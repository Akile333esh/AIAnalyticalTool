"use client";

import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { getCurrentUser, logoutClientSide } from "@/lib/auth";
import { Button } from "../ui/Button";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

export function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST", auth: true });
    } catch {
      // ignore backend errors on logout
    }
    logoutClientSide();
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4">
      <div className="text-sm text-slate-400">
        Natural language → SQL → Dashboards
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="text-xs text-slate-300">
            <div>{user.email ?? `User #${user.userId}`}</div>
            <div className="text-[10px] uppercase tracking-wide text-brand">
              {user.role}
            </div>
          </div>
        )}
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
