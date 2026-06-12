"use client";

import React, { useState, useEffect } from "react";
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
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

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
  const [rules, setRules] = useState<RevenueShareRule[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [modelFilter, setModelFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [operatorsList, setOperatorsList] = useState<any[]>([]);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    ruleId: string;
    operatorCode: string;
    newStatus: "ACTIVE" | "INACTIVE";
  }>({
    isOpen: false,
    ruleId: "",
    operatorCode: "",
    newStatus: "ACTIVE"
  });
  
  // Form States for new sharing rule
  const [operatorCode, setOperatorCode] = useState("HURC");
  const [shareModel, setShareModel] = useState<"KM_BASED" | "TRIP_BASED" | "FIXED">("TRIP_BASED");
  const [sharePercentage, setSharePercentage] = useState(60);
  const [effectiveFrom, setEffectiveFrom] = useState("2026-06-01");
  const [effectiveTo, setEffectiveTo] = useState("2026-12-31");
  const [paramKey, setParamKey] = useState("tripWeight");
  const [paramVal, setParamVal] = useState("1.0");

  useEffect(() => {
    async function loadData() {
      try {
        const [rulesData, operatorsData] = await Promise.all([
          fetchApi("/api/revenue-share-rules"),
          fetchApi("/api/operators")
        ]);

        let ops = [];
        if (Array.isArray(operatorsData)) {
          ops = operatorsData;
          setOperatorsList(operatorsData);
        }

        const rulesList = rulesData.content || rulesData || [];
        if (Array.isArray(rulesList)) {
          setRules(rulesList.map((r) => {
            const matchedOp = ops.find(o => o.id === r.operatorId);
            return {
              id: r.id,
              operatorId: r.operatorId,
              operatorCode: matchedOp ? matchedOp.code : "N/A",
              shareModel: r.shareModel,
              sharePercentage: r.sharePercentage || 0,
              effectiveFrom: r.effectiveFrom || "",
              effectiveTo: r.effectiveTo || "",
              status: r.status || "ACTIVE",
              version: r.version || 1,
              createdAt: r.createdAt ? new Date(r.createdAt).toISOString().replace("T", " ").substring(0, 16) : "",
              params: r.params || {}
            };
          }));
        }
      } catch (err: any) {
        console.warn("FMC Revenue Share rules API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadData();
  }, []);

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

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();

    let resolvedOperatorId = operatorCode === "HURC" ? "op-1" : "op-2";
    if (operatorsList.length > 0) {
      const match = operatorsList.find(o => o.code === operatorCode);
      if (match) {
        resolvedOperatorId = match.id;
      }
    }
    
    // Deactivate previous active rules for the same operator in UI
    const updatedRules = rules.map(rule => {
      if (rule.operatorCode === operatorCode && rule.status === "ACTIVE") {
        return { ...rule, status: "INACTIVE" as const };
      }
      return rule;
    });

    const nextVersion = rules.filter(r => r.operatorCode === operatorCode).length + 1;
    const ruleParams = { [paramKey]: parseFloat(paramVal) || paramVal };

    try {
      const newRuleFromApi = await fetchApi("/api/revenue-share-rules", {
        method: "POST",
        body: JSON.stringify({
          operatorId: resolvedOperatorId,
          shareModel,
          sharePercentage,
          effectiveFrom,
          effectiveTo,
          params: ruleParams
        })
      });

      const newRule: RevenueShareRule = {
        id: newRuleFromApi.id,
        operatorId: newRuleFromApi.operatorId,
        operatorCode,
        shareModel: newRuleFromApi.shareModel,
        sharePercentage: newRuleFromApi.sharePercentage,
        effectiveFrom: newRuleFromApi.effectiveFrom,
        effectiveTo: newRuleFromApi.effectiveTo,
        status: (newRuleFromApi.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
        version: newRuleFromApi.version || nextVersion,
        createdAt: newRuleFromApi.createdAt ? new Date(newRuleFromApi.createdAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16),
        params: newRuleFromApi.params || ruleParams
      };
      setRules([newRule, ...updatedRules]);
    } catch (err: any) {
      console.warn("POST revenue share rule API failed, using mock local creation. Error:", err.message);
      setIsOffline(true);

      const newRule: RevenueShareRule = {
        id: 'rule-' + Math.floor(300 + Math.random() * 700),
        operatorId: resolvedOperatorId,
        operatorCode,
        shareModel,
        sharePercentage,
        effectiveFrom,
        effectiveTo,
        status: "ACTIVE",
        version: nextVersion,
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        params: ruleParams
      };

      setRules([newRule, ...updatedRules]);
    }
    
    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    const ruleToToggle = rules.find((r) => r.id === id);
    if (!ruleToToggle) return;

    const isCurrentlyActive = ruleToToggle.status === "ACTIVE";
    const nextStatus: "ACTIVE" | "INACTIVE" = isCurrentlyActive ? "INACTIVE" : "ACTIVE";

    setConfirmModal({
      isOpen: true,
      ruleId: id,
      operatorCode: ruleToToggle.operatorCode,
      newStatus: nextStatus
    });
  };

  const handleConfirmToggle = async () => {
    const { ruleId, operatorCode, newStatus } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const ruleToToggle = rules.find((r) => r.id === ruleId);
    if (!ruleToToggle) return;

    const isCurrentlyActive = ruleToToggle.status === "ACTIVE";

    const updater = (prevRules: RevenueShareRule[]) => {
      let temp = prevRules.map((rule) => {
        if (rule.id === ruleId) {
          return { ...rule, status: newStatus };
        }
        return rule;
      });

      if (newStatus === "ACTIVE") {
        temp = temp.map((r) =>
          r.id !== ruleId && r.operatorCode === ruleToToggle.operatorCode && r.status === "ACTIVE"
            ? { ...r, status: "INACTIVE" as const }
            : r
        );
      }
      return temp;
    };

    const originalList = [...rules];
    setRules(updater);

    try {
      if (isCurrentlyActive) {
        await fetchApi(`/api/revenue-share-rules/${ruleId}`, { method: "DELETE" });
      } else {
        console.warn("No explicit activate endpoint, toggling locally");
      }
    } catch (err: any) {
      console.warn("Toggle rule active status failed, using mock local state. Error:", err.message);
      setRules(originalList);
      setIsOffline(true);
    }
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

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-warning/10 rounded-full text-warning mt-0.5">
                <AlertTriangle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Xác nhận thay đổi trạng thái</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {confirmModal.newStatus === "ACTIVE" ? (
                    <span>
                      Bạn có chắc chắn muốn <strong>kích hoạt</strong> quy tắc chia sẻ doanh thu này của nhà vận hành{" "}
                      <strong>{confirmModal.operatorCode}</strong> không? Các quy tắc đang hoạt động khác của nhà vận hành này sẽ tự động bị tạm dừng.
                    </span>
                  ) : (
                    <span>
                      Bạn có chắc chắn muốn <strong>tạm dừng</strong> quy tắc chia sẻ doanh thu này của nhà vận hành{" "}
                      <strong>{confirmModal.operatorCode}</strong> không?
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
