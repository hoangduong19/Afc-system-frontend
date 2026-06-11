"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Slash,
  Link as LinkIcon,
  X
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface TransportCard {
  id: string;
  uid: string;
  passengerType: "NORMAL" | "STUDENT" | "SENIOR" | "PRIORITY";
  balance: number;
  status: "ACTIVE" | "SUSPENDED" | "ISSUED" | "REVOKED";
  linkedTicket: string | null;
  createdAt: string;
}

export default function CardsPage() {
  const [cards, setCards] = useState<TransportCard[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TransportCard | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Form State - Phát hành thẻ
  const [uid, setUid] = useState("");
  const [passengerType, setPassengerType] = useState<"NORMAL" | "STUDENT" | "SENIOR" | "PRIORITY">("NORMAL");
  const [balance, setBalance] = useState(50000);

  // Form State - Liên kết vé
  const [ticketType, setTicketType] = useState("Vé lượt R-M1");

  useEffect(() => {
    async function loadCards() {
      try {
        const data = await fetchApi("/api/cards");
        if (Array.isArray(data)) {
          setCards(data.map((c: any) => ({
            id: c.id,
            uid: c.cardUid,
            passengerType: c.type === "IDENTIFIED" ? "STUDENT" : "NORMAL",
            balance: 50000, // mock balance
            status: c.status || "ACTIVE",
            linkedTicket: c.linkedUserId ? "Vé liên kết" : null,
            createdAt: c.createdAt ? new Date(c.createdAt).toISOString().replace("T", " ").substring(0, 16) : ""
          })));
        }
      } catch (err: any) {
        console.warn("FMC Cards API is offline. Running in mock fallback mode. Error:", err.message);
        setIsOffline(true);
      }
    }
    loadCards();
  }, []);

  const handleOpenCreateModal = () => {
    setUid(generateRandomUid());
    setPassengerType("NORMAL");
    setBalance(50000);
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
    try {
      const newCard = await fetchApi("/api/cards", {
        method: "POST",
        body: JSON.stringify({
          cardUid: uid,
          type: passengerType === "NORMAL" ? "ANON" : "IDENTIFIED",
          supportsMetro: true,
          supportsBus: true
        })
      });
      
      const createdCard: TransportCard = {
        id: newCard.id,
        uid: newCard.cardUid,
        passengerType: passengerType,
        balance: balance,
        status: newCard.status || "ISSUED",
        linkedTicket: null,
        createdAt: newCard.createdAt ? new Date(newCard.createdAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16)
      };
      setCards([createdCard, ...cards]);
    } catch (err: any) {
      console.warn("POST /api/cards failed, using mock local state. Error:", err.message);
      setIsOffline(true);
      const fallbackCard: TransportCard = {
        id: "c-" + Date.now(),
        uid,
        passengerType,
        balance,
        status: "ISSUED",
        linkedTicket: null,
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
      };
      setCards([fallbackCard, ...cards]);
    }
    setIsModalOpen(false);
  };

  const handleAction = async (id: string, action: "ACTIVATE" | "SUSPEND" | "REVOKE") => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    
    let nextStatus: TransportCard["status"] = card.status;
    if (action === "ACTIVATE") nextStatus = "ACTIVE";
    else if (action === "SUSPEND") nextStatus = "SUSPENDED";
    else if (action === "REVOKE") nextStatus = "REVOKED";

    setCards(cards.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)));

    try {
      if (action === "REVOKE") {
        await fetchApi("/api/cards/" + id + "/revoke", { method: "PATCH" });
      } else if (action === "SUSPEND") {
        await fetchApi("/api/cards/" + id + "/suspend", { method: "PATCH" });
      } else if (action === "ACTIVATE") {
        if (card.status === "SUSPENDED") {
          await fetchApi("/api/cards/" + id + "/unsuspend", { method: "PATCH" });
        } else {
          await fetchApi("/api/cards/" + id + "/activate", { method: "PATCH" });
        }
      }
    } catch (err: any) {
      console.warn("Card action API failed, using mock local state. Error:", err.message);
      setIsOffline(true);
    }
  };

  const handleOpenLinkModal = (card: TransportCard) => {
    setSelectedCard(card);
    setTicketType("Vé lượt - R-M1 (Cát Linh - Hà Đông)");
    setIsLinkModalOpen(true);
  };

  const handleLinkTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCard) {
      setCards(
        cards.map((c) =>
          c.id === selectedCard.id ? { ...c, linkedTicket: ticketType, status: "ACTIVE" } : c
        )
      );

      try {
        const dummyTicketId = "11111111-1111-1111-1111-111111111111";
        await fetchApi("/api/cards/" + selectedCard.id + "/link-ticket", {
          method: "POST",
          body: JSON.stringify({ ticketId: dummyTicketId })
        });
      } catch (err: any) {
        console.warn("Link ticket API failed, using mock local state. Error:", err.message);
        setIsOffline(true);
      }
    }
    setIsLinkModalOpen(false);
  };

  const handleUnlinkTicket = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn hủy liên kết vé khỏi thẻ này?")) {
      setCards(
        cards.map((c) =>
          c.id === id ? { ...c, linkedTicket: null } : c
        )
      );

      try {
        await fetchApi("/api/cards/" + id + "/unlink-ticket", {
          method: "POST"
        });
      } catch (err: any) {
        console.warn("Unlink ticket API failed, using mock local state. Error:", err.message);
        setIsOffline(true);
      }
    }
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch = c.uid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesType = typeFilter === "ALL" || c.passengerType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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
          <div className="text-3xl font-bold text-on-surface">1,254,580</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Hoạt động (Active)
          </h3>
          <div className="text-3xl font-bold text-tertiary-fixed-dim">1,200,450</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Tạm dừng (Suspended)
          </h3>
          <div className="text-3xl font-bold text-secondary-fixed-dim">45,200</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="font-label-caps text-xs text-on-surface-variant uppercase mb-1">
            Danh sách đen (Blacklisted)
          </h3>
          <div className="text-3xl font-bold text-error">8,930</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            className="bg-surface-container-high border-none rounded-full py-1.5 pl-10 pr-4 font-body-sm text-body-sm text-on-surface focus:ring-2 focus:ring-secondary w-full outline-none"
            placeholder="Tìm theo mã UID thẻ..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full sm:w-40"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE (Hoạt động)</option>
            <option value="ISSUED">ISSUED (Chưa kích hoạt)</option>
            <option value="SUSPENDED">SUSPENDED (Tạm khóa)</option>
            <option value="REVOKED">REVOKED (Hủy bỏ)</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container-high border-none rounded-md py-1.5 px-3 font-body-sm text-body-sm text-on-surface outline-none cursor-pointer w-full sm:w-40"
          >
            <option value="ALL">Tất cả đối tượng</option>
            <option value="NORMAL">NORMAL (Thường)</option>
            <option value="STUDENT">STUDENT (Học sinh/SV)</option>
            <option value="SENIOR">SENIOR (Người cao tuổi)</option>
            <option value="PRIORITY">PRIORITY (Ưu tiên)</option>
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
                  Loại đối tượng
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold text-right">
                  Số dư ví (₫)
                </th>
                <th className="p-table-cell-padding font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  Vé liên kết
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
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => (
                  <tr
                    key={card.id}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[48px]"
                  >
                    <td className="p-table-cell-padding text-on-surface font-semibold font-data-mono">
                      {card.uid}
                    </td>
                    <td className="p-table-cell-padding text-on-surface-variant font-semibold">
                      {card.passengerType}
                    </td>
                    <td className="p-table-cell-padding text-right font-data-mono text-on-surface font-semibold">
                      {card.balance.toLocaleString()}
                    </td>
                    <td className="p-table-cell-padding text-on-surface">
                      {card.linkedTicket ? (
                        <span className="inline-flex items-center gap-1.5 text-secondary-fixed-dim">
                          <CheckCircle className="h-3.5 w-3.5 text-tertiary-fixed-dim" /> {card.linkedTicket}
                          <button
                            onClick={() => handleUnlinkTicket(card.id)}
                            className="text-error hover:underline text-[10px] uppercase font-semibold ml-1 cursor-pointer"
                            title="Hủy liên kết vé"
                          >
                            Gỡ
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenLinkModal(card)}
                          className="inline-flex items-center gap-1 text-xs text-outline hover:text-secondary-fixed-dim hover:underline cursor-pointer"
                        >
                          <LinkIcon className="h-3 w-3" /> Liên kết vé
                        </button>
                      )}
                    </td>
                    <td className="p-table-cell-padding">
                      <span
                        className={`px-2 py-0.5 rounded font-body-sm text-[11px] font-medium inline-flex items-center gap-1 ${
                          card.status === "ACTIVE"
                            ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant"
                            : card.status === "SUSPENDED"
                            ? "bg-secondary-fixed-dim/20 text-on-secondary-fixed-variant"
                            : card.status === "ISSUED"
                            ? "bg-surface-variant text-on-surface-variant"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {card.status === "ACTIVE" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> ACTIVE
                          </>
                        ) : card.status === "SUSPENDED" ? (
                          <>
                            <AlertTriangle className="h-3 w-3" /> SUSPENDED
                          </>
                        ) : card.status === "ISSUED" ? (
                          <>
                            <Eye className="h-3 w-3" /> ISSUED
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> REVOKED
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-table-cell-padding text-right">
                      <div className="inline-flex gap-2">
                        {card.status === "ISSUED" && (
                          <button
                            onClick={() => handleAction(card.id, "ACTIVATE")}
                            className="px-2 py-0.5 bg-tertiary-fixed-dim/20 hover:bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant rounded text-[10px] font-semibold uppercase cursor-pointer"
                          >
                            Kích hoạt
                          </button>
                        )}
                        {card.status === "ACTIVE" && (
                          <button
                            onClick={() => handleAction(card.id, "SUSPEND")}
                            className="px-2 py-0.5 bg-secondary-fixed-dim/20 hover:bg-secondary-fixed-dim/30 text-on-secondary-fixed-variant rounded text-[10px] font-semibold uppercase cursor-pointer"
                          >
                            Khóa tạm thời
                          </button>
                        )}
                        {card.status === "SUSPENDED" && (
                          <button
                            onClick={() => handleAction(card.id, "ACTIVATE")}
                            className="px-2 py-0.5 bg-tertiary-fixed-dim/20 hover:bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant rounded text-[10px] font-semibold uppercase cursor-pointer"
                          >
                            Mở khóa
                          </button>
                        )}
                        {card.status !== "REVOKED" && (
                          <button
                            onClick={() => handleAction(card.id, "REVOKE")}
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
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
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
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-lg font-bold text-on-surface">Phát Hành Thẻ Vật Lý Mới</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Mã thẻ định danh (UID)
                </label>
                <input
                  type="text"
                  required
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Nhóm hành khách (Đối tượng)
                </label>
                <select
                  value={passengerType}
                  onChange={(e) => setPassengerType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                >
                  <option value="NORMAL">Thường (NORMAL)</option>
                  <option value="STUDENT">Học sinh / Sinh viên (STUDENT)</option>
                  <option value="SENIOR">Người cao tuổi (SENIOR)</option>
                  <option value="PRIORITY">Ưu tiên miễn giảm (PRIORITY)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Nạp tiền ví điện tử ban đầu (₫)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={balance}
                  onChange={(e) => setBalance(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
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
                  Phát hành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Liên kết vé */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsLinkModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant mb-4">
              <h3 className="text-lg font-bold text-on-surface">Liên Kết Vé Vào Thẻ</h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLinkTicketSubmit} className="space-y-4">
              <div className="bg-surface-container-low p-3 rounded border border-outline-variant">
                <div className="text-xs text-on-surface-variant mb-1 font-semibold">Thẻ chọn liên kết:</div>
                <div className="text-sm font-bold font-data-mono text-on-surface">{selectedCard?.uid}</div>
                <div className="text-xs text-on-surface-variant">Đối tượng: {selectedCard?.passengerType}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Chọn loại vé cần nạp vào thẻ
                </label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                >
                  <option value="Vé lượt - R-M1 (Cát Linh - Hà Đông)">Vé lượt - Tuyến R-M1 (Cát Linh - Hà Đông)</option>
                  <option value="Vé tháng - R-M1">Vé tháng 1 Tuyến - R-M1</option>
                  <option value="Vé tháng liên tuyến (Bus + Metro)">Vé tháng Liên Tuyến (Toàn mạng lưới)</option>
                  <option value="Vé lượt - R-B01">Vé lượt - Tuyến Bus R-B01</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Xác nhận nạp vé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
