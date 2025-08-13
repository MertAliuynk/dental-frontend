
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
  // Modal yerine edit sayfasına yönlendirme kullanılacak
  const [sortOption, setSortOption] = useState<string>("name-asc");
  const router = useRouter();
  const [role, setRole] = useState<string>("");

  const fetchPatients = () => {
  fetch("https://dentalapi.karadenizdis.com/api/patient")
      .then(res => res.json())
      .then(data => {
        if (data.success) setPatients(data.data);
        else setPatients([]);
      })
      .catch(() => setPatients([]));
  };

  useEffect(() => {
    fetchPatients();
    try { setRole(localStorage.getItem("role") || ""); } catch {}
  }, []);

  const handleEditClick = (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();
    router.push(`/patients/new?id=${patient.patient_id}`);
  };

  // Düzenleme sonrası geri dönüldüğünde sayfa yenileneceği için ek işleme gerek yok

  // Sıralama fonksiyonu
  const getSortedPatients = () => {
    const sortedPatients = [...patients];
    
    switch (sortOption) {
      case "name-asc":
        return sortedPatients.sort((a, b) => {
          const nameA = (a.first_name + " " + a.last_name).toLowerCase();
          const nameB = (b.first_name + " " + b.last_name).toLowerCase();
          return nameA.localeCompare(nameB, "tr");
        });
      
      case "name-desc":
        return sortedPatients.sort((a, b) => {
          const nameA = (a.first_name + " " + a.last_name).toLowerCase();
          const nameB = (b.first_name + " " + b.last_name).toLowerCase();
          return nameB.localeCompare(nameA, "tr");
        });
      
      case "surname-asc":
        return sortedPatients.sort((a, b) => {
          const surnameA = a.last_name?.toLowerCase() || "";
          const surnameB = b.last_name?.toLowerCase() || "";
          return surnameA.localeCompare(surnameB, "tr");
        });
      
      case "surname-desc":
        return sortedPatients.sort((a, b) => {
          const surnameA = a.last_name?.toLowerCase() || "";
          const surnameB = b.last_name?.toLowerCase() || "";
          return surnameB.localeCompare(surnameA, "tr");
        });
      
      default:
        return sortedPatients;
    }
  };

  const sorted = getSortedPatients();
  const filtered = sorted.filter(p =>
    (p.first_name + " " + p.last_name).toLowerCase().includes(search.toLowerCase())
  );

  // Sıralama okları için yardımcı fonksiyon
  const getSortIcon = (column: string) => {
    if (sortOption.startsWith(column)) {
      return sortOption.endsWith("-asc") ? " ↑" : " ↓";
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
              Toplam: {patients.length}
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
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
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
              <option value="name-asc">Ad-Soyad (A-Z)</option>
              <option value="name-desc">Ad-Soyad (Z-A)</option>
              <option value="surname-asc">Soyad (A-Z)</option>
              <option value="surname-desc">Soyad (Z-A)</option>
            </select>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", overflow: "auto", height: "70vh", minHeight: 400, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
          <div style={{ width: "100%", height: "100%" }}>
            <AutoSizer>
               {({ height, width }) => (
                 <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900, tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '8%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: "#e3eafc" }}>
                      <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "12px 8px" }}>Ad-Soyad{getSortIcon("name")}</th>
                      <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "12px 8px" }}>Soyad{getSortIcon("surname")}</th>
                      <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "12px 8px" }}>Telefon</th>
                      <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "12px 8px" }}>TC Kimlik No</th>
                      <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "12px 8px" }}>Şube</th>
                      <th style={{ ...thStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "12px 8px" }}>Oluşturma Tarihi</th>
                      <th style={{ ...thStyle, textAlign: "center", verticalAlign: "middle", minWidth: 120, fontSize: 15, padding: "12px 8px" }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", color: "#888", padding: 32 }}>Kayıtlı hasta bulunamadı.</td></tr>
                    ) : (
                      <List
                        height={height - 40}
                        itemCount={filtered.length}
                        itemSize={56}
                        width={width}
                        outerElementType={CustomTBody as any}
                      >
                         {({ index, style }: { index: number; style: React.CSSProperties }) => {
                           const p = filtered[index];
                           return (
                             <tr
                               key={p.patient_id || index}
                               style={{ ...style, borderBottom: "1px solid #f0f0f0", cursor: "pointer", transition: "background 0.2s", display: "table-row", width: "auto" }}
                               onClick={() => router.push(`/patients/card/?id=${p.patient_id}`)}
                               onMouseOver={e => (e.currentTarget.style.background = "#e3eafc")}
                               onMouseOut={e => (e.currentTarget.style.background = "")}
                             >
                               <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "10px 8px" }}>{p.first_name + ' ' + p.last_name}</td>
                               <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "10px 8px" }}>{p.last_name}</td>
                               <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "10px 8px" }}>{role === 'doctor' ? '•••' : (p.phone || '-')}</td>
                               <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "10px 8px" }}>{role === 'doctor' ? '•••' : (p.tc_number || '-')}</td>
                               <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "10px 8px" }}>{p.branch_name || '-'}</td>
                               <td style={{ ...tdStyle, textAlign: "left", verticalAlign: "middle", fontSize: 15, padding: "10px 8px" }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                               <td style={{ ...tdStyle, textAlign: "center", verticalAlign: "middle", minWidth: 120, fontSize: 15, padding: "10px 8px" }}>
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
                           );
                         }}
                      </List>
                    )}
                  </tbody>
                </table>
              )}
            </AutoSizer>
          </div>
        </div>
      </main>
    </AppLayout>
  );

// react-window ile tbody yerine kullanılacak özel component
}

const thStyle = {
  fontWeight: 700,
  color: "#1a237e",
  fontSize: 15,
  padding: "12px 8px",
  borderBottom: "2px solid #dbeafe",
  textAlign: "left" as const
};

const tdStyle = {
  fontWeight: 500,
  color: "#2d3a4a",
  fontSize: 15,
  padding: "10px 8px"
};
