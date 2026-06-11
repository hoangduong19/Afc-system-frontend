"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  X,
  MessageSquare
} from "lucide-react";

interface AnomalyItem {
  id: string;
  tripId: string;
  anomalyType: "DEVICE_OFFLINE" | "INVALID_TAP_SEQUENCE" | "FRAUD_SUSPECTED" | "CARD_BALANCE_MISMATCH" | "MISSING_TAP_OUT";
  severity: "CRITICAL" | "WARNING" | "INFO";
  description: string;
  isResolved: boolean;
  detectedAt: string;
  resolvedAt?: string;
  notes?: string;
  resolvedBy?: string;
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([
    {
      id: "8821a3b1-4e8c-42a1-b883-92c4f550da12",
      tripId: "tx-7719-f538-4e1b",
      anomalyType: "DEVICE_OFFLINE",
      severity: "CRITICAL",
      description: "Thiết bị cổng kiểm soát GATE-IN-MS01-A2 mất kết nối với hệ thống FMC hơn 15 phút.",
      isResolved: false,
      detectedAt: "2026-06-11T11:24:05"
    },
    {
      id: "7742b8e3-12d4-4b5c-a29d-cc83a1b02931",
      tripId: "tx-3382-b883-92f4",
      anomalyType: "INVALID_TAP_SEQUENCE",
      severity: "WARNING",
      description: "Phát hiện quẹt thẻ liên tục (Tap in 2 lần liên tiếp không có quẹt ra) tại Ga La Thành.",
      isResolved: false,
      detectedAt: "2026-06-11T10:45:12"
    },
    {
      id: "1240c9d8-883b-47de-a590-b183ab924012",
      tripId: "tx-2204-a590-1c9d",
      anomalyType: "CARD_BALANCE_MISMATCH",
      severity: "WARNING",
      description: "Số dư thực tế trên thẻ vật lý thấp hơn số dư ghi nhận trên ví điện tử FMC (-50,000 ₫).",
      isResolved: false,
      detectedAt: "2026-06-11T09:30:00"
    },
    {
      id: "0931d550-9921-4f33-8c4d-a129ef38b821",
      tripId: "tx-1204-e598-bb83",
      anomalyType: "FRAUD_SUSPECTED",
      severity: "CRITICAL",
      description: "Thẻ nằm trong Danh sách đen (Lý do báo mất) cố gắng quẹt thẻ đi tại Ga Yên Nghĩa.",
      isResolved: true,
      detectedAt: "2026-06-10T16:15:33",
      notes: "Đã giữ thẻ vật lý tại quầy chăm sóc khách hàng Ga Yên Nghĩa.",
      resolvedAt: "2026-06-10T16:45:00",
      resolvedBy: "Nguyễn Văn A (System)"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Resolve Action Modal State
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionType, setActionType] = useState<"RESOLVE" | "IGNORE">("RESOLVE");

  const handleOpenActionModal = (anomaly: AnomalyItem, type: "RESOLVE" | "IGNORE") => {
    setSelectedAnomaly(anomaly);
    setActionType(type);
    setResolutionNote("");
  };

  const handleResolveAnomaly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnomaly) return;

    setAnomalies(
      anomalies.map((alt) =>
        alt.id === selectedAnomaly.id
          ? {
              ...alt,
              isResolved: actionType === "RESOLVE",
              notes: resolutionNote,
              resolvedAt: new Date().toISOString(),
              resolvedBy: "Trần Văn B (Admin)"
            }
          : alt
      )
    );

    setSelectedAnomaly(null);
  };

  const filteredAnomalies = anomalies.filter((alt) => {
    const matchesSearch =
      alt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alt.anomalyType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "ALL" || alt.severity === severityFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "RESOLVED" && alt.isResolved) ||
      (statusFilter === "OPEN" && !alt.isResolved);
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-secondary" /> Bất thường Hành trình (Trip Anomalies)
          </h2>
          <p className="text-sm text-on-surface-variant">
            Giám sát các hành vi bất thường, gian lận thẻ, thiết bị ngoại tuyến và quẹt thẻ sai quy trình theo domain TripAnomaly.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Sự cố chưa xử lý (Open)
          </h3>
          <div className="text-3xl font-bold text-error font-data-mono">
            {anomalies.filter((a) => !a.isResolved).length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Sự cố nghiêm trọng
          </h3>
          <div className="text-3xl font-bold text-error font-data-mono">
            {anomalies.filter((a) => a.severity === "CRITICAL" && !a.isResolved).length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Đã khắc phục hôm nay
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim font-data-mono">
            {anomalies.filter((a) => a.isResolved).length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Hiệu năng cổng kiểm soát
          </h3>
          <div className="text-3xl font-bold text-on-surface font-data-mono">
            99.85%
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            className="bg-surface-container-high border-none rounded-full py-1.5 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-secondary w-full outline-none"
            placeholder="Tìm theo ID sự cố, mô tả..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-40"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="CRITICAL">Nghiêm trọng (CRITICAL)</option>
            <option value="WARNING">Cảnh báo (WARNING)</option>
            <option value="INFO">Thông tin (INFO)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-40"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Chưa xử lý (Open)</option>
            <option value="RESOLVED">Đã xử lý (Resolved)</option>
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
                  Mã sự cố
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Mã chuyến đi (Trip ID)
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Phân loại bất thường
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Mức độ
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Mô tả sự cố
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Thời gian phát hiện
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Trạng thái
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-xs">
              {filteredAnomalies.length > 0 ? (
                filteredAnomalies.map((alt) => (
                  <tr
                    key={alt.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[64px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono truncate max-w-[100px]" title={alt.id}>
                      {alt.id.substring(0, 8)}...
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-data-mono text-xs truncate max-w-[100px]" title={alt.tripId}>
                      {alt.tripId}
                    </td>
                    <td className="p-table-cell-padding text-on-surface font-medium">
                      {alt.anomalyType === "DEVICE_OFFLINE" ? (
                        <span className="text-error">Thiết bị ngoại tuyến</span>
                      ) : alt.anomalyType === "INVALID_TAP_SEQUENCE" ? (
                        <span className="text-orange-400">Sai quy trình quẹt thẻ</span>
                      ) : alt.anomalyType === "CARD_BALANCE_MISMATCH" ? (
                        <span className="text-yellow-500">Lệch số dư thẻ</span>
                      ) : (
                        <span className="text-error font-bold">Nghi vấn gian lận</span>
                      )}
                    </td>
                    <td className="p-table-cell-padding">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.severity === "CRITICAL"
                          ? "bg-error-container text-on-error-container"
                          : alt.severity === "WARNING"
                          ? "bg-orange-950/20 text-orange-400"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}>
                        {alt.severity}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant text-xs max-w-[200px] truncate" title={alt.description}>
                      {alt.description}
                    </td>
                    <td className="p-table-cell-padding font-data-mono text-on-surface-variant text-[11px]">
                      {alt.detectedAt.replace("T", " ")}
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[10px] font-semibold inline-flex items-center gap-1 ${
                          !alt.isResolved
                            ? "bg-error-container text-on-error-container animate-pulse"
                            : "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                        }`}
                      >
                        {!alt.isResolved ? "ĐANG MỞ" : "ĐÃ XỬ LÝ"}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right">
                      {!alt.isResolved ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenActionModal(alt, "RESOLVE")}
                            className="px-2.5 py-1 bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant hover:bg-tertiary-fixed-dim/35 rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Giải quyết
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-on-surface-variant text-right">
                          <div>Giải quyết bởi: {alt.resolvedBy}</div>
                          <div className="font-data-mono text-[9px] text-outline">{(alt.resolvedAt || "").replace("T", " ").substring(0, 16)}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy sự cố bất thường nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Dialog Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAnomaly(null)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5 text-error" /> Xác nhận Giải quyết Sự cố
              </h3>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-on-surface-variant space-y-2 bg-surface-container-low p-3 rounded border border-outline-variant">
              <div><strong>Mã sự cố:</strong> <span className="font-data-mono text-on-surface select-all break-all">{selectedAnomaly.id}</span></div>
              <div><strong>Phân loại:</strong> <span className="text-on-surface">{selectedAnomaly.anomalyType}</span></div>
              <div><strong>Mô tả:</strong> <span className="text-on-surface">{selectedAnomaly.description}</span></div>
            </div>

            <form onSubmit={handleResolveAnomaly} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> Ghi chú nội dung giải quyết (notes):
                </label>
                <textarea
                  required
                  placeholder="Ví dụ: Đã kiểm tra log quẹt thẻ, hoàn trả cước phí chênh lệch và cập nhật số dư ví..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm h-24"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Xác nhận Khắc phục (Resolve)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
