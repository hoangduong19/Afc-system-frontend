"use client";

import React, { useState } from "react";
import {
  Coins,
  TrendingUp,
  Ticket,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export default function OverviewPage() {
  const [chartPeriod, setChartPeriod] = useState("7 ngày qua");

  return (
    <>
      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-gutter mb-8">
        {/* Revenue Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:bg-surface-container-low transition-colors col-span-1 md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-on-surface pointer-events-none group-hover:scale-110 transition-transform">
            <Coins className="h-16 w-16" />
          </div>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">
            Tổng doanh thu hôm nay
          </h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-display text-display text-on-surface">
              ₫ 1,245,600,000
            </span>
            <span className="text-tertiary-fixed-dim font-body-sm text-body-sm flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" /> +12.5%
            </span>
          </div>
          {/* Sparkline simulation */}
          <div className="h-12 w-full bg-surface-container-high rounded-md overflow-hidden relative flex items-end justify-between px-1">
            <div className="w-[22%] bg-secondary/50 h-[40%] rounded-t-sm" />
            <div className="w-[22%] bg-secondary/60 h-[65%] rounded-t-sm" />
            <div className="w-[22%] bg-secondary/80 h-[100%] rounded-t-sm" />
            <div className="w-[22%] bg-secondary h-[80%] rounded-t-sm" />
          </div>
        </div>

        {/* Tickets Sold Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:bg-surface-container-low transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Vé đã bán hôm nay
            </h3>
            <Ticket className="h-5 w-5 text-on-surface-variant" />
          </div>
          <div className="font-display text-2xl font-bold text-on-surface mb-1">
            84,521
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            So với hôm qua: <span className="text-tertiary-fixed-dim">+3.2%</span>
          </p>
        </div>

        {/* Level 4 Transactions Pending */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:bg-surface-container-low transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              GD Cấp 4 (Pending)
            </h3>
            <RefreshCw className="h-5 w-5 text-on-surface-variant animate-spin-slow" />
          </div>
          <div className="font-display text-2xl font-bold text-on-surface mb-1">
            12,045
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-secondary h-1.5 rounded-full" style={{ width: "45%" }} />
          </div>
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
              24
            </div>
            <p className="font-body-sm text-body-sm text-on-error-container/80">
              Cần xử lý ngay: 5
            </p>
          </div>
          <button className="mt-3 px-3 py-1.5 bg-on-error-container text-error-container rounded-md font-label-caps text-xs uppercase w-full hover:bg-on-error-container/95 transition-colors cursor-pointer">
            Xem chi tiết
          </button>
        </div>

        {/* Card Status Breakdown */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm col-span-1 md:col-span-2 lg:col-span-4 flex flex-col justify-center">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4">
            Trạng thái Thẻ (Hệ thống)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-body-sm text-body-sm">Active</span>
                <span className="font-data-mono text-data-mono font-semibold">1,200,450</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-tertiary-fixed-dim h-2 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-body-sm text-body-sm">Suspended</span>
                <span className="font-data-mono text-data-mono font-semibold">45,200</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-secondary-fixed-dim h-2 rounded-full" style={{ width: "10%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-body-sm text-body-sm">Blacklisted</span>
                <span className="font-data-mono text-data-mono font-semibold">8,930</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-error h-2 rounded-full" style={{ width: "5%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter mb-8">
        {/* Daily Revenue Bar Chart */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm col-span-1 lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Doanh thu theo ngày
            </h3>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="bg-surface-container-high border-none rounded-md py-1 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer"
            >
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
            </select>
          </div>
          
          {/* Responsive Bar Graphic */}
          <div className="h-64 w-full bg-surface-container flex items-end justify-between p-4 rounded-lg gap-2">
            {[
              { label: "T2", height: "33%", val: "800M" },
              { label: "T3", height: "50%", val: "1.2B" },
              { label: "T4", height: "40%", val: "950M" },
              { label: "T5", height: "75%", val: "1.8B" },
              { label: "T6", height: "66%", val: "1.5B" },
              { label: "T7", height: "90%", val: "2.1B" },
              { label: "CN", height: "100%", val: "2.4B", highlight: true }
            ].map((bar, idx) => (
              <div
                key={idx}
                style={{ height: bar.height }}
                className={`w-[12%] rounded-t-sm hover:opacity-95 transition-all group relative cursor-pointer ${
                  bar.highlight
                    ? "bg-secondary shadow-[0_0_10px_rgba(33,112,228,0.5)]"
                    : "bg-secondary/70 hover:bg-secondary"
                }`}
              >
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 font-data-mono">
                  {bar.label}: {bar.val}
                </div>
                {/* Day text bottom */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-on-surface-variant font-medium">
                  {bar.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Traffic Area Chart */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm col-span-1 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Lưu lượng theo giờ
            </h3>
          </div>
          <div className="h-64 w-full bg-surface-container rounded-lg relative overflow-hidden flex items-end">
            {/* Simulated SVG Area Chart */}
            <svg
              className="absolute bottom-0 w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M0,100 L0,80 Q10,70 20,85 T40,60 T60,20 T80,40 T100,10 L100,100 Z"
                fill="rgba(33, 112, 228, 0.2)"
                stroke="#2170e4"
                strokeWidth="2"
              />
            </svg>
            <div className="absolute bottom-2 left-2 text-[10px] text-on-surface-variant font-medium">
              00:00
            </div>
            <div className="absolute bottom-2 right-2 text-[10px] text-on-surface-variant font-medium">
              23:59
            </div>
          </div>
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
            <button className="text-secondary font-label-caps text-label-caps uppercase hover:underline text-xs cursor-pointer">
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[11px]">
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Mã GD (UID)
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
                {[
                  { uid: "TX-8A9F21", card: "C-4492-11", amount: "8,000", status: "success", label: "Thành công" },
                  { uid: "TX-8A9F22", card: "C-1029-45", amount: "15,000", status: "success", label: "Thành công" },
                  { uid: "TX-8A9F23", card: "C-9921-00", amount: "8,000", status: "pending", label: "Chờ xử lý" },
                  { uid: "TX-8A9F24", card: "C-5541-22", amount: "0", status: "error", label: "Từ chối" },
                  { uid: "TX-8A9F25", card: "C-3321-99", amount: "12,000", status: "success", label: "Thành công" }
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[40px]"
                  >
                    <td className="p-table-cell-padding text-on-surface">{row.uid}</td>
                    <td className="p-table-cell-padding text-on-surface-variant">{row.card}</td>
                    <td className="p-table-cell-padding text-right text-on-surface font-semibold">{row.amount}</td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2 py-0.5 rounded font-body-sm text-[11px] font-medium ${
                          row.status === "success"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : row.status === "pending"
                            ? "bg-surface-variant text-on-surface-variant"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {row.label}
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
            <button className="text-secondary font-label-caps text-label-caps uppercase hover:underline text-xs cursor-pointer">
              Xử lý ngay
            </button>
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
                {[
                  { type: "Sai lệch mã SAM", level: "critical", label: "CRITICAL", time: "10:42:15" },
                  { type: "Thẻ blacklist chạm cổng", level: "high", label: "HIGH", time: "10:38:02" },
                  { type: "Giao dịch trùng lặp", level: "medium", label: "MEDIUM", time: "10:15:44" },
                  { type: "Mất kết nối Ga Cát Linh", level: "critical", label: "CRITICAL", time: "09:55:10" },
                  { type: "Sai lệch doanh thu C4-C5", level: "high", label: "HIGH", time: "08:00:00" }
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[40px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold">{row.type}</td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2 py-0.5 rounded font-label-caps text-[10px] font-bold ${
                          row.level === "critical"
                            ? "bg-error text-on-error"
                            : row.level === "high"
                            ? "bg-error-container text-on-error-container"
                            : "bg-surface-variant text-on-surface-variant"
                        }`}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td className="p-table-cell-padding font-data-mono text-on-surface-variant">{row.time}</td>
                    <td className="p-table-cell-padding">
                      <button className="text-secondary hover:underline cursor-pointer">
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
