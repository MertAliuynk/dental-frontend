"use client";
import { useEffect, useState } from "react";

export default function PatientSelectModal({ open, onClose, onSelect }: { open: boolean, onClose: () => void, onSelect: (id: number) => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    if (open) {
      const params = new URLSearchParams();
      params.append("limit", pageSize.toString());
      params.append("offset", ((page-1)*pageSize).toString());
      if (search.trim() !== "") {
        params.append("search", search.trim());
      }
      fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          setPatients(data.success ? data.data : []);
          setTotal(data.total || 0);
        });
    }
  }, [open, search, page, pageSize]);
  if (!open) return null;
  // Arama artık backend'den geldiği için, sadece gelen hastalar gösterilecek
  const filtered = patients;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 400, width: "100%", boxShadow: "0 2px 16px #0003" }}>
        <h3 style={{ marginBottom: 16, color: "#0a2972", fontWeight: 700 }}>Hasta Seç</h3>
        <input
          type="text"
          placeholder="İsme göre ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #dbeafe", marginBottom: 16 }}
        />
        <div style={{ maxHeight: 260, overflowY: "auto" }}>
          {filtered.length === 0 ? <div style={{ color: "#888", textAlign: "center" }}>Hasta bulunamadı</div> :
            filtered.map(p => (
              <div key={p.patient_id} style={{ padding: 8, borderBottom: "1px solid #eee", cursor: "pointer", color: "#0a2972", fontWeight: 600 }} onClick={() => onSelect(p.patient_id)}>
                {p.first_name} {p.last_name}
              </div>
            ))}
        </div>
        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button disabled={page === 1} onClick={() => setPage(page-1)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #dbeafe", background: page === 1 ? "#eee" : "#0a2972", color: "#fff", fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer" }}>Önceki</button>
          <span style={{ fontWeight: 600, color: "#1976d2" }}>{page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
          <button disabled={page * pageSize >= total} onClick={() => setPage(page+1)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #dbeafe", background: page * pageSize >= total ? "#eee" : "#0a2972", color: "#fff", fontWeight: 600, cursor: page * pageSize >= total ? "not-allowed" : "pointer" }}>Sonraki</button>
        </div>
        <button onClick={onClose} style={{ marginTop: 18, background: "#e53935", color: "white", border: 0, borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", width: "100%" }}>Vazgeç</button>
      </div>
    </div>
  );
}
