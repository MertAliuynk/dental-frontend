
"use client";
import { useState, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import { useRouter } from "next/navigation";

export default function PatientSearchCard() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://dentalapi.karadenizdis.com/api/branch")
      .then(res => res.json())
      .then(data => {
        if (data.success) setBranches(data.data);
      });
  }, []);
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("limit", pageSize.toString());
    params.append("offset", ((page-1)*pageSize).toString());
    if (search.trim() !== "") {
      params.append("search", search.trim());
    }
    if (selectedBranch) {
      params.append("branch_id", selectedBranch.toString());
    }
    fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPatients(data.data);
          setTotal(data.total || 0);
        } else setPatients([]);
        setLoading(false);
      })
      .catch(() => {
        setError("Hasta verileri alınamadı");
        setLoading(false);
      });
  }, [search, page, pageSize, selectedBranch]);

  // Arama ve pagination backend'den geldiği için, sadece gelen hastalar gösterilecek
  const filtered = patients;

  return (
  <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px #0001", minWidth: 280, maxWidth: 320, minHeight: 480, height: 480, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <select
          value={selectedBranch ?? ""}
          onChange={e => setSelectedBranch(e.target.value ? Number(e.target.value) : null)}
          style={{ padding: 8, borderRadius: 6, border: "1.5px solid #1976d2", fontWeight: 700, fontSize: 15, background: '#f8fafc', width: 120, color: '#1a237e', marginRight: 4 }}
        >
          <option value="" style={{ color: '#1a237e', fontWeight: 700 }}>Tüm Şubeler</option>
          {branches.map(b => (
            <option key={b.branch_id} value={b.branch_id} style={{ color: '#1a237e', fontWeight: 700 }}>{b.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Hasta ara..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1.5px solid #1976d2", fontWeight: 700, color: "#1a237e", fontSize: 15, background: '#f8fafc' }}
        />
        <span style={{
          minWidth: 40,
          textAlign: 'center',
          fontSize: 13,
          color: '#0a2972',
          background: '#e3eafc',
          borderRadius: 6,
          padding: '2px 8px',
          fontWeight: 700,
          border: '1.5px solid #1976d2',
          boxShadow: '0 1px 4px #e3eaff33',
          whiteSpace: 'nowrap',
          lineHeight: 1.1,
          maxWidth: 70,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {total}
        </span>
      </div>
  <div style={{ flex: 1 }}>
        {loading && <div style={{ color: "#888", textAlign: "center", fontWeight: 500 }}>Yükleniyor...</div>}
        {error && <div style={{ color: "#e53935", textAlign: "center", fontWeight: 500 }}>{error}</div>}
        {!loading && !error && filtered.length === 0 && <div style={{ color: "#888", textAlign: "center", fontWeight: 500 }}>Hasta bulunamadı</div>}
        {!loading && !error && (
          <List
            height={340}
            itemCount={filtered.length}
            itemSize={44}
            width={"100%"}
            style={{ overflowX: "hidden" }}
          >
            {({ index, style }: { index: number; style: React.CSSProperties }) => {
              const p = filtered[index];
              return (
                <div
                  key={p.patient_id}
                  style={{
                    ...style,
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                    fontSize: 16,
                    color: "#1a237e",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onClick={() => router.push(`/patients/card/?id=${p.patient_id}`)}
                  onMouseOver={e => (e.currentTarget.style.background = "#e3eafc")}
                  onMouseOut={e => (e.currentTarget.style.background = "")}
                >
                  {p.first_name} {p.last_name}
                </div>
              );
            }}
          </List>
        )}
      </div>
      {/* Pagination - kartın içinde, en altta ortalanmış */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 12 }}>
        <button disabled={page === 1} onClick={() => setPage(page-1)} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #dbeafe", background: page === 1 ? "#eee" : "#0a2972", color: "#fff", fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 15, boxShadow: page === 1 ? "none" : "0 2px 8px #0001" }}>Önceki</button>
        <span style={{ fontWeight: 700, color: "#1976d2", fontSize: 15 }}>{page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
        <button disabled={page * pageSize >= total} onClick={() => setPage(page+1)} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #dbeafe", background: page * pageSize >= total ? "#eee" : "#0a2972", color: "#fff", fontWeight: 600, cursor: page * pageSize >= total ? "not-allowed" : "pointer", fontSize: 15, boxShadow: page * pageSize >= total ? "none" : "0 2px 8px #0001" }}>Sonraki</button>
      </div>
    </div>
  );
}
