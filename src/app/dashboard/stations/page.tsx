"use client";

import React, { useState, useEffect } from "react";
import {
  Train,
  Plus,
  Edit2,
  Trash2,
  X,
  Navigation,
  Hash,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Station {
  id: string;
  routeId: string;
  routeCode: string;
  code: string;
  name: string;
  kmMarker: number;
  stationOrder: number;
  createdAt: string;
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);

  const [routeFilter, setRouteFilter] = useState("ALL");
  const [isOffline, setIsOffline] = useState(false);
  const [routesList, setRoutesList] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [stationsData, routesData] = await Promise.all([
          fetchApi("/api/stations"),
          fetchApi("/api/routes")
        ]);

        let rMap: Record<string, string> = {};
        if (Array.isArray(routesData)) {
          setRoutesList(routesData.map((r: any) => ({
            id: r.id,
            code: r.code,
            name: `${r.name} (${r.code})`
          })));
          routesData.forEach((r: any) => {
            rMap[r.id] = r.code;
          });
        } else {
          rMap = { "rt-1": "R-M1", "rt-2": "R-B01", "rt-3": "R-B02" };
        }

        if (Array.isArray(stationsData)) {
          setStations(stationsData.map((s: any) => ({
            id: s.id,
            routeId: s.routeId,
            routeCode: s.routeCode || rMap[s.routeId] || "R-M1",
            code: s.code,
            name: s.name,
            kmMarker: s.kmMarker || 0,
            stationOrder: s.stationOrder || 1,
            createdAt: s.createdAt ? new Date(s.createdAt).toISOString().replace("T", " ").substring(0, 16) : ""
          })));
        }
      } catch (err: any) {
        console.warn("FMC Stations/Routes API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadData();
  }, []);

  const filteredStations = stations.filter((st) => {
    const matchesRoute = routeFilter === "ALL" || st.routeCode === routeFilter;
    return matchesRoute;
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
            <Train className="h-6 w-6 text-secondary" /> Quản lý Nhà ga
          </h2>
          <p className="text-sm text-on-surface-variant">
            Danh sách các nhà ga, điểm dừng xe buýt, thứ tự dừng và cự ly cột mốc.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
              Tổng số nhà ga
            </h3>
            <div className="text-3xl font-bold text-on-surface">{stations.length}</div>
          </div>
          <Train className="h-10 w-10 text-outline opacity-40" />
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng chiều dài mạng lưới
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim font-data-mono">
            {stations.length > 0 ? Math.max(...stations.map((s) => s.kmMarker)).toFixed(1) : "0.0"} km
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Ga trung chuyển
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim">1</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-60"
          >
            <option value="ALL">Tất cả tuyến đường</option>
            {routesList.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
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
                  Mã nhà ga
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Tên nhà ga
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Tuyến đường
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Cột mốc
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Thứ tự dừng
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-xs">
              {filteredStations.length > 0 ? (
                filteredStations
                  .sort((a, b) => a.stationOrder - b.stationOrder)
                  .map((st) => (
                    <tr
                      key={st.id}
                      className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                    >
                      <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono">
                        {st.code}
                      </td>
                      <td className="p-table-cell-padding text-on-surface font-medium">
                        {st.name}
                      </td>
                      <td className="p-table-cell-padding text-on-surface-variant">
                        <span className="px-2 py-0.5 bg-surface-container-high rounded text-xs font-semibold">
                          {st.routeCode}
                        </span>
                      </td>
                      <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-semibold">
                        <span className="inline-flex items-center gap-0.5 text-secondary-fixed-dim">
                          {st.kmMarker.toFixed(2)} km
                        </span>
                      </td>
                      <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-semibold">
                        <span className="inline-flex items-center gap-0.5 text-tertiary-fixed-dim">
                          <Hash className="h-3 w-3" /> {st.stationOrder}
                        </span>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy nhà ga nào khớp điều kiện lọc.
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
