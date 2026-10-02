"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartIcon, ListIcon, StoreIcon } from "./icons";

const TABS = [
  { href: "/lists", label: "Lists", Icon: ListIcon },
  { href: "/insights", label: "Insights", Icon: ChartIcon },
  { href: "/settings", label: "Stores", Icon: StoreIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <ul className="mx-auto flex max-w-lg">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 pt-2 text-xs font-medium transition-colors ${
                  active
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
