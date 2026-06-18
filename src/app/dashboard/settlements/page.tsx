"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  Calendar,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Upload,
  ArrowRight,
  TrendingDown,
  Info,
  ChevronRight,
  X,
  FileSpreadsheet
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface SettlementPeriod {
  id?: string;
  period: string; // YYYY-MM
  expectedRevenue: number;
  actualRevenue: number;
  discrepancy: number;
  status: "LOCKED" | "OPEN" | "RECONCILING";
  lastReconciledAt: string;
  reconciledBy: string;
  reconciliationStatus?: "MATCH" | "WARNING" | "MISMATCH";
}

interface OperatorShare {
  operatorCode: string;
  operatorName: string;
  totalKm: number;
  totalTrips: number;
  expectedShare: number;
  actualShare: number;
  roundingAdjustment: number;
  status: "PENDING" | "CONFIRMED" | "PAID";
  directShare: number;
  proportionalShare: number;
}

interface ReconciliationLog {
  id: string;
  timestamp: string;
  period: string;
  action: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  details: string;
  performedBy: string;
}

const formatMoney = (amount: number) => {
  return Math.round(amount).toLocaleString("en-US");
};

const translateSettlementError = (errorMsg: string): string => {
  const msg = errorMsg || "";
  
  if (msg.includes("SETTLEMENT_ALREADY_EXISTS") || msg.includes("already exists")) {
    return "Kỳ quyết toán này đã tồn tại trong hệ thống và không thể tạo hoặc chạy lại.";
  }
  if (msg.includes("SETTLEMENT_NO_TRIPS") || msg.includes("No completed trips")) {
    return "Không tìm thấy bất kỳ chuyến đi hoàn thành nào trong kỳ này để thực hiện đối soát.";
  }
  if (msg.includes("SETTLEMENT_HAS_UNRESOLVED_ANOMALIES") || msg.includes("unresolved anomalies")) {
    const match = msg.match(/(\d+)\s+unresolved/);
    const count = match ? match[1] : "";
    return `Kỳ quyết toán này có ${count ? count + " " : ""}giao dịch/chuyến đi bất thường chưa được giải quyết. Vui lòng xử lý hết các sự cố trước khi chạy quyết toán.`;
  }
  if (msg.includes("SETTLEMENT_NOT_PENDING") || msg.includes("not in pending") || msg.includes("NOT_PENDING")) {
    return "Kỳ quyết toán không ở trạng thái chờ duyệt (DRAFT) nên không thể thực hiện khóa sổ.";
  }
  if (msg.includes("SETTLEMENT_RECONCILE_FAIL") || msg.includes("reconciliation status is MISMATCH") || msg.includes("RECONCILE_FAIL")) {
    return "Đối soát thất bại do có sai lệch số liệu vượt quá ngưỡng dung sai cho phép (MISMATCH).";
  }
  if (msg.includes("SETTLEMENT_NOT_FOUND") || msg.includes("not found")) {
    return "Không tìm thấy kỳ quyết toán yêu cầu trên hệ thống.";
  }
  
  return errorMsg;
};

export default function SettlementsPage() {
  const [rawSettlements, setRawSettlements] = useState<any[]>([]);
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isOffline, setIsOffline] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Local tracking for paid status of operators per period
  const [paidShares, setPaidShares] = useState<Record<string, string[]>>({});

  // Logs data
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);

  // Modal State
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedUploadPeriod, setSelectedUploadPeriod] = useState("2026-06");
  const [dragActive, setDragActive] = useState(false);

  // Compute periods from raw settlements
  const periods = React.useMemo<SettlementPeriod[]>(() => {
    return rawSettlements.map((s: any) => {
      const expectedRevenue = s.totalExpected ?? 0;
      const actualRevenue = s.totalActual ?? 0;
      const discrepancy = s.diffAmount !== undefined && s.diffAmount !== null ? s.diffAmount : (expectedRevenue - actualRevenue);
      return {
        id: s.settlementId,
        period: s.period,
        expectedRevenue,
        actualRevenue,
        discrepancy,
        status: (s.status === "CONFIRMED" || s.status === "LOCKED" ? "LOCKED" : "OPEN") as SettlementPeriod["status"],
        lastReconciledAt: s.ranAt ? new Date(s.ranAt).toISOString().replace("T", " ").substring(0, 16) : "",
        reconciledBy: s.ranBy || "Hệ thống",
        reconciliationStatus: s.reconciliationStatus || "MATCH"
      };
    });
  }, [rawSettlements]);

  // Compute operator shares mapping dynamically
  const operatorShares = React.useMemo<Record<string, OperatorShare[]>>(() => {
    const sharesMap: Record<string, OperatorShare[]> = {};
    rawSettlements.forEach((s: any) => {
      const sharesList = s.companyShares ?? [];
      if (Array.isArray(sharesList)) {
        sharesMap[s.period] = sharesList.map((cs: any) => {
          const opId = cs.operatorId;
          const opCode = cs.operatorCode;
          let matched = operatorsList.find(o => o.id === opId || o.code === opCode);
          if (!matched && opId) {
            if (opId === "op-1") matched = { code: "HURC", name: "Công ty Đường sắt Đô thị Hà Nội" };
            else if (opId === "op-2") matched = { code: "TRANSERCO", name: "Tổng công ty Vận tải Hà Nội" };
          }
          const code = matched?.code || opCode || opId || "N/A";
          const name = matched?.name || (opCode === "HURC" ? "Công ty Đường sắt Đô thị Hà Nội" : opCode === "TRANSERCO" ? "Tổng công ty Vận tải Hà Nội" : "Đơn vị vận hành khác");

          return {
            operatorCode: code,
            operatorName: name,
            totalKm: cs.totalKm || 0,
            totalTrips: cs.totalTrips || 0,
            expectedShare: cs.expectedRevenue || 0,
            actualShare: cs.shareAmount || 0,
            roundingAdjustment: cs.roundingAdjustment || 0,
            status: (paidShares[s.period]?.includes(code)
              ? "PAID"
              : (s.status === "CONFIRMED" || s.status === "LOCKED" ? "CONFIRMED" : "PENDING")) as OperatorShare["status"],
            directShare: cs.directShare ?? cs.directRevenue ?? cs.directShareAmount ?? 0,
            proportionalShare: cs.proportionalShare ?? cs.proportionalRevenue ?? cs.proportionalShareAmount ?? 0
          };
        });
      }
    });
    return sharesMap;
  }, [rawSettlements, operatorsList, paidShares]);

  // Load Settlements and Operators from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [settlementsData, operatorsData] = await Promise.all([
          fetchApi("/api/settlements"),
          fetchApi("/api/operators").catch(err => {
            console.warn("Failed to load operators list:", err);
            return [];
          })
        ]);

        if (Array.isArray(operatorsData)) {
          setOperatorsList(operatorsData);
        }

        if (Array.isArray(settlementsData)) {
          setRawSettlements(settlementsData);
          if (settlementsData.length > 0) {
            setSelectedPeriod(settlementsData[0].period);
          }
        }
      } catch (err: any) {
        console.warn("FMC Settlements API is offline. Error:", err.message);
        setIsOffline(true);
        const translatedMsg = translateSettlementError(err.message);
        setPageError(`Không thể tải dữ liệu quyết toán từ máy chủ API: ${translatedMsg}`);
      }
    }
    loadData();
  }, []);

  // Stats calculation for active period
  const activePeriodInfo = periods.find((p) => p.period === selectedPeriod) || periods[0] || {
    period: "N/A", expectedRevenue: 0, actualRevenue: 0, discrepancy: 0, status: "OPEN", lastReconciledAt: "", reconciledBy: ""
  };
  const activeShares = operatorShares[selectedPeriod] || [];

  // Load Reconciliation Logs when active period changes
  useEffect(() => {
    if (!activePeriodInfo || !activePeriodInfo.id || activePeriodInfo.id.startsWith("mock-")) return;
    
    async function loadLogs() {
      try {
        const logsData = await fetchApi("/api/settlements/" + activePeriodInfo.id + "/reconciliation-logs");
        if (Array.isArray(logsData)) {
          setLogs(logsData.map((log) => ({
            id: log.id,
            timestamp: log.loggedAt ? new Date(log.loggedAt).toISOString().replace("T", " ").substring(0, 16) : "",
            period: selectedPeriod,
            action: log.category || "Đối soát",
            status: log.discrepancyAmount !== 0 ? "WARNING" : "SUCCESS",
            details: log.note || ("Đối soát hoàn tất: chênh lệch " + log.discrepancyAmount + " trên " + log.tripCount + " lượt."),
            performedBy: "Hệ thống tự động"
          })));
        }
      } catch (err: any) {
        console.warn("Failed to load logs for period, keeping current logs state. Error:", err.message);
      }
    }
    loadLogs();
  }, [selectedPeriod, activePeriodInfo?.id]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startSettlementRun = async () => {
    if (!selectedUploadPeriod) return;
    const [yearStr, monthStr] = selectedUploadPeriod.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    setIsUploading(true);
    setPageError(null);
    setModalError(null);

    try {
      const s = await fetchApi("/api/settlements/run", {
        method: "POST",
        body: JSON.stringify({ year, month })
      });

      setRawSettlements(prev => [s, ...prev.filter(p => p.period !== selectedUploadPeriod)]);
      setSelectedPeriod(selectedUploadPeriod);
      setSelectedFile(null);
      setIsReconcileModalOpen(false);
    } catch (err: any) {
      console.error("POST run settlement failed. Error:", err);
      const translatedMsg = translateSettlementError(err.message);
      setModalError(`Lỗi chạy đối soát: ${translatedMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLockPeriod = async () => {
    if (!activePeriodInfo || !activePeriodInfo.id) return;

    const updater = () => {
      setRawSettlements(prev =>
        prev.map((p) => (p.settlementId === activePeriodInfo.id ? { ...p, status: "CONFIRMED" } : p))
      );
    };

    try {
      await fetchApi("/api/settlements/" + activePeriodInfo.id + "/confirm", { method: "PATCH" });
      updater();

      const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        period: selectedPeriod,
        action: "Khóa sổ quyết toán",
        status: "SUCCESS" as const,
        details: "Đã khóa dữ liệu và xác nhận bảng phân chia doanh thu kỳ Tháng " + selectedPeriod.substring(5) + "/" + selectedPeriod.substring(0, 4) + ".",
        performedBy: "Hệ thống"
      };
      setLogs(prev => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Confirm settlement failed. Error:", err);
      const translatedMsg = translateSettlementError(err.message);
      setPageError(`Lỗi khóa sổ: ${translatedMsg}`);
    }
    setIsConfirmLockOpen(false);
  };



  const handleConfirmPaid = (operatorCode: string) => {
    setPaidShares(prev => {
      const current = prev[selectedPeriod] || [];
      if (current.includes(operatorCode)) return prev;
      return {
        ...prev,
        [selectedPeriod]: [...current, operatorCode]
      };
    });

    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      period: selectedPeriod,
      action: "Thanh toán phân chia",
      status: "SUCCESS" as const,
      details: "Đã cập nhật trạng thái đã thanh toán cho nhà vận hành " + operatorCode + " trong kỳ quyết toán " + selectedPeriod + ".",
      performedBy: "Hệ thống"
    };
    setLogs(prev => [newLog, ...prev]);
  };

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="px-4 py-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center justify-between border border-error/20 animate-pulse">
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" /> Chế độ mô phỏng (Mock Fallback Mode) được kích hoạt do lỗi kết nối tới API Server.
          </span>
        </div>
      )}

      {pageError && (
        <div className="px-4 py-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center justify-between border border-error/20">
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-error" /> {pageError}
          </span>
          <button
            onClick={() => setPageError(null)}
            className="p-1 hover:bg-error-container/20 rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-on-error-container" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Coins className="h-6 w-6 text-secondary" /> Quyết toán & Phân chia
          </h2>
          <p className="text-sm text-on-surface-variant">
            Đối soát tổng hợp, quản lý chênh lệch doanh thu và phân chia tỷ lệ cho HURC & TRANSERCO.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setModalError(null);
              setSelectedFile(null);
              setIsReconcileModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" /> Đối soát dữ liệu
          </button>
        </div>
      </div>

      {/* Period Selector & Global Actions Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="h-5 w-5 text-outline" />
          <span className="text-sm font-medium text-on-surface">Kỳ quyết toán:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-48 font-data-mono"
          >
            {periods.length > 0 ? (
              periods.map((p) => (
                <option key={p.period} value={p.period}>
                  Tháng {p.period.substring(5)}/{p.period.substring(0, 4)}
                </option>
              ))
            ) : (
              <option value="">Chưa có dữ liệu</option>
            )}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-xs text-on-surface-variant">
            Trạng thái kỳ:{" "}
            <span
              className={`font-semibold uppercase px-2 py-0.5 rounded text-[10px] ${
                activePeriodInfo.status === "LOCKED"
                  ? "bg-outline-variant text-on-surface-variant"
                  : "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
              }`}
            >
              {activePeriodInfo.status === "LOCKED" ? "Đã khóa sổ" : "Đang mở"}
            </span>
          </span>

          {activePeriodInfo.status === "OPEN" && (
            <button
              onClick={() => setIsConfirmLockOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-error-container text-on-error-container hover:bg-error-container/80 rounded text-xs font-semibold uppercase cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" /> Khóa sổ kỳ này
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase mb-1">
            Doanh thu dự kiến (Mô phỏng)
          </h3>
          <div className="text-2xl font-bold text-on-surface font-data-mono">
            ₫ {formatMoney(activePeriodInfo.expectedRevenue)}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase mb-1">
            Doanh thu thực tế (Check-in/out)
          </h3>
          <div className="text-2xl font-bold text-on-surface font-data-mono flex items-center gap-1.5">
            ₫ {formatMoney(activePeriodInfo.actualRevenue)}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase mb-1 flex justify-between items-center">
            <span>Chênh lệch đối soát</span>
            {activePeriodInfo.reconciliationStatus && (
              <span
                className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                  activePeriodInfo.reconciliationStatus === "MATCH"
                    ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                    : activePeriodInfo.reconciliationStatus === "WARNING"
                    ? "bg-warning/20 text-secondary"
                    : "bg-error-container text-on-error-container animate-pulse"
                }`}
              >
                {activePeriodInfo.reconciliationStatus === "MATCH"
                  ? "KHỚP"
                  : activePeriodInfo.reconciliationStatus === "WARNING"
                  ? "CẢNH BÁO"
                  : "SAI LỆCH"}
              </span>
            )}
          </h3>
          <div
            className={`text-2xl font-bold font-data-mono flex items-center gap-1 ${
              activePeriodInfo.reconciliationStatus === "MATCH"
                ? "text-tertiary-fixed-dim"
                : activePeriodInfo.reconciliationStatus === "WARNING"
                ? "text-secondary"
                : "text-error"
            }`}
          >
            {activePeriodInfo.discrepancy > 0 ? "+" : ""}
            ₫ {formatMoney(activePeriodInfo.discrepancy)}
            {activePeriodInfo.reconciliationStatus !== "MATCH" && (
              <AlertTriangle className="h-4 w-4 ml-1 animate-pulse" />
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase mb-1">
            Tỷ lệ đối soát thành công
          </h3>
          <div className="text-2xl font-bold text-on-surface font-data-mono flex items-center gap-1.5">
            {((activePeriodInfo.actualRevenue / activePeriodInfo.expectedRevenue) * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Operators Revenue Share Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col w-full">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-secondary" /> Bảng phân chia doanh thu nhà vận hành
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Quyết toán dựa trên quãng đường chạy thực tế và lượng khách đi
            </p>
          </div>
          {activePeriodInfo.period !== "N/A" && (
            <div className="text-[11px] text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant">
              <span className="font-semibold text-on-surface">Kiểm toán: </span>
              <span>{activePeriodInfo.reconciledBy}</span>
              {activePeriodInfo.lastReconciledAt && (
                <span className="text-outline"> | Cập nhật: {activePeriodInfo.lastReconciledAt}</span>
              )}
            </div>
          )}
        </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[10px]">
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Đơn vị
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Tổng hành trình
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Tổng lượt
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Phân chia trực tiếp
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Phân chia theo Tỷ lệ 
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Số tiền phân chia
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Làm tròn/Điều chỉnh
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
                {activeShares.length > 0 ? (
                  activeShares.map((share) => (
                    <tr
                      key={share.operatorCode}
                      className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[54px]"
                    >
                      <td className="p-table-cell-padding">
                        <div className="font-semibold text-on-surface font-data-mono">{share.operatorCode}</div>
                        <div className="text-[10px] text-on-surface-variant max-w-[150px] truncate" title={share.operatorName}>
                          {share.operatorName}
                        </div>
                      </td>
                      <td className="p-table-cell-padding text-right font-medium text-on-surface text-sm">
                        {share.totalKm.toLocaleString(undefined, { minimumFractionDigits: 1 })} km
                      </td>
                      <td className="p-table-cell-padding text-right font-medium text-on-surface text-sm">
                        {share.totalTrips.toLocaleString()}
                      </td>
                      <td className="p-table-cell-padding text-right font-semibold text-on-surface text-sm">
                        {share.directShare > 0
                          ? `₫ ${formatMoney(share.directShare)}`
                          : <span className="text-outline-variant">—</span>}
                      </td>
                      <td className="p-table-cell-padding text-right font-semibold text-secondary text-sm">
                        {share.proportionalShare > 0
                          ? `₫ ${formatMoney(share.proportionalShare)}`
                          : <span className="text-outline-variant">—</span>}
                      </td>
                      <td className="p-table-cell-padding text-right font-bold text-on-surface text-sm">
                        ₫ {formatMoney(share.actualShare)}
                      </td>
                      <td className="p-table-cell-padding text-right font-medium text-error text-sm">
                        {share.roundingAdjustment !== 0
                          ? `₫ ${formatMoney(share.roundingAdjustment)}`
                          : <span className="text-outline-variant">—</span>}
                      </td>
                      <td className="p-table-cell-padding">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 ${
                            share.status === "PAID"
                              ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                              : share.status === "CONFIRMED"
                              ? "bg-secondary-container/20 text-secondary-fixed-dim"
                              : "bg-error-container text-on-error-container"
                          }`}
                        >
                          {share.status === "PAID" ? (
                            <>
                              <CheckCircle className="h-3 w-3" /> ĐÃ CHI TRẢ
                            </>
                          ) : share.status === "CONFIRMED" ? (
                            <>
                              <CheckCircle className="h-3 w-3" /> ĐÃ XÁC NHẬN
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3" /> CHỜ DUYỆT
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-table-cell-padding text-right">
                        {share.status === "CONFIRMED" ? (
                          <button
                            onClick={() => handleConfirmPaid(share.operatorCode)}
                            className="px-2.5 py-1 bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant hover:bg-tertiary-fixed-dim/30 rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Đã chuyển khoản
                          </button>
                        ) : share.status === "PAID" ? (
                          <span className="text-[10px] text-on-surface-variant font-medium">Hoàn thành</span>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant italic">Yêu cầu khóa sổ</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-on-surface-variant font-medium">
                      Chưa có bảng phân chia tỷ lệ cho kỳ này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Reconciliation Log Audit Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <div>
             <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
               <FileText className="h-4 w-4 text-secondary" /> Lịch sử đối soát & Sự kiện bất thường
             </h3>
            <p className="text-xs text-on-surface-variant">
              Nhật ký ghi nhận tiến trình chạy đối soát tự động và các log lỗi giao dịch phát hiện.
            </p>
          </div>
        </div>

        <div className="divide-y divide-outline-variant">
          {logs.filter(log => log.period === selectedPeriod || selectedPeriod === "ALL").map((log) => (
            <div key={log.id} className="p-4 hover:bg-surface-container-low transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-3 items-start">
                <span className="mt-1">
                  {log.status === "SUCCESS" ? (
                    <CheckCircle className="h-4.5 w-4.5 text-tertiary-fixed-dim" />
                  ) : log.status === "WARNING" ? (
                    <AlertTriangle className="h-4.5 w-4.5 text-error animate-pulse" />
                  ) : (
                    <XCircle className="h-4.5 w-4.5 text-error" />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-on-surface">{log.action}</span>
                    <span className="font-data-mono text-[10px] bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant">
                      Kỳ {log.period}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{log.details}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1 w-full sm:w-auto">
                <span className="font-data-mono text-[10px] text-outline">{log.timestamp}</span>
                <span className="text-[10px] text-on-surface-variant">Bởi: {log.performedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- RECONCILE DATA MODAL --- */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!isUploading) setIsReconcileModalOpen(false);
            }}
          />
          
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg p-6 z-10">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-lg font-bold text-on-surface">
                Đối soát & Nhập Dữ Liệu Thủ Công FMC
              </h3>
              <button
                onClick={() => setIsReconcileModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
                disabled={isUploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
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
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Chọn Kỳ Quyết Toán cần đối soát:
                </label>
                <input
                  type="month"
                  value={selectedUploadPeriod}
                  onChange={(e) => setSelectedUploadPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono cursor-pointer"
                  disabled={isUploading}
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Hệ thống sẽ tự động tổng hợp đối soát dựa trên tất cả dữ liệu giao dịch sẵn có trên Backend.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Tải lên tệp log bổ sung ngoài hệ thống (Tùy chọn):
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer relative ${
                    dragActive
                      ? "border-secondary bg-secondary/5"
                      : "border-outline-variant hover:border-secondary bg-surface-bright"
                  } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
                >
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    accept=".csv,.xlsx,.xls,.json"
                  />
                  <Upload className="h-10 w-10 text-outline opacity-65" />
                  <div>
                    <p className="text-xs font-semibold text-on-surface">
                      {selectedFile ? `Đã chọn tệp: ${selectedFile.name}` : "Click để chọn tệp hoặc kéo thả tệp tại đây"}
                    </p>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="mt-2 px-2 py-0.5 bg-error/10 text-error hover:bg-error/20 rounded text-[10px] font-semibold cursor-pointer z-20 relative"
                      >
                        Gỡ bỏ tệp
                      </button>
                    )}
                    <p className="text-[10px] text-on-surface-variant mt-1">Dung lượng tối đa: 50MB</p>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2 p-3 bg-surface-container-high border border-outline-variant rounded-lg flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <RefreshCw className="h-4 w-4 animate-spin text-secondary" />
                    <span className="text-on-surface">Đang đối soát dữ liệu trên máy chủ...</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsReconcileModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer"
                  disabled={isUploading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={startSettlementRun}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
                  disabled={isUploading}
                >
                  {isUploading ? "Đang xử lý..." : "Bắt đầu đối soát kỳ này"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM LOCK MODAL --- */}
      {isConfirmLockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsConfirmLockOpen(false)}
          />
          
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-error flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  Xác nhận khóa sổ kỳ quyết toán?
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Kỳ quyết toán <strong className="text-on-surface font-data-mono">{selectedPeriod}</strong> sẽ được khóa vĩnh viễn. 
                  Tất cả các số liệu chênh lệch, tỉ lệ phân chia doanh thu sẽ được xác nhận làm dữ liệu kế toán pháp lý và không thể thay đổi thêm.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmLockOpen(false)}
                className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleLockPeriod}
                className="px-4 py-2 bg-error text-on-error rounded hover:opacity-90 transition-opacity text-xs font-semibold uppercase cursor-pointer"
              >
                Khóa sổ ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
