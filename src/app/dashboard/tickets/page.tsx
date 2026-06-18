"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
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
  const [stationsList, setStationsList] = useState<any[]>([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Form States for creating new ticket
  const [newType, setNewType] = useState<"SINGLE_TRIP" | "MONTHLY_PASS">("SINGLE_TRIP");
  const [newMode, setNewMode] = useState<"METRO" | "BUS" | "ANY">("METRO");
  const [newFromStation, setNewFromStation] = useState("MS01 (Cát Linh)");
  const [newToStation, setNewToStation] = useState("MS05 (Vành Đai 3)");
  const [newPassengerType, setNewPassengerType] = useState("NORMAL");
  const [newValidFrom, setNewValidFrom] = useState("2026-06-11");
  const [newScope, setNewScope] = useState<"SINGLE_ROUTE" | "MULTI_ROUTE" | "STATION_TO_STATION">("SINGLE_ROUTE");
  const [newDurationType, setNewDurationType] = useState<"MONTHLY" | "DAILY" | "WEEKLY">("MONTHLY");
  const [newDurationMonths, setNewDurationMonths] = useState<number>(1);

  useEffect(() => {
    async function loadData() {
      try {
        const [ticketsData, stationsData] = await Promise.all([
          fetchApi("/api/admin/tickets"),
          fetchApi("/api/stations")
        ]);
        
        if (Array.isArray(stationsData)) {
          setStationsList(stationsData);
        }

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
            purchasedAt: t.createdAt ? new Date(t.createdAt).toISOString().replace("T", " ").substring(0, 16) : "",
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

  const handleOpenCreateModal = () => {
    setNewType("SINGLE_TRIP");
    setNewMode("METRO");
    setNewFromStation("MS01 (Cát Linh)");
    setNewToStation("MS05 (Vành Đai 3)");
    setNewPassengerType("NORMAL");
    setNewValidFrom(new Date().toISOString().substring(0, 10));
    setNewScope("SINGLE_ROUTE");
    setNewDurationType("MONTHLY");
    setNewDurationMonths(1);
    setIsModalOpen(true);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let ticketPrice = 13000;
    if (newType === "MONTHLY_PASS") {
      const basePrice = newMode === "ANY" ? 200000 : 100000;
      if (newDurationType === "MONTHLY") {
        ticketPrice = basePrice * newDurationMonths;
      } else if (newDurationType === "WEEKLY") {
        ticketPrice = Math.round(basePrice * 0.25);
      } else if (newDurationType === "DAILY") {
        ticketPrice = Math.round(basePrice * 0.05);
      }
    } else {
      ticketPrice = newMode === "BUS" ? 7000 : 13000;
    }

    // Apply passenger type discount
    if (newPassengerType === "STUDENT") ticketPrice *= 0.5;
    else if (newPassengerType === "SENIOR") ticketPrice *= 0.7;
    else if (newPassengerType === "PRIORITY") ticketPrice = 0;

    const validToDate = new Date(newValidFrom);
    if (newType === "MONTHLY_PASS") {
      if (newDurationType === "MONTHLY") {
        validToDate.setMonth(validToDate.getMonth() + newDurationMonths);
      } else if (newDurationType === "WEEKLY") {
        validToDate.setDate(validToDate.getDate() + 7);
      } else if (newDurationType === "DAILY") {
        validToDate.setDate(validToDate.getDate() + 1);
      }
    }

    let resolvedFromId = "11111111-1111-1111-1111-111111111111";
    let resolvedToId = "22222222-2222-2222-2222-222222222222";
    if (stationsList.length > 0) {
      const matchFrom = stationsList.find(s => s.name.toLowerCase().includes(newFromStation.replace(/\(.*?\)/g, "").trim().toLowerCase()) || s.code.toLowerCase() === newFromStation.replace(/\(.*?\)/g, "").trim().toLowerCase());
      if (matchFrom) resolvedFromId = matchFrom.id;
      const matchTo = stationsList.find(s => s.name.toLowerCase().includes(newToStation.replace(/\(.*?\)/g, "").trim().toLowerCase()) || s.code.toLowerCase() === newToStation.replace(/\(.*?\)/g, "").trim().toLowerCase());
      if (matchTo) resolvedToId = matchTo.id;
    }

    try {
      let issuedTicket;
      if (newType === "SINGLE_TRIP") {
        issuedTicket = await fetchApi("/api/tickets/single-trip", {
          method: "POST",
          body: JSON.stringify({
            fromStationId: resolvedFromId,
            toStationId: resolvedToId,
            mode: newMode,
            passengerType: newPassengerType
          })
        });
      } else {
        issuedTicket = await fetchApi("/api/admin/tickets/issue", {
          method: "POST",
          body: JSON.stringify({
            mode: newMode,
            scope: newScope,
            passengerType: newPassengerType,
            validFrom: newValidFrom,
            durationType: newDurationType,
            durationMonths: newDurationType === "MONTHLY" ? newDurationMonths : null
          })
        });
      }

      const newTk: TicketItem = {
        ticketId: issuedTicket.ticketId || issuedTicket.id,
        type: issuedTicket.type || newType,
        mode: issuedTicket.mode || newMode,
        scope: issuedTicket.scope || (newType === "SINGLE_TRIP" ? "STATION_TO_STATION" : newScope),
        status: issuedTicket.status || "ACTIVE",
        fromStationCode: newType === "SINGLE_TRIP" ? newFromStation : "ALL",
        toStationCode: newType === "SINGLE_TRIP" ? newToStation : "ALL",
        price: issuedTicket.price !== undefined ? issuedTicket.price : ticketPrice,
        validFrom: issuedTicket.validFrom || newValidFrom,
        validTo: issuedTicket.validTo || validToDate.toISOString().substring(0, 10),
        purchasedAt: issuedTicket.createdAt ? new Date(issuedTicket.createdAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16),
        qrToken: issuedTicket.qrToken || ("QR-" + newType + "-" + Math.random().toString(36).substring(2, 12).toUpperCase())
      };
      setTickets([newTk, ...tickets]);
    } catch (err: any) {
      console.warn("Ticket issue API failed, using mock local state. Error:", err.message);
      setIsOffline(true);

      const newTk: TicketItem = {
        ticketId: "tk-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.random().toString(36).substring(2, 4),
        type: newType,
        mode: newMode,
        scope: newType === "SINGLE_TRIP" ? "STATION_TO_STATION" : newScope,
        status: "ACTIVE",
        fromStationCode: newType === "SINGLE_TRIP" ? newFromStation : "ALL",
        toStationCode: newType === "SINGLE_TRIP" ? newToStation : "ALL",
        price: ticketPrice,
        validFrom: newValidFrom,
        validTo: validToDate.toISOString().substring(0, 10),
        purchasedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        qrToken: "QR-" + newType + "-" + Math.random().toString(36).substring(2, 12).toUpperCase()
      };
      setTickets([newTk, ...tickets]);
    }
    setIsModalOpen(false);
  };

  const handleShowQr = (tk: TicketItem) => {
    setSelectedTicket(tk);
    setIsQrModalOpen(true);
  };

  const filteredTickets = tickets.filter((tk) => {
    const matchesType = typeFilter === "ALL" || tk.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || tk.status === statusFilter;
    return matchesType && matchesStatus;
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
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Phát hành vé mới
        </button>
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
            ₫ {tickets.reduce((acc, t) => acc + t.price, 0).toLocaleString()}
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
            <option value="SINGLE_TRIP">Vé lượt (SINGLE)</option>
            <option value="MONTHLY_PASS">Vé tháng (MONTHLY)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Chưa sử dụng (Active)</option>
            <option value="USED">Đã sử dụng (Used)</option>
            <option value="EXPIRED">Hết hạn (Expired)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[11px]">
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
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-xs">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((tk) => (
                  <tr
                    key={tk.ticketId}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono">
                      {tk.ticketId}
                    </td>
                    <td className="p-table-cell-padding">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium font-label-caps ${
                        tk.type === "MONTHLY_PASS" ? "bg-secondary-container/20 text-secondary-fixed-dim" : "bg-primary-container text-on-primary-container"
                      }`}>
                        {tk.type === "SINGLE_TRIP" ? "VÉ LƯỢT" : "VÉ THÁNG"}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant">
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
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-bold">
                      ₫ {tk.price.toLocaleString()}
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-data-mono">
                      {tk.validFrom} / {tk.validTo}
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[11px] font-medium inline-flex items-center gap-1 ${
                          tk.status === "ACTIVE"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : tk.status === "USED"
                            ? "bg-secondary-container/20 text-secondary-fixed-dim"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {tk.status === "ACTIVE" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> ACTIVE
                          </>
                        ) : tk.status === "USED" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> USED
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> EXPIRED
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right">
                      <button
                        onClick={() => handleShowQr(tk)}
                        className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1 text-xs"
                        title="Xem mã QR vé"
                      >
                        <QrCode className="h-4 w-4" /> Mã QR
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy vé nào khớp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issuance Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-lg font-bold text-on-surface">
                Phát Hành Vé Hệ Thống Mới
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Loại vé
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="SINGLE_TRIP">Vé lượt (Single)</option>
                    <option value="MONTHLY_PASS">Vé tháng (Monthly)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Phương thức liên thông
                  </label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="METRO">Metro duy nhất</option>
                    <option value="BUS">Bus duy nhất</option>
                    <option value="ANY">Liên thông (Bất kỳ)</option>
                  </select>
                </div>
              </div>

              {newType === "SINGLE_TRIP" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Ga xuất phát
                    </label>
                    <select
                      value={newFromStation}
                      onChange={(e) => setNewFromStation(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                    >
                      <option value="MS01 (Cát Linh)">MS01 (Cát Linh)</option>
                      <option value="MS02 (La Thành)">MS02 (La Thành)</option>
                      <option value="MS03 (Thái Hà)">MS03 (Thái Hà)</option>
                      <option value="MS04 (Láng)">MS04 (Láng)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Ga kết thúc
                    </label>
                    <select
                      value={newToStation}
                      onChange={(e) => setNewToStation(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                    >
                      <option value="MS05 (Vành Đai 3)">MS05 (Vành Đai 3)</option>
                      <option value="MS06 (Phùng Khoang)">MS06 (Phùng Khoang)</option>
                      <option value="MS07 (Yên Nghĩa)">MS07 (Yên Nghĩa)</option>
                    </select>
                  </div>
                </div>
              )}

              {newType === "MONTHLY_PASS" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Phạm vi vé (Scope)
                      </label>
                      <select
                        value={newScope}
                        onChange={(e) => setNewScope(e.target.value as any)}
                        className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                      >
                        <option value="SINGLE_ROUTE">Một tuyến (Single Route)</option>
                        <option value="MULTI_ROUTE">Liên tuyến (Multi Route)</option>
                        <option value="STATION_TO_STATION">Ga đến ga (Station to Station)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Loại kỳ hạn (Duration)
                      </label>
                      <select
                        value={newDurationType}
                        onChange={(e) => setNewDurationType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                      >
                        <option value="MONTHLY">Hàng tháng (Monthly)</option>
                        <option value="DAILY">Hàng ngày (Daily)</option>
                        <option value="WEEKLY">Hàng tuần (Weekly)</option>
                      </select>
                    </div>
                  </div>

                  {newDurationType === "MONTHLY" && (
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Số tháng hiệu lực (1 - 12)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        required
                        value={newDurationMonths}
                        onChange={(e) => setNewDurationMonths(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Nhóm hành khách
                  </label>
                  <select
                    value={newPassengerType}
                    onChange={(e) => setNewPassengerType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="NORMAL">Bình thường (100% giá)</option>
                    <option value="STUDENT">Học sinh / Sinh viên (50%)</option>
                    <option value="SENIOR">Người cao tuổi (70%)</option>
                    <option value="PRIORITY">Đối tượng ưu tiên (FREE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Ngày có hiệu lực
                  </label>
                  <input
                    type="date"
                    required
                    value={newValidFrom}
                    onChange={(e) => setNewValidFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Phát hành vé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <div><strong>Mệnh giá:</strong> <span className="font-data-mono text-on-surface font-semibold">₫ {selectedTicket.price.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
