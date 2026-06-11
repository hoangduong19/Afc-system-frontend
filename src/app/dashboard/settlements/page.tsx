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

export default function SettlementsPage() {
  const [periods, setPeriods] = useState<SettlementPeriod[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-05");
  const [isOffline, setIsOffline] = useState(false);

  // Operator shares data mapped by period
  const [operatorShares, setOperatorShares] = useState<Record<string, OperatorShare[]>>({
    "2026-05": [
      {
        operatorCode: "HURC",
        operatorName: "Công ty Đường sắt Đô thị Hà Nội",
        totalKm: 145200,
        totalTrips: 185400,
        expectedShare: 1110000000,
        actualShare: 1109100000,
        roundingAdjustment: -900000,
        status: "PENDING"
      },
      {
        operatorCode: "TRANSERCO",
        operatorName: "Tổng công ty Vận tải Hà Nội",
        totalKm: 320400,
        totalTrips: 452100,
        expectedShare: 740000000,
        actualShare: 739400000,
        roundingAdjustment: -600000,
        status: "PENDING"
      }
    ],
    "2026-04": [
      {
        operatorCode: "HURC",
        operatorName: "Công ty Đường sắt Đô thị Hà Nội",
        totalKm: 139100,
        totalTrips: 172500,
        expectedShare: 1032000000,
        actualShare: 1032000000,
        roundingAdjustment: 0,
        status: "CONFIRMED"
      },
      {
        operatorCode: "TRANSERCO",
        operatorName: "Tổng công ty Vận tải Hà Nội",
        totalKm: 312000,
        totalTrips: 432000,
        expectedShare: 688000000,
        actualShare: 688000000,
        roundingAdjustment: 0,
        status: "CONFIRMED"
      }
    ],
    "2026-03": [
      {
        operatorCode: "HURC",
        operatorName: "Công ty Đường sắt Đô thị Hà Nội",
        totalKm: 135800,
        totalTrips: 168400,
        expectedShare: 1008000000,
        actualShare: 1007520000,
        roundingAdjustment: -480000,
        status: "PAID"
      },
      {
        operatorCode: "TRANSERCO",
        operatorName: "Tổng công ty Vận tải Hà Nội",
        totalKm: 308000,
        totalTrips: 421000,
        expectedShare: 672000000,
        actualShare: 671680000,
        roundingAdjustment: -320000,
        status: "PAID"
      }
    ]
  });

  // Logs data
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);

  // Modal State
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isConfirmLockOpen, setIsConfirmLockOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedUploadPeriod, setSelectedUploadPeriod] = useState("2026-06");
  const [dragActive, setDragActive] = useState(false);

  // Load Settlements from API on mount
  useEffect(() => {
    async function loadSettlements() {
      try {
        const data = await fetchApi("/api/settlements");
        if (Array.isArray(data)) {
          const fetchedPeriods: SettlementPeriod[] = data.map((s: any) => ({
            id: s.settlementId,
            period: s.period,
            expectedRevenue: s.totalExpected || 0,
            actualRevenue: s.totalActual || 0,
            discrepancy: s.diffAmount || 0,
            status: (s.status === "CONFIRMED" || s.status === "LOCKED" ? "LOCKED" : "OPEN") as SettlementPeriod["status"],
            lastReconciledAt: s.ranAt ? new Date(s.ranAt).toISOString().replace("T", " ").substring(0, 16) : "",
            reconciledBy: s.ranBy || "Hệ thống"
          }));

          const sharesMap: Record<string, OperatorShare[]> = {};
          data.forEach((s: any) => {
            if (Array.isArray(s.companyShares)) {
              sharesMap[s.period] = s.companyShares.map((cs: any) => ({
                operatorCode: cs.operatorCode || "",
                operatorName: cs.operatorCode === "HURC" ? "Công ty Đường sắt Đô thị Hà Nội" : "Tổng công ty Vận tải Hà Nội",
                totalKm: cs.totalKm || 0,
                totalTrips: cs.totalTrips || 0,
                expectedShare: cs.expectedRevenue || 0,
                actualShare: cs.shareAmount || 0,
                roundingAdjustment: cs.roundingAdjustment || 0,
                status: (s.status === "CONFIRMED" || s.status === "LOCKED" ? "CONFIRMED" : "PENDING") as OperatorShare["status"]
              }));
            }
          });

          setPeriods(fetchedPeriods);
          setOperatorShares(sharesMap);
          if (fetchedPeriods.length > 0) {
            setSelectedPeriod(fetchedPeriods[0].period);
          }
        }
      } catch (err: any) {
        console.warn("FMC Settlements API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadSettlements();
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
      startSimulatedUpload();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startSimulatedUpload();
    }
  };

  const startSimulatedUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
  };

  const startSettlementRun = async () => {
    const [yearStr, monthStr] = selectedUploadPeriod.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const fallbackPeriod = {
      id: 'mock-' + Date.now(),
      period: selectedUploadPeriod,
      expectedRevenue: 1950000000,
      actualRevenue: 1947800000,
      discrepancy: -2200000,
      status: "OPEN" as const,
      lastReconciledAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      reconciledBy: "Trần Văn B (Admin)"
    };

    const fallbackShares = [
      {
        operatorCode: "HURC",
        operatorName: "Công ty Đường sắt Đô thị Hà Nội",
        totalKm: 151000,
        totalTrips: 192000,
        expectedShare: 1170000000,
        actualShare: 1168500000,
        roundingAdjustment: -1500000,
        status: "PENDING" as const
      },
      {
        operatorCode: "TRANSERCO",
        operatorName: "Tổng công ty Vận tải Hà Nội",
        totalKm: 335000,
        totalTrips: 471000,
        expectedShare: 780000000,
        actualShare: 779300000,
        roundingAdjustment: -700000,
        status: "PENDING" as const
      }
    ];

    try {
      const s = await fetchApi("/api/settlements/run", {
        method: "POST",
        body: JSON.stringify({ year, month })
      });

      const newPeriod = {
        id: s.settlementId,
        period: s.period,
        expectedRevenue: s.totalExpected || 0,
        actualRevenue: s.totalActual || 0,
        discrepancy: s.diffAmount || 0,
        status: s.status === "CONFIRMED" || s.status === "LOCKED" ? "LOCKED" as const : "OPEN" as const,
        lastReconciledAt: s.ranAt ? new Date(s.ranAt).toISOString().replace("T", " ").substring(0, 16) : "",
        reconciledBy: s.ranBy || "Hệ thống"
      };

      const newShares = s.companyShares ? s.companyShares.map((cs: any) => ({
        operatorCode: cs.operatorCode || "",
        operatorName: cs.operatorCode === "HURC" ? "Công ty Đường sắt Đô thị Hà Nội" : "Tổng công ty Vận tải Hà Nội",
        totalKm: cs.totalKm || 0,
        totalTrips: cs.totalTrips || 0,
        expectedShare: cs.expectedRevenue || 0,
        actualShare: cs.shareAmount || 0,
        roundingAdjustment: cs.roundingAdjustment || 0,
        status: s.status === "CONFIRMED" || s.status === "LOCKED" ? "CONFIRMED" as const : "PENDING" as const
      })) : [];

      setPeriods(prev => [newPeriod, ...prev.filter(p => p.period !== selectedUploadPeriod)]);
      setOperatorShares(prev => ({
        ...prev,
        [selectedUploadPeriod]: newShares
      }));
      setSelectedPeriod(selectedUploadPeriod);
    } catch (err: any) {
      console.warn("POST run settlement failed. Falling back to local state. Error:", err.message);
      setIsOffline(true);
      
      setPeriods(prev => [fallbackPeriod, ...prev.filter(p => p.period !== selectedUploadPeriod)]);
      setOperatorShares(prev => ({
        ...prev,
        [selectedUploadPeriod]: fallbackShares
      }));
      setSelectedPeriod(selectedUploadPeriod);

      const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        period: selectedUploadPeriod,
        action: "Đối soát định kỳ tải lên",
        status: "WARNING" as const,
        details: "Phát hiện chênh lệch -2,200,000 ₫ khi đối soát thủ công dữ liệu giao dịch tháng " + selectedUploadPeriod + ".",
        performedBy: "Trần Văn B (Admin)"
      };
      setLogs(prev => [newLog, ...prev]);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsUploading(false);
              setIsReconcileModalOpen(false);
              startSettlementRun();
            }, 500);
            return 100;
          }
          return prev + 20;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isUploading, selectedUploadPeriod, periods, operatorShares, logs]);

  const handleLockPeriod = async () => {
    if (!activePeriodInfo || !activePeriodInfo.id) return;

    const updater = () => {
      setPeriods(prev =>
        prev.map((p) => (p.period === selectedPeriod ? { ...p, status: "LOCKED" } : p))
      );
      if (operatorShares[selectedPeriod]) {
        setOperatorShares(prev => ({
          ...prev,
          [selectedPeriod]: prev[selectedPeriod].map((s) => ({ ...s, status: "CONFIRMED" }))
        }));
      }
    };

    try {
      if (!activePeriodInfo.id.startsWith("mock-")) {
        await fetchApi("/api/settlements/" + activePeriodInfo.id + "/confirm", { method: "PATCH" });
      }
      updater();

      const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        period: selectedPeriod,
        action: "Khóa sổ quyết toán",
        status: "SUCCESS" as const,
        details: "Đã khóa dữ liệu và xác nhận bảng phân chia doanh thu kỳ Tháng " + selectedPeriod.substring(5) + "/" + selectedPeriod.substring(0, 4) + ".",
        performedBy: "Trần Văn B (Admin)"
      };
      setLogs(prev => [newLog, ...prev]);
    } catch (err: any) {
      console.warn("Confirm settlement failed, using local mock. Error:", err.message);
      setIsOffline(true);
      updater();
    }
    setIsConfirmLockOpen(false);
  };

  const handleUnlockPeriod = (periodStr: string) => {
    setPeriods(
      periods.map((p) =>
        p.period === periodStr ? { ...p, status: "OPEN" } : p
      )
    );
    
    if (operatorShares[periodStr]) {
      setOperatorShares({
        ...operatorShares,
        [periodStr]: operatorShares[periodStr].map((s) => ({
          ...s,
          status: "PENDING"
        }))
      });
    }

    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      period: periodStr,
      action: "Mở khóa sổ quyết toán",
      status: "WARNING" as const,
      details: "Kỳ quyết toán Tháng " + periodStr.substring(5) + "/" + periodStr.substring(0, 4) + " đã được mở khóa để đối soát lại dữ liệu.",
      performedBy: "Trần Văn B (Admin)"
    };
    setLogs([newLog, ...logs]);
  };

  const handleConfirmPaid = (operatorCode: string) => {
    if (operatorShares[selectedPeriod]) {
      setOperatorShares({
        ...operatorShares,
        [selectedPeriod]: operatorShares[selectedPeriod].map((s) =>
          s.operatorCode === operatorCode ? { ...s, status: "PAID" } : s
        )
      });

      const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        period: selectedPeriod,
        action: "Thanh toán phân chia",
        status: "SUCCESS" as const,
        details: "Đã cập nhật trạng thái đã thanh toán cho nhà vận hành " + operatorCode + " trong kỳ quyết toán " + selectedPeriod + ".",
        performedBy: "Trần Văn B (Admin)"
      };
      setLogs([newLog, ...logs]);
    }
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
            onClick={() => setIsReconcileModalOpen(true)}
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
            {periods.map((p) => (
              <option key={p.period} value={p.period}>
                Tháng {p.period.substring(5)}/{p.period.substring(0, 4)}
              </option>
            ))}
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

          {activePeriodInfo.status === "OPEN" ? (
            <button
              onClick={() => setIsConfirmLockOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-error-container text-on-error-container hover:bg-error-container/80 rounded text-xs font-semibold uppercase cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" /> Khóa sổ kỳ này
            </button>
          ) : (
            <button
              onClick={() => handleUnlockPeriod(activePeriodInfo.period)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant hover:bg-tertiary-fixed-dim/30 rounded text-xs font-semibold uppercase cursor-pointer"
            >
              <Unlock className="h-3.5 w-3.5" /> Mở khóa sửa đổi
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
            ₫ {activePeriodInfo.expectedRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Dựa trên log bán vé & thẻ phát hành</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase mb-1">
            Doanh thu thực tế (Check-in/out)
          </h3>
          <div className="text-2xl font-bold text-on-surface font-data-mono flex items-center gap-1.5">
            ₫ {activePeriodInfo.actualRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Dựa trên log quẹt thẻ thực tế tại cổng ga</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase mb-1">
            Chênh lệch đối soát
          </h3>
          <div
            className={`text-2xl font-bold font-data-mono flex items-center gap-1 ${
              activePeriodInfo.discrepancy === 0
                ? "text-tertiary-fixed-dim"
                : "text-error"
            }`}
          >
            {activePeriodInfo.discrepancy > 0 ? "+" : ""}
            ₫ {activePeriodInfo.discrepancy.toLocaleString()}
            {activePeriodInfo.discrepancy !== 0 && (
              <AlertTriangle className="h-4 w-4 ml-1 animate-pulse" />
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {activePeriodInfo.discrepancy === 0
              ? "Hoàn hảo, không sai lệch"
              : `Lệch ${((Math.abs(activePeriodInfo.discrepancy) / activePeriodInfo.expectedRevenue) * 100).toFixed(3)}% tổng thu`}
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase mb-1">
            Tỷ lệ đối soát thành công
          </h3>
          <div className="text-2xl font-bold text-on-surface font-data-mono flex items-center gap-1.5">
            {((activePeriodInfo.actualRevenue / activePeriodInfo.expectedRevenue) * 100).toFixed(2)}%
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            Yêu cầu liên thông FMC: &gt; 99.5%
          </p>
        </div>
      </div>

      {/* Main Grid: Operators Share Table & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
        {/* Operators Revenue Share Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col col-span-1 lg:col-span-2">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <div>
              <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-secondary" /> Bảng phân chia doanh thu nhà vận hành
              </h3>
              <p className="text-xs text-on-surface-variant">
                Quyết toán dựa trên quãng đường (KM) chạy thực tế và lượng khách đi (Trips)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[10px]">
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                    Đơn vị (Code)
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Tổng hành trình (KM)
                  </th>
                  <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                    Tổng lượt (Trips)
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
                      <td className="p-table-cell-padding text-right font-data-mono text-on-surface-variant">
                        {share.totalKm.toLocaleString()} km
                      </td>
                      <td className="p-table-cell-padding text-right font-data-mono text-on-surface-variant">
                        {share.totalTrips.toLocaleString()}
                      </td>
                      <td className="p-table-cell-padding text-right font-data-mono font-semibold text-secondary-fixed-dim">
                        ₫ {share.actualShare.toLocaleString()}
                      </td>
                      <td className="p-table-cell-padding text-right font-data-mono text-error">
                        {share.roundingAdjustment !== 0
                          ? `₫ ${share.roundingAdjustment.toLocaleString()}`
                          : "—"}
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
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant font-medium">
                      Chưa có bảng phân chia tỷ lệ cho kỳ này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Formula Info */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-on-surface text-sm flex items-center gap-2 pb-2 border-b border-outline-variant">
              <Info className="h-4 w-4 text-secondary" /> Công thức phân chia
            </h3>
            <div className="space-y-3 mt-4 text-xs text-on-surface-variant">
              <p>
                Phân chia doanh thu liên thông FMC tuân thủ quy định tại Quyết định số 450/QĐ-FMC:
              </p>
              <div className="bg-surface-container-low p-3 rounded border border-outline-variant font-data-mono space-y-1 text-on-surface">
                <div className="font-semibold text-secondary-fixed-dim">Tỷ lệ share = 0.6 * A + 0.4 * B</div>
                <div>Trong đó:</div>
                <div className="text-[11px]">- A: Tỷ lệ khách đi (Trips) của nhà xe</div>
                <div className="text-[11px]">- B: Tỷ lệ tổng số KM luân chuyển</div>
              </div>
              <p className="text-[11px] italic">
                * Chênh lệch (nếu có) được bù trừ vào quỹ dự phòng và điều chỉnh kỹ thuật làm tròn hàng tháng.
              </p>
            </div>
          </div>
          
          <div className="bg-surface-container-high border border-outline-variant rounded-lg p-3 space-y-2">
            <h4 className="font-bold text-xs text-on-surface">Báo cáo kiểm toán kỳ này</h4>
            <p className="text-[11px] text-on-surface-variant">
              Kỳ đối soát: <strong className="text-on-surface font-data-mono">{selectedPeriod}</strong><br />
              Lần đối soát cuối: <span className="font-data-mono">{activePeriodInfo.lastReconciledAt}</span><br />
              Thực hiện bởi: <span className="text-secondary font-medium">{activePeriodInfo.reconciledBy}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation Log Audit Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <div>
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-secondary" /> Lịch sử đối soát & Sự kiện bất thường (Audit Logs)
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
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Chọn Kỳ Quyết Toán cần nhập dữ liệu:
                </label>
                <select
                  value={selectedUploadPeriod}
                  onChange={(e) => setSelectedUploadPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono cursor-pointer"
                  disabled={isUploading}
                >
                  <option value="2026-06">Tháng 06/2026 (Kỳ kế tiếp)</option>
                  <option value="2026-05">Tháng 05/2026 (Chạy lại đối soát)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Kéo thả hoặc tải tập tin log giao dịch (.csv, .xlsx, .json):
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
                    <p className="text-xs font-semibold text-on-surface">Click để chọn tệp hoặc kéo thả tệp tại đây</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">Dung lượng tối đa: 50MB</p>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2 p-3 bg-surface-container-high border border-outline-variant rounded-lg">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface">Đang xử lý & phân tích log đối soát...</span>
                    <span className="text-secondary font-data-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-secondary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
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
                  onClick={startSimulatedUpload}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
                  disabled={isUploading}
                >
                  Bắt đầu đối soát
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
