import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { useSearchParams } from "next/navigation";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const formText = `GENEL BİLGİLENDİRME VE ONAM FORMU

Aşağıda size verilen bilgileri okuyunuz. Bu bilgileri okuyup imzalayarak size ya da çocuğunuza uygulanacak tedavileri hakkında bilgi sahibi olacaksınız. Tedavi planlamasının fayda ve risklerini öğrenmek sizin tedavi sonunda memnun olmanızı sağlayacaktır. Sağlıklı ve mutlu bir yaşam dileğiyle.

Tedaviler esnasında ağrı kontrolünü sağlamak amacıyla sınırlı uyuşturma uygulanmaktadır. Gerekli hallerde öncelikle topikal anestezik madde(sprey) ile dişeti veya yanağın iç kısmı uyuşturulur. Bölge uyuştuğunda anestezik sıvı enjektör ile enjekte edilerek, diş ve bulunduğu bölge bir süreliğine hissizleştirilir. Lokal anestezi uygulaması sonrası nadir de olsa hastalarda alerjik reaksiyonlar, his kaybı, kanama, geçici kas spazmları, geçici yüz felci görülebilir. Lokal anestezi uygulaması, bölgede anatomik farklılıklar veya akut enfeksiyonlar olmadığı sürece başarılı bir uygulamadır. Lokal anestezi uygulanan bölge yaklaşık 2–4 saat boyunca hissizdir. Bu nedenle, ısırmaya bağlı yanak içi ve dudakta yara oluşmaması için hissizlik geçene kadar yeme içme önerilmez. 2–4 saat sonrasında anestezinin etkisi ortadan kalkar. Tedavileriniz esnasında ileri tetkik için biyopsi alınması gerekebilir. Sağlık kuruluşumuzun, düzeninin ve tedavi programının aksamaması için randevularınıza sadık olmaya ve zamanında gelmeye özen gösteriniz. Gelmeniz mümkün olmadığında, randevunuzu 24 saat öncesinden iptal ettiriniz.

GENEL ONAM FORMU

Aşağıda imzası olan ben/hastanın vasisi/hastanın velisi, dişhekimi tarafından hastalığın teşhisi, tedavi planı ve alternatif tedaviler hakkında bilgilendirildim. Bana önerilen tedavileri kabul ettim.

Şüpheli tedavilerde planlamanın değişebileceği anlatıldı, anladım ve kabul ettim. Tedavilerimle ya da çocuğumun/…………………….. tedavisi hakkında merak ettiğim tüm sorulara cevap verildi.

Yapılacak tedavilerin başarısının bana da bağlı olduğu, evde üzerime düşen ağız temizliği ve diyet önerilerine uymam gerektiği anlatıldı, kabul ettim.

Benim/çocuğumun/……………….. vazgeçmemiz gereken zararlı alışkanlıklarla ilgili önerileri yerine getirmem ve bana/çocuğuma/……………. yazılacak reçetelerdeki ilaçları tarife uygun doz ve sürelerde kullanmam gerekliliği anlatıldı ve kabul ettim.

Bana/çocuğuma/……………………… uygulanacak tedavilerin uzun süreli garanti edilemeyeceği anlatıldı, anladım ve kabul ettim.

Tedaviyi kabul ettikten sonra bana/çocuğuma/………………………. ait bilgi, radyografi, fotoğraf, video ve diğer dokümanların eğitim ve/veya bilimsel amaçlı çalışmalarda kullanılmasını kabul edip izin verdim.

Tedavim sırasında kişisel eşyalarımın(para, mücevher, takı, giyecek, cep telefonu vb.) sorumluluğu ve güvenliğinin bana ait olduğu bildirildi, anladım ve kabul ettim.

Yukarıda belirtildiği gibi tedavi planlaması sırasında bana/çocuğuma/…………………….. anlatılan ve benim tarafımdan kabul edilen diş tedavilerini onayladım ve kabul ettim.

Hasta haklarıyla ilgili olarak bilgilendirildi.

* Yasal Temsilci: Vesayet altındakiler için vasi, reşit olmayanlar için anne- baba, bunların bulunmadığı durumlarda 1. derece kanuni mirasçılardır.(Hasta yakınının isminin yanında yakınlık derecesini belirtiniz.)

Hasta veya Hastanın Yasal Temsilcisi* - Yakınlık Derecesi
Adı-Soyadı : {name}
T.C. Kimlik No’su : {tc}
Adresi : ..............................................
Telefon : {phone}
İmza : .................................................`;

export default function ConsentFormDownloadPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patient_id");
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
    const filledText = formText
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
          Genel Bilgilendirme ve Onam Formu
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
