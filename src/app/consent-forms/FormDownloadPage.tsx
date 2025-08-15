"use client";
import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { useSearchParams } from "next/navigation";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const formTemplates = {
  "Genel Bilgilendirme ve Onam Formu": `GENEL BİLGİLENDİRME VE ONAM FORMU\n\n...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
  "Ağız ve Çene Hastalıkları ve Cerrahisi Diş Çekimi Hasta Bilgilendirme ve Onam Formu": `AĞIZ VE ÇENE HASTALIKLARI ...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
  "Diş Hastalıkları ve Tedavisi Hasta Bilgilendirme ve Onam Formu": `DİŞ HASTALIKLARI ...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
  "Endodontik Tedavi Onam Formu": `ENDODONTİK TEDAVİ ...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
  "Kron Köprü Protezleri İçin Hasta Bilgilendirme ve Onam Formu": `KRON KÖPRÜ PROTEZLERİ ...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
  "Ortodontik Tedaviler İçin Hasta Bilgilendirme ve Onam Formu": `ORTODONTİK TEDAVİLER ...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
  "İmplant Cerrahisi Hasta Bilgilendirme ve Onam Formu": `İMPLANT CERRAHİSİ ...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
  "YENİ KORONOVİRÜS (COVID –19) İLE İLGİLİ ONAM FORMU": `COVID-19 ...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
  "Kişisel Verilerin Aydınlatma ve Onam Metni": `KİŞİSEL VERİLER ...\nAdı-Soyadı : {name}\nT.C. Kimlik No’su : {tc}\nAdresi : ..............................................\nTelefon : {phone}\nİmza : .................................................`,
};

export default function ConsentFormDownloadPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patient_id");
  const type = searchParams.get("type") || "Genel Bilgilendirme ve Onam Formu";
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    fetch(`https://dentalapi.karadenizdis.com/api/patient/${patientId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPatient(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [patientId]);

  const handleDownload = async () => {
    if (!patient) return;
    // Şablonu doldur
  const template = (formTemplates as any)[type] || formTemplates["Genel Bilgilendirme ve Onam Formu"];
    const filledText = template
      .replace("{name}", `${patient.first_name} ${patient.last_name}`)
      .replace("{tc}", patient.tc_number || "-")
      .replace("{address}", patient.address || "-")
      .replace("{phone}", patient.phone || "-");
    // PDF oluştur
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const margin = 40;
    const lines = filledText.split("\n");
    let y = 800;
    for (const line of lines) {
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0,0,0) });
      y -= 22;
      if (y < 50) break; // Sayfa taşmasın
    }
  const pdfBytes = await pdfDoc.save();
  // pdfBytes Uint8Array, Blob için ArrayBuffer gerekiyor
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Genel_Bilgilendirme_Onam_Formu.pdf";
  a.click();
  URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <main style={{ padding: 24, minHeight: "100vh", maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 24, color: "#0a2972" }}>
          {type}
        </h2>
        {loading ? <div>Yükleniyor...</div> : patient && (
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 24 }}>
            <p>Hasta: <b>{patient.first_name} {patient.last_name}</b></p>
            <p>TC Kimlik No: <b>{patient.tc_number}</b></p>
            <p>Telefon: <b>{patient.phone}</b></p>
            <p>Adres: <b>{patient.address || "-"}</b></p>
            <button
              style={{ background: "#0a2972", color: "white", border: "none", borderRadius: 6, padding: "12px 28px", fontWeight: 700, fontSize: 18, cursor: "pointer", marginTop: 24 }}
              onClick={handleDownload}
            >PDF İndir</button>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
