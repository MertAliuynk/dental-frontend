import React from "react";
export default function LoadingScreen() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(135deg, #1976d2 0%, #e3eafc 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{
        background: "white",
        padding: 32,
        borderRadius: 16,
        boxShadow: "0 4px 24px #0002",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
          <circle cx="24" cy="24" r="20" stroke="#1976d2" strokeWidth="4" opacity="0.2" />
          <path d="M44 24c0-11.046-8.954-20-20-20" stroke="#1976d2" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: 20, color: "#1976d2" }}>Yükleniyor...</span>
      </div>
    </div>
  );
}
