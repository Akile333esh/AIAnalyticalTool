"use client";

import { ProtectedClient } from "@/components/auth/ProtectedClient";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardLayoutEditor } from "@/components/dashboard/DashboardLayoutEditor";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { JobRunnerPanel } from "@/components/dashboard/JobRunnerPanel";

export default function DashboardPage() {
  return (
    <ProtectedClient>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 space-y-4 p-4">
            {/* 1) Edit: persists to /frontend/dashboard/layout */}
            <DashboardLayoutEditor />

            {/* 2) View: reads /frontend/dashboard/layout + /widget/:id/data */}
            <DashboardGrid />

            {/* 3) NL → SQL: uses Worker + AIBackend */}
            <JobRunnerPanel />
          </main>
        </div>
      </div>
    </ProtectedClient>
  );
}
