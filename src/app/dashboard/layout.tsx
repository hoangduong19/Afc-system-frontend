import type { Metadata } from "next";
import DashboardShell from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard - FMC Level 5",
  description: "Hệ thống quản lý vé - Tổng quan Fare Management Center (FMC)",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
