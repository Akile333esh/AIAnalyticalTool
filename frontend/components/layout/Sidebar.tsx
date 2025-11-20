"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reports", label: "Reports" },
  { href: "/admin/users", label: "Admin Users" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-800 bg-slate-950/90">
      <div className="px-4 py-4 text-lg font-semibold text-brand">
        AI Capacity Analytics
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "block rounded-md px-3 py-2 text-sm font-medium",
                active
                  ? "bg-slate-800 text-brand"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 text-xs text-slate-500">
        CoreBackend: {process.env.NEXT_PUBLIC_CORE_BACKEND_URL ?? "http://localhost:4000"}
      </div>
    </aside>
  );
}
