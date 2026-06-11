"use client";

import React, { useState } from "react";
import {
  Wallet,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Sliders,
  History,
  Info,
  X,
  FileSpreadsheet
} from "lucide-react";

interface RevenueShareRule {
  id: string;
  operatorId: string;
  operatorCode: string;
  shareModel: "KM_BASED" | "TRIP_BASED" | "FIXED";
  sharePercentage: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: "ACTIVE" | "INACTIVE";
  version: number;
  createdAt: string;
  params: Record<string, any>;
}

export default function RevenueSharePage() {
  const [rules, setRules] = useState<RevenueShareRule[]>([
    {
      id: "rule-100",
      operatorId: "op-1",
      operatorCode: "HURC",
      shareModel: "TRIP_BASED",
      sharePercentage: 60, // 60% of tickets sold on Metro
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      status: "ACTIVE",
      version: 2,
      createdAt: "2025-12-25 10:00",
      params: { tripWeight: 1.0, minimumGuarantee: 500000000 }
    },
    {
      id: "rule-200",
      operatorId: "op-2",
      operatorCode: "TRANSERCO",
      shareModel: "KM_BASED",
      sharePercentage: 40, // 40% sharing based on fleet KM run
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      status: "ACTIVE",
      version: 1,
      createdAt: "2025-12-25 10:15",
      params: { kmRateMultiplier: 1.2, flatBonus: 100000000 }
    },
    {
      id: "rule-099",
      operatorId: "op-1",
      operatorCode: "HURC",
      shareModel: "FIXED",
      sharePercentage: 50,
      effectiveFrom: "2025-06-01",
      effectiveTo: "2025-12-31",
      status: "INACTIVE",
      version: 1,
      createdAt: "2025-05-15 09:30",
      params: { monthlyFixedAmount: 800000000 }
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [modelFilter, setModelFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form States for new sharing rule
  const [operatorCode, setOperatorCode] = useState("HURC");
  const [shareModel, setShareModel] = useState<"KM_BASED" | "TRIP_BASED" | "FIXED">("TRIP_BASED");
  const [sharePercentage, setSharePercentage] = useState(60);
  const [effectiveFrom, setEffectiveFrom] = useState("2026-06-01");
  const [effectiveTo, setEffectiveTo] = useState("2026-12-31");
  const [paramKey, setParamKey] = useState("tripWeight");
  const [paramVal, setParamVal] = useState("1.0");

  const handleOpenCreateModal = () => {
    setOperatorCode("HURC");
    setShareModel("TRIP_BASED");
    setSharePercentage(60);
    setEffectiveFrom("2026-06-01");
    setEffectiveTo("2026-12-31");
    setParamKey("tripWeight");
    setParamVal("1.0");
    setIsModalOpen(true);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();

    // Check operatorId mapping
    const operatorId = operatorCode === "HURC" ? "op-1" : "op-2";
    
    // Deactivate previous active rules for the same operator
    const updatedRules = rules.map(rule => {
      if (rule.operatorCode === operatorCode && rule.status === "ACTIVE") {
        return { ...rule, status: "INACTIVE" as const };
      }
      return rule;
    });

    const nextVersion = rules.filter(r => r.operatorCode === operatorCode).length + 1;

    const newRule: RevenueShareRule = {
      id: `rule-${Math.floor(300 + Math.random() * 700)}`,
      operatorId,
      operatorCode,
      shareModel,
      sharePercentage,
      effectiveFrom,
      effectiveTo,
      status: "ACTIVE",
      version: nextVersion,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      params: { [paramKey]: parseFloat(paramVal) || paramVal }
    };

    setRules([newRule, ...updatedRules]);
    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    setRules(
      rules.map((rule) => {
        if (rule.id === id) {
          const isActivating = rule.status === "INACTIVE";
          // If activating, we must deactivate other active rules for the same operator
          if (isActivating) {
            setTimeout(() => {
              setRules(prev => prev.map(r => 
                r.id === id 
                  ? { ...r, status: "ACTIVE" }
                  : (r.operatorCode === rule.operatorCode && r.status === "ACTIVE" ? { ...r, status: "INACTIVE" } : r)
              ));
            }, 0);
          }
          return { ...rule, status: rule.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" };
        }
        return rule;
      })
    );
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.operatorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shareModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = modelFilter === "ALL" || r.shareModel === modelFilter;
    return matchesSearch && matchesModel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Wallet className="h-6 w-6 text-secondary" /> Quy tắc Phân chia Doanh thu
          </h2>
          <p className="text-sm text-on-surface-variant">
            Định nghĩa tỷ lệ phân chia, mô hình tính toán cước phí và thông số phân bổ tài chính cho các Operator.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Tạo quy tắc mới
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
              Quy tắc HURC (Metro)
            </h3>
            <div className="text-xl font-bold text-secondary-fixed-dim">
              {rules.find((r) => r.operatorCode === "HURC" && r.status === "ACTIVE")?.sharePercentage || 0}% 
              <span className="text-xs font-normal text-on-surface-variant ml-2">
                ({rules.find((r) => r.operatorCode === "HURC" && r.status === "ACTIVE")?.shareModel})
              </span>
            </div>
          </div>
          <Sliders className="h-10 w-10 text-outline opacity-40" />
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Quy tắc TRANSERCO (Bus)
          </h3>
          <div className="text-xl font-bold text-tertiary-fixed-dim">
            {rules.find((r) => r.operatorCode === "TRANSERCO" && r.status === "ACTIVE")?.sharePercentage || 0}%
            <span className="text-xs font-normal text-on-surface-variant ml-2">
              ({rules.find((r) => r.operatorCode === "TRANSERCO" && r.status === "ACTIVE")?.shareModel})
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Mô hình áp dụng
          </h3>
          <div className="text-xl font-bold text-on-surface">
            {new Set(rules.filter(r => r.status === "ACTIVE").map(r => r.shareModel)).size} Mô hình
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            className="bg-surface-container-high border-none rounded-full py-1.5 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-secondary w-full outline-none"
            placeholder="Tìm theo nhà vận hành..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-48"
          >
            <option value="ALL">Tất cả mô hình share</option>
            <option value="KM_BASED">Tính theo số KM (KM_BASED)</option>
            <option value="TRIP_BASED">Tính theo lượt đi (TRIP_BASED)</option>
            <option value="FIXED">Cố định định kỳ (FIXED)</option>
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
                  Nhà vận hành
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Mô hình phân chia
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Tỉ lệ phân chia
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Hiệu lực từ - đến
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Tham số cấu hình (JSON)
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Phiên bản
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Trạng thái
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Tác vụ
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-xs">
              {filteredRules.length > 0 ? (
                filteredRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[54px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono">
                      {rule.operatorCode}
                    </td>
                    <td className="p-table-cell-padding text-on-surface font-medium">
                      {rule.shareModel === "KM_BASED"
                        ? "Dựa trên số KM di chuyển"
                        : rule.shareModel === "TRIP_BASED"
                        ? "Dựa trên số lượt quẹt thẻ"
                        : "Chi trả cố định hàng tháng"}
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-bold text-secondary-fixed-dim">
                      {rule.sharePercentage}%
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-data-mono">
                      {rule.effectiveFrom} / {rule.effectiveTo}
                    </td>
                    <td className="p-table-cell-padding font-data-mono text-xs text-outline">
                      {JSON.stringify(rule.params)}
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono font-semibold text-on-surface-variant">
                      v{rule.version}
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[10px] font-semibold inline-flex items-center gap-1 ${
                          rule.status === "ACTIVE"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : "bg-outline-variant text-on-surface-variant"
                        }`}
                      >
                        {rule.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right">
                      <button
                        onClick={() => handleToggleActive(rule.id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                          rule.status === "ACTIVE"
                            ? "bg-error-container text-on-error-container hover:opacity-90"
                            : "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant hover:opacity-90"
                        }`}
                      >
                        {rule.status === "ACTIVE" ? "Khóa quy tắc" : "Kích hoạt"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy quy tắc phân chia nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="text-lg font-bold text-on-surface">
                Tạo Mới Quy Tắc Phân Chia Doanh Thu
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Chọn nhà vận hành (Operator)
                </label>
                <select
                  value={operatorCode}
                  onChange={(e) => setOperatorCode(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer font-data-mono"
                >
                  <option value="HURC">HURC - Công ty Đường sắt Đô thị Hà Nội</option>
                  <option value="TRANSERCO">TRANSERCO - Tổng công ty Vận tải Hà Nội</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Mô hình áp dụng
                  </label>
                  <select
                    value={shareModel}
                    onChange={(e) => setShareModel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="TRIP_BASED">TRIP_BASED (Lượt đi)</option>
                    <option value="KM_BASED">KM_BASED (Quãng đường)</option>
                    <option value="FIXED">FIXED (Cố định)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Tỷ lệ chia sẻ (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={sharePercentage}
                    onChange={(e) => setSharePercentage(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Ngày có hiệu lực
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Ngày hết hiệu lực
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant space-y-3">
                <h4 className="font-semibold text-xs text-on-surface flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-secondary" /> Cấu hình tham số mô hình bổ sung
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-outline mb-0.5">Tên tham số</label>
                    <input
                      type="text"
                      value={paramKey}
                      onChange={(e) => setParamKey(e.target.value)}
                      placeholder="tripWeight"
                      className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-on-surface text-xs font-data-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-outline mb-0.5">Giá trị tham số</label>
                    <input
                      type="text"
                      value={paramVal}
                      onChange={(e) => setParamVal(e.target.value)}
                      placeholder="1.0"
                      className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-on-surface text-xs font-data-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-on-surface-variant italic border-t border-outline-variant pt-2">
                * Lưu ý: Kích hoạt quy tắc mới sẽ tự động đưa các quy tắc đang có của nhà vận hành này về trạng thái ngưng hoạt động (INACTIVE).
              </div>

              <div className="flex gap-3 justify-end pt-2">
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
                  Áp dụng quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
