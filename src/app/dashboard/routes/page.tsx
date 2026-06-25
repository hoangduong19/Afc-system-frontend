"use client";
import React, { useState, useEffect } from "react";
import {
  Route as RouteIcon,
  Plus,
  Edit2,
  Trash2,
  X,
  Layers,
  Info,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

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
  const [routes, setRoutes] = useState<RouteItem[]>([]);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [operatorFilter, setOperatorFilter] = useState("ALL");
  const [isOffline, setIsOffline] = useState(false);

  const [operatorsList, setOperatorsList] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [routesData, opsData] = await Promise.all([
          fetchApi("/api/routes"),
          fetchApi("/api/operators")
        ]);

        let opMap: Record<string, string> = {};
        if (Array.isArray(opsData)) {
          setOperatorsList(opsData.map((o: any) => ({
            id: o.id,
            code: o.code,
            name: `${o.name} (${o.code})`
          })));
          opsData.forEach((o: any) => {
            opMap[o.id] = o.code;
          });
        } else {
          opMap = { "op-1": "HURC", "op-2": "TRANSERCO" };
        }

        if (Array.isArray(routesData)) {
          setRoutes(routesData.map((r: any) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            operatorId: r.operatorId,
            operatorCode: r.operatorCode || opMap[r.operatorId] || "HURC",
            type: r.type || "METRO",
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString().replace("T", " ").substring(0, 16) : ""
          })));
        }
      } catch (err: any) {
        console.warn("FMC Routes/Operators API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadData();
  }, []);

  const filteredRoutes = routes.filter((route) => {
    const matchesType = typeFilter === "ALL" || route.type === typeFilter;
    const matchesOperator =
      operatorFilter === "ALL" || route.operatorCode === operatorFilter;
    return matchesType && matchesOperator;
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
            <RouteIcon className="h-6 w-6 text-secondary" /> Quản lý Tuyến đường
          </h2>
          <p className="text-sm text-on-surface-variant">
            Danh sách tuyến đường sắt đô thị (Metro) và các tuyến xe buýt tích hợp.
          </p>
        </div>
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
            Đường sắt đô thị
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim">
            {routes.filter((r) => r.type === "METRO").length}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Mạng lưới xe buýt
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim">
            {routes.filter((r) => r.type === "BUS").length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full sm:w-40"
          >
            <option value="ALL">Tất cả loại tuyến</option>
            <option value="METRO">Đường sắt</option>
            <option value="BUS">Xe buýt</option>
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
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold col-span-2">
                  Phân loại
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
                    <td className="p-table-cell-padding" colSpan={2}>
                      <span
                        className={`px-2 py-0.5 rounded font-label-caps text-[10px] font-bold ${route.type === "METRO"
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                          }`}
                      >
                        {route.type}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy tuyến đường nào khớp điều kiện lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
