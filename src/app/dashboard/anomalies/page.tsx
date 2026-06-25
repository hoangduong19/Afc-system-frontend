"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  X,
  MessageSquare,
  Coins
} from "lucide-react";
import { fetchApi } from "@/lib/api";

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
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);

  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isOffline, setIsOffline] = useState(false);

  // Resolve Action Modal State
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [correctedFare, setCorrectedFare] = useState("");
  const [actionType, setActionType] = useState<"RESOLVE" | "IGNORE">("RESOLVE");
  const [modalError, setModalError] = useState<string | null>(null);

  async function loadAnomalies() {
    try {
      const data = await fetchApi("/api/anomalies", { params: { size: 100 } });
      const list = data.content || data || [];
      if (Array.isArray(list)) {
        setAnomalies(list.map((item) => ({
          id: item.id,
          tripId: item.tripId || "",
          anomalyType: item.anomalyType,
          severity: item.severity === "ERROR" ? "CRITICAL" : item.severity,
          description: item.description,
          isResolved: !!item.isResolved,
          detectedAt: item.detectedAt ? new Date(item.detectedAt).toISOString().replace("T", " ").substring(0, 19) : "",
          resolvedAt: item.resolvedAt ? new Date(item.resolvedAt).toISOString().replace("T", " ").substring(0, 19) : undefined,
          notes: item.resolveNotes || item.notes || "",
          resolvedBy: item.resolvedBy || "Hệ thống"
        })));
      }
    } catch (err: any) {
      console.warn("FMC Anomalies API is offline. Running in mock fallback mode. Error:", err.message);
      setIsOffline(true);
    }
  }

  useEffect(() => {
    loadAnomalies();
  }, []);

  const handleOpenActionModal = (anomaly: AnomalyItem, type: "RESOLVE" | "IGNORE") => {
    setSelectedAnomaly(anomaly);
    setActionType(type);
    setResolutionNote("");
    setCorrectedFare("");
    setModalError(null);
  };

  const handleResolveAnomaly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnomaly) return;

    const resolvedTime = new Date().toISOString();
    const updater = (alt: AnomalyItem) =>
      alt.id === selectedAnomaly.id
        ? {
          ...alt,
          isResolved: true,
          notes: resolutionNote,
          resolvedAt: resolvedTime.replace("T", " ").substring(0, 19),
          resolvedBy: "Người vận hành"
        }
        : alt;

    setModalError(null);

    try {
      const fare = correctedFare.trim() ? parseFloat(correctedFare) : null;
      await fetchApi(`/api/anomalies/${selectedAnomaly.id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({
          notes: resolutionNote,
          correctedFare: fare
        })
      });
      setAnomalies(prev => prev.map(updater));
      setSelectedAnomaly(null);
    } catch (err: any) {
      console.error("PATCH resolve anomaly failed. Error:", err);
      const isNetworkError = !err.message || err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("networkerror") || err.message.toLowerCase().includes("api request failed with status");

      if (!isNetworkError) {
        setModalError(`Lỗi khắc phục sự cố: ${err.message || "Không thể thực hiện."}`);
      } else {
        setIsOffline(true);
        setAnomalies(prev => prev.map(updater));
        setSelectedAnomaly(null);
      }
    }
  };

  const filteredAnomalies = anomalies.filter((alt) => {
    const matchesSeverity = severityFilter === "ALL" || alt.severity === severityFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "RESOLVED" && alt.isResolved) ||
      (statusFilter === "OPEN" && !alt.isResolved);
    return matchesSeverity && matchesStatus;
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
            <ShieldAlert className="h-6 w-6 text-secondary" /> Bất thường Hành trình (Trip Anomalies)
          </h2>
          <p className="text-sm text-on-surface-variant">
            Giám sát các hành vi bất thường, gian lận thẻ, thiết bị ngoại tuyến và quẹt thẻ sai quy trình theo domain TripAnomaly.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Sự cố chưa xử lý
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
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-40"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="CRITICAL">Nghiêm trọng</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="INFO">Thông tin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-40"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Chưa xử lý</option>
            <option value="RESOLVED">Đã xử lý</option>
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${alt.severity === "CRITICAL"
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
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[10px] font-semibold inline-flex items-center gap-1 ${!alt.isResolved
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

            {modalError && (
              <div className="px-4 py-2.5 bg-error-container text-on-error-container text-xs rounded-lg flex items-center justify-between border border-error/20">
                <span className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-4 w-4 text-error flex-shrink-0" /> {modalError}
                </span>
                <button
                  onClick={() => setModalError(null)}
                  className="p-1 hover:bg-error-container/20 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5 text-on-error-container" />
                </button>
              </div>
            )}

            <div className="text-xs text-on-surface-variant space-y-2 bg-surface-container-low p-3 rounded border border-outline-variant">
              <div><strong>Mã sự cố:</strong> <span className="font-data-mono text-on-surface select-all break-all">{selectedAnomaly.id}</span></div>
              <div><strong>Phân loại:</strong> <span className="text-on-surface">{selectedAnomaly.anomalyType}</span></div>
              <div><strong>Mô tả:</strong> <span className="text-on-surface">{selectedAnomaly.description}</span></div>
            </div>

            <form onSubmit={handleResolveAnomaly} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> Ghi chú nội dung giải quyết:
                </label>
                <textarea
                  required
                  placeholder="Ví dụ: Đã kiểm tra log quẹt thẻ, hoàn trả cước phí chênh lệch và cập nhật số dư ví..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm h-24"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" /> Giá vé sửa đổi - Tùy chọn:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Nhập giá vé đã sửa đổi (nếu có)..."
                  value={correctedFare}
                  onChange={(e) => setCorrectedFare(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
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
                  Xác nhận Khắc phục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
