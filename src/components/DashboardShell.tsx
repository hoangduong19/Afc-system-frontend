"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Search,
  Plus,
  Download,
  Bell,
  User,
  Menu,
  X
} from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { label: "Phân chia doanh thu", icon: Wallet, url: "/dashboard/revenue-share" },
    { label: "Quyết toán", icon: Coins, url: "/dashboard/settlements" },
    { label: "Đối soát", icon: Network, url: "/dashboard/settlements" },
    { label: "Tích hợp", icon: Sliders, url: "/dashboard/integrations" },
    { label: "Báo cáo", icon: FileText, url: "/dashboard/reports" },
  ];

  const bottomMenuItems = [
    { label: "Hỗ trợ", icon: HelpCircle, url: "#" },
    { label: "Cài đặt", icon: Settings, url: "#" },
  ];

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

        <div className="p-4 border-t border-outline-variant space-y-1">
          {bottomMenuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                className="flex items-center px-3 py-2 text-on-primary-container hover:bg-on-primary-fixed-variant transition-all rounded-lg group"
                href={item.url}
              >
                <Icon className="mr-3 h-5 w-5 text-on-primary-container group-hover:text-primary-fixed" />
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

            <div className="pt-2 border-t border-outline-variant space-y-1">
              {bottomMenuItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    className="flex items-center px-3 py-2 text-on-primary-container hover:bg-on-primary-fixed-variant transition-all rounded-lg"
                    href={item.url}
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
            {/* Navigation Links */}
            <nav className="hidden lg:flex gap-6">
              <a
                className="text-outline hover:text-primary-fixed transition-colors font-label-caps text-label-caps uppercase text-xs"
                href="#"
              >
                HURC
              </a>
              <a
                className="text-outline hover:text-primary-fixed transition-colors font-label-caps text-label-caps uppercase text-xs"
                href="#"
              >
                TRANSERCO
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <input
                className="bg-surface-container-high border-none rounded-full py-1.5 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-secondary w-48 lg:w-64 transition-all outline-none"
                placeholder="Tìm kiếm..."
                type="text"
              />
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 border-l border-outline-variant pl-3 ml-1">
              <button className="p-1.5 text-on-surface-variant hover:text-primary-fixed transition-colors rounded-full hover:bg-surface-container-high cursor-pointer">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-1.5 text-on-surface-variant hover:text-primary-fixed transition-colors rounded-full hover:bg-surface-container-high cursor-pointer">
                <User className="h-5 w-5" />
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
