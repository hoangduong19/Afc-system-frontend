"use client";

import React, { useState } from "react";
import {
  Route as RouteIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Layers,
  Info
} from "lucide-react";

interface RouteItem {
  id: string;
  code: string;
  name: string;
  operatorId: string;
  operatorCode: string;
  type: "METRO" | "BUS";
  createdAt: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([
    {
      id: "rt-1",
      code: "R-M1",
      name: "Tuyến đường sắt Cát Linh - Hà Đông",
      operatorId: "op-1",
      operatorCode: "HURC",
      type: "METRO",
      createdAt: "2026-01-10 10:00"
    },
    {
      id: "rt-2",
      code: "R-B01",
      name: "Tuyến xe buýt 01 (Long Biên - Yên Nghĩa)",
      operatorId: "op-2",
      operatorCode: "TRANSERCO",
      type: "BUS",
      createdAt: "2026-01-15 11:20"
    },
    {
      id: "rt-3",
      code: "R-B02",
      name: "Tuyến xe buýt 02 (Bác Cổ - Yên Nghĩa)",
      operatorId: "op-2",
      operatorCode: "TRANSERCO",
      type: "BUS",
      createdAt: "2026-01-15 11:25"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [operatorFilter, setOperatorFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [operatorCode, setOperatorCode] = useState("HURC");
  const [type, setType] = useState<"METRO" | "BUS">("METRO");

  const operatorsList = [
    { code: "HURC", name: "Hanoi Metro (HURC)" },
    { code: "TRANSERCO", name: "Bus (TRANSERCO)" }
  ];

  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setCode("");
    setName("");
    setOperatorCode("HURC");
    setType("METRO");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (route: RouteItem) => {
    setSelectedRoute(route);
    setModalMode("EDIT");
    setCode(route.code);
    setName(route.name);
    setOperatorCode(route.operatorCode);
    setType(route.type);
    setIsModalOpen(true);
  };

  const handleDeleteRoute = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tuyến này khỏi hệ thống?")) {
      setRoutes(routes.filter((route) => route.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentOp = operatorsList.find((o) => o.code === operatorCode);
    
    if (modalMode === "CREATE") {
      const newRoute: RouteItem = {
        id: `rt-${Date.now()}`,
        code,
        name,
        operatorId: operatorCode === "HURC" ? "op-1" : "op-2",
        operatorCode,
        type,
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
      };
      setRoutes([...routes, newRoute]);
    } else if (modalMode === "EDIT" && selectedRoute) {
      setRoutes(
        routes.map((rt) =>
          rt.id === selectedRoute.id
            ? { ...rt, code, name, operatorCode, type, operatorId: operatorCode === "HURC" ? "op-1" : "op-2" }
            : rt
        )
      );
    }
    setIsModalOpen(false);
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || route.type === typeFilter;
    const matchesOperator =
      operatorFilter === "ALL" || route.operatorCode === operatorFilter;
    return matchesSearch && matchesType && matchesOperator;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <RouteIcon className="h-6 w-6 text-secondary" /> Quản lý Tuyến đường
          </h2>
          <p className="text-sm text-on-surface-variant">
            Danh sách tuyến đường sắt đô thị (Metro) và các tuyến xe buýt tích hợp.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm tuyến mới
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
              Tổng số tuyến
            </h3>
            <div className="text-3xl font-bold text-on-surface">{routes.length}</div>
          </div>
          <Layers className="h-10 w-10 text-outline opacity-40" />
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Đường sắt đô thị (METRO)
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim">
            {routes.filter((r) => r.type === "METRO").length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Mạng lưới xe buýt (BUS)
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim">
            {routes.filter((r) => r.type === "BUS").length}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            className="bg-surface-container-high border-none rounded-full py-1.5 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-secondary w-full outline-none"
            placeholder="Tìm theo mã hoặc tên tuyến..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full sm:w-40"
          >
            <option value="ALL">Tất cả loại tuyến</option>
            <option value="METRO">Đường sắt (Metro)</option>
            <option value="BUS">Xe buýt (Bus)</option>
          </select>
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full sm:w-40"
          >
            <option value="ALL">Tất cả nhà vận hành</option>
            <option value="HURC">HURC</option>
            <option value="TRANSERCO">TRANSERCO</option>
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
                  Mã tuyến
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Tên tuyến đường
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Nhà vận hành
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Phân loại
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Ngày tạo
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-xs">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <tr
                    key={route.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono">
                      {route.code}
                    </td>
                    <td className="p-table-cell-padding text-on-surface font-medium">
                      {route.name}
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant">
                      <span className="px-2 py-0.5 bg-surface-container-high rounded text-xs font-semibold">
                        {route.operatorCode}
                      </span>
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2 py-0.5 rounded font-label-caps text-[10px] font-bold ${
                          route.type === "METRO"
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                        }`}
                      >
                        {route.type}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-data-mono">
                      {route.createdAt}
                    </td>
                    <td className="p-table-cell-padding text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(route)}
                          className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(route.id)}
                          className="p-1 hover:bg-surface-container-high rounded text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy tuyến đường nào khớp điều kiện lọc.
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
                {modalMode === "CREATE" ? "Thêm Tuyến Đường Mới" : "Chỉnh Sửa Tuyến Đường"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Mã tuyến đường
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: R-M1"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  disabled={modalMode === "EDIT"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Tên tuyến đường
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tuyến số 2A Cát Linh - Hà Đông"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Nhà vận hành
                </label>
                <select
                  value={operatorCode}
                  onChange={(e) => setOperatorCode(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                >
                  {operatorsList.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Phân loại
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "METRO" | "BUS")}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                >
                  <option value="METRO">Đường sắt (Metro)</option>
                  <option value="BUS">Xe buýt (Bus)</option>
                </select>
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
                  {modalMode === "CREATE" ? "Tạo mới" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
