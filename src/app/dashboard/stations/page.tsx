"use client";

import React, { useState, useEffect } from "react";
import {
  Train,
  Plus,
  Search,
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

  const [searchTerm, setSearchTerm] = useState("");
  const [routeFilter, setRouteFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [routeCode, setRouteCode] = useState("R-M1");
  const [kmMarker, setKmMarker] = useState(0.0);
  const [stationOrder, setStationOrder] = useState(1);

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

  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setCode("");
    setName("");
    setRouteCode("R-M1");
    setKmMarker(0.0);
    setStationOrder(stations.length + 1);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (station: Station) => {
    setSelectedStation(station);
    setModalMode("EDIT");
    setCode(station.code);
    setName(station.name);
    setRouteCode(station.routeCode);
    setKmMarker(station.kmMarker);
    setStationOrder(station.stationOrder);
    setIsModalOpen(true);
  };

  const handleDeleteStation = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhà ga này khỏi hệ thống?")) {
      setStations(stations.filter((st) => st.id !== id));
      try {
        await fetchApi(`/api/stations/${id}`, { method: "DELETE" });
      } catch (err: any) {
        console.warn("DELETE /api/stations failed, using local state. Error:", err.message);
        setIsOffline(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentRoute = routesList.find((r) => r.code === routeCode);
    const rId = currentRoute ? currentRoute.id : (routeCode === "R-M1" ? "rt-1" : routeCode === "R-B01" ? "rt-2" : "rt-3");
    
    if (modalMode === "CREATE") {
      try {
        const newStation = await fetchApi("/api/stations", {
          method: "POST",
          body: JSON.stringify({
            code,
            name,
            routeId: rId,
            kmMarker,
            stationOrder
          })
        });
        setStations([...stations, {
          id: newStation.id,
          code: newStation.code,
          name: newStation.name,
          routeId: newStation.routeId,
          routeCode: routeCode,
          kmMarker: newStation.kmMarker || kmMarker,
          stationOrder: newStation.stationOrder || stationOrder,
          createdAt: newStation.createdAt ? new Date(newStation.createdAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16)
        }]);
      } catch (err: any) {
        console.warn("POST /api/stations failed, falling back to local creation. Error:", err.message);
        setIsOffline(true);
        const fallbackStation: Station = {
          id: `st-${Date.now()}`,
          code,
          name,
          routeId: rId,
          routeCode,
          kmMarker,
          stationOrder,
          createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
        };
        setStations([...stations, fallbackStation]);
      }
    } else if (modalMode === "EDIT" && selectedStation) {
      try {
        const updatedStation = await fetchApi(`/api/stations/${selectedStation.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            kmMarker
          })
        });
        setStations(
          stations.map((st) =>
            st.id === selectedStation.id
              ? {
                  ...st,
                  name: updatedStation.name || name,
                  kmMarker: updatedStation.kmMarker !== undefined ? updatedStation.kmMarker : kmMarker,
                  stationOrder,
                  routeCode,
                  routeId: rId
                }
              : st
          )
        );
      } catch (err: any) {
        console.warn("PUT /api/stations failed, falling back to local update. Error:", err.message);
        setIsOffline(true);
        setStations(
          stations.map((st) =>
            st.id === selectedStation.id
              ? { ...st, name, routeCode, kmMarker, stationOrder, routeId: rId }
              : st
          )
        );
      }
    }
    setIsModalOpen(false);
  };

  const filteredStations = stations.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoute = routeFilter === "ALL" || st.routeCode === routeFilter;
    return matchesSearch && matchesRoute;
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
            Quản lý danh sách các nhà ga, điểm dừng xe buýt, thứ tự dừng và cự ly cột mốc.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm nhà ga mới
        </button>
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

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            className="bg-surface-container-high border-none rounded-full py-1.5 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-secondary w-full outline-none"
            placeholder="Tìm theo mã hoặc tên ga..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
                  Cột mốc (Km)
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Thứ tự dừng
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Thao tác
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
                          <Navigation className="h-3 w-3 rotate-45" /> {st.kmMarker.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-semibold">
                        <span className="inline-flex items-center gap-0.5 text-tertiary-fixed-dim">
                          <Hash className="h-3 w-3" /> {st.stationOrder}
                        </span>
                      </td>
                      <td className="p-table-cell-padding text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStation(st.id)}
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
                    Không tìm thấy nhà ga nào khớp điều kiện lọc.
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
                {modalMode === "CREATE" ? "Thêm Nhà Ga Mới" : "Chỉnh Sửa Nhà Ga"}
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
                  Mã nhà ga
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: ST-M1-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  disabled={modalMode === "EDIT"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Tên nhà ga
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ga Cát Linh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Thuộc tuyến đường
                </label>
                <select
                  value={routeCode}
                  onChange={(e) => setRouteCode(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                >
                  {routesList.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Cột mốc cự ly (Km)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={kmMarker}
                    onChange={(e) => setKmMarker(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Thứ tự dừng trên tuyến
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stationOrder}
                    onChange={(e) => setStationOrder(parseInt(e.target.value))}
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
