  // Onaylanan tedavileri önerilen olarak geri al
"use client";


import AppLayout from "../../components/AppLayout";
// import Topbar kaldırıldı
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";


export default function PatientCardPageClient() {
  // Hasta notu güncelleme modalı için state
  const [editNoteModal, setEditNoteModal] = useState(false);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [patient, setPatient] = useState<any>(null);

  // Modal açıldığında mevcut notu göster
  useEffect(() => {
    if (editNoteModal && patient) {
      setEditNoteValue(patient.notes || "");
    }
  }, [editNoteModal, patient]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const [anamnesis, setAnamnesis] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [anamnesisOpen, setAnamnesisOpen] = useState(false);
  const [selectedTreatments, setSelectedTreatments] = useState<number[]>([]);
  const [approvingTreatments, setApprovingTreatments] = useState(false);
  const [selectedApprovedTreatments, setSelectedApprovedTreatments] = useState<number[]>([]);
  const [completingTreatments, setCompletingTreatments] = useState(false);
  const [role, setRole] = useState<string>("");
  const [branchId, setBranchId] = useState<number>(1);
  const [priceMap, setPriceMap] = useState<Record<number, { base: number; upper: number; lower: number; isPerTooth: boolean; isJawSpecific: boolean }>>({});

  useEffect(() => {
    if (!patientId) return;
    try { 
      setRole(localStorage.getItem('role') || '');
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const b = u?.branchId || u?.branch_id;
        if (b) setBranchId(Number(b));
      }
    } catch {}
    setLoading(true);
    Promise.all([
      fetch(`https://dentalapi.karadenizdis.com/api/patient/${patientId}`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/patient-anamnesis/${patientId}`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/treatment-type`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/appointment?patient_id=${patientId}`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/patient/all-doctors-relations`).then(r => r.json()),
      fetch(`https://dentalapi.karadenizdis.com/api/user?role=doctor`).then(r => r.json()),
    ])
      .then(async ([p, t, a, tt, ap, rel, docList]) => {
        if (!p.success) throw new Error("Hasta bulunamadı");
        setPatient(p.data);
        setTreatments((t.success && t.data) ? t.data : []);
        setAnamnesis((a.success && a.data) ? a.data : []);
        setTreatmentTypes((tt.success && tt.data) ? tt.data : []);
        setAppointments((ap.success && ap.data) ? ap.data : []);
        // İlgili doktorlar
        let names: string[] = [];
        if (rel.success && Array.isArray(rel.data) && docList.success && Array.isArray(docList.data)) {
          const patientDoctorIds = rel.data.filter((r: any) => r.patient_id == patientId).map((r: any) => r.doctor_id);
          names = docList.data.filter((d: any) => patientDoctorIds.includes(d.user_id)).map((d: any) => d.first_name + " " + d.last_name);
        }
        setDoctorNames(names);
        setLoading(false);
      })
      .catch(() => {
        setError("Veriler alınamadı");
        setLoading(false);
      });
  }, [patientId]);

  const suggestedTreatments = treatments.filter((tr: any) => tr.status === "önerilen");
  const approvedTreatments = treatments.filter((tr: any) => tr.status === "onaylanan");
  const completedTreatments = treatments.filter((tr: any) => tr.status === "tamamlanan");

  // Aktif fiyat listesini çek
  useEffect(() => {
    const loadPrices = async () => {
      try {
  const res = await fetch(`https://dentalapi.karadenizdis.com/api/price-list?branch_id=${branchId}&active_only=true`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data) || data.data.length === 0) { setPriceMap({}); return; }
        const active = data.data[0];
  const res2 = await fetch(`https://dentalapi.karadenizdis.com/api/price-list/${active.price_list_id}`);
        const data2 = await res2.json();
        if (!data2.success) { setPriceMap({}); return; }
        const items = data2.data.items || [];
        const map: Record<number, any> = {};
        for (const it of items) {
          const tt = (treatmentTypes || []).find((x: any) => x.treatment_type_id === it.treatment_type_id);
          map[it.treatment_type_id] = {
            base: Number(it.base_price) || 0,
            upper: Number(it.upper_jaw_price) || 0,
            lower: Number(it.lower_jaw_price) || 0,
            isPerTooth: !!tt?.is_per_tooth,
            isJawSpecific: !!tt?.is_jaw_specific,
          };
        }
        setPriceMap(map);
      } catch { setPriceMap({}); }
    };
    loadPrices();
  }, [branchId, treatmentTypes]);

  const showTotals = role === 'admin';
  const getUnitPrice = (treatmentTypeId: number, upper: boolean, lower: boolean) => {
    const pm = priceMap[treatmentTypeId];
    if (!pm) return 0;
    if (pm.isJawSpecific) {
      if (upper && !lower) return pm.upper || pm.base;
      if (lower && !upper) return pm.lower || pm.base;
      return pm.base;
    }
    return pm.base;
  };
  const getTreatmentQty = (tr: any) => {
    const pm = priceMap[tr.treatment_type_id];
    if (!pm) return 1;
    if (pm.isPerTooth) {
      const teeth = tr.tooth_numbers || tr.toothNumbers || [];
      return Array.isArray(teeth) ? teeth.length : 1;
    }
    return 1;
  };
  const getLineTotal = (tr: any) => {
    const pm = priceMap[tr.treatment_type_id];
    if (!pm) return 0;
    const teeth = tr.tooth_numbers || tr.toothNumbers || [];
    if (pm.isJawSpecific) {
      // Charge once per jaw (upper/lower), even if multiple teeth selected in that jaw
  const isUpperFDI = (n: number) => (n >= 11 && n <= 18) || (n >= 21 && n <= 28) || (n >= 51 && n <= 55) || (n >= 61 && n <= 65);
  const isLowerFDI = (n: number) => (n >= 31 && n <= 38) || (n >= 41 && n <= 48) || (n >= 71 && n <= 75) || (n >= 81 && n <= 85);
      const isUpperSeq = (n: number) => n >= 1 && n <= 16;
      const isLowerSeq = (n: number) => n >= 17 && n <= 32;
      const isUpper = (n: number) => isUpperFDI(n) || isUpperSeq(n);
      const isLower = (n: number) => isLowerFDI(n) || isLowerSeq(n);
      const hasUpper = (!!tr.is_upper_jaw || !!tr.isUpperJaw) || (Array.isArray(teeth) && teeth.some((n: number) => isUpper(n)));
      const hasLower = (!!tr.is_lower_jaw || !!tr.isLowerJaw) || (Array.isArray(teeth) && teeth.some((n: number) => isLower(n)));
      let total = 0;
      if (hasUpper) total += (pm.upper || pm.base);
      if (hasLower) total += (pm.lower || pm.base);
      if (!hasUpper && !hasLower) total += pm.base; // fallback
      return total;
    }
    // Not jaw-specific
    const qty = getTreatmentQty(tr);
    return (pm.base) * qty;
  };
  const suggestedTotal = suggestedTreatments.reduce((sum, tr) => sum + getLineTotal(tr), 0);

  // Tedavi onaylama fonksiyonu
  const handleApproveTreatments = async () => {
    if (selectedTreatments.length === 0) {
      alert("Lütfen onaylanacak tedavileri seçin");
      return;
    }

    try {
      setApprovingTreatments(true);
      
      // Seçilen tedavilerin durumunu "onaylanan" olarak güncelle
      const promises = selectedTreatments.map(treatmentId =>
  fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'onaylanan' })
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      
      // Tüm işlemler başarılı mı kontrol et
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        alert(`${selectedTreatments.length} tedavi başarıyla onaylandı!`);
        
        // Tedavi listesini yenile
  const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        
        // Seçimleri temizle
        setSelectedTreatments([]);
      } else {
        alert("Bazı tedaviler onaylanamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Approve treatments error:', error);
      alert("Tedaviler onaylanırken hata oluştu");
    } finally {
      setApprovingTreatments(false);
    }
  };

  // Tedavi tamamlama fonksiyonu
  const handleCompleteTreatments = async () => {
    if (selectedApprovedTreatments.length === 0) {
      alert("Lütfen tamamlanacak tedavileri seçin");
      return;
    }

    try {
      setCompletingTreatments(true);
      
      // Seçilen tedavilerin durumunu "tamamlanan" olarak güncelle
      const promises = selectedApprovedTreatments.map(treatmentId =>
  fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'tamamlanan' })
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      
      // Tüm işlemler başarılı mı kontrol et
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        alert(`${selectedApprovedTreatments.length} tedavi başarıyla tamamlandı!`);
        
        // Tedavi listesini yenile
  const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        
        // Seçimleri temizle
        setSelectedApprovedTreatments([]);
      } else {
        alert("Bazı tedaviler tamamlanamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Complete treatments error:', error);
      alert("Tedaviler tamamlanırken hata oluştu");
    } finally {
      setCompletingTreatments(false);
    }
  };


  // Önerilen tedaviler için seçim toggle
  const toggleTreatmentSelection = (treatmentId: number) => {
    setSelectedTreatments(prev =>
      prev.includes(treatmentId)
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  // Onaylanan tedaviler için seçim toggle
  const toggleApprovedTreatmentSelection = (treatmentId: number) => {
    setSelectedApprovedTreatments(prev =>
      prev.includes(treatmentId)
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  // Seçili önerilen tedavileri sil
  const handleDeleteSuggestedTreatments = async () => {
    if (selectedTreatments.length === 0) {
      alert("Lütfen silinecek tedavileri seçin");
      return;
    }
    if (!window.confirm(`${selectedTreatments.length} tedavi silinecek. Emin misiniz?`)) return;
    try {
      // Silme işlemleri
      const promises = selectedTreatments.map(treatmentId =>
        fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json())
      );
      const results = await Promise.all(promises);
      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        alert(`${selectedTreatments.length} tedavi başarıyla silindi!`);
        // Tedavi listesini yenile
        const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        setSelectedTreatments([]);
      } else {
        alert("Bazı tedaviler silinemedi. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Delete treatments error:', error);
      alert("Tedaviler silinirken hata oluştu");
    }
  };
  const handleUndoApprovedTreatments = async () => {
    if (selectedApprovedTreatments.length === 0) {
      alert("Lütfen geri alınacak tedavileri seçin");
      return;
    }
    if (!window.confirm(`${selectedApprovedTreatments.length} tedavi önerilen olarak geri alınacak. Emin misiniz?`)) return;
    try {
      const promises = selectedApprovedTreatments.map(treatmentId =>
        fetch(`https://dentalapi.karadenizdis.com/api/treatment/${treatmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'önerilen' })
        }).then(res => res.json())
      );
      const results = await Promise.all(promises);
      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        alert(`${selectedApprovedTreatments.length} tedavi başarıyla önerilen olarak geri alındı!`);
        // Tedavi listesini yenile
        const treatmentsRes = await fetch(`https://dentalapi.karadenizdis.com/api/treatment/patient/${patientId}`);
        const treatmentsData = await treatmentsRes.json();
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data);
        }
        setSelectedApprovedTreatments([]);
      } else {
        alert("Bazı tedaviler geri alınamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Undo approved treatments error:', error);
      alert("Tedaviler geri alınırken hata oluştu");
    }
  };

  return (
      <main style={{ flex: 1, padding: 32 }}>
        {loading ? (
          <div>Yükleniyor...</div>
        ) : error ? (
          <div style={{ color: "#e53935" }}>{error}</div>
        ) : patient ? (
          <>
            {/* Üstte 3 buton */}
            <div className="pc-actions" style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 18, flexWrap: "wrap" }}>
              <button
                style={{
                  background: "#e3eafc",
                  color: "#1976d2",
                  border: "1.5px solid #b6c6e6",
                  borderRadius: 18,
                  padding: "8px 24px",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #e3eaff33",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                className="pc-btn"
                type="button"
                onClick={() => {
                  if (patientId) {
                    window.location.href = `/patients/card/treatment-add-page?id=${patientId}`;
                  } else {
                    window.location.href = "/patients/card/treatment-add-page";
                  }
                }}
              >
                Tedavi Ekle
              </button>
              <button
                style={{
                  background: "#e3fcec",
                  color: "#388e3c",
                  border: "1.5px solid #b6e6c6",
                  borderRadius: 18,
                  padding: "8px 24px",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #e3eaff33",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                className="pc-btn"
                type="button"
                onClick={() => router.push("/calendar")}
              >
                Yeni Randevu
              </button>
              <button
                style={{
                  background: "#f5f6fa",
                  color: "#7c6f00",
                  border: "1.5px solid #e6e6b6",
                  borderRadius: 18,
                  padding: "8px 24px",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #e3eaff33",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                className="pc-btn"
                type="button"
              >
                Onam Formu Oluştur
              </button>
              <button
                style={{
                  background: "#fffbe6",
                  color: "#b68c00",
                  border: "1.5px solid #e6e6b6",
                  borderRadius: 18,
                  padding: "8px 24px",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #e3eaff33",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                className="pc-btn"
                type="button"
                onClick={() => setEditNoteModal(true)}
              >
                Notu Güncelle
              </button>
            </div>
      {/* Not Güncelleme Modalı */}
      {editNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: '0 4px 24px #0002',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#b68c00', marginBottom: 8 }}>Hasta Notunu Güncelle</div>
            <textarea
              value={editNoteValue}
              onChange={e => setEditNoteValue(e.target.value)}
              style={{
                width: '100%',
                minHeight: 80,
                border: '1.5px solid #e3eafc',
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Not giriniz..."
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '8px 18px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
                onClick={() => setEditNoteModal(false)}
              >
                İptal
              </button>
              <button
                style={{
                  padding: '8px 18px',
                  background: '#b68c00',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
                onClick={async () => {
                  try {
                    const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient/${patient.patient_id}/notes`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notes: editNoteValue })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setPatient((prev: any) => ({ ...prev, notes: editNoteValue }));
                      setEditNoteModal(false);
                      alert('Not güncellendi!');
                    } else {
                      alert(data.message || 'Güncelleme başarısız!');
                    }
                  } catch (err) {
                    alert('Sunucu hatası!');
                  }
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {/* Hasta Bilgileri Kartı */}
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 24, minWidth: 260, maxWidth: 320, height: 420, flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#0a2972" }}>
                  {patient.first_name} {patient.last_name}
                </div>
                <div style={{ fontSize: 15, color: "#2d3a4a" }}>
                  İlgili doktor(lar): {doctorNames.length > 0 ? doctorNames.join(", ") : "-"}
                </div>
                <div style={{ fontSize: 15, color: "#2d3a4a" }}>TC No: {role === 'doctor' ? '•••' : (patient.tc_number || "-")}</div>
                <div style={{ fontSize: 15, color: "#2d3a4a" }}>Tel: {role === 'doctor' ? '•••' : (patient.phone || "-")}</div>
                <div style={{ fontSize: 15, color: "#2d3a4a" }}>Doğum Tarihi: {patient.birth_date ? patient.birth_date.slice(0,10) : "-"}</div>
                <div style={{ fontSize: 15, color: "#2d3a4a" }}>Notlar: {patient.notes || "-"}</div>
                <div style={{ fontSize: 15, color: "#2d3a4a", marginTop: 8, cursor: "pointer", fontWeight: 600 }} onClick={() => setAnamnesisOpen(v => !v)}>
                  Anamnez {anamnesisOpen ? "▲" : "▼"}
                </div>
                {anamnesisOpen && (
                  <div style={{ fontSize: 14, color: "#444", marginLeft: 12, maxHeight: 120, overflowY: "auto", marginTop: 4, border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, background: "#f8fafc" }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'disc inside' }}>
                      {anamnesis.length === 0 ? <li>Yok</li> : anamnesis.map((a, i) => <li key={i}>{a.question}: {a.answer_text || (a.answer_boolean ? "Evet" : "Hayır")}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              {/* Tedavi Bölümleri - 3 sütunlu responsive grid */}
              <div className="pc-lists" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", flex: "3 1 600px" }}>
                {/* Önerilen Tedaviler */}
                <div className="pc-list-card" style={{ background: "#f8fafc", borderRadius: 24, border: "1.5px solid #b6c6e6", boxShadow: "0 2px 8px #e3eaff", padding: 24, minHeight: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="pc-list-title" style={{ fontWeight: 700, fontSize: 16, color: "#0a2972", marginBottom: 8, borderBottom: "1px solid #dbeafe", width: "100%", textAlign: "center", borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>Önerilen Tedaviler</div>
                  <div className="pc-list-content" style={{ flex: 1, width: "100%", background: "#fffbea", borderRadius: 12, padding: 16, minHeight: 200, display: "flex", flexDirection: "column" }}>
                    {treatments.filter((x: any) => ['önerilen','onaylanan','tamamlanan'].includes(x.status)).length === 0 ? (
                      <div style={{ color: "#888", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>Yok</div>
                    ) : (
                      <div style={{ flex: 1, fontSize: 15, color: "#2d3a4a" }}>
                        {treatments
                          .filter((x: any) => ['önerilen','onaylanan','tamamlanan'].includes(x.status))
                          .sort((a: any, b: any) => Number(b.status === 'önerilen') - Number(a.status === 'önerilen'))
                          .map((tr: any) => {
                          const type = treatmentTypes.find((tt: any) => tt.treatment_type_id === tr.treatment_type_id);
                          const treatmentName = type ? type.name : "Bilinmeyen Tedavi";
                          
                          // Diş numaralarını kontrol et (tooth_numbers veya toothNumbers olabilir)
                          const toothNumbers = tr.tooth_numbers || tr.toothNumbers || [];
                          // Jaw label inference for display
                          const isUpperFDI = (n: number) => (n >= 11 && n <= 18) || (n >= 21 && n <= 28) || (n >= 51 && n <= 55) || (n >= 61 && n <= 65);
                          const isLowerFDI = (n: number) => (n >= 31 && n <= 38) || (n >= 41 && n <= 48) || (n >= 71 && n <= 75) || (n >= 81 && n <= 85);
                          const isUpperSeq = (n: number) => n >= 1 && n <= 16;
                          const isLowerSeq = (n: number) => n >= 17 && n <= 32;
                          const isUpper = (n: number) => isUpperFDI(n) || isUpperSeq(n);
                          const isLower = (n: number) => isLowerFDI(n) || isLowerSeq(n);
                          const hasUpper = (!!tr.is_upper_jaw || !!tr.isUpperJaw) || (Array.isArray(toothNumbers) && toothNumbers.some((n: number) => isUpper(n)));
                          const hasLower = (!!tr.is_lower_jaw || !!tr.isLowerJaw) || (Array.isArray(toothNumbers) && toothNumbers.some((n: number) => isLower(n)));
                          const jawLabel = hasUpper && hasLower
                            ? "Üst ve Alt çene"
                            : hasUpper
                              ? "Üst çene"
                              : hasLower
                                ? "Alt çene"
                                : "";
                          
                          // Tedavi seçili mi kontrol et
                          const isSelected = selectedTreatments.includes(tr.treatment_id);
                          const isSelectable = tr.status === 'önerilen';
                          const bgByStatus = tr.status === 'önerilen' ? '#fff' : tr.status === 'onaylanan' ? '#e3eafc' : '#e6f4c8';
                          const borderByStatus = tr.status === 'önerilen' ? 'transparent' : tr.status === 'onaylanan' ? '#b6c6e6' : '#b6e6c6';
                          
                          return (
                            <div className="pc-list-item"
                              key={tr.treatment_id}
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 8, 
                                marginBottom: 8,
                                padding: "6px",
                                borderRadius: 6,
                                background: isSelected ? "#e3f2fd" : bgByStatus,
                                cursor: isSelectable ? "pointer" : "default",
                                border: isSelected ? "1px solid #1976d2" : `1px solid ${borderByStatus}`,
                                justifyContent: 'space-between'
                              }}
                              onClick={() => { if (isSelectable) toggleTreatmentSelection(tr.treatment_id); }}
                            >
                              {isSelectable && (
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleTreatmentSelection(tr.treatment_id)}
                                  style={{ cursor: "pointer" }}
                                />
                              )}
                              <span>
                                {treatmentName}
                                {jawLabel && (
                                  <span style={{ color: "#666", fontSize: 13 }}> {" "}({jawLabel}{Array.isArray(toothNumbers) && toothNumbers.length > 0 ? ` (${toothNumbers.join(", ")})` : ""})</span>
                                )}
                                {!jawLabel && tr.is_per_tooth && Array.isArray(toothNumbers) && toothNumbers.length > 0 && (
                                  <span style={{ color: "#666", fontSize: 13 }}>
                                    {" "}(Dişler: {toothNumbers.join(", ")})
                                  </span>
                                )}
                                {tr.status !== 'önerilen' && (
                                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: tr.status === 'onaylanan' ? '#1976d2' : '#388e3c' }}>
                                    [{tr.status === 'onaylanan' ? 'Onaylanan' : 'Tamamlanan'}]
                                  </span>
                                )}
                              </span>
                              {showTotals && (
                                <span style={{ fontWeight: 700, color: '#0a2972' }}>
                                  ₺{getLineTotal(tr).toLocaleString('tr-TR')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {showTotals && suggestedTreatments.length > 0 && (
                    <div className="pc-list-total" style={{ width: '100%', textAlign: 'right', marginTop: 8, fontWeight: 800, color: '#0a2972' }}>
                      Toplam: ₺{suggestedTotal.toLocaleString('tr-TR')}
                    </div>
                  )}
                  
                  {/* Onayla Butonu - En altta sabit */}
                  {suggestedTreatments.length > 0 && (
                    <div style={{ width: "100%", paddingTop: 16, borderTop: "1px solid #e0e0e0" }}>
                      <button
                        onClick={handleApproveTreatments}
                        disabled={selectedTreatments.length === 0 || approvingTreatments}
                        style={{
                          background: selectedTreatments.length === 0 || approvingTreatments ? "#ccc" : "#388e3c",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedTreatments.length === 0 || approvingTreatments ? "not-allowed" : "pointer",
                          width: "100%"
                        }}
                      >
                        {approvingTreatments ? "Onaylanıyor..." : `Onayla (${selectedTreatments.length})`}
                      </button>
                      <button
                        onClick={handleDeleteSuggestedTreatments}
                        disabled={selectedTreatments.length === 0}
                        style={{
                          background: selectedTreatments.length === 0 ? "#ccc" : "#e53935",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedTreatments.length === 0 ? "not-allowed" : "pointer",
                          width: "100%",
                          marginTop: 8
                        }}
                      >
                        {`Sil (${selectedTreatments.length})`}
                      </button>
                    </div>
                  )}
                </div>
                {/* Onaylanan Tedaviler */}
                <div className="pc-list-card" style={{ background: "#f8fafc", borderRadius: 24, border: "1.5px solid #b6c6e6", boxShadow: "0 2px 8px #e3eaff", padding: 24, minHeight: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="pc-list-title" style={{ fontWeight: 700, fontSize: 16, color: "#1976d2", marginBottom: 8, borderBottom: "1px solid #dbeafe", width: "100%", textAlign: "center", borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>Onaylanan Tedaviler</div>
                  <div className="pc-list-content" style={{ flex: 1, width: "100%", background: "#fffbea", borderRadius: 12, padding: 16, minHeight: 200, display: "flex", flexDirection: "column" }}>
                    {treatments.filter((x: any) => ['onaylanan','tamamlanan'].includes(x.status)).length === 0 ? (
                      <div style={{ color: "#888", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>Yok</div>
                    ) : (
                      <div style={{ flex: 1, fontSize: 15, color: "#2d3a4a" }}>
                        {treatments
                          .filter((x: any) => ['onaylanan','tamamlanan'].includes(x.status))
                          .sort((a: any, b: any) => Number(b.status === 'onaylanan') - Number(a.status === 'onaylanan'))
                          .map((tr: any) => {
                          const type = treatmentTypes.find((tt: any) => tt.treatment_type_id === tr.treatment_type_id);
                          const treatmentName = type ? type.name : "Bilinmeyen Tedavi";
                          
                          // Diş numaralarını kontrol et (tooth_numbers veya toothNumbers olabilir)
                          const toothNumbers = tr.tooth_numbers || tr.toothNumbers || [];
                          const isUpperFDI2 = (n: number) => (n >= 11 && n <= 18) || (n >= 21 && n <= 28) || (n >= 51 && n <= 55) || (n >= 61 && n <= 65);
                          const isLowerFDI2 = (n: number) => (n >= 31 && n <= 38) || (n >= 41 && n <= 48) || (n >= 71 && n <= 75) || (n >= 81 && n <= 85);
                          const isUpperSeq2 = (n: number) => n >= 1 && n <= 16;
                          const isLowerSeq2 = (n: number) => n >= 17 && n <= 32;
                          const isUpper2 = (n: number) => isUpperFDI2(n) || isUpperSeq2(n);
                          const isLower2 = (n: number) => isLowerFDI2(n) || isLowerSeq2(n);
                          const hasUpper = (!!tr.is_upper_jaw || !!tr.isUpperJaw) || (Array.isArray(toothNumbers) && toothNumbers.some((n: number) => isUpper2(n)));
                          const hasLower = (!!tr.is_lower_jaw || !!tr.isLowerJaw) || (Array.isArray(toothNumbers) && toothNumbers.some((n: number) => isLower2(n)));
                          const jawLabel = hasUpper && hasLower
                            ? "Üst ve Alt çene"
                            : hasUpper
                              ? "Üst çene"
                              : hasLower
                                ? "Alt çene"
                                : "";
                          
                          // Tedavi seçili mi kontrol et
                          const isSelected = selectedApprovedTreatments.includes(tr.treatment_id);
                          const isSelectable = tr.status === 'onaylanan';
                          const bgByStatus = tr.status === 'onaylanan' ? '#fff' : '#e6f4c8';
                          const borderByStatus = tr.status === 'onaylanan' ? 'transparent' : '#b6e6c6';

                          return (
                            <div className="pc-list-item"
                              key={tr.treatment_id}
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 8, 
                                marginBottom: 8,
                                padding: "6px",
                                borderRadius: 6,
                                background: isSelected ? "#e3f2fd" : bgByStatus,
                                cursor: isSelectable ? "pointer" : "default",
                                border: isSelected ? "1px solid #1976d2" : `1px solid ${borderByStatus}`
                              }}
                              onClick={() => { if (isSelectable) toggleApprovedTreatmentSelection(tr.treatment_id); }}
                            >
                              {isSelectable && (
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleApprovedTreatmentSelection(tr.treatment_id)}
                                  style={{ cursor: "pointer" }}
                                />
                              )}
                              <span>
                                {treatmentName}
                                {jawLabel && (
                                  <span style={{ color: "#666", fontSize: 13 }}> {" "}({jawLabel}{Array.isArray(toothNumbers) && toothNumbers.length > 0 ? ` (${toothNumbers.join(", ")})` : ""})</span>
                                )}
                                {!jawLabel && tr.is_per_tooth && Array.isArray(toothNumbers) && toothNumbers.length > 0 && (
                                  <span style={{ color: "#666", fontSize: 13 }}>
                                    {" "}(Dişler: {toothNumbers.join(", ")})
                                  </span>
                                )}
                                {tr.status === 'tamamlanan' && (
                                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#388e3c' }}>
                                    [Tamamlanan]
                                  </span>
                                )}
                              </span>
                              {showTotals && (
                                <span style={{ fontWeight: 700, color: '#0a2972' }}>
                                  ₺{getLineTotal(tr).toLocaleString('tr-TR')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Tamamla Butonu - En altta sabit */}
                  {approvedTreatments.length > 0 && (
                    <div style={{ width: "100%", paddingTop: 16, borderTop: "1px solid #e0e0e0" }}>
                      <button
                        onClick={handleCompleteTreatments}
                        disabled={selectedApprovedTreatments.length === 0 || completingTreatments}
                        style={{
                          background: selectedApprovedTreatments.length === 0 || completingTreatments ? "#ccc" : "#ff5722",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedApprovedTreatments.length === 0 || completingTreatments ? "not-allowed" : "pointer",
                          width: "100%"
                        }}
                      >
                        {completingTreatments ? "Tamamlanıyor..." : `Tamamla (${selectedApprovedTreatments.length})`}
                      </button>
                      <button
                        onClick={handleUndoApprovedTreatments}
                        disabled={selectedApprovedTreatments.length === 0}
                        style={{
                          background: selectedApprovedTreatments.length === 0 ? "#ccc" : "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: selectedApprovedTreatments.length === 0 ? "not-allowed" : "pointer",
                          width: "100%",
                          marginTop: 8
                        }}
                      >
                        {`Geri Al (${selectedApprovedTreatments.length})`}
                      </button>
                    </div>
                  )}
                </div>
                {/* Tamamlanan Tedaviler */}
                <div className="pc-list-card" style={{ background: "#f8fafc", borderRadius: 24, border: "1.5px solid #b6c6e6", boxShadow: "0 2px 8px #e3eaff", padding: 24, minHeight: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="pc-list-title" style={{ fontWeight: 700, fontSize: 16, color: "#388e3c", marginBottom: 8, borderBottom: "1px solid #dbeafe", width: "100%", textAlign: "center", borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>Biten Tedaviler</div>
                  <div className="pc-list-content" style={{ flex: 1, width: "100%", background: "#fffbea", borderRadius: 12, padding: 16, minHeight: 240 }}>
                    {completedTreatments.length === 0 ? (
                      <div style={{ color: "#888", textAlign: "center" }}>Yok</div>
                    ) : (
                      <ul style={{ fontSize: 15, color: "#2d3a4a", paddingLeft: 12 }}>
                        {completedTreatments.map((tr: any) => {
                          const type = treatmentTypes.find((tt: any) => tt.treatment_type_id === tr.treatment_type_id);
                          const treatmentName = type ? type.name : "Bilinmeyen Tedavi";
                          const toothNumbers = tr.tooth_numbers || tr.toothNumbers || [];
                          // Onaylanan/önerilenlerdeki gibi: varsa diş(ler) bilgisini tek satırda göster
                          return (
                            <li key={tr.treatment_id}>
                              {treatmentName}
                              {Array.isArray(toothNumbers) && toothNumbers.length > 0 && (
                                <span style={{ color: "#666", fontSize: 13 }}> (Dişler: {toothNumbers.join(", ")})</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile-only tweaks to keep desktop/tablet unchanged */}
            <style jsx global>{`
              @media (max-width: 640px) {
                .pc-actions { gap: 10px !important; }
                .pc-actions .pc-btn { padding: 6px 12px !important; font-size: 13px !important; }
                /* Let lists wrap: use auto-fit with a minimum card width so extras drop below */
                .pc-lists { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important; gap: 10px !important; width: 100% !important; }
                .pc-list-card { padding: 10px !important; min-height: 220px !important; }
                .pc-list-title { font-size: 13px !important; margin-bottom: 6px !important; }
                .pc-list-content { padding: 8px !important; min-height: 120px !important; }
                .pc-list-item { margin-bottom: 6px !important; padding: 4px !important; font-size: 12px !important; }
                .pc-list-total { font-size: 13px !important; }
              }
            `}</style>
            {/* Randevu Geçmişi */}
            <div style={{ marginTop: 40, width: "100%" }}>
              <div style={{ fontWeight: 700, color: "#2d3a4a", marginBottom: 10, fontSize: 18 }}>Randevu Geçmişi</div>
              <div style={{ background: "#fffbe9", border: "1px solid #b6c6e6", borderRadius: 12, padding: 16, minHeight: 40 }}>
                {appointments.length === 0 ? (
                  <div style={{ color: "#888" }}>Kayıt yok</div>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {appointments
                      .slice() // kopya
                      .sort((a: any, b: any) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()) // en yeni en üstte
                      .map((ap: any, idx: number, arr: any[]) => {
                        // Seans numarası: en alttan yukarı doğru 1.seans, 2.seans...
                        const seansNo = arr.length - idx;
                        let bg = "#fff";
                        let color = "#2d3a4a";
                        if (ap.status_tr === "Gelmedi") { bg = "#ffeaea"; color = "#d32f2f"; }
                        else if (ap.status_tr === "Geldi") { bg = "#e6f4c8"; color = "#388e3c"; }
                        else if (ap.status_tr === "Planlandı") { bg = "#e3eafc"; color = "#1976d2"; }
                        else if (ap.status_tr === "İptal") { bg = "#f8d7da"; color = "#b71c1c"; }
                        // Doktor adı
                        const doctorName = ap.doctor_first_name && ap.doctor_last_name
                          ? `Dr. ${ap.doctor_first_name} ${ap.doctor_last_name}`
                          : (ap.doctor_name || "Doktor Bilgisi Yok");
                        return (
                          <li key={ap.appointment_id} style={{ background: bg, color, borderRadius: 8, marginBottom: 8, padding: "10px 14px", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px #e3eaff33" }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>
                              {seansNo}. Seans | {new Date(ap.appointment_time).toLocaleString("tr-TR")} - {ap.status_tr || (ap.status?.charAt(0).toUpperCase() + ap.status?.slice(1))}
                            </div>
                            <div style={{ fontSize: 14, color: "#1976d2", marginTop: 2 }}>
                              👨‍⚕️ {doctorName}
                            </div>
                            {ap.notes && <div style={{ fontSize: 14, color: "#555", marginTop: 2 }}>Not: {ap.notes}</div>}
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
  );
}
