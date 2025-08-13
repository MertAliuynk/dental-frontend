// ...existing code...
"use client";
// import Topbar kaldırıldı
import AppLayout from "../../components/AppLayout";
import { useState, useEffect } from "react";
import "./bulk-patient.css";

const MAX_ROWS = 25;

export default function BulkPatientAddPageClient() {
  const [rows, setRows] = useState(
    Array.from({ length: MAX_ROWS }, () => ({
      firstName: "",
      lastName: "",
      tc: "",
      phone: "",
      birthDate: "",
      doctors: [] as string[]
    }))
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
  fetch("https://dentalapi.karadenizdis.com/api/user/doctors")
      .then(res => res.json())
      .then(data => {
        if (data.success) setDoctors(data.data);
        else setDoctors([]);
      })
      .catch(() => setDoctors([]));
  }, []);

  const handleChange = (idx: number, field: string, value: any) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      if (field === "doctors") {
        // Çoklu select
        return { ...row, doctors: value };
      }
      return { ...row, [field]: value };
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    // Zorunlu alan ve format kontrolü
    for (let i = 0; i < rows.length; i++) {
      const { firstName, lastName, tc, phone, birthDate, doctors } = rows[i];
      if ((firstName || lastName || tc || phone || birthDate || (doctors && doctors.length)) && (!firstName || !lastName || !tc || !phone || !birthDate || !doctors || doctors.length === 0)) {
        setMessage(`${i + 1}. satırda eksik bilgi var. Tüm alanlar zorunlu.`);
        setLoading(false);
        return;
      }
      // TC kimlik kontrolü (11 hane, sadece rakam)
      if (tc && (!/^\d{11}$/.test(tc))) {
        setMessage(`${i + 1}. satırda TC kimlik numarası 11 haneli olmalı ve sadece rakam içermeli.`);
        setLoading(false);
        return;
      }
      // Telefon kontrolü (en az 10, en fazla 11 hane, sadece rakam)
      if (phone && (!/^\d{10,11}$/.test(phone))) {
        setMessage(`${i + 1}. satırda telefon numarası 10 veya 11 haneli olmalı ve sadece rakam içermeli.`);
        setLoading(false);
        return;
      }
    }
    // Sadece dolu satırları gönder
    const validRows = rows
      .filter(r => r.firstName && r.lastName && r.tc && r.phone && r.birthDate && r.doctors && r.doctors.length > 0)
    if (validRows.length === 0) {
      setMessage("En az bir hasta bilgisi girilmelidir.");
      setLoading(false);
      return;
    }
    try {
      // Token'ı localStorage'dan al
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("https://dentalapi.karadenizdis.com/api/patient/bulk", {
        method: "POST",
        headers,
        body: JSON.stringify({ patients: validRows })
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Tüm hastalar başarıyla eklendi!");
        setRows(Array.from({ length: MAX_ROWS }, () => ({ firstName: "", lastName: "", tc: "", phone: "", birthDate: "", doctors: [] })));
      } else {
        // Duplicate TC error için satır numarası bul
        let rowNum = null;
        if (data.message && data.message.includes("duplicate key value")) {
          // Backend'den dönen hata mesajında tc_number varsa, satırı bul
          const match = /\"tc_number\":\"(\d{11})\"/.exec(JSON.stringify(data));
          if (match) {
            const tc = match[1];
            const idx = rows.findIndex(r => r.tc === tc);
            if (idx !== -1) rowNum = idx + 1;
          }
        }
        if (rowNum) {
          setMessage(`${rowNum}. satırda TC kimlik numarası başka bir hastada mevcut!`);
        } else {
          setMessage(data.message || "Kayıt sırasında hata oluştu.");
        }
      }
    } catch (err) {
      setMessage("Sunucu hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
  {/* <Topbar /> kaldırıldı, AppLayout kullanılmalı */}
  <main className="bulk-patient-container">
    <h2 className="bulk-patient-title">Toplu Hasta Ekleme</h2>
    <form onSubmit={handleSubmit} className="bulk-patient-form">
      {message && <div className={"bulk-patient-message" + (message.includes("başarı") ? " success" : "")}>{message}</div>}
      <div className="bulk-patient-table-wrapper">
        <table className="bulk-patient-table">
          <thead>
            <tr>
              <th>Adı</th>
              <th>Soyadı</th>
              <th>Tc kimlik</th>
              <th>Tel no</th>
              <th>Doğum tarihi</th>
              <th>İlgili Doktor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td><input className="bulk-patient-input" value={row.firstName} onChange={e => handleChange(i, "firstName", e.target.value)} required={false} /></td>
                <td><input className="bulk-patient-input" value={row.lastName} onChange={e => handleChange(i, "lastName", e.target.value)} required={false} /></td>
                <td><input className="bulk-patient-input" value={row.tc} onChange={e => handleChange(i, "tc", e.target.value)} required={false} /></td>
                <td><input className="bulk-patient-input" value={row.phone} onChange={e => handleChange(i, "phone", e.target.value)} required={false} /></td>
                <td><input className="bulk-patient-input" type="date" value={row.birthDate} onChange={e => handleChange(i, "birthDate", e.target.value)} required={false} /></td>
                <td>
                  <select
                    className="bulk-patient-select"
                    multiple
                    value={row.doctors}
                    onChange={e => {
                      const options = e.target.options;
                      const selected: string[] = Array.from(options).filter((o: any) => o.selected).map((o: any) => o.value);
                      handleChange(i, "doctors", selected);
                    }}
                    required={false}
                    style={{ minWidth: 120, height: 38 }}
                  >
                    {doctors.map((d: any) => (
                      <option key={d.user_id} value={d.user_id}>{d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="submit" className="bulk-patient-btn" disabled={loading}>{loading ? "Kaydediliyor..." : "Tüm Hastaları Kaydet"}</button>
    </form>
  </main>
    </AppLayout>
  );
}


