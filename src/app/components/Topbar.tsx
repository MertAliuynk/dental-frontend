"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const pages = [
  { label: "Ana Sayfa", path: "/" },
  { label: "Randevu Takvimi", path: "/calendar" },
  { label: "Hasta Kartı Görüntüle", path: "/patients/card" },
  { label: "Yeni Hasta Ekle", path: "/patients/new" },
  { label: "Hasta Listesi", path: "/patients" },
  { label: "Toplu Hasta Ekleme", path: "/patients/bulk" },
  { label: "Onam Formları", path: "/patients/consent" },
  { label: "Sms Gönder", path: "/sms/send" },
  { label: "Sms Şablonları", path: "/sms/templates" },
  { label: "Hasta Raporları", path: "/reports/patients" },
  { label: "Gelir Raporları", path: "/reports/income" },
  { label: "Geri Dönüşler", path: "/feedbacks" },
];

export default function Topbar({ fullWidth = false, onHamburger }: { fullWidth?: boolean, onHamburger?: () => void }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const filtered = pages.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <header style={{
      width: fullWidth ? "100vw" : "100%",
      position: "sticky",
      left: 0,
      height: 56,
      background: "#3b5998",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: fullWidth ? "0 24px 0 0" : "0 32px 0 0",
      boxSizing: "border-box",
      boxShadow: "0 2px 8px #0002",
      top: 0,
      zIndex: 110,
      minWidth: 0,
      borderBottom: "1px solid #dbeafe"
    }}>
      {/* Hamburger button for mobile */}
      <div className="topbar-hamburger" style={{ display: 'none', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <button
          aria-label="Menüyü Aç"
          onClick={onHamburger}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 28,
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 40,
            width: 40
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>☰</span>
        </button>
      </div>
      <div style={{ width: fullWidth ? 0 : 240 }} />
      <div style={{ position: "relative", width: 320 }}>
        <input
          type="text"
          placeholder="Sayfa ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 36px 8px 12px",
            borderRadius: 6,
            border: "1px solid #dbeafe",
            fontSize: 15
          }}
        />
        <span style={{ position: "absolute", right: 10, top: 10, color: "#888" }}>🔍</span>
        {search && (
          <div style={{
            position: "absolute",
            top: 38,
            left: 0,
            width: "100%",
            background: "white",
            border: "1px solid #dbeafe",
            borderRadius: 6,
            boxShadow: "0 2px 8px #0001",
            zIndex: 10
          }}>
            {filtered.length === 0 && <div style={{ padding: 10, color: "#888" }}>Sonuç yok</div>}
            {filtered.map((p) => (
              <div
                key={p.path}
                style={{ padding: 10, cursor: "pointer", fontSize: 15, borderBottom: "1px solid #f0f0f0" }}
                onClick={() => { router.push(p.path); setSearch(""); }}
              >
                {p.label}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, color: "#fff", cursor: "pointer" }}>⚙️</span>
      </div>
      <style>{`
        @media (max-width: 767.98px) {
          .topbar-hamburger { display: flex !important; }
          header > div:nth-child(2) { display: none !important; }
        }
      `}</style>
    </header>
  );
}
