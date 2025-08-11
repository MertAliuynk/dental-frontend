"use client";
import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const PatientSelectModal = dynamic(() => import("./PatientSelectModal"), { ssr: false });

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [showPatientModal, setShowPatientModal] = React.useState(false);
  const router = useRouter();

  return (
    <div className="app-shell">
      {/* Topbar with hamburger for mobile */}
      <Topbar onHamburger={() => setMobileOpen(true)} />

      {/* Sidebar (fixed on >= tablet, drawer on mobile) */}
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenPatientSelect={() => setShowPatientModal(true)}
      />

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="sidebar-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 105
          }}
        />
      )}

      <div className="app-content">{children}</div>

      {/* Centralized patient select modal */}
      <PatientSelectModal
        open={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onSelect={(id: number | string) => {
          setShowPatientModal(false);
          router.push(`/patients/card?id=${id}`);
        }}
      />
    </div>
  );
}
