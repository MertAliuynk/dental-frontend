
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../components/AppLayout";

import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

const CustomTBody = React.forwardRef<HTMLTableSectionElement, React.HTMLProps<HTMLTableSectionElement>>(
  (props, ref) => <tbody ref={ref} {...props} />
);

export default function PatientsListPageClient() {
  // Tablo başlık ve hücre stilleri
  const thStyle = {
    background: "#e3eafc",
    fontWeight: 700,
    color: "#0a2972",
    borderBottom: "2px solid #cfd8dc"
  };
  const tdStyle = {
    background: "#fff",
    fontWeight: 500,
    color: "#1a237e",
    borderBottom: "1px solid #f0f0f0"
  };
  // Hasta silme fonksiyonu
const handleDelete = async (e: React.MouseEvent, patient: any) => {
  e.stopPropagation();
  if (!window.confirm(`${patient.first_name} ${patient.last_name} adlı hastayı silmek istediğinize emin misiniz?`)) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`https://dentalapi.karadenizdis.com/api/patient/${patient.patient_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setPatients((prev: any[]) => prev.filter((p: any) => p.patient_id !== patient.patient_id));
    } else {
      alert(data.message || 'Hasta silinemedi!');
    }
  } catch {
    alert('Sunucu hatası!');
  }
};

  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  // Sıralama: orderBy ve order
  const [orderBy, setOrderBy] = useState<string>("first_name");
  const [order, setOrder] = useState<string>("asc");
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);

  // Arama kutusu değiştiğinde sayfa 1'e dön
  useEffect(() => {
    setPage(1);
  }, [search]);
  const fetchPatients = () => {
    const params = new URLSearchParams();
    params.append("limit", pageSize.toString());
    params.append("offset", ((page-1)*pageSize).toString());
    if (search.trim() !== "") {
      params.append("search", search.trim());
    }
    params.append("orderBy", orderBy);
    params.append("order", order);
    fetch(`https://dentalapi.karadenizdis.com/api/patient?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPatients(data.data);
          setTotal(data.total || 0);
        } else setPatients([]);
      })
      .catch(() => setPatients([]));
  };

  useEffect(() => {
    fetchPatients();
    try { setRole(localStorage.getItem("role") || ""); } catch {}
  }, [page, pageSize, search, orderBy, order]);
  // Sayfa değiştirici
  const Pagination = () => (
    <div style={{
      margin: "32px 0 24px 0",
      textAlign: "center",
      position: "relative",
      zIndex: 20,
      background: "#f3f6fa",
      borderRadius: 12,
      boxShadow: "0 2px 8px #0002",
      padding: "18px 0",
      border: "1px solid #e3eafc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      minHeight: 56
    }}>
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        style={{
          background: page === 1 ? "#cfd8dc" : "#0a2972",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "10px 22px",
          fontWeight: 700,
          fontSize: 16,
          cursor: page === 1 ? "not-allowed" : "pointer",
          boxShadow: "0 1px 4px #0001",
          transition: "background 0.2s"
        }}
      >Önceki</button>
      <span style={{
        margin: "0 18px",
        fontWeight: 700,
        fontSize: 18,
        color: "#0a2972",
        background: "#e3eafc",
        borderRadius: 8,
        padding: "8px 18px",
        border: "1px solid #cfd8dc"
      }}>{page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
      <button
        disabled={page * pageSize >= total}
        onClick={() => setPage(page + 1)}
        style={{
          background: page * pageSize >= total ? "#cfd8dc" : "#0a2972",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "10px 22px",
          fontWeight: 700,
          fontSize: 16,
          cursor: page * pageSize >= total ? "not-allowed" : "pointer",
          boxShadow: "0 1px 4px #0001",
          transition: "background 0.2s"
        }}
      >Sonraki</button>
    </div>
  );

  const handleEditClick = (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();
    router.push(`/patients/new?id=${patient.patient_id}`);
  };

  // Düzenleme sonrası geri dönüldüğünde sayfa yenileneceği için ek işleme gerek yok

  // Sıralama fonksiyonu
  // Sıralama backend'den geldiği için ek frontend sıralama yok
  const filtered = patients;

  // Sıralama okları için yardımcı fonksiyon
  const getSortIcon = (column: string) => {
    if (orderBy === column) {
      return order === "asc" ? " ↑" : " ↓";
    }
    return "";
  };

  return (
    <AppLayout>
      <main style={{ padding: 24, minHeight: "100vh" }}>
        <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 24, color: "#0a2972" }}>
          Hasta Listesi ({filtered.length} hasta)
        </h2>
        {/* Arama ve Sıralama Kontrolleri */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: "#0a2972",
              minWidth: "fit-content"
            }}>
              Sırala:
            </span>
            <select
              value={orderBy + '-' + order}
              onChange={e => {
                const [by, ord] = e.target.value.split('-');
                setOrderBy(by);
                setOrder(ord);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "2px solid #0a2972",
                fontSize: 16,
                background: "#e3eafc",
                color: "#1a237e",
                fontWeight: 600,
                minWidth: 200,
                cursor: "pointer"
              }}
            >
              <option value="first_name-asc">Ad (A-Z)</option>
              <option value="first_name-desc">Ad (Z-A)</option>
              <option value="last_name-asc">Soyad (A-Z)</option>
              <option value="last_name-desc">Soyad (Z-A)</option>
              <option value="created_at-desc">Oluşturma Tarihi (Yeni → Eski)</option>
              <option value="created_at-asc">Oluşturma Tarihi (Eski → Yeni)</option>
              <option value="branch_name-asc">Şube (A-Z)</option>
              <option value="branch_name-desc">Şube (Z-A)</option>
            </select>
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 8px #0001",
            overflowX: "auto",
            height: "70vh",
            minHeight: 400,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start"
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 600,
              borderCollapse: "collapse",
              tableLayout: "fixed"
            }}
          >
            <thead>
              <tr style={{ background: "#e3eafc" }}>
                <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(12px,2.8vw,15px)", padding: "clamp(6px,2vw,12px) clamp(8px,3vw,16px)" }}>Ad{getSortIcon("name")}</th>
                <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(12px,2.8vw,15px)", padding: "clamp(6px,2vw,12px) clamp(8px,3vw,16px)" }}>Soyad{getSortIcon("surname")}</th>
                <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(12px,2.8vw,15px)", padding: "clamp(6px,2vw,12px) clamp(8px,3vw,16px)" }}>Telefon</th>
                <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(12px,2.8vw,15px)", padding: "clamp(6px,2vw,12px) clamp(8px,3vw,16px)" }}>TC Kimlik No</th>
                <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(12px,2.8vw,15px)", padding: "clamp(6px,2vw,12px) clamp(8px,3vw,16px)" }}>Şube</th>
                <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(12px,2.8vw,15px)", padding: "clamp(6px,2vw,12px) clamp(8px,3vw,16px)" }}>Oluşturma Tarihi</th>
                <th style={{ ...thStyle, textAlign: "center", verticalAlign: "middle", minWidth: 90, fontSize: "clamp(12px,2.8vw,15px)", padding: "clamp(6px,2vw,12px) clamp(8px,3vw,16px)" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "#888", padding: 32 }}>Kayıtlı hasta bulunamadı.</td></tr>
              ) : (
                filtered.map((p, index) => (
                  <tr
                    key={p.patient_id || index}
                    style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer", transition: "background 0.2s", display: "table-row", width: "auto" }}
                    onClick={() => router.push(`/patients/card/?id=${p.patient_id}`)}
                    onMouseOver={e => (e.currentTarget.style.background = "#e3eafc")}
                    onMouseOut={e => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(11px,2.5vw,15px)", padding: "clamp(5px,1.5vw,10px) clamp(6px,2vw,8px)" }}>{p.first_name}</td>
                    <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(11px,2.5vw,15px)", padding: "clamp(5px,1.5vw,10px) clamp(6px,2vw,8px)" }}>{p.last_name}</td>
                    <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(11px,2.5vw,15px)", padding: "clamp(5px,1.5vw,10px) clamp(6px,2vw,8px)" }}>{role === 'doctor' ? '•••' : (p.phone || '-')}</td>
                    <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(11px,2.5vw,15px)", padding: "clamp(5px,1.5vw,10px) clamp(6px,2vw,8px)" }}>{role === 'doctor' ? '•••' : (p.tc_number || '-')}</td>
                    <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(11px,2.5vw,15px)", padding: "clamp(5px,1.5vw,10px) clamp(6px,2vw,8px)" }}>{p.branch_name || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: "clamp(11px,2.5vw,15px)", padding: "clamp(5px,1.5vw,10px) clamp(6px,2vw,8px)" }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ ...tdStyle, textAlign: "center", verticalAlign: "middle", minWidth: 90, fontSize: "clamp(11px,2.5vw,15px)", padding: "clamp(5px,1.5vw,10px) clamp(6px,2vw,8px)" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                        <button
                          onClick={(e) => handleEditClick(e, p)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#0a2972",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 600,
                            transition: "background 0.2s"
                          }}
                          onMouseOver={e => (e.currentTarget.style.backgroundColor = "#1a237e")}
                          onMouseOut={e => (e.currentTarget.style.backgroundColor = "#0a2972")}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, p)}
                          title="Sil"
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "#e53935",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 16,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: "background 0.2s"
                          }}
                          onMouseOver={e => (e.currentTarget.style.backgroundColor = "#b71c1c")}
                          onMouseOut={e => (e.currentTarget.style.backgroundColor = "#e53935")}
                        >
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 8V15M10 8V15M14 8V15M3 5H5H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 5V3C8 2.44772 8.44772 2 9 2H11C11.5523 2 12 2.44772 12 3V5M5 5V17C5 17.5523 5.44772 18 6 18H14C14.5523 18 15 17.5523 15 17V5H5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Responsive pagination butonları */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: 24,
            margin: "24px 0 0 0",
            width: "100%",
            flexWrap: "wrap"
          }}
        >
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{
              background: page === 1 ? "#cfd8dc" : "#0a2972",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontWeight: 700,
              fontSize: 16,
              cursor: page === 1 ? "not-allowed" : "pointer",
              boxShadow: "0 1px 4px #0001",
              transition: "background 0.2s",
              minWidth: 120,
              width: "100%",
              maxWidth: 180
            }}
          >Önceki</button>
          <button
            disabled={page * pageSize >= total}
            onClick={() => setPage(page + 1)}
            style={{
              background: page * pageSize >= total ? "#cfd8dc" : "#0a2972",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontWeight: 700,
              fontSize: 16,
              cursor: page * pageSize >= total ? "not-allowed" : "pointer",
              boxShadow: "0 1px 4px #0001",
              transition: "background 0.2s",
              minWidth: 120,
              width: "100%",
              maxWidth: 180
            }}
          >Sonraki</button>
        </div>
      </main>
    </AppLayout>
  );
}
