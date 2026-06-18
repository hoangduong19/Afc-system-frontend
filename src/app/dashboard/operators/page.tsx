"use client";
import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Power,
  CheckCircle,
  XCircle,
  X,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Operator {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  routesCount: number;
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    operatorId: string;
    operatorName: string;
    newStatus: "ACTIVE" | "INACTIVE";
  }>({
    isOpen: false,
    operatorId: "",
    operatorName: "",
    newStatus: "ACTIVE"
  });

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [mode, setMode] = useState<"METRO" | "BUS">("METRO");

  useEffect(() => {
    async function loadOperators() {
      try {
        const data = await fetchApi("/api/operators");
        if (Array.isArray(data)) {
          setOperators(data.map((o: any) => ({
            id: o.id,
            code: o.code,
            name: o.name,
            status: o.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            createdAt: o.createdAt ? new Date(o.createdAt).toISOString().replace("T", " ").substring(0, 16) : "",
            routesCount: o.routesCount || 0
          })));
        }
      } catch (err: any) {
        console.warn("FMC Operators API is offline.", err.message);
        setIsOffline(true);
      }
    }
    loadOperators();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setCode("");
    setName("");
    setStatus("ACTIVE");
    setMode("METRO");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (op: Operator) => {
    setSelectedOperator(op);
    setModalMode("EDIT");
    setCode(op.code);
    setName(op.name);
    setStatus(op.status);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    const operatorToToggle = operators.find(o => o.id === id);
    if (!operatorToToggle) return;

    const newStatus = operatorToToggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setConfirmModal({
      isOpen: true,
      operatorId: id,
      operatorName: operatorToToggle.name,
      newStatus: newStatus
    });
  };

  const handleConfirmToggle = async () => {
    const { operatorId, operatorName, newStatus } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const originalList = [...operators];
    setOperators(
      operators.map((op) =>
        op.id === operatorId ? { ...op, status: newStatus } : op
      )
    );
    setPageError(null);

    try {
      if (newStatus === "INACTIVE") {
        await fetchApi(`/api/operators/${operatorId}/deactivate`, { method: "PATCH" });
      } else if (newStatus === "ACTIVE") {
        await fetchApi(`/api/operators/${operatorId}/activate`, { method: "PATCH" });
      }
    } catch (err: any) {
      console.warn("Backend toggle operator status failed. Error:", err.message);
      setOperators(originalList);
      setIsOffline(true);
      setPageError(`Lỗi hệ thống: ${err.message || "Không thể thay đổi trạng thái nhà vận hành " + operatorName}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (modalMode === "CREATE") {
      try {
        const newOp = await fetchApi("/api/operators", {
          method: "POST",
          body: JSON.stringify({ code, name, mode })
        });
        setOperators([...operators, {
          id: newOp.id,
          code: newOp.code,
          name: newOp.name,
          status: newOp.status || "ACTIVE",
          createdAt: newOp.createdAt ? new Date(newOp.createdAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16),
          routesCount: 0
        }]);
        setIsModalOpen(false);
      } catch (err: any) {
        console.warn("POST /api/operators failed. Error:", err.message);
        setIsOffline(true);
        setModalError(`Lỗi hệ thống: ${err.message || "Không thể tạo nhà vận hành."}`);
      }
    } else if (modalMode === "EDIT" && selectedOperator) {
      try {
        const updatedOp = await fetchApi(`/api/operators/${selectedOperator.id}`, {
          method: "PUT",
          body: JSON.stringify({ name })
        });
        setOperators(
          operators.map((op) =>
            op.id === selectedOperator.id ? { ...op, name: updatedOp.name || name } : op
          )
        );
        setIsModalOpen(false);
      } catch (err: any) {
        console.warn("PUT /api/operators failed. Error:", err.message);
        setIsOffline(true);
        setModalError(`Lỗi hệ thống: ${err.message || "Không thể cập nhật nhà vận hành."}`);
      }
    }
  };

  const filteredOperators = operators.filter((op) => {
    const matchesStatus = statusFilter === "ALL" || op.status === statusFilter;
    return matchesStatus;
  });

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="px-4 py-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center justify-between border border-error/20">
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-error" /> Lỗi kết nối tới Backend API. Một số dữ liệu thống kê sẽ hiển thị mặc định bằng 0.
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Building2 className="h-6 w-6 text-secondary" /> Quản lý Nhà vận hành
          </h2>
          <p className="text-sm text-on-surface-variant">
            Danh sách các đơn vị khai thác vận tải công cộng tham gia hệ thống vé liên thông FMC.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm nhà vận hành
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng số nhà vận hành
          </h3>
          <div className="text-3xl font-bold text-on-surface">{operators.length}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Đang hoạt động
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim">
            {operators.filter((op) => op.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tạm dừng hoạt động
          </h3>
          <div className="text-3xl font-bold text-error">
            {operators.filter((op) => op.status === "INACTIVE").length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-40"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Tạm khóa</option>
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
                  Mã nhà vận hành
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Tên đầy đủ
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Ngày tạo
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
              {filteredOperators.length > 0 ? (
                filteredOperators.map((op) => (
                  <tr
                    key={op.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono">
                      {op.code}
                    </td>
                    <td className="p-table-cell-padding text-on-surface font-medium">
                      {op.name}
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-data-mono">
                      {op.createdAt}
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[11px] font-medium inline-flex items-center gap-1 ${op.status === "ACTIVE"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : "bg-error-container text-on-error-container"
                          }`}
                      >
                        {op.status === "ACTIVE" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Hoạt động
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Tạm khóa
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(op)}
                          className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(op.id)}
                          className={`p-1 hover:bg-surface-container-high rounded transition-colors cursor-pointer ${op.status === "ACTIVE"
                              ? "text-error hover:bg-error-container/20"
                              : "text-tertiary-fixed-dim hover:bg-tertiary-fixed-dim/20"
                            }`}
                          title={op.status === "ACTIVE" ? "Khóa" : "Kích hoạt"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy nhà vận hành nào khớp điều kiện tìm kiếm.
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
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-lg font-bold text-on-surface">
                {modalMode === "CREATE" ? "Thêm Nhà Vận Hành Mới" : "Chỉnh Sửa Nhà Vận Hành"}
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
                    <AlertTriangle className="h-4 w-4 text-error" /> {modalError}
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
                  Mã nhà vận hành
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: HURC"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  disabled={modalMode === "EDIT"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Tên đầy đủ nhà vận hành
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty Đường sắt Đô thị Hà Nội"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm"
                />
              </div>

              {modalMode === "CREATE" && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Phương thức vận tải
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as "METRO" | "BUS")}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="METRO">Đường sắt</option>
                    <option value="BUS">Xe buýt</option>
                  </select>
                </div>
              )}

              {modalMode === "CREATE" && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm khóa</option>
                  </select>
                </div>
              )}

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
                  {modalMode === "CREATE" ? "Tạo mới" : "Lưu thay đổi"}
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
                  Bạn có chắc chắn muốn chuyển trạng thái nhà vận hành <strong>{confirmModal.operatorName}</strong> sang{" "}
                  <strong>{confirmModal.newStatus === "ACTIVE" ? "HOẠT ĐỘNG" : "TẠM KHÓA"}</strong> không?
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
