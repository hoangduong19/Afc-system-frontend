"use client";

import React, { useState } from "react";
import {
  Ban,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Unlock,
  X
} from "lucide-react";

interface BlacklistedCard {
  id: string;
  cardUid: string;
  reason: "DEBT" | "STOLEN" | "FRAUD";
  notes: string;
  blockedAt: string;
}

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistedCard[]>([
    {
      id: "bl-1",
      cardUid: "04:AA:BB:CC:DD:EE:FF",
      reason: "DEBT",
      notes: "Nợ cước chưa thanh toán: ₫ 45,000",
      blockedAt: "2026-02-15 10:30"
    },
    {
      id: "bl-2",
      cardUid: "04:12:34:56:78:9A:BC",
      reason: "STOLEN",
      notes: "Hành khách báo mất thẻ lúc 09:00",
      blockedAt: "2026-02-18 09:20"
    },
    {
      id: "bl-3",
      cardUid: "04:DE:AD:BE:EF:00:11",
      reason: "FRAUD",
      notes: "Phát hiện mã SAM giả mạo tại ga Láng",
      blockedAt: "2026-02-22 14:15"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [cardUid, setCardUid] = useState("");
  const [reason, setReason] = useState<"DEBT" | "STOLEN" | "FRAUD">("DEBT");
  const [notes, setNotes] = useState("");

  const handleOpenModal = () => {
    setCardUid("");
    setReason("DEBT");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    const newBlocked: BlacklistedCard = {
      id: `bl-${Date.now()}`,
      cardUid,
      reason,
      notes,
      blockedAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    setBlacklist([newBlocked, ...blacklist]);
    setIsModalOpen(false);
  };

  const handleRemoveFromBlacklist = (id: string, uid: string) => {
    if (confirm(`Bạn có chắc chắn muốn mở khóa và gỡ thẻ ${uid} khỏi danh sách đen?`)) {
      setBlacklist(blacklist.filter((item) => item.id !== id));
    }
  };

  const filteredBlacklist = blacklist.filter((c) => {
    const matchesSearch = c.cardUid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReason = reasonFilter === "ALL" || c.reason === reasonFilter;
    return matchesSearch && matchesReason;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Ban className="h-6 w-6 text-error animate-pulse" /> Quản lý Danh sách đen
          </h2>
          <p className="text-sm text-on-surface-variant">
            Danh sách các thẻ giao thông bị chặn quyền truy cập do nợ cước, báo mất hoặc nghi ngờ gian lận.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm vào danh sách đen
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng số thẻ bị khóa
          </h3>
          <div className="text-3xl font-bold text-on-surface">8,930</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Nợ cước (DEBT)
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim">4,500</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Báo mất (STOLEN)
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim">3,430</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Gian lận (FRAUD)
          </h3>
          <div className="text-3xl font-bold text-error">1,000</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            className="bg-surface-container-high border-none rounded-full py-1.5 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-secondary w-full outline-none"
            placeholder="Tìm theo UID thẻ bị chặn..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-52"
          >
            <option value="ALL">Tất cả lý do chặn</option>
            <option value="DEBT">Nợ cước (DEBT)</option>
            <option value="STOLEN">Báo mất (STOLEN)</option>
            <option value="FRAUD">Gian lận thẻ (FRAUD)</option>
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
                  Mã thẻ bị chặn (UID)
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Lý do khóa
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Chi tiết lý do
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Thời gian chặn
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-xs">
              {filteredBlacklist.length > 0 ? (
                filteredBlacklist.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono">
                      {item.cardUid}
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2.5 py-0.5 rounded font-label-caps text-[10px] font-bold inline-flex items-center gap-1 ${
                          item.reason === "FRAUD"
                            ? "bg-error text-on-error"
                            : item.reason === "STOLEN"
                            ? "bg-secondary-fixed-dim/20 text-on-secondary-fixed-variant"
                            : "bg-surface-variant text-on-surface-variant"
                        }`}
                      >
                        <AlertOctagon className="h-3 w-3" /> {item.reason}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-on-surface font-medium">
                      {item.notes}
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-data-mono">
                      {item.blockedAt}
                    </td>
                    <td className="p-table-cell-padding text-right">
                      <button
                        onClick={() => handleRemoveFromBlacklist(item.id, item.cardUid)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-fixed-dim/20 hover:bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant rounded text-xs font-semibold uppercase transition-colors cursor-pointer"
                      >
                        <Unlock className="h-3.5 w-3.5" /> Gỡ bỏ chặn
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy thẻ bị chặn nào khớp điều kiện lọc.
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
              <h3 className="text-lg font-bold text-on-surface">Thêm Thẻ Vào Danh Sách Đen</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddBlacklist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Mã định danh thẻ (UID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 04:AA:BB:CC:DD:EE:FF"
                  value={cardUid}
                  onChange={(e) => setCardUid(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Lý do đưa vào danh sách đen
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                >
                  <option value="DEBT">Nợ cước chưa thanh toán (DEBT)</option>
                  <option value="STOLEN">Báo mất thẻ vật lý (STOLEN)</option>
                  <option value="FRAUD">Gian lận / Phát hiện giả mạo (FRAUD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Ghi chú chi tiết
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập lý do chi tiết hoặc số tiền nợ cước..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
                />
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
                  Chặn thẻ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
