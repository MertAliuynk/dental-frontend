
"use client";
import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout";



interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  tc_number: string;
}


interface SmsTemplate {
  template_id: number;
  name: string;
  content: string;
}


export default function ScheduledSmsPage() {
  // Sayfa açıldığında zamanı gelmiş planlı SMS'leri gönder
  useEffect(() => {
    fetch('/api/sms/send-due-scheduled', { method: 'POST' });
  }, []);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/patient", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPatients(data.data || data);
        }
      } catch (error) {
        setPatients([]);
      }
    };
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/sms/templates", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        setTemplates([]);
      }
    };
    fetchPatients();
    fetchTemplates();
  }, []);

  const handleSend = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("SMS planlandı!");
    }, 1000);
  };

  return (
    <AppLayout>
      <div style={{ padding: 24 }}>
        <div style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: 24,
          maxWidth: 540,
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          <h1 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 700, color: "#1a1a1a", textAlign: "center" }}>
            İleri Tarihli SMS Planla
          </h1>

          {/* Hasta Seçimi */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#333" }}>
              Hasta Seç:
            </label>
            <select
              value={selectedPatient || ""}
              onChange={e => setSelectedPatient(Number(e.target.value) || null)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e1e5e9",
                borderRadius: 8,
                fontSize: 16,
                outline: "none",
                background: "white",
                color: "#222",
                fontWeight: 700
              }}
            >
              <option value="">Hasta seçiniz...</option>
              {patients.map(p => (
                <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name} - {p.phone}</option>
              ))}
            </select>
          </div>

          {/* SMS Şablonu Seçimi */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#333" }}>
              SMS Şablonu Seçin:
            </label>
            <select
              value={selectedTemplate || ""}
              onChange={e => setSelectedTemplate(Number(e.target.value) || null)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e1e5e9",
                borderRadius: 8,
                fontSize: 16,
                outline: "none",
                background: "white",
                color: "#222",
                fontWeight: 700
              }}
            >
              <option value="">Şablon seçiniz...</option>
              {templates.map(t => (
                <option key={t.template_id} value={t.template_id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Seçili Şablon Önizleme */}
          {selectedTemplate && (
            <div style={{
              background: "#f8f9fa",
              border: "1px solid #e1e5e9",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24
            }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>Şablon Önizleme:</h4>
              <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>
                {templates.find(t => t.template_id === selectedTemplate)?.content}
              </p>
            </div>
          )}

          {/* Tarih ve Saat Seçimi */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: "#333", marginBottom: 8, display: "block" }}>Tarih</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e1e5e9", fontSize: 16, color: "#222", fontWeight: 700 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: "#333", marginBottom: 8, display: "block" }}>Saat</label>
              <input
                type="time"
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e1e5e9", fontSize: 16, color: "#222", fontWeight: 700 }}
              />
            </div>
          </div>

          {/* Seçim Özeti */}
          <div style={{
            background: "#e8f4fd",
            border: "1px solid #b3d9ff",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24
          }}>
            <div style={{ fontWeight: 600, color: "#0066cc", marginBottom: 4 }}>
              Seçim Özeti:
            </div>
            <div style={{ color: "#333" }}>
              {selectedPatient ? `${patients.find(p => p.patient_id === selectedPatient)?.first_name} ${patients.find(p => p.patient_id === selectedPatient)?.last_name}` : "Hasta seçilmedi"}
              {selectedTemplate && `, "${templates.find(t => t.template_id === selectedTemplate)?.name}" şablonu seçildi`}
              {selectedDate && selectedTime && `, ${selectedDate} ${selectedTime}`}
            </div>
          </div>

          {/* Gönder Butonu */}
          <button
            onClick={handleSend}
            disabled={!selectedPatient || !selectedTemplate || !selectedDate || !selectedTime || loading}
            style={{
              width: "100%",
              padding: "16px 24px",
              background: (!selectedPatient || !selectedTemplate || !selectedDate || !selectedTime || loading) ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              cursor: (!selectedPatient || !selectedTemplate || !selectedDate || !selectedTime || loading) ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Gönderiliyor..." : "SMS Planla"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}