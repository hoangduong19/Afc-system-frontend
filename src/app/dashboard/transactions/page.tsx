"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  CreditCard,
  Building2
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface TransactionItem {
  transactionId: string;
  cardUid: string;
  ticketId?: string;
  operatorCode: string;
  lineCode: string;
  tapInStationCode: string;
  tapInAt: string;
  tapInDeviceId: string;
  tapOutStationCode?: string;
  tapOutAt?: string;
  tapOutDeviceId?: string;
  distanceKm: number;
  fareAmount: number;
  mode: "METRO" | "BUS" | "ANY";
  paymentMethod: "WALLET" | "TICKET" | "PREPAID";
  ticketType?: "SINGLE_TRIP" | "MONTHLY_PASS";
  tripStatus: "COMPLETED" | "DEBT";
  debtAmount: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await fetchApi("/api/transactions");
        const list = data.content || data || [];
        if (Array.isArray(list)) {
          setTransactions(list.map((t: any) => ({
            transactionId: t.id,
            cardUid: t.cardUid || "Mã thẻ ẩn",
            ticketId: t.externalTransactionId,
            operatorCode: t.operatorCode || "HURC",
            lineCode: t.operatorCode === "HURC" ? "L2A (Cát Linh - Yên Nghĩa)" : "BUS LINE",
            tapInStationCode: t.tapInStationCode || "MS01",
            tapInAt: t.tapInAt ? new Date(t.tapInAt).toISOString().replace("T", " ").substring(0, 19) : "",
            tapInDeviceId: t.tapInDeviceId || "GATE-IN-01",
            tapOutStationCode: t.tapOutStationCode || undefined,
            tapOutAt: t.tapOutAt ? new Date(t.tapOutAt).toISOString().replace("T", " ").substring(0, 19) : undefined,
            tapOutDeviceId: t.tapOutDeviceId || undefined,
            distanceKm: t.distanceKm || 0,
            fareAmount: t.fareAmount || 0,
            mode: t.operatorCode === "HURC" ? "METRO" : "BUS",
            paymentMethod: t.paymentMethod || "WALLET",
            ticketType: t.ticketType || undefined,
            tripStatus: t.status || "COMPLETED",
            debtAmount: t.debtAmount || 0
          })));
        }
      } catch (err: any) {
        console.warn("FMC Transactions API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadTransactions();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.cardUid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tapInStationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.tapOutStationCode && tx.tapOutStationCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesOperator = operatorFilter === "ALL" || tx.operatorCode === operatorFilter;
    const matchesStatus = statusFilter === "ALL" || tx.tripStatus === statusFilter;
    return matchesSearch && matchesOperator && matchesStatus;
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
            <Receipt className="h-6 w-6 text-secondary" /> Nhật ký Giao dịch Hành trình
          </h2>
          <p className="text-sm text-on-surface-variant">
            Nhật ký check-in/out và thông tin cước phí đi tàu Metro, xe Bus thời gian thực.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng lượt quẹt thẻ (Hôm nay)
          </h3>
          <div className="text-3xl font-bold text-on-surface font-data-mono">
            {transactions.length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Doanh thu Quẹt thẻ
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim font-data-mono">
            ₫ {transactions.reduce((acc, t) => acc + t.fareAmount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Nợ cước phát sinh (Debt)
          </h3>
          <div className="text-3xl font-bold text-error font-data-mono">
            ₫ {transactions.reduce((acc, t) => acc + t.debtAmount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Cự ly di chuyển TB
          </h3>
          <div className="text-3xl font-bold text-on-surface font-data-mono">
            {(transactions.reduce((acc, t) => acc + t.distanceKm, 0) / transactions.length).toFixed(1)} km
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            className="bg-surface-container-high border-none rounded-full py-1.5 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-secondary w-full outline-none"
            placeholder="Tìm theo ID, mã UID thẻ..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-40"
          >
            <option value="ALL">Tất cả vận hành</option>
            <option value="HURC">HURC (Metro)</option>
            <option value="TRANSERCO">TRANSERCO (Bus)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-40"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="COMPLETED">Thành công</option>
            <option value="DEBT">Nợ cước (Incomplete)</option>
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
                  Mã giao dịch
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Mã UID Thẻ
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Vận hành
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Ga vào / Ga ra
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Cự ly (KM)
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Cước phí
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Hành trình
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-xs">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.transactionId}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[54px]"
                  >
                    <td className="p-table-cell-padding font-semibold font-data-mono text-on-surface truncate max-w-[120px]" title={tx.transactionId}>
                      {tx.transactionId.substring(0, 13)}...
                    </td>
                    <td className="p-table-cell-padding text-on-surface font-data-mono text-xs">
                      {tx.cardUid}
                    </td>
                    <td className="p-table-cell-padding">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.operatorCode === "HURC" ? "bg-secondary-container/20 text-secondary-fixed-dim" : "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                      }`}>
                        {tx.operatorCode}
                      </span>
                    </td>
                    <td className="p-table-cell-padding">
                      <div className="flex flex-col">
                        <div className="text-[11px] font-medium text-on-surface flex items-center gap-1">
                          <span className="text-outline">Vào:</span> {tx.tapInStationCode}
                        </div>
                        {tx.tapOutStationCode ? (
                          <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                            <span className="text-outline">Ra:</span> {tx.tapOutStationCode}
                          </div>
                        ) : (
                          <div className="text-[10px] text-error flex items-center gap-1">
                            <span className="text-outline">Ra:</span> Không quẹt ra
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface-variant">
                      {tx.distanceKm > 0 ? `${tx.distanceKm} km` : "—"}
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-bold">
                      {tx.fareAmount > 0 ? `₫ ${tx.fareAmount.toLocaleString()}` : "₫ 0 (Vé tháng)"}
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[11px] font-medium inline-flex items-center gap-1 ${
                          tx.tripStatus === "COMPLETED"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {tx.tripStatus === "COMPLETED" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> THÀNH CÔNG
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3" /> NỢ CƯỚC (+₫{tx.debtAmount.toLocaleString()})
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1 text-xs"
                      >
                        <Info className="h-4 w-4" /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy giao dịch nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTx(null)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg p-6 z-10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Receipt className="h-5 w-5 text-secondary" /> Chi tiết giao dịch hành trình
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-3 rounded border border-outline-variant space-y-1">
                <div className="text-[10px] text-outline uppercase font-semibold">Mã giao dịch</div>
                <div className="text-xs font-data-mono text-on-surface select-all break-all">{selectedTx.transactionId}</div>
              </div>
              <div className="bg-surface-container-low p-3 rounded border border-outline-variant space-y-1">
                <div className="text-[10px] text-outline uppercase font-semibold">Mã UID Thẻ</div>
                <div className="text-xs font-data-mono text-on-surface select-all">{selectedTx.cardUid}</div>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
              <h4 className="font-bold text-xs text-on-surface">Thông tin di chuyển & đầu đọc cổng</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Gate In */}
                <div className="space-y-1.5 border-r border-outline-variant pr-3">
                  <div className="text-[10px] text-outline uppercase font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-tertiary-fixed-dim" /> TAP-IN (Giờ vào)
                  </div>
                  <div>Ga: <strong className="text-on-surface">{selectedTx.tapInStationCode}</strong></div>
                  <div>Giờ: <span className="font-data-mono text-on-surface-variant">{selectedTx.tapInAt}</span></div>
                  <div>Đầu đọc: <span className="font-data-mono text-on-surface-variant">{selectedTx.tapInDeviceId}</span></div>
                </div>

                {/* Gate Out */}
                <div className="space-y-1.5 pl-3">
                  <div className="text-[10px] text-outline uppercase font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-error" /> TAP-OUT (Giờ ra)
                  </div>
                  {selectedTx.tapOutStationCode ? (
                    <>
                      <div>Ga: <strong className="text-on-surface">{selectedTx.tapOutStationCode}</strong></div>
                      <div>Giờ: <span className="font-data-mono text-on-surface-variant">{selectedTx.tapOutAt}</span></div>
                      <div>Đầu đọc: <span className="font-data-mono text-on-surface-variant">{selectedTx.tapOutDeviceId || "—"}</span></div>
                    </>
                  ) : (
                    <div className="text-error font-medium italic flex items-center gap-1 pt-2">
                      <AlertTriangle className="h-4 w-4" /> Hệ thống không ghi nhận quẹt thẻ ra (Incomplete Journey).
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
              <h4 className="font-bold text-xs text-on-surface">Chi tiết cước phí & Thanh toán</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-surface-bright p-2.5 rounded border border-outline-variant">
                  <div className="text-[9px] text-outline uppercase">Phương thức</div>
                  <div className="font-semibold text-on-surface mt-1">{selectedTx.paymentMethod}</div>
                </div>
                <div className="bg-surface-bright p-2.5 rounded border border-outline-variant">
                  <div className="text-[9px] text-outline uppercase">Cước phí quẹt</div>
                  <div className="font-bold font-data-mono text-secondary-fixed-dim mt-1">₫ {selectedTx.fareAmount.toLocaleString()}</div>
                </div>
                <div className="bg-surface-bright p-2.5 rounded border border-outline-variant">
                  <div className="text-[9px] text-outline uppercase">Nợ cước phát sinh</div>
                  <div className={`font-bold font-data-mono mt-1 ${selectedTx.debtAmount > 0 ? "text-error" : "text-outline"}`}>
                    ₫ {selectedTx.debtAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {selectedTx.ticketId && (
              <div className="flex items-center gap-2 text-xs bg-secondary-container/10 border border-secondary-container/30 p-3 rounded-lg text-secondary-fixed-dim">
                <CreditCard className="h-4 w-4 flex-shrink-0" />
                <span>
                  Giao dịch liên thông sử dụng vé hệ thống có mã: <strong>{selectedTx.ticketId}</strong> ({selectedTx.ticketType})
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
