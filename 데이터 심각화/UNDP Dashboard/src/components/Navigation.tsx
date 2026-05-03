"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Database, Network, Sun, Moon, Info, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: Info },
  { href: "/dashboard", label: "Strategic Dashboard", icon: BarChart3 },
  { href: "/data-insights", label: "Synergy Insights", icon: Database },
  { href: "/projects", label: "Projects", icon: Network },
];

export function Navigation() {
  const { resolvedTheme } = useTheme(); 
  const pathname = usePathname();
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;

  if (!mounted) return null;

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-3xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-strach justify-between h-16">
          {/* EcoEquity + UNDP Logos */}
          <div className="flex items-center space-x-3">
            {/* EcoEquity block */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-primary bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div className="leading-tight">
                <h1 className="text-sm sm:text-base font-bold gradient-text">
                  EcoEquity
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Gender × Climate Intelligence
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-10 w-px bg-border" />

            {/* UNDP block */}
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 flex items-center justify-center">
                <Image
                    src={resolvedTheme === "dark"
                      ? "/UNDP_Logo_White_Large.svg"
                      : "/UNDP_Logo_Blue_Large.svg"}
                    alt="UNDP"
                    width={32} height={28}
                    className="object-contain"
                      />
              </div>

              <div className="leading-tight">
                <div className="text-sm font-semibold text-foreground">
                  UNDP
                </div>
                <div className="text-[10px] text-muted-foreground">
                  United Nations Development Programme
                </div>
              </div>
            </div>
          </div>

          {/* Nav items + Theme toggle */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[rgb(var(--sem-integrated))] text-gray-200 shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Theme toggle button */}
            <button
              className="p-2 rounded-full bg-accent hover:bg-accent-hover transition-colors duration-200"
              onClick={() =>
                setTheme(currentTheme === "dark" ? "light" : "dark")
              }
            >
              {currentTheme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}