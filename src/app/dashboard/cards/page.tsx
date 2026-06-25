"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Slash,
  X
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface TransportCard {
  id: string;
  uid: string;
  passengerType: string; // "ANON" | "IDENTIFIED" from backend type
  status: "CREATED" | "ACTIVE" | "SUSPENDED" | "ISSUED" | "REVOKED";
  supportsMetro: boolean;
  supportsBus: boolean;
  linkedUserId: string | null;
  createdAt: string;
}

export default function CardsPage() {
  const [cards, setCards] = useState<TransportCard[]>([]);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkUserModalOpen, setIsLinkUserModalOpen] = useState(false);
  const [linkUserId, setLinkUserId] = useState("");
  const [linkUserError, setLinkUserError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<TransportCard | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    cardId: string;
    cardUid: string;
    action: "ACTIVATE" | "SUSPEND" | "REVOKE" | "UNLINK_USER";
    title: string;
    description: string;
    requireReason: boolean;
    reason: string;
  }>({
    isOpen: false,
    cardId: "",
    cardUid: "",
    action: "ACTIVATE",
    title: "",
    description: "",
    requireReason: false,
    reason: ""
  });

  // Form State - Phát hành thẻ
  const [uid, setUid] = useState("");
  const [userId, setUserId] = useState("");
  const [supportsMetro, setSupportsMetro] = useState(true);
  const [supportsBus, setSupportsBus] = useState(true);
  const [issuanceType, setIssuanceType] = useState<"ANON" | "IDENTIFIED">("ANON");

  // Ticket creation state inside card issuance
  const [ticketMode, setTicketMode] = useState<"METRO" | "BUS" | "ANY">("METRO");
  const [ticketPassengerType, setTicketPassengerType] = useState<string>("");
  const [ticketDurationType, setTicketDurationType] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("MONTHLY");
  const [ticketDurationMonths, setTicketDurationMonths] = useState<number>(1);
  const [ticketValidFrom, setTicketValidFrom] = useState<string>("");

  const loadData = async () => {
    try {
      const cardsData = await fetchApi("/api/cards");

      if (Array.isArray(cardsData)) {
        setCards(cardsData.map((c: any) => {
          return {
            id: c.id,
            uid: c.cardUid,
            passengerType: c.type || "ANON",
            status: c.status || "ACTIVE",
            supportsMetro: !!c.supportsMetro,
            supportsBus: !!c.supportsBus,
            linkedUserId: c.linkedUserId || null,
            createdAt: c.createdAt ? new Date(c.createdAt).toISOString().replace("T", " ").substring(0, 16) : ""
          };
        }));
      }
    } catch (err: any) {
      console.warn("FMC Cards API is offline.", err.message);
      setIsOffline(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setUid(generateRandomUid());
    setUserId("");
    setSupportsMetro(true);
    setSupportsBus(true);
    setIssuanceType("ANON");
    setTicketMode("METRO");
    setTicketPassengerType("");
    setTicketDurationType("MONTHLY");
    setTicketDurationMonths(1);
    setTicketValidFrom(new Date().toISOString().substring(0, 10));
    setModalError(null);
    setIsModalOpen(true);
  };

  const generateRandomUid = () => {
    return Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .toUpperCase()
        .padStart(2, "0")
    ).join(":");
  };

  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      const cleanUid = uid.trim() || null;
      if (issuanceType === "ANON") {
        // Issue anonymous card
        await fetchApi("/api/cards", {
          method: "POST",
          body: JSON.stringify({
            cardUid: cleanUid,
            userId: null,
            supportsMetro,
            supportsBus
          })
        });
        await loadData();
        setIsModalOpen(false);
      } else {
        // Issue identified card with ticket
        const targetUserId = userId.trim();
        if (!targetUserId) {
          setModalError("Vui lòng nhập Mã người dùng cho thẻ định danh!");
          return;
        }

        // Validate UUID
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(targetUserId)) {
          setModalError("Mã người dùng không hợp lệ (phải ở định dạng UUID)!");
          return;
        }

        // Prepare ticket request body
        const ticketPayload: any = {
          userId: targetUserId,
          mode: ticketMode,
          passengerType: ticketPassengerType || null,
          validFrom: ticketValidFrom,
          durationType: ticketDurationType
        };

        // Rule: BUS requires MULTI_ROUTE scope, METRO/ANY must have null scope
        if (ticketMode === "BUS") {
          ticketPayload.scope = "MULTI_ROUTE";
        } else {
          ticketPayload.scope = null;
        }

        // Rule: durationMonths required for MONTHLY, must be null otherwise
        if (ticketDurationType === "MONTHLY") {
          ticketPayload.durationMonths = ticketDurationMonths;
        } else {
          ticketPayload.durationMonths = null;
        }

        const payload = {
          card: {
            cardUid: cleanUid,
            userId: targetUserId,
            supportsMetro,
            supportsBus
          },
          ticket: ticketPayload
        };

        await fetchApi("/api/issuance/cards", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        await loadData();
        setIsModalOpen(false);
      }
    } catch (err: any) {
      console.warn("POST card failed. Error:", err.message);
      setModalError(`Lỗi phát hành thẻ: ${err.message || "Không thể thực hiện."}`);
    }
  };

  const triggerConfirm = (cardId: string, cardUid: string, action: "ACTIVATE" | "SUSPEND" | "REVOKE" | "UNLINK_USER") => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    let title = "";
    let description = "";
    let requireReason = false;

    if (action === "SUSPEND") {
      title = "Xác nhận Khóa Tạm Thời Thẻ";
      description = `Bạn có chắc chắn muốn khóa tạm thời thẻ ${cardUid} không?`;
      requireReason = true;
    } else if (action === "REVOKE") {
      title = "Xác nhận Hủy Thẻ Vĩnh Viễn";
      description = `Bạn có chắc chắn muốn hủy thẻ ${cardUid} vĩnh viễn không? Hành động này không thể hoàn tác.`;
      requireReason = true;
    } else if (action === "ACTIVATE") {
      if (card.status === "SUSPENDED") {
        title = "Xác nhận Mở Khóa Thẻ (Unsuspend)";
        description = `Bạn có chắc chắn muốn mở khóa thẻ ${cardUid} đang bị tạm dừng không?`;
        requireReason = true;
      } else {
        title = "Xác nhận Kích Hoạt Thẻ (Activate)";
        description = `Bạn có chắc chắn muốn kích hoạt thẻ ${cardUid} không?`;
        requireReason = false;
      }
    } else if (action === "UNLINK_USER") {
      title = "Xác nhận Hủy Liên Kết Người Dùng";
      description = `Bạn có chắc chắn muốn hủy liên kết người dùng khỏi thẻ ${cardUid} không?`;
      requireReason = false;
    }

    setConfirmError(null);
    setConfirmModal({
      isOpen: true,
      cardId,
      cardUid,
      action,
      title,
      description,
      requireReason,
      reason: ""
    });
  };

  const handleConfirmAction = async () => {
    const { cardId, cardUid, action, reason, requireReason } = confirmModal;

    if (requireReason && !reason.trim()) {
      setConfirmError("Lý do thực hiện hành động là bắt buộc và không được để trống.");
      return;
    }

    setConfirmError(null);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    if (action === "UNLINK_USER") {
      const originalList = [...cards];
      setCards(cards.map((c) => c.id === cardId ? { ...c, linkedUserId: null } : c));
      setPageError(null);
      try {
        await fetchApi("/api/cards/" + cardId + "/unlink", { method: "PATCH" });
        await loadData();
      } catch (err: any) {
        console.warn("Unlink user failed:", err.message);
        setCards(originalList);
        setPageError(`Thao tác thất bại: ${err.message || "Không thể hủy liên kết người dùng khỏi thẻ " + cardUid}`);
      }
      return;
    }

    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    let nextStatus: TransportCard["status"] = card.status;
    if (action === "ACTIVATE") nextStatus = "ACTIVE";
    else if (action === "SUSPEND") nextStatus = "SUSPENDED";
    else if (action === "REVOKE") nextStatus = "REVOKED";

    const originalList = [...cards];
    setCards(cards.map((c) => (c.id === cardId ? { ...c, status: nextStatus } : c)));
    setPageError(null);

    try {
      if (action === "REVOKE") {
        await fetchApi("/api/cards/" + cardId + "/revoke", {
          method: "PATCH",
          body: JSON.stringify({ reason: reason.trim() })
        });
      } else if (action === "SUSPEND") {
        await fetchApi("/api/cards/" + cardId + "/suspend", {
          method: "PATCH",
          body: JSON.stringify({ reason: reason.trim() })
        });
      } else if (action === "ACTIVATE") {
        if (card.status === "SUSPENDED") {
          await fetchApi("/api/cards/" + cardId + "/unsuspend", {
            method: "PATCH",
            body: JSON.stringify({ reason: reason.trim() })
          });
        } else {
          await fetchApi("/api/cards/" + cardId + "/activate", { method: "PATCH" });
        }
      }
      await loadData();
    } catch (err: any) {
      console.warn("Card action API failed. Error:", err.message);
      setCards(originalList);
      setPageError(`Thao tác thất bại: ${err.message || "Không thể thay đổi trạng thái thẻ " + cardUid}`);
    }
  };



  const handleOpenLinkUserModal = (card: TransportCard) => {
    setSelectedCard(card);
    setLinkUserId("");
    setLinkUserError(null);
    setIsLinkUserModalOpen(true);
  };

  const handleLinkUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCard) {
      const targetUserId = linkUserId.trim();
      if (!targetUserId) {
        setLinkUserError("Vui lòng nhập Mã người dùng!");
        return;
      }

      // Simple UUID format verification
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(targetUserId)) {
        setLinkUserError("Mã người dùng không hợp lệ (phải ở định dạng UUID)!");
        return;
      }

      setLinkUserError(null);
      try {
        await fetchApi("/api/cards/" + selectedCard.id + "/link", {
          method: "PATCH",
          body: JSON.stringify({ userId: targetUserId })
        });
        await loadData();
        setIsLinkUserModalOpen(false);
      } catch (err: any) {
        console.warn("Link user API failed. Error:", err.message);
        setLinkUserError(`Lỗi liên kết người dùng: ${err.message || "Không thể thực hiện."}`);
      }
    }
  };

  const filteredCards = cards.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesType = typeFilter === "ALL" || c.passengerType === typeFilter;
    return matchesStatus && matchesType;
  });

  const cardStatusPriority: Record<string, number> = {
    ACTIVE: 1,
    CREATED: 2,
    ISSUED: 3,
    SUSPENDED: 4,
    REVOKED: 5
  };

  const sortedCards = [...filteredCards].sort((a, b) => {
    const pA = cardStatusPriority[a.status] || 5;
    const pB = cardStatusPriority[b.status] || 5;
    if (pA !== pB) return pA - pB;
    return b.createdAt.localeCompare(a.createdAt);
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
            <CreditCard className="h-6 w-6 text-secondary" /> Quản lý Thẻ (Card Lifecycle)
          </h2>
          <p className="text-sm text-on-surface-variant">
            Phát hành thẻ mới, khóa/mở khóa thẻ, liên kết thẻ vật lý với tài khoản hành khách và vé điện tử.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full hover:opacity-90 transition-opacity font-label-caps text-xs uppercase cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Phát hành thẻ
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tổng số thẻ hệ thống
          </h3>
          <div className="text-3xl font-bold text-on-surface font-data-mono">
            {cards.length.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Hoạt động (Active)
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim font-data-mono">
            {cards.filter((c) => c.status === "ACTIVE").length.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tạm dừng (Suspended)
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim font-data-mono">
            {cards.filter((c) => c.status === "SUSPENDED").length.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Danh sách đen (Blacklisted)
          </h3>
          <div className="text-3xl font-bold text-error font-data-mono">
            {cards.filter((c) => c.status === "REVOKED").length.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full sm:w-40"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="CREATED">Mới tạo</option>
            <option value="ISSUED">Chưa kích hoạt</option>
            <option value="SUSPENDED">Tạm khóa</option>
            <option value="REVOKED">Đã hủy</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full sm:w-40"
          >
            <option value="ALL">Tất cả loại thẻ</option>
            <option value="ANON">ANON (Thẻ vô danh)</option>
            <option value="IDENTIFIED">IDENTIFIED (Thẻ định danh)</option>
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
                  Mã thẻ (UID)
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Loại thẻ / Tính năng
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Mã người dùng liên kết
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
              {sortedCards.length > 0 ? (
                sortedCards.map((card) => (
                  <tr
                    key={card.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono">
                      {card.uid}
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-medium">
                      <span className="font-bold">{card.passengerType}</span>
                      <span className="text-[10px] text-outline ml-2">
                        (Metro: {card.supportsMetro ? "✔" : "✘"}, Bus: {card.supportsBus ? "✔" : "✘"})
                      </span>
                    </td>
                    <td className="p-table-cell-padding font-data-mono text-on-surface-variant text-[11px] truncate max-w-[120px]" title={card.linkedUserId || ""}>
                      {card.linkedUserId || <span className="text-outline italic">Chưa liên kết</span>}
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2.5 py-0.5 rounded font-body-sm text-[11px] font-medium inline-flex items-center gap-1 ${
                          card.status === "ACTIVE"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : card.status === "SUSPENDED"
                            ? "bg-secondary-fixed-dim/20 text-on-secondary-fixed-variant"
                            : card.status === "CREATED"
                            ? "bg-outline-variant/30 text-on-surface-variant"
                            : card.status === "ISSUED"
                            ? "bg-surface-variant text-on-surface-variant"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {card.status === "ACTIVE" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Hoạt động
                          </>
                        ) : card.status === "SUSPENDED" ? (
                          <>
                            <AlertTriangle className="h-3 w-3" /> Tạm khóa
                          </>
                        ) : card.status === "CREATED" ? (
                          <>
                            <Eye className="h-3 w-3" /> Mới tạo
                          </>
                        ) : card.status === "ISSUED" ? (
                          <>
                            <Eye className="h-3 w-3" /> Chưa kích hoạt
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Đã hủy
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right">
                      <div className="inline-flex gap-2">
                        {(card.status === "ISSUED" || card.status === "CREATED") && (
                          <button
                            onClick={() => triggerConfirm(card.id, card.uid, "ACTIVATE")}
                            className="px-2 py-0.5 bg-tertiary-fixed-dim/20 hover:bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant rounded text-[10px] font-semibold uppercase cursor-pointer"
                          >
                            Kích hoạt
                          </button>
                        )}
                        {card.status === "ACTIVE" && (
                          <button
                            onClick={() => triggerConfirm(card.id, card.uid, "SUSPEND")}
                            className="px-2 py-0.5 bg-secondary-fixed-dim/20 hover:bg-secondary-fixed-dim/30 text-on-secondary-fixed-variant rounded text-[10px] font-semibold uppercase cursor-pointer"
                          >
                            Khóa tạm thời
                          </button>
                        )}
                        {card.status === "SUSPENDED" && (
                          <button
                            onClick={() => triggerConfirm(card.id, card.uid, "ACTIVATE")}
                            className="px-2 py-0.5 bg-tertiary-fixed-dim/20 hover:bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant rounded text-[10px] font-semibold uppercase cursor-pointer"
                          >
                            Mở khóa
                          </button>
                        )}
                        {card.status !== "REVOKED" && (
                          <button
                            onClick={() => triggerConfirm(card.id, card.uid, "REVOKE")}
                            className="px-2 py-0.5 bg-error-container hover:bg-error-container/80 text-on-error-container rounded text-[10px] font-semibold uppercase cursor-pointer"
                          >
                            Hủy thẻ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant font-medium">
                    Không tìm thấy thẻ nào khớp điều kiện tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Phát hành thẻ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-lg font-bold text-on-surface">Phát Hành Thẻ Vật Lý Mới</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4 overflow-y-auto pr-1 flex-1">
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
                  Phân loại phát hành
                </label>
                <select
                  value={issuanceType}
                  onChange={(e) => setIssuanceType(e.target.value as "ANON" | "IDENTIFIED")}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer font-medium"
                >
                  <option value="ANON">Thẻ vô danh (Không định danh)</option>
                  <option value="IDENTIFIED">Thẻ định danh & Kèm vé đăng ký</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Mã thẻ định danh (UID) - Tùy chọn
                </label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                />
              </div>

              {issuanceType === "IDENTIFIED" ? (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Mã người dùng liên kết (User ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: cfe1a485-78d4-4f15-9fe5-1ee6a04d7e14"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Mã người dùng liên kết - Tùy chọn
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: cfe1a485-78d4-4f15-9fe5-1ee6a04d7e14"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                  />
                </div>
              )}

              <div className="flex gap-6 py-1">
                <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={supportsMetro}
                    onChange={(e) => setSupportsMetro(e.target.checked)}
                    className="rounded text-secondary focus:ring-secondary h-4.5 w-4.5"
                  />
                  <span>Hỗ trợ Metro</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={supportsBus}
                    onChange={(e) => setSupportsBus(e.target.checked)}
                    className="rounded text-secondary focus:ring-secondary h-4.5 w-4.5"
                  />
                  <span>Hỗ trợ Xe Bus</span>
                </label>
              </div>

              {issuanceType === "IDENTIFIED" && (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Cấu hình vé đăng ký kèm theo
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                        Phương thức vận tải
                      </label>
                      <select
                        value={ticketMode}
                        onChange={(e) => setTicketMode(e.target.value as "METRO" | "BUS" | "ANY")}
                        className="w-full px-2.5 py-1.5 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-xs cursor-pointer font-medium"
                      >
                        <option value="METRO">Đường sắt (METRO)</option>
                        <option value="BUS">Xe buýt (BUS)</option>
                        <option value="ANY">Đa phương thức (ANY)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                        Đối tượng ưu tiên
                      </label>
                      <select
                        value={ticketPassengerType}
                        onChange={(e) => setTicketPassengerType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-xs cursor-pointer font-medium"
                      >
                        <option value="">Không có (Mặc định)</option>
                        <option value="STUDENT">Sinh viên (STUDENT)</option>
                        <option value="PRIORITY">Đối tượng ưu tiên (PRIORITY)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                        Kỳ hạn vé
                      </label>
                      <select
                        value={ticketDurationType}
                        onChange={(e) => setTicketDurationType(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")}
                        className="w-full px-2.5 py-1.5 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-xs cursor-pointer font-medium"
                      >
                        <option value="DAILY">Theo ngày (DAILY)</option>
                        <option value="WEEKLY">Theo tuần (WEEKLY)</option>
                        <option value="MONTHLY">Theo tháng (MONTHLY)</option>
                      </select>
                    </div>

                    {ticketDurationType === "MONTHLY" ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Số tháng hiệu lực (1 - 12)
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={12}
                          value={ticketDurationMonths}
                          onChange={(e) => setTicketDurationMonths(parseInt(e.target.value) || 1)}
                          className="w-full px-2.5 py-1.5 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-xs font-data-mono font-medium"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant/40 mb-1">
                          Số tháng hiệu lực
                        </label>
                        <input
                          type="text"
                          disabled
                          value="Không áp dụng"
                          className="w-full px-2.5 py-1.5 bg-surface-variant/20 border border-outline-variant rounded text-on-surface-variant/40 outline-none text-xs font-medium cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                      Ngày bắt đầu hiệu lực
                    </label>
                    <input
                      type="date"
                      required
                      value={ticketValidFrom}
                      onChange={(e) => setTicketValidFrom(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-xs font-data-mono font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant">
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
                  Phát hành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal - Hộp thoại Xác nhận và Nhập lý do tùy chỉnh */}
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
                <h3 className="text-lg font-bold text-on-surface">{confirmModal.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{confirmModal.description}</p>
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
                  onClick={handleConfirmAction}
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
