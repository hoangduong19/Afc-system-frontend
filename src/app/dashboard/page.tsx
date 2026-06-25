"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  TrendingUp,
  Ticket,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";

export default function OverviewPage() {
  const [isOffline, setIsOffline] = useState(false);

  // Real data state
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [recentAnomalies, setRecentAnomalies] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    transactions: 0,
    anomalies: 0,
    unresolvedAnomalies: 0,
    revenue: 0,
    activeCards: 0,
    suspendedCards: 0,
    blacklistedCards: 0,
    pendingL4: 0
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const txData = await fetchApi("/api/transactions", { params: { size: 5 } });
        const anomalyData = await fetchApi("/api/anomalies", { params: { size: 5, isResolved: false } });

        if (txData && txData.content) {
          setRecentTransactions(txData.content);
          setCounts(prev => ({
            ...prev,
            revenue: txData.content.reduce((acc: number, t: any) => acc + (t.fareAmount || 0), 0),
            transactions: txData.totalElements || txData.content.length
          }));
        }

        if (anomalyData && anomalyData.content) {
          setRecentAnomalies(anomalyData.content);
          setCounts(prev => ({
            ...prev,
            anomalies: anomalyData.totalElements || anomalyData.content.length,
            unresolvedAnomalies: anomalyData.content.filter((a: any) => !a.isResolved).length
          }));
        }
      } catch (err: any) {
        console.warn("FMC Dashboard API is offline.", err.message);
        setIsOffline(true);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <>
      {isOffline && (
        <div className="mb-6 px-4 py-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center justify-between border border-error/20 animate-pulse">
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" /> Hệ thống đang chạy ở chế độ mô phỏng ngoại tuyến (Mock Fallback Mode). Kết nối tới Backend API thất bại.
          </span>
        </div>
      )}

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-gutter mb-8">
        {/* Revenue Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:bg-surface-container-low transition-colors col-span-1 md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-on-surface pointer-events-none group-hover:scale-110 transition-transform">
            <Coins className="h-16 w-16" />
          </div>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">
            Tổng doanh thu
          </h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-display text-display text-on-surface">
              ₫ {Math.round(counts.revenue).toLocaleString()}
            </span>
            {counts.revenue > 0 && (
              <span className="text-tertiary-fixed-dim font-body-sm text-body-sm flex items-center gap-0.5">
                <TrendingUp className="h-3.5 w-3.5" /> —
              </span>
            )}
          </div>
          {/* Sparkline simulation */}
          <div className="h-12 w-full bg-surface-container-high rounded-md overflow-hidden relative flex items-end justify-between px-1">
            <div className="w-[22%] bg-secondary/50 h-[40%] rounded-t-sm" />
            <div className="w-[22%] bg-secondary/60 h-[65%] rounded-t-sm" />
            <div className="w-[22%] bg-secondary/80 h-[100%] rounded-t-sm" />
            <div className="w-[22%] bg-secondary h-[80%] rounded-t-sm" />
          </div>
        </div>

        {/* Trips Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:bg-surface-container-low transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Lượt di chuyển
            </h3>
            <Ticket className="h-5 w-5 text-on-surface-variant" />
          </div>
          <div className="font-display text-2xl font-bold text-on-surface mb-1">
            {counts.transactions.toLocaleString()}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Tổng lượt đi ghi nhận từ Cấp 4
          </p>
        </div>


        {/* Anomalies Card (Critical Warning) */}
        <div className="bg-error-container border border-error/20 rounded-xl p-5 shadow-sm col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-label-caps text-label-caps text-on-error-container uppercase">
                Giao dịch bất thường
              </h3>
              <AlertTriangle className="h-5 w-5 text-on-error-container animate-bounce" />
            </div>
            <div className="font-display text-2xl font-bold text-on-error-container mb-1">
              {counts.anomalies.toLocaleString()}
            </div>
            <p className="font-body-sm text-body-sm text-on-error-container/80">
              Cần xử lý ngay: {counts.unresolvedAnomalies}
            </p>
          </div>
          <Link href="/dashboard/anomalies" className="mt-3 px-3 py-1.5 bg-on-error-container text-error-container rounded-md font-label-caps text-xs uppercase w-full hover:bg-on-error-container/95 transition-colors cursor-pointer text-center block">
            Xem chi tiết
          </Link>
        </div>


      </div>


      {/* Data Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-grid-gutter">
        {/* Recent Transactions Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-dim">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Giao dịch gần đây
            </h3>
            <Link href="/dashboard/transactions" className="text-secondary font-label-caps text-label-caps uppercase hover:underline text-xs cursor-pointer">
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[11px]">
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Mã giao dịch
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Mã Thẻ
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Số tiền
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="font-data-mono text-data-mono text-xs">
                {recentTransactions.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[40px]"
                  >
                    <td className="p-table-cell-padding text-on-surface">{(row.id || "").slice(0, 8).toUpperCase()}</td>
                    <td className="p-table-cell-padding text-on-surface-variant">{row.cardUid}</td>
                    <td className="p-table-cell-padding text-right text-on-surface font-semibold">₫ {Math.round(row.fareAmount || 0).toLocaleString()}</td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2 py-0.5 rounded font-body-sm text-[11px] font-medium ${row.status === "COMPLETED"
                          ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                          : row.status === "DEBT"
                            ? "bg-surface-variant text-on-surface-variant"
                            : "bg-error-container text-on-error-container"
                          }`}
                      >
                        {row.status === "COMPLETED" ? "Thành công" : row.status === "DEBT" ? "Ghi nợ" : row.status || "Chờ xử lý"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Warnings/Anomalies Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-dim">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Cảnh báo gần đây
            </h3>
            <Link href="/dashboard/anomalies" className="text-secondary font-label-caps text-label-caps uppercase hover:underline text-xs cursor-pointer">
              Xử lý ngay
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[11px]">
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Loại cảnh báo
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Mức độ
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Thời gian phát hiện
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-xs">
                {recentAnomalies.map((row, idx) => {
                  const detectedTime = row.detectedAt ? new Date(row.detectedAt).toLocaleTimeString() : "";
                  return (
                    <tr
                      key={row.id || idx}
                      className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[40px]"
                    >
                      <td className="p-table-cell-padding text-on-surface font-semibold">{row.anomalyType}</td>
                      <td className="p-table-cell-padding">
                        <span
                          className={`px-2 py-0.5 rounded font-label-caps text-[10px] font-bold ${row.severity === "CRITICAL"
                            ? "bg-error text-on-error"
                            : row.severity === "HIGH"
                              ? "bg-error-container text-on-error-container"
                              : "bg-surface-variant text-on-surface-variant"
                            }`}
                        >
                          {row.severity}
                        </span>
                      </td>
                      <td className="p-table-cell-padding font-data-mono text-on-surface-variant">{detectedTime}</td>
                      <td className="p-table-cell-padding">
                        <Link href="/dashboard/anomalies" className="text-secondary hover:underline cursor-pointer">
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
