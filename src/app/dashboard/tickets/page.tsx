"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  QrCode,
  ArrowRight,
  TrendingUp,
  Tag,
  X,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface TicketItem {
  ticketId: string;
  type: "SINGLE_TRIP" | "MONTHLY_PASS";
  mode: "METRO" | "BUS" | "ANY";
  scope: "SINGLE_ROUTE" | "MULTI_ROUTE" | "STATION_TO_STATION";
  status: "ACTIVE" | "USED" | "EXPIRED";
  fromStationCode: string;
  toStationCode: string;
  price: number;
  validFrom: string;
  validTo: string;
  purchasedAt: string;
  qrToken?: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isOffline, setIsOffline] = useState(false);

  // Modal States
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const ticketsData = await fetchApi("/api/admin/tickets");
        const list = ticketsData.content || ticketsData || [];
        if (Array.isArray(list)) {
          setTickets(list.map((t) => ({
            ticketId: t.ticketId || t.id,
            type: t.type || "SINGLE_TRIP",
            mode: t.mode || "METRO",
            scope: t.scope || "STATION_TO_STATION",
            status: t.status || "ACTIVE",
            fromStationCode: t.fromStationCode || "MS01",
            toStationCode: t.toStationCode || "MS05",
            price: t.price || 0,
            validFrom: t.validFrom || "",
            validTo: t.validTo || "",
            purchasedAt: t.purchasedAt ? new Date(t.purchasedAt).toISOString().replace("T", " ").substring(0, 16) : "",
            qrToken: t.qrToken || ("QR-" + (t.ticketId || t.id || "").toUpperCase())
          })));
        }
      } catch (err: any) {
        console.warn("FMC Tickets API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadData();
  }, []);

  const handleShowQr = (tk: TicketItem) => {
    setSelectedTicket(tk);
    setIsQrModalOpen(true);
  };

  const filteredTickets = tickets.filter((tk) => {
    const matchesType = typeFilter === "ALL" || tk.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || tk.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const ticketStatusPriority: Record<string, number> = {
    ACTIVE: 1,
    USED: 2,
    EXPIRED: 3
  };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const pA = ticketStatusPriority[a.status] || 4;
    const pB = ticketStatusPriority[b.status] || 4;
    if (pA !== pB) return pA - pB;
    return b.purchasedAt.localeCompare(a.purchasedAt);
  });

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="px-4 py-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center justify-between border border-error/20 animate-pulse">
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" /> Chế độ mô phỏng (Mock Fallback Mode) được kích hoạt do lỗi kết nối tới API Server.
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Ticket className="h-6 w-6 text-secondary" /> Quản lý Vé Hệ thống
          </h2>
          <p className="text-sm text-on-surface-variant">
            Theo dõi, phát hành và kiểm soát trạng thái các loại vé lượt, vé tháng liên thông FMC.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng số vé đã bán
          </h3>
          <div className="text-3xl font-bold text-on-surface font-data-mono">{tickets.length}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Đang hoạt động (Active)
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim font-data-mono">
            {tickets.filter((t) => t.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng doanh thu bán vé
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim font-data-mono">
            ₫ {Math.round(tickets.reduce((acc, t) => acc + t.price, 0)).toLocaleString()}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tỷ lệ Vé tháng
          </h3>
          <div className="text-3xl font-bold text-on-surface font-data-mono">
            {((tickets.filter((t) => t.type === "MONTHLY_PASS").length / tickets.length) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả loại vé</option>
            <option value="SINGLE_TRIP">Vé lượt</option>
            <option value="MONTHLY_PASS">Vé tháng</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Chưa sử dụng</option>
            <option value="USED">Đã sử dụng</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] whitespace-nowrap">
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Mã vé
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Loại vé
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Hành trình (Ga đi - Ga đến)
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Mệnh giá
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Hiệu lực
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-xs">
              {sortedTickets.length > 0 ? (
                sortedTickets.map((tk) => (
                  <tr
                    key={tk.ticketId}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono whitespace-nowrap">
                      {tk.ticketId}
                    </td>
                    <td className="p-table-cell-padding whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium font-label-caps ${tk.type === "MONTHLY_PASS" ? "bg-secondary-container/20 text-secondary-fixed-dim" : "bg-primary-container text-on-primary-container"
                        }`}>
                        {tk.type === "SINGLE_TRIP" ? "VÉ LƯỢT" : "VÉ THÁNG"}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant whitespace-nowrap">
                      {tk.type === "SINGLE_TRIP" ? (
                        <div className="flex items-center gap-1.5">
                          <span>{tk.fromStationCode}</span>
                          <ArrowRight className="h-3 w-3 text-outline" />
                          <span>{tk.toStationCode}</span>
                        </div>
                      ) : (
                        <span className="italic text-xs">Liên thông hệ thống ({tk.mode})</span>
                      )}
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-bold whitespace-nowrap">
                      ₫ {Math.round(tk.price).toLocaleString()}
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-data-mono whitespace-nowrap">
                      {tk.validFrom} / {tk.validTo}
                    </td>
                    <td className="p-table-cell-padding whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[11px] font-medium inline-flex items-center gap-1 ${tk.status === "ACTIVE"
                          ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                          : tk.status === "USED"
                            ? "bg-secondary-container/20 text-secondary-fixed-dim"
                            : "bg-error-container text-on-error-container"
                          }`}
                      >
                        {tk.status === "ACTIVE" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Chưa sử dụng
                          </>
                        ) : tk.status === "USED" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Đã sử dụng
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Hết hạn
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy vé nào khớp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* QR Code Details Modal */}
      {isQrModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsQrModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-sm p-6 z-10 text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="text-sm font-bold text-on-surface text-left">
                Thông tin mã QR Vé
              </h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="bg-white p-3 rounded-lg border border-outline-variant shadow-inner">
                {/* Simulated QR Code using CSS grid/shapes */}
                <div className="h-44 w-44 bg-slate-900 flex items-center justify-center text-white relative rounded overflow-hidden">
                  <div className="absolute inset-2 border-2 border-white/25 flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="h-6 w-6 border-2 border-white"></div>
                      <div className="h-6 w-6 border-2 border-white"></div>
                    </div>
                    <div className="text-[9px] font-bold text-white tracking-widest text-center truncate w-full">
                      FMC TICKET
                    </div>
                    <div className="flex justify-between">
                      <div className="h-6 w-6 border-2 border-white"></div>
                      <div className="h-6 w-6 bg-white"></div>
                    </div>
                  </div>
                </div>
              </div>
              <span className="font-data-mono text-xs text-secondary-fixed-dim bg-surface-container-high px-2 py-0.5 rounded break-all select-all mt-2">
                {selectedTicket.qrToken}
              </span>
            </div>

            <div className="text-left bg-surface-container-low p-4 rounded-lg border border-outline-variant text-xs space-y-2 text-on-surface-variant">
              <div><strong>Mã vé:</strong> <span className="font-data-mono text-on-surface font-semibold">{selectedTicket.ticketId}</span></div>
              <div><strong>Loại vé:</strong> <span className="text-on-surface">{selectedTicket.type === "SINGLE_TRIP" ? "Vé lượt" : "Vé tháng"}</span></div>
              {selectedTicket.type === "SINGLE_TRIP" && (
                <div><strong>Tuyến đường:</strong> <span className="text-on-surface">{selectedTicket.fromStationCode} → {selectedTicket.toStationCode}</span></div>
              )}
              <div><strong>Hạn hiệu lực:</strong> <span className="font-data-mono text-on-surface">{selectedTicket.validFrom} đến {selectedTicket.validTo}</span></div>
              <div><strong>Mệnh giá:</strong> <span className="font-data-mono text-on-surface font-semibold">₫ {Math.round(selectedTicket.price).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
