"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Power,
  CheckCircle,
  XCircle,
  X,
  Percent,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface FareDiscount {
  id: string;
  passengerType: "STUDENT" | "SENIOR" | "PRIORITY";
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: "ACTIVE" | "INACTIVE";
  version: number;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<FareDiscount[]>([]);

  const [passengerFilter, setPassengerFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedDiscount, setSelectedDiscount] = useState<FareDiscount | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    discountId: string;
    passengerType: string;
    newStatus: "ACTIVE" | "INACTIVE";
  }>({
    isOpen: false,
    discountId: "",
    passengerType: "",
    newStatus: "ACTIVE"
  });

  // Form State
  const [passengerType, setPassengerType] = useState<"STUDENT" | "SENIOR" | "PRIORITY">("STUDENT");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState(50);
  const [effectiveFrom, setEffectiveFrom] = useState("2026-01-01");
  const [effectiveTo, setEffectiveTo] = useState("");

  useEffect(() => {
    async function loadDiscounts() {
      try {
        const data = await fetchApi("/api/fare-discounts");
        if (Array.isArray(data)) {
          setDiscounts(data.map((d: any) => ({
            id: d.id,
            passengerType: d.passengerType || "STUDENT",
            discountType: d.discountType || "PERCENT",
            discountValue: d.discountValue || 0,
            effectiveFrom: d.effectiveFrom || "",
            effectiveTo: d.effectiveTo || "",
            status: d.status || "ACTIVE",
            version: d.version || 1
          })));
        }
      } catch (err: any) {
        console.warn("FMC Discounts API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadDiscounts();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setPassengerType("STUDENT");
    setDiscountType("PERCENT");
    setDiscountValue(50);
    setEffectiveFrom("2026-01-01");
    setEffectiveTo("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ds: FareDiscount) => {
    setSelectedDiscount(ds);
    setModalMode("EDIT");
    setPassengerType(ds.passengerType);
    setDiscountType(ds.discountType);
    setDiscountValue(ds.discountValue);
    setEffectiveFrom(ds.effectiveFrom);
    setEffectiveTo(ds.effectiveTo || "");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    const ds = discounts.find((d) => d.id === id);
    if (!ds) return;
    setConfirmModal({
      isOpen: true,
      discountId: id,
      passengerType: ds.passengerType,
      newStatus: "INACTIVE"
    });
  };

  const handleConfirmToggle = async () => {
    const { discountId, passengerType, newStatus } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const originalList = [...discounts];
    setDiscounts(
      discounts.map((d) =>
        d.id === discountId ? { ...d, status: "INACTIVE" } : d
      )
    );

    try {
      await fetchApi("/api/fare-discounts/" + discountId + "/disable", { method: "PATCH" });
    } catch (err: any) {
      console.warn("Toggle status API failed, using mock local state. Error:", err.message);
      setDiscounts(originalList);
      setIsOffline(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "CREATE") {
      try {
        const newDs = await fetchApi("/api/fare-discounts", {
          method: "POST",
          body: JSON.stringify({
            passengerType,
            discountType,
            discountValue,
            effectiveFrom,
            effectiveTo: effectiveTo || null
          })
        });
        setDiscounts([...discounts, {
          id: newDs.id,
          passengerType: newDs.passengerType || passengerType,
          discountType: newDs.discountType || discountType,
          discountValue: newDs.discountValue || discountValue,
          effectiveFrom: newDs.effectiveFrom || effectiveFrom,
          effectiveTo: newDs.effectiveTo || "",
          status: newDs.status || "ACTIVE",
          version: newDs.version || 1
        }]);
        setIsModalOpen(false);
      } catch (err: any) {
        console.warn("POST /api/fare-discounts failed. Error:", err.message);
        setModalError(`Lỗi thêm đối tượng ưu đãi: ${err.message || "Không thể thực hiện."}`);
      }
    } else if (modalMode === "EDIT" && selectedDiscount) {
      try {
        const updatedDs = await fetchApi("/api/fare-discounts/" + selectedDiscount.id, {
          method: "PUT",
          body: JSON.stringify({
            discountType,
            discountValue,
            effectiveFrom,
            effectiveTo: effectiveTo || null
          })
        });
        setDiscounts(
          discounts.map((ds) =>
            ds.id === selectedDiscount.id
              ? {
                  ...ds,
                  passengerType,
                  discountType: updatedDs.discountType || discountType,
                  discountValue: updatedDs.discountValue !== undefined ? updatedDs.discountValue : discountValue,
                  effectiveFrom: updatedDs.effectiveFrom || effectiveFrom,
                  effectiveTo: updatedDs.effectiveTo || "",
                  version: updatedDs.version || ds.version
                }
              : ds
          )
        );
        setIsModalOpen(false);
      } catch (err: any) {
        console.warn("PUT /api/fare-discounts failed. Error:", err.message);
        setModalError(`Lỗi cập nhật đối tượng ưu đãi: ${err.message || "Không thể thực hiện."}`);
      }
    }
  };

  // Helper to compute versions for each passengerType group
  const getDiscountsWithVersionsAndSorted = () => {
    const filtered = discounts.filter((ds) => {
      return passengerFilter === "ALL" || ds.passengerType === passengerFilter;
    });

    filtered.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "ACTIVE" ? -1 : 1;
      }
      if (a.passengerType !== b.passengerType) {
        return a.passengerType.localeCompare(b.passengerType);
      }
      return b.version - a.version;
    });

    return filtered;
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
            <Tag className="h-6 w-6 text-secondary" /> Quản lý Chính sách giảm giá
          </h2>
          <p className="text-sm text-on-surface-variant">
            Cấu hình tỷ lệ miễn giảm giá vé đối với các nhóm đối tượng đặc biệt (Học sinh/Sinh viên, Người lớn tuổi, Người có công).
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm miễn giảm mới
        </button>
      </div>



      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div className="text-sm text-on-surface-variant font-medium">Bộ lọc hiển thị:</div>
        <div className="flex gap-2">
          <select
            value={passengerFilter}
            onChange={(e) => setPassengerFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-52 animate-pulse-once"
          >
            <option value="ALL">Tất cả nhóm hành khách</option>
            <option value="STUDENT">Học sinh / Sinh viên</option>
            <option value="PRIORITY">Đối tượng ưu tiên</option>
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
                  Nhóm hành khách
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Cách thức giảm giá
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Mức giảm giá
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Hiệu lực từ - đến
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
              {getDiscountsWithVersionsAndSorted().length > 0 ? (
                getDiscountsWithVersionsAndSorted().map((ds) => (
                  <tr
                    key={ds.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>
                          {ds.passengerType === "STUDENT"
                            ? "Học sinh / Sinh viên"
                            : ds.passengerType === "SENIOR"
                            ? "Người cao tuổi"
                            : "Đối tượng ưu tiên"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-container text-on-secondary-container font-semibold font-sans">
                          v{ds.version}
                        </span>
                      </div>
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-medium whitespace-nowrap">
                      {ds.discountType === "PERCENT" ? "Giảm theo phần trăm (%)" : "Giảm trừ tiền mặt cố định (đ)"}
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-bold text-tertiary-fixed-dim whitespace-nowrap">
                      {ds.discountType === "PERCENT" ? `${ds.discountValue}%` : `₫ ${ds.discountValue.toLocaleString()}`}
                    </td>
                    <td className="p-table-cell-padding font-data-mono text-on-surface-variant whitespace-nowrap">
                      {ds.effectiveFrom} / {ds.effectiveTo || "Vô thời hạn"}
                    </td>
                    <td className="p-table-cell-padding whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[11px] font-medium inline-flex items-center gap-1 ${
                          ds.status === "ACTIVE"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {ds.status === "ACTIVE" ? (
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
                          onClick={() => handleOpenEditModal(ds)}
                          className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {ds.status === "ACTIVE" && (
                          <button
                            onClick={() => handleToggleStatus(ds.id)}
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
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy chính sách miễn giảm nào khớp điều kiện lọc.
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
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-lg font-bold text-on-surface">
                {modalMode === "CREATE" ? "Tạo Miễn Giảm Mới" : "Chỉnh Sửa Miễn Giảm"}
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
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Nhóm đối tượng khách hàng
                </label>
                <select
                  value={passengerType}
                  onChange={(e) => setPassengerType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  disabled={modalMode === "EDIT"}
                >
                  <option value="STUDENT">Học sinh / Sinh viên</option>
                  <option value="PRIORITY">Đối tượng ưu tiên miễn giảm</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Hình thức giảm giá
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Tiền mặt cố định (₫)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Mức giảm giá ({discountType === "PERCENT" ? "%" : "₫"})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === "PERCENT" ? 100 : undefined}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseInt(e.target.value))}
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
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
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
                  {modalMode === "CREATE" ? "Tạo chính sách" : "Lưu thay đổi"}
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
                <h3 className="text-lg font-bold text-on-surface">Xác nhận vô hiệu hóa chính sách</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Bạn có chắc chắn muốn chuyển trạng thái chính sách giảm giá cho đối tượng <strong>
                    {confirmModal.passengerType === "STUDENT"
                      ? "Học sinh / Sinh viên"
                      : confirmModal.passengerType === "SENIOR"
                      ? "Người cao tuổi"
                      : "Đối tượng ưu tiên"}
                  </strong> sang{" "}
                  <strong>TẠM DỪNG (INACTIVE)</strong> không? Hành động này không thể hoàn tác.
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
