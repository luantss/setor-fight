"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { key: "info", label: "Informações" },
  { key: "inscricoes", label: "Inscrições" },
] as const;

export default function TabNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "info";

  return (
    <nav className="flex border-b border-gray-200 mb-8">
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const href = `${pathname}?tab=${key}`;
        return (
          <Link
            key={key}
            href={href}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
