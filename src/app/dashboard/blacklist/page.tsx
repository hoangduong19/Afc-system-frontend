"use client";

import React, { useState, useEffect } from "react";
import {
  Ban,
  Plus,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Unlock,
  X,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface BlacklistedCard {
  id: string;
  cardUid: string;
  reason: string;
  notes: string;
  blockedAt: string;
}

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistedCard[]>([]);

  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    itemId: string;
    cardUid: string;
  }>({
    isOpen: false,
    itemId: "",
    cardUid: ""
  });

  // Form State
  const [cardUid, setCardUid] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [blacklistData, cardsData] = await Promise.all([
          fetchApi("/api/blacklist"),
          fetchApi("/api/cards")
        ]);
        
        let cardMap: Record<string, string> = {};
        if (Array.isArray(cardsData)) {
          cardsData.forEach((c) => {
            cardMap[c.id] = c.cardUid;
          });
        }
        
        if (Array.isArray(blacklistData)) {
          setBlacklist(blacklistData.map((b) => ({
            id: b.id,
            cardUid: b.cardUid || cardMap[b.cardId] || "Mã thẻ ẩn",
            reason: b.reason || "N/A",
            notes: b.reason || "N/A",
            blockedAt: b.addedAt ? new Date(b.addedAt).toISOString().replace("T", " ").substring(0, 16) : ""
          })));
        }
      } catch (err: any) {
        console.warn("FMC Blacklist API is offline.", err.message);
        setIsOffline(true);
      }
    }
    loadData();
  }, []);

  const handleOpenModal = () => {
    setCardUid("");
    setReason("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    
    let resolvedCardId = cardUid;
    try {
      const cardsList = await fetchApi("/api/cards");
      if (Array.isArray(cardsList)) {
        const matched = cardsList.find((c) => c.cardUid.toLowerCase() === cardUid.trim().toLowerCase());
        if (matched) {
          resolvedCardId = matched.id;
        }
      }
    } catch (e) {}

    try {
      const res = await fetchApi("/api/blacklist", {
        method: "POST",
        body: JSON.stringify({
          cardId: resolvedCardId,
          reason: reason.trim()
        })
      });
      
      setBlacklist([{
        id: res.id,
        cardUid: cardUid,
        reason: reason.trim(),
        notes: reason.trim(),
        blockedAt: res.addedAt ? new Date(res.addedAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16)
      }, ...blacklist]);
      setIsModalOpen(false);
    } catch (err: any) {
      console.warn("POST /api/blacklist failed. Error:", err.message);
      setIsOffline(true);
      setModalError("Lỗi kết nối tới Backend API. Không thể thêm thẻ vào danh sách đen.");
    }
  };

  const handleRemoveFromBlacklist = (id: string, uid: string) => {
    setConfirmModal({
      isOpen: true,
      itemId: id,
      cardUid: uid
    });
  };

  const handleConfirmRemove = async () => {
    const { itemId, cardUid } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const originalList = [...blacklist];
    setBlacklist(blacklist.filter((item) => item.id !== itemId));
    setPageError(null);
    try {
      await fetchApi("/api/blacklist/" + itemId, { method: "DELETE" });
    } catch (err: any) {
      console.warn("DELETE /api/blacklist failed. Error:", err.message);
      setIsOffline(true);
      setBlacklist(originalList);
      setPageError("Lỗi kết nối tới Backend API. Không thể mở khóa thẻ " + cardUid + ".");
    }
  };

  const filteredBlacklist = blacklist.filter((c) => {
    if (reasonFilter === "ALL") return true;
    return c.reason.toUpperCase().includes(reasonFilter.toUpperCase());
  });

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="px-4 py-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center justify-between border border-error/20">
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-error" /> Lỗi kết nối tới Backend API. Dữ liệu đang hiển thị theo cache cục bộ.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm col-span-1">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng số thẻ bị khóa
          </h3>
          <div className="text-3xl font-bold text-on-surface">
            {blacklist.length.toLocaleString()} Thẻ
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full md:w-52"
          >
            <option value="ALL">Tất cả lý do chặn</option>
            <option value="DEBT">Nợ cước</option>
            <option value="STOLEN">Báo mất</option>
            <option value="FRAUD">Gian lận thẻ</option>
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
                    <td className="p-table-cell-padding text-on-surface font-medium">
                      {item.reason}
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
                  <td colSpan={4} className="p-8 text-center text-on-surface-variant font-medium">
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
                  Lý do đưa vào danh sách đen (Bắt buộc)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập lý do chi tiết (ví dụ: Nợ cước 50k, báo mất thẻ...)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                <h3 className="text-lg font-bold text-on-surface">Xác nhận mở khóa thẻ</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Bạn có chắc chắn muốn mở khóa và gỡ thẻ <strong>{confirmModal.cardUid}</strong> khỏi danh sách đen không?
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
                onClick={handleConfirmRemove}
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
