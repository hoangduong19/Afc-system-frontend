"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Plus,
  Edit2,
  Power,
  CheckCircle,
  XCircle,
  X,
  Coins,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface PassPrice {
  durationType: "DAILY" | "WEEKLY" | "MONTHLY";
  durationMonths: number;
  scope: "SINGLE_ROUTE" | "MULTI_ROUTE" | null;
  amount: number;
}

interface FareRule {
  id: string;
  code: string;
  mode: "METRO" | "BUS" | "ANY";
  baseFare: number;
  ratePerKm: number;
  minPrice: number;
  maxPrice: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: "ACTIVE" | "INACTIVE";
  passPrices: PassPrice[];
  version?: number;
}

export default function FareRulesPage() {
  const [rules, setRules] = useState<FareRule[]>([]);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  const toggleRuleExpand = (ruleId: string) => {
    setExpandedRules((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const [modeFilter, setModeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedRule, setSelectedRule] = useState<FareRule | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    ruleId: string;
    ruleCode: string;
    newStatus: "ACTIVE" | "INACTIVE";
    requireReason: boolean;
    reason: string;
  }>({
    isOpen: false,
    ruleId: "",
    ruleCode: "",
    newStatus: "ACTIVE",
    requireReason: false,
    reason: ""
  });

  // Form State
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"METRO" | "BUS" | "ANY">("METRO");
  const [baseFare, setBaseFare] = useState(8000);
  const [ratePerKm, setRatePerKm] = useState(600);
  const [minPrice, setMinPrice] = useState(8000);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [effectiveFrom, setEffectiveFrom] = useState("2026-01-01");
  const [effectiveTo, setEffectiveTo] = useState("2026-12-31");
  
  // Pass Prices Configuration lists by transit mode
  const [metroPassPrices, setMetroPassPrices] = useState<PassPrice[]>([
    { durationType: "DAILY", durationMonths: 1, scope: null, amount: 20000 }
  ]);
  const [busPassPrices, setBusPassPrices] = useState<PassPrice[]>([
    { durationType: "DAILY", durationMonths: 1, scope: "MULTI_ROUTE", amount: 20000 }
  ]);
  const [anyPassPrices, setAnyPassPrices] = useState<PassPrice[]>([
    { durationType: "DAILY", durationMonths: 1, scope: null, amount: 20000 }
  ]);

  const getActivePassPrices = () => {
    if (mode === "METRO") return metroPassPrices;
    if (mode === "BUS") return busPassPrices;
    return anyPassPrices;
  };

  const setActivePassPrices = (prices: PassPrice[]) => {
    if (mode === "METRO") setMetroPassPrices(prices);
    else if (mode === "BUS") setBusPassPrices(prices);
    else setAnyPassPrices(prices);
  };

  useEffect(() => {
    async function loadRules() {
      try {
        const data = await fetchApi("/api/fare-rules");
        if (Array.isArray(data)) {
          setRules(data.map((r) => ({
            id: r.id,
            code: r.code,
            mode: r.mode || "METRO",
            baseFare: r.baseFare || 0,
            ratePerKm: r.ratePerKm || 0,
            minPrice: r.minPrice || 0,
            maxPrice: r.maxPrice || 0,
            effectiveFrom: r.effectiveFrom || "",
            effectiveTo: r.effectiveTo || "",
            status: r.status || "ACTIVE",
            passPrices: r.passPrices || []
          })));
        }
      } catch (err: any) {
        console.warn("FMC Fare Rules API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadRules();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setCode("");
    setMode("METRO");
    setBaseFare(8000);
    setRatePerKm(600);
    setMinPrice(8000);
    setMaxPrice(15000);
    setEffectiveFrom("2026-01-01");
    setEffectiveTo("2026-12-31");
    setMetroPassPrices([
      { durationType: "DAILY", durationMonths: 1, scope: null, amount: 20000 }
    ]);
    setBusPassPrices([
      { durationType: "DAILY", durationMonths: 1, scope: "MULTI_ROUTE", amount: 20000 }
    ]);
    setAnyPassPrices([
      { durationType: "DAILY", durationMonths: 1, scope: null, amount: 20000 }
    ]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: FareRule) => {
    setSelectedRule(rule);
    setModalMode("EDIT");
    setCode(rule.code);
    setMode(rule.mode);
    setBaseFare(rule.baseFare);
    setRatePerKm(rule.ratePerKm);
    setMinPrice(rule.minPrice);
    setMaxPrice(rule.maxPrice);
    setEffectiveFrom(rule.effectiveFrom);
    setEffectiveTo(rule.effectiveTo);
    
    const loadedPrices: PassPrice[] = rule.passPrices && rule.passPrices.length > 0 ? rule.passPrices.map(p => ({
      durationType: p.durationType as any,
      durationMonths: p.durationMonths || 1,
      scope: rule.mode === "BUS" ? (p.scope || "MULTI_ROUTE") : null,
      amount: p.amount
    })) : [
      { durationType: "DAILY", durationMonths: 1, scope: rule.mode === "BUS" ? "MULTI_ROUTE" : null, amount: 20000 }
    ];

    if (rule.mode === "METRO") {
      setMetroPassPrices(loadedPrices);
      setBusPassPrices([
        { durationType: "DAILY", durationMonths: 1, scope: "MULTI_ROUTE", amount: 20000 }
      ]);
      setAnyPassPrices([
        { durationType: "DAILY", durationMonths: 1, scope: null, amount: 20000 }
      ]);
    } else if (rule.mode === "BUS") {
      setBusPassPrices(loadedPrices);
      setMetroPassPrices([
        { durationType: "DAILY", durationMonths: 1, scope: null, amount: 20000 }
      ]);
      setAnyPassPrices([
        { durationType: "DAILY", durationMonths: 1, scope: null, amount: 20000 }
      ]);
    } else {
      setAnyPassPrices(loadedPrices);
      setMetroPassPrices([
        { durationType: "DAILY", durationMonths: 1, scope: null, amount: 20000 }
      ]);
      setBusPassPrices([
        { durationType: "DAILY", durationMonths: 1, scope: "MULTI_ROUTE", amount: 20000 }
      ]);
    }
    
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleAddPassPrice = () => {
    const current = getActivePassPrices();
    setActivePassPrices([
      ...current,
      { durationType: "DAILY", durationMonths: 1, scope: mode === "BUS" ? "MULTI_ROUTE" : null, amount: 20000 }
    ]);
  };

  const handleRemovePassPrice = (index: number) => {
    const current = getActivePassPrices();
    if (current.length <= 1) {
      alert("Yêu cầu cần có ít nhất 1 mức giá vé định kỳ!");
      return;
    }
    setActivePassPrices(current.filter((_, idx) => idx !== index));
  };

  const handleUpdatePassPrice = (index: number, field: keyof PassPrice, value: any) => {
    const current = getActivePassPrices();
    setActivePassPrices(
      current.map((p, idx) => {
        if (idx === index) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleToggleStatus = (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    setConfirmError(null);
    setConfirmModal({
      isOpen: true,
      ruleId: id,
      ruleCode: rule.code,
      newStatus: "INACTIVE",
      requireReason: true,
      reason: ""
    });
  };

  const handleConfirmToggle = async () => {
    const { ruleId, ruleCode, newStatus, reason, requireReason } = confirmModal;

    if (requireReason && !reason.trim()) {
      setConfirmError("Lý do thực hiện hành động là bắt buộc và không được để trống.");
      return;
    }

    setConfirmError(null);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const originalList = [...rules];
    setRules(
      rules.map((r) =>
        r.id === ruleId ? { ...r, status: "INACTIVE" } : r
      )
    );
    try {
      await fetchApi("/api/fare-rules/" + ruleId + "/disable", {
        method: "PATCH",
        body: JSON.stringify({ reason: reason.trim() })
      });
    } catch (err: any) {
      console.warn("Toggle status API failed, using mock local state. Error:", err.message);
      setRules(originalList);
      setIsOffline(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = getActivePassPrices();
    const formattedPassPrices = current.map(p => ({
      durationType: p.durationType,
      durationMonths: p.durationType === "MONTHLY" ? p.durationMonths : null,
      scope: mode === "BUS" ? (p.scope || "MULTI_ROUTE") : null,
      amount: p.amount
    }));

    if (mode === "BUS") {
      const hasMulti = formattedPassPrices.some(p => p.scope === "MULTI_ROUTE");
      if (!hasMulti) {
        alert("Phương thức Xe buýt (BUS) yêu cầu ít nhất một mức giá vé định kỳ có phạm vi Liên tuyến (MULTI_ROUTE)!");
        return;
      }
    }

    if (modalMode === "CREATE") {
      try {
        const newRule = await fetchApi("/api/fare-rules", {
          method: "POST",
          body: JSON.stringify({
            code,
            mode,
            baseFare,
            ratePerKm,
            minPrice,
            maxPrice,
            effectiveFrom,
            effectiveTo,
            passPrices: formattedPassPrices
          })
        });
        setRules([...rules, {
          id: newRule.id,
          code: newRule.code,
          mode: newRule.mode || mode,
          baseFare: newRule.baseFare || baseFare,
          ratePerKm: newRule.ratePerKm || ratePerKm,
          minPrice: newRule.minPrice || minPrice,
          maxPrice: newRule.maxPrice || maxPrice,
          effectiveFrom: newRule.effectiveFrom || effectiveFrom,
          effectiveTo: newRule.effectiveTo || effectiveTo,
          status: newRule.status || "ACTIVE",
          passPrices: newRule.passPrices || current
        }]);
        setIsModalOpen(false);
      } catch (err: any) {
        console.warn("POST /api/fare-rules failed. Error:", err.message);
        setModalError(`Lỗi thêm quy tắc: ${err.message || "Không thể thực hiện."}`);
      }
    } else if (modalMode === "EDIT" && selectedRule) {
      try {
        const updatedRule = await fetchApi("/api/fare-rules/" + selectedRule.id, {
          method: "PUT",
          body: JSON.stringify({
            baseFare,
            ratePerKm,
            minPrice,
            maxPrice,
            effectiveFrom,
            effectiveTo,
            passPrices: formattedPassPrices
          })
        });
        setRules(
          rules.map((r) =>
            r.id === selectedRule.id
              ? {
                  ...r,
                  code,
                  mode,
                  baseFare: updatedRule.baseFare !== undefined ? updatedRule.baseFare : baseFare,
                  ratePerKm: updatedRule.ratePerKm !== undefined ? updatedRule.ratePerKm : ratePerKm,
                  minPrice: updatedRule.minPrice !== undefined ? updatedRule.minPrice : minPrice,
                  maxPrice: updatedRule.maxPrice !== undefined ? updatedRule.maxPrice : maxPrice,
                  effectiveFrom: updatedRule.effectiveFrom || effectiveFrom,
                  effectiveTo: updatedRule.effectiveTo || effectiveTo,
                  passPrices: updatedRule.passPrices || current
                }
              : r
          )
        );
        setIsModalOpen(false);
      } catch (err: any) {
        console.warn("PUT /api/fare-rules failed. Error:", err.message);
        setModalError(`Lỗi cập nhật quy tắc: ${err.message || "Không thể thực hiện."}`);
      }
    }
  };

  // Helper to compute versions for each rule code group
  const getRulesWithVersionsAndSorted = () => {
    const groups: Record<string, FareRule[]> = {};
    rules.forEach(r => {
      if (!groups[r.code]) {
        groups[r.code] = [];
      }
      groups[r.code].push(r);
    });

    const ruleIdToVersion: Record<string, number> = {};
    Object.keys(groups).forEach(code => {
      groups[code].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
      groups[code].forEach((r, idx) => {
        ruleIdToVersion[r.id] = idx + 1;
      });
    });

    const filtered = rules.filter((r) => {
      const matchesMode = modeFilter === "ALL" || r.mode === modeFilter;
      return matchesMode;
    });

    const withVersions = filtered.map(r => ({
      ...r,
      version: ruleIdToVersion[r.id] || 1
    }));

    withVersions.sort((a, b) => {
      if (a.status === b.status) {
        if (a.code !== b.code) {
          return a.code.localeCompare(b.code);
        }
        return b.version - a.version;
      }
      return a.status === "ACTIVE" ? -1 : 1;
    });

    return withVersions;
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-secondary" /> Quản lý Quy tắc giá vé
          </h2>
          <p className="text-sm text-on-surface-variant">
            Cấu hình công thức tính tiền vé (giá mở cửa, phí mỗi km tiếp theo, mức giá trần và giá sàn).
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm quy tắc mới
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng quy tắc cấu hình
          </h3>
          <div className="text-3xl font-bold text-on-surface font-data-mono">{rules.length}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Đang áp dụng (Active)
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim font-data-mono">
            {rules.filter((r) => r.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Đường sắt (Metro)
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim font-data-mono">
            {rules.filter((r) => r.mode === "METRO" && r.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Xe buýt (Bus)
          </h3>
          <div className="text-3xl font-bold text-on-surface font-data-mono">
            {rules.filter((r) => r.mode === "BUS" && r.status === "ACTIVE").length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-52"
          >
            <option value="ALL">Tất cả phương thức</option>
            <option value="METRO">Đường sắt</option>
            <option value="BUS">Xe buýt</option>
            <option value="ANY">Đa phương thức</option>
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
                  Mã quy tắc
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Loại hình
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Vé sàn
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Đơn giá/Km
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Giá sàn - Trần
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Hiệu lực từ - đến
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Vé định kỳ
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
              {getRulesWithVersionsAndSorted().length > 0 ? (
                getRulesWithVersionsAndSorted().map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{rule.code}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-container text-on-secondary-container font-semibold font-sans">
                          v{rule.version}
                        </span>
                      </div>
                    </td>
                    <td className="p-table-cell-padding whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-label-caps text-[10px] font-bold ${
                          rule.mode === "METRO"
                            ? "bg-secondary-container text-on-secondary-container"
                            : rule.mode === "BUS"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : "bg-surface-variant text-on-surface-variant"
                        }`}
                      >
                        {rule.mode}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-semibold whitespace-nowrap">
                      ₫ {rule.baseFare.toLocaleString()}
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-semibold text-secondary-fixed-dim whitespace-nowrap">
                      {rule.ratePerKm > 0 ? `₫ ${rule.ratePerKm.toLocaleString()}` : "-"}
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface-variant whitespace-nowrap">
                      ₫ {rule.minPrice.toLocaleString()} - ₫ {rule.maxPrice.toLocaleString()}
                    </td>
                    <td className="p-table-cell-padding font-data-mono text-on-surface-variant text-xs whitespace-nowrap">
                      {rule.effectiveFrom} / {rule.effectiveTo}
                    </td>
                    <td className="p-table-cell-padding text-xs text-on-surface-variant min-w-[320px] max-w-[450px]">
                      <div className="flex flex-wrap gap-1 items-center">
                        {rule.passPrices && rule.passPrices.length > 0 ? (
                          <>
                            {(expandedRules[rule.id]
                              ? rule.passPrices
                              : rule.passPrices.slice(0, 2)
                            ).map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className="inline-flex items-center text-[10px] font-data-mono bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant/30"
                              >
                                {p.durationType === "DAILY"
                                  ? "Vé ngày"
                                  : p.durationType === "WEEKLY"
                                  ? "Vé tuần"
                                  : "Vé tháng"}
                                {p.durationType === "MONTHLY"
                                  ? ` (${p.durationMonths || 1}t)`
                                  : ""}
                                : ₫{(p.amount || 0).toLocaleString()}
                                {p.scope
                                  ? ` (${
                                      p.scope === "SINGLE_ROUTE"
                                        ? "Đơn"
                                        : "Liên"
                                    })`
                                  : ""}
                              </span>
                            ))}
                            {rule.passPrices.length > 2 && (
                              <button
                                onClick={() => toggleRuleExpand(rule.id)}
                                className="text-[10px] font-semibold text-secondary hover:text-secondary-fixed-dim hover:underline transition-colors focus:outline-none cursor-pointer inline-flex items-center px-1"
                              >
                                {expandedRules[rule.id]
                                  ? "Thu gọn"
                                  : `+ ${rule.passPrices.length - 2} mức giá`}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-outline italic text-[11px]">Không có</span>
                        )}
                      </div>
                    </td>
                    <td className="p-table-cell-padding whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[11px] font-medium inline-flex items-center gap-1 ${
                          rule.status === "ACTIVE"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {rule.status === "ACTIVE" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Hoạt động
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Tạm dừng
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {rule.status === "ACTIVE" && (
                          <button
                            onClick={() => handleToggleStatus(rule.id)}
                            className="p-1 hover:bg-surface-container-high rounded transition-colors cursor-pointer text-error hover:bg-error-container/20"
                            title="Vô hiệu hóa"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy quy tắc giá vé nào khớp điều kiện tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg p-6 z-10 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-lg font-bold text-on-surface">
                {modalMode === "CREATE" ? "Tạo Quy Tắc Giá Vé Mới" : "Chỉnh Sửa Quy Tắc Giá Vé"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalError && (
                <div className="px-4 py-2.5 bg-error-container text-on-error-container text-xs rounded-lg flex items-center justify-between border border-error/20">
                  <span className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4 text-error font-semibold" /> {modalError}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalError(null)}
                    className="p-1 hover:bg-error-container/20 rounded cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5 text-on-error-container" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Mã quy tắc
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: FR-METRO-02"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                    disabled={modalMode === "EDIT"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Phương thức vận tải
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="METRO">Đường sắt</option>
                    <option value="BUS">Xe buýt</option>
                    <option value="ANY">Đa phương thức</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Vé cơ bản / mở cửa (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={baseFare}
                    onChange={(e) => setBaseFare(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Đơn giá mỗi Km tiếp theo (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={ratePerKm}
                    onChange={(e) => setRatePerKm(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Giá sàn tối thiểu (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={minPrice}
                    onChange={(e) => setMinPrice(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Giá trần tối đa (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Có hiệu lực từ ngày
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
                    Hết hiệu lực vào ngày
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

              {/* Dynamic passPrices builder */}
              <div className="border-t border-outline-variant pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-on-surface-variant">
                    Cấu hình giá vé định kỳ *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPassPrice}
                    className="text-xs text-secondary hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    + Thêm giá vé định kỳ
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {getActivePassPrices().map((p, idx) => (
                    <div key={`${mode}-${idx}`} className="flex gap-2 items-end bg-surface-container-low p-2 rounded border border-outline-variant relative">
                      <div className={mode === "BUS" ? "w-[30%]" : (p.durationType === "MONTHLY" ? "w-[40%]" : "w-[45%]")}>
                        <label className="block text-[9px] text-outline mb-0.5">Kỳ hạn</label>
                        <select
                          value={p.durationType}
                          onChange={(e) => handleUpdatePassPrice(idx, "durationType", e.target.value as any)}
                          className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs text-on-surface outline-none"
                        >
                          <option value="DAILY">Theo ngày</option>
                          <option value="WEEKLY">Theo tuần</option>
                          <option value="MONTHLY">Theo tháng</option>
                        </select>
                      </div>

                      {p.durationType === "MONTHLY" && (
                        <div className={mode === "BUS" ? "w-[15%]" : "w-[20%]"}>
                          <label className="block text-[9px] text-outline mb-0.5">Tháng</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={p.durationMonths}
                            onChange={(e) => handleUpdatePassPrice(idx, "durationMonths", parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs text-on-surface outline-none font-data-mono"
                          />
                        </div>
                      )}

                      {mode === "BUS" && (
                        <div className={p.durationType === "MONTHLY" ? "w-[25%]" : "w-[40%]"}>
                          <label className="block text-[9px] text-outline mb-0.5">Phạm vi</label>
                          <select
                            value={p.scope || "MULTI_ROUTE"}
                            onChange={(e) => handleUpdatePassPrice(idx, "scope", e.target.value as any)}
                            className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs text-on-surface outline-none"
                          >
                            <option value="SINGLE_ROUTE">Một tuyến</option>
                            <option value="MULTI_ROUTE">Liên tuyến</option>
                          </select>
                        </div>
                      )}

                      <div className={mode === "BUS" ? "w-[25%]" : (p.durationType === "MONTHLY" ? "w-[30%]" : "w-[45%]")}>
                        <label className="block text-[9px] text-outline mb-0.5">Mệnh giá (₫)</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={p.amount}
                          onChange={(e) => handleUpdatePassPrice(idx, "amount", parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs text-on-surface outline-none font-data-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePassPrice(idx)}
                        className="p-1.5 hover:bg-error-container/20 text-error rounded cursor-pointer"
                        title="Xóa"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
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
                  {modalMode === "CREATE" ? "Tạo quy tắc" : "Lưu thay đổi"}
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
                <h3 className="text-lg font-bold text-on-surface">Xác nhận vô hiệu hóa quy tắc</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Bạn có chắc chắn muốn chuyển trạng thái quy tắc giá vé <strong>{confirmModal.ruleCode}</strong> sang{" "}
                  <strong>TẠM DỪNG</strong> không? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {confirmModal.requireReason && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Nhập lý do thực hiện (Bắt buộc)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Vui lòng điền lý do..."
                    value={confirmModal.reason}
                    onChange={(e) => setConfirmModal(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
                  />
                </div>
              )}

              {confirmError && (
                <div className="px-3 py-2 bg-error-container text-on-error-container text-xs rounded-lg flex items-center gap-2 border border-error/20">
                  <AlertTriangle className="h-4 w-4 text-error shrink-0" />
                  <span>{confirmError}</span>
                </div>
              )}

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
        </div>
      )}
    </div>
  );
}
