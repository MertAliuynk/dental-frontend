import React from "react";
import AppLayout from "../components/AppLayout";
import { useRouter, useSearchParams } from "next/navigation";

const consentFormTypes = [
  "Genel Bilgilendirme ve Onam Formu",
  "Ağız ve Çene Hastalıkları ve Cerrahisi Diş Çekimi Hasta Bilgilendirme ve Onam Formu",
  "Diş Hastalıkları ve Tedavisi Hasta Bilgilendirme ve Onam Formu",
  "Endodontik Tedavi Onam Formu",
  "Kron Köprü Protezleri İçin Hasta Bilgilendirme ve Onam Formu",
  "Ortodontik Tedaviler İçin Hasta Bilgilendirme ve Onam Formu",
  "İmplant Cerrahisi Hasta Bilgilendirme ve Onam Formu",
  "YENİ KORONOVİRÜS (COVID –19) İLE İLGİLİ ONAM FORMU",
  "Kişisel Verilerin Aydınlatma ve Onam Metni"
];

export default function ConsentFormTypeSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patient_id");

  return (
    <AppLayout>
      <main style={{ padding: 24, minHeight: "100vh", maxWidth: 500, margin: "0 auto" }}>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 24, color: "#0a2972" }}>Onam Formu Seç</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {consentFormTypes.map((type, idx) => (
              <li key={type} style={{ borderBottom: idx < consentFormTypes.length-1 ? "1px solid #e3eafc" : "none" }}>
                <button
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "18px 12px",
                    fontSize: 17,
                    fontWeight: 600,
                    color: "#1a237e",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                  onClick={() => router.push(`/consent-forms/form?patient_id=${patientId}&type=${encodeURIComponent(type)}`)}
                >
                  {type}
                  <span style={{ fontSize: 22, color: "#0a2972" }}>&#8250;</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </AppLayout>
  );
}
