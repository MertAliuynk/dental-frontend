"use client";
export const dynamic = "force-dynamic";
import AppLayout from "../../components/AppLayout";
import PatientCardPageClient from "./PatientCardPageClient";
import { Suspense } from "react";

export default function PatientCardPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <PatientCardPageClient />
      </Suspense>
    </AppLayout>
  );
}
