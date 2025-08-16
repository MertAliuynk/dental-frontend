"use client";
// MiniAppointmentCalendar.tsx - Şube bazlı doktor randevuları
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./mini-calendar-custom.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useState } from "react";

import "./mini-calendar-custom.css";
const locales = { "tr-TR": tr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => 1,
  getDay,
  locales,
});

// Custom event component: sadece hasta ismi ve not
function MiniCalendarEvent({ event }: { event: any }) {
  // FullAppointmentCalendar'daki gibi event objesinden hasta ismi ve notu doğrudan al
  const hastaIsmi = event.patient_name
    ? event.patient_name
    : (event.patient_first_name && event.patient_last_name
      ? `${event.patient_first_name} ${event.patient_last_name}`
      : "");
  const not = event.notes || "";
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
  {hastaIsmi && <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: not ? 2 : 0 }}>{hastaIsmi}</span>}
      {not && <span style={{ fontSize: 13, color: '#fff' }}>{not}</span>}
    </div>
  );
}

interface Doctor {
  user_id: number;
  first_name: string;
  last_name: string;
  branch_id: number;
}

interface Branch {
  branch_id: number;
  name: string;
}

export default function MiniAppointmentCalendar() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [doctorAppointments, setDoctorAppointments] = useState<{[key: number]: any[]}>({});
  const [userRole, setUserRole] = useState<string>("");
  const [userBranchId, setUserBranchId] = useState<number>(1);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Kullanıcı bilgilerini al
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("role") || "";
      const branchId = parseInt(localStorage.getItem("branchId") || "1");
      try {
        const uStr = localStorage.getItem("user");
        if (uStr) {
          const u = JSON.parse(uStr);
          if (u?.user_id) setCurrentUserId(Number(u.user_id));
        }
      } catch {}
      
      // Admin için seçili şubeyi al, diğerleri kendi şubelerini kullan
      let activeBranchId = branchId;
      if (role === "admin") {
        const selectedBranch = localStorage.getItem("selectedBranchId");
        if (selectedBranch && selectedBranch !== "") {
          activeBranchId = parseInt(selectedBranch);
        }
      }
      
      console.log("User Role:", role, "Branch ID:", branchId, "Active:", activeBranchId);
      setUserRole(role);
      setUserBranchId(branchId);
      setSelectedBranchId(activeBranchId);
    }
  }, []);

  // Şube değişikliklerini dinle (admin için)
  useEffect(() => {
    const handleBranchChange = (event: any) => {
      const newBranchId = event.detail.branchId;
      console.log("Branch changed to:", newBranchId);
      setSelectedBranchId(newBranchId);
    };

    if (userRole === "admin") {
      window.addEventListener('branchChanged', handleBranchChange);
      return () => {
        window.removeEventListener('branchChanged', handleBranchChange);
      };
    }
  }, [userRole]);

  // Seçili şubedeki doktorları getir
  const fetchDoctors = async () => {
    if (!selectedBranchId || selectedBranchId === 0) {
      setDoctors([]);
      return;
    }

    try {
      console.log("API Call: /api/branch/" + selectedBranchId + "/doctors");
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/branch/${selectedBranchId}/doctors`);
      const data = await res.json();
      console.log("Doctors API response:", data);
      
      if (data.success && data.data) {
        // Her durumda data.data'yı diziye çevir
        let list = Array.isArray(data.data)
          ? data.data
          : (Array.isArray(data.data.doctors) ? data.data.doctors : Object.values(data.data));
        // Doktor rolünde sadece kendi takvimini göster
        if (userRole === "doctor" && currentUserId) {
          list = list.filter((d: any) => Number(d.user_id) === Number(currentUserId));
        }
        setDoctors(list);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      console.error("Doktor getirme hatası:", err);
      setDoctors([]);
    }
  };

  // Doktor başına randevuları getir
  const fetchAppointmentsForDoctor = async (doctorId: number) => {
    try {
      // Haftanın başı (Pazartesi) ve sonu (Pazar) tarihlerini bul
      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Pazar=0 ise 7 yap
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const start_date = format(monday, 'yyyy-MM-dd');
      const end_date = format(sunday, 'yyyy-MM-dd');
      const url = `https://dentalapi.karadenizdis.com/api/appointment?branch_id=${selectedBranchId}&doctor_id=${doctorId}&start_date=${start_date}&end_date=${end_date}`;
      console.log('Mini takvim API:', url);
      const res = await fetch(url);
      const data = await res.json();
      console.log('Mini takvim API cevabı:', data);
      if (data.success) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const mapped = data.data
          .filter((item: any) => {
            const itemDate = format(new Date(item.appointment_time), 'yyyy-MM-dd');
            return itemDate === todayStr;
          })
          .map((item: any) => ({
            title: item.patient_name
              ? item.notes
                ? `${item.patient_name} - ${item.notes}`
                : `${item.patient_name}`
              : (item.patient_first_name && item.patient_last_name
                ? item.notes
                  ? `${item.patient_first_name} ${item.patient_last_name} - ${item.notes}`
                  : `${item.patient_first_name} ${item.patient_last_name}`
                : (item.notes || "Randevu")),
            start: new Date(item.appointment_time),
            end: new Date(new Date(item.appointment_time).getTime() + (item.duration_minutes || 30) * 60000),
            id: item.appointment_id,
            patient_name: item.patient_name,
            patient_first_name: item.patient_first_name,
            patient_last_name: item.patient_last_name,
            notes: item.notes
          }));
        return mapped;
      }
    } catch (err) {
      console.error(`Doktor ${doctorId} randevuları alınamadı:`, err);
    }
    return [];
  };

  // Tüm doktorların randevularını getir
  const fetchAllDoctorAppointments = async () => {
    const appointments: {[key: number]: any[]} = {};
    for (const doctor of doctors) {
      appointments[doctor.user_id] = await fetchAppointmentsForDoctor(doctor.user_id);
    }
    setDoctorAppointments(appointments);
  };

  useEffect(() => {
    if (selectedBranchId && selectedBranchId > 0) {
      console.log("Fetching doctors for branch:", selectedBranchId);
      fetchDoctors();
    }
  }, [selectedBranchId, userRole, currentUserId]);

  useEffect(() => {
    if (doctors.length > 0) {
      console.log("Fetching appointments for", doctors.length, "doctors");
      fetchAllDoctorAppointments();
    } else {
      // Doktor yoksa randevuları temizle
      setDoctorAppointments({});
    }
  }, [doctors]);

  if (doctors.length === 0) {
    return (
      <div style={{ 
        background: "white", 
        borderRadius: 12, 
        padding: 24, 
        boxShadow: "0 2px 8px #0001", 
        width: "100%",
        overflowX: "auto"
      }}>
        <div style={{ fontWeight: 700, marginBottom: 16, textAlign: "center", color: "#1a237e", fontSize: 18 }}>
          Bu Şubede Doktor Bulunamadı
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: "white", 
      borderRadius: 12, 
      padding: 24, 
      boxShadow: "0 2px 8px #0001", 
      width: "100%",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch"
    }}>
      <div style={{ fontWeight: 700, marginBottom: 16, textAlign: "center", color: "#1a237e", fontSize: 18 }}>
        Bugünkü Randevular
      </div>

      {/* Doktor başına ayrı takvimler */}
  <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {doctors.map((doctor) => (
          <div key={doctor.user_id} style={{ 
            border: "2px solid #e3eafc", 
            borderRadius: 8, 
            padding: 12,
            background: "#fafbff"
          }}>
            <div style={{ 
              fontWeight: 600, 
              marginBottom: 8, 
              textAlign: "center", 
              color: "#1a237e", 
              fontSize: 16 
            }}>
              Dt. {doctor.first_name} {doctor.last_name}
            </div>
      <div style={{ width: "100%", overflowX: "auto" }}>
  <Calendar
              localizer={localizer}
              events={doctorAppointments[doctor.user_id] || []}
              defaultView="day"
              views={["day"]}
              min={new Date(new Date().setHours(9, 0, 0, 0))}
              max={new Date(new Date().setHours(23, 59, 0, 0))}
              step={15}
              timeslots={1}
              className="mini-calendar-custom-slots"
              style={{
                height: 600, // Yüksekliği daha da artırıldı
                minWidth: 360,
                width: "100%",
                background: "white",
                borderRadius: 6,
                fontSize: 12,
                color: "#222"
              }}
              toolbar={false}
              showAllEvents={false}
              formats={{
                timeGutterFormat: (date) => {
                  // Sadece saat başlarında saat göster
                  const minutes = date.getMinutes();
                  return minutes === 0 ? format(date, 'HH:mm', { locale: tr }) : '';
                },
                eventTimeRangeFormat: ({ start, end }) => `${format(start, 'HH:mm', { locale: tr })} - ${format(end, 'HH:mm', { locale: tr })}`
              }}
              eventPropGetter={(event) => ({
                style: {
                  border: '2px solid #1976d2',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#222',
                  fontWeight: 600,
                  padding: '2px 8px',
                  boxShadow: '0 1px 4px #e3eaff33',
                  fontSize: '13px',
                  marginBottom: '4px',
                  zIndex: 1
                }
              })}
              components={{
                event: MiniCalendarEvent
              }}
/>
      </div>
          </div>
        ))}
      </div>
    </div>
  );
}
