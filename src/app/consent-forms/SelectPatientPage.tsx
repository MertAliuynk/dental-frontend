
"use client";
import React, { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useRouter } from "next/navigation";

export default function ConsentFormSelectPatientPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    params.append("limit", pageSize.toString());
    params.append("offset", ((page-1)*pageSize).toString());
    if (search.trim() !== "") {
      params.append("search", search.trim());
    }
    fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPatients(data.data);
          setTotal(data.total || 0);
        } else setPatients([]);
      })
      .catch(() => setPatients([]));
  }, [page, pageSize, search]);

  return (
    <AppLayout>
      <main style={{ padding: 24, minHeight: "100vh" }}>
        <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 24, color: "#0a2972" }}>
          Onam Formu İçin Hasta Seç
        </h2>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="İsme göre hasta ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 320,
              padding: "8px 12px",
              borderRadius: 6,
              border: "2px solid #0a2972",
              fontSize: 16,
              background: "#e3eafc",
              color: "#1a237e",
              fontWeight: 600
            }}
          />
          <span style={{ fontSize: 13, color: '#555', background: '#f3f6fa', borderRadius: 6, padding: '2px 8px', fontWeight: 500, border: '1px solid #e3eafc' }}>
            Toplam: {total}
          </span>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", overflowX: "auto", minHeight: 400 }}>
          <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: "#e3eafc" }}>
                <th style={{ padding: "12px", fontWeight: 700, color: "#0a2972" }}>Ad</th>
                <th style={{ padding: "12px", fontWeight: 700, color: "#0a2972" }}>Soyad</th>
                <th style={{ padding: "12px", fontWeight: 700, color: "#0a2972" }}>Telefon</th>
                <th style={{ padding: "12px", fontWeight: 700, color: "#0a2972" }}>Şube</th>
                <th style={{ padding: "12px", fontWeight: 700, color: "#0a2972" }}>Seç</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#888", padding: 32 }}>Kayıtlı hasta bulunamadı.</td></tr>
              ) : (
                patients.map((p: any) => (
                  <tr key={p.patient_id} style={{ borderBottom: "1px solid #e3eafc" }}>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#1a237e", fontSize: 16 }}>{p.first_name}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#1a237e", fontSize: 16 }}>{p.last_name}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#1a237e", fontSize: 16 }}>{p.phone}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#1a237e", fontSize: 16 }}>{p.branch_name}</td>
                    <td style={{ padding: "10px" }}>
                      <button
                        style={{ background: "#0a2972", color: "white", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 700, cursor: "pointer" }}
                        onClick={() => router.push(`/consent-forms/select-form-type?patient_id=${p.patient_id}`)}
                      >Seç</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, margin: "24px 0 0 0" }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{ background: page === 1 ? "#cfd8dc" : "#0a2972", color: "white", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: page === 1 ? "not-allowed" : "pointer", boxShadow: "0 1px 4px #0001", transition: "background 0.2s" }}
          >Önceki</button>
          <button
            disabled={page * pageSize >= total}
            onClick={() => setPage(page + 1)}
            style={{ background: page * pageSize >= total ? "#cfd8dc" : "#0a2972", color: "white", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: page * pageSize >= total ? "not-allowed" : "pointer", boxShadow: "0 1px 4px #0001", transition: "background 0.2s" }}
          >Sonraki</button>
        </div>
      </main>
    </AppLayout>
  );
}
