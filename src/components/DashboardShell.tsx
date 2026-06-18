"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Route,
  Train,
  CreditCard,
  Ban,
  FileSpreadsheet,
  Tag,
  Ticket,
  Receipt,
  AlertTriangle,
  Wallet,
  Coins,
  Network,
  Sliders,
  FileText,
  HelpCircle,
  Settings,
  Plus,
  Download,
  Bell,
  User,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { clearAuthTokens } from "@/lib/api";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuthTokens();
    router.push("/");
  };

  const menuItems: { label: string; icon: any; url: string; disabled?: boolean }[] = [
    { label: "Tổng quan", icon: LayoutDashboard, url: "/dashboard" },
    { label: "Nhà vận hành", icon: Building2, url: "/dashboard/operators" },
    { label: "Tuyến", icon: Route, url: "/dashboard/routes" },
    { label: "Nhà ga", icon: Train, url: "/dashboard/stations" },
    { label: "Quản lý Thẻ", icon: CreditCard, url: "/dashboard/cards" },
    { label: "Danh sách đen", icon: Ban, url: "/dashboard/blacklist" },
    { label: "Quy tắc giá vé", icon: FileSpreadsheet, url: "/dashboard/fare-rules" },
    { label: "Giảm giá", icon: Tag, url: "/dashboard/discounts" },
    { label: "Quản lý Vé", icon: Ticket, url: "/dashboard/tickets" },
    { label: "Giao dịch", icon: Receipt, url: "/dashboard/transactions" },
    { label: "Cảnh báo bất thường", icon: AlertTriangle, url: "/dashboard/anomalies" },
    { label: "Công thức phân bổ", icon: FileText, url: "/dashboard/revenue-share" },
    { label: "Quyết toán", icon: Coins, url: "/dashboard/settlements" },
    { label: "Đối soát", icon: Network, url: "/dashboard/settlements" },
  ];

  const bottomMenuItems: any[] = [];

  return (
    <div className="dark bg-background text-on-background min-h-screen flex w-full font-body-md text-body-md antialiased overflow-x-hidden">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col h-screen w-sidebar-width fixed left-0 top-0 bg-primary-container border-r border-outline-variant z-50">
        <div className="px-4 py-6">
          <Link href="/dashboard" className="block focus:outline-none">
            <h1 className="font-display text-display text-primary-fixed-dim tracking-tight mb-1">
              FMC Level 5
            </h1>
          </Link>
          <p className="font-body-sm text-body-sm text-on-primary-container">
            Hệ thống quản lý vé
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.url;
            return (
              <Link
                key={idx}
                className={`flex items-center px-3 py-2 transition-all rounded-lg group ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-primary-container hover:bg-on-primary-fixed-variant"
                } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                href={item.disabled ? "#" : item.url}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    isActive
                      ? "text-on-secondary-container"
                      : "text-on-primary-container group-hover:text-primary-fixed"
                  }`}
                />
                <span className="font-label-caps text-label-caps">{item.label}</span>
              </Link>
            );
          })}
        </div>


      </aside>

      {/* --- MOBILE SIDEBAR DRAWER --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <aside className="relative flex flex-col w-sidebar-width max-w-xs h-full bg-primary-container border-r border-outline-variant p-4 space-y-4 shadow-xl z-50">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <div>
                <h1 className="font-display text-xl font-bold text-primary-fixed-dim">
                  FMC Level 5
                </h1>
                <p className="text-xs text-on-primary-container">Hệ thống quản lý vé</p>
              </div>
              <button
                className="p-1 rounded-full text-on-primary-container hover:bg-on-primary-fixed-variant"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = pathname === item.url;
                return (
                  <Link
                    key={idx}
                    className={`flex items-center px-3 py-2 transition-all rounded-lg ${
                      isActive
                        ? "bg-secondary-container text-on-secondary-container font-bold"
                        : "text-on-primary-container hover:bg-on-primary-fixed-variant"
                    } ${item.disabled ? "opacity-60" : ""}`}
                    href={item.disabled ? "#" : item.url}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <span className="font-label-caps text-label-caps">{item.label}</span>
                  </Link>
                );
              })}
            </div>


          </aside>
        </div>
      )}

      {/* --- MAIN PAGE WRAPPER --- */}
      <div className="flex-1 flex flex-col md:ml-sidebar-width min-h-screen">
        {/* --- TOP NAV BAR --- */}
        <header className="fixed top-0 right-0 left-0 md:left-sidebar-width h-topbar-height z-40 flex items-center justify-between px-container-padding bg-surface-dim border-b border-outline-variant">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              className="p-2 -ml-2 rounded-full text-on-surface hover:bg-surface-container-high md:hidden cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface-variant hidden md:block">
              Fare Management Center
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Actions */}
            <div className="flex items-center gap-1 border-l border-outline-variant pl-3 ml-1">
              <button
                onClick={handleLogout}
                className="p-1.5 text-error hover:bg-error-container/20 hover:text-error transition-colors rounded-full cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT CANVAS --- */}
        <main className="flex-1 mt-topbar-height p-container-padding bg-background overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
