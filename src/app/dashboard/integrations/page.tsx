"use client";

import React, { useState } from "react";
import {
  Sliders,
  Plus,
  CheckCircle,
  XCircle,
  Copy,
  Eye,
  EyeOff,
  Link,
  Shield,
  RefreshCw,
  X,
  Server,
  Code
} from "lucide-react";

interface ApiClient {
  clientId: string;
  clientName: string;
  role: "AFC_DEVICE" | "PARTNER_APP" | "ADMIN_APP";
  status: "ACTIVE" | "REVOKED";
  tokenPrefix: string;
  createdAt: string;
}

interface WebhookSub {
  id: string;
  url: string;
  events: string[];
  status: "ACTIVE" | "INACTIVE";
  secretKey: string;
}

export default function IntegrationsPage() {
  const [clients, setClients] = useState<ApiClient[]>([
    {
      clientId: "cli-hurc-afc-01",
      clientName: "HURC Cát Linh Ticket Validators",
      role: "AFC_DEVICE",
      status: "ACTIVE",
      tokenPrefix: "fmc_live_afc_catlinh_...",
      createdAt: "2026-01-15 11:20"
    },
    {
      clientId: "cli-transerco-bus-02",
      clientName: "TRANSERCO Bus GPS & Ticket Readers",
      role: "AFC_DEVICE",
      status: "ACTIVE",
      tokenPrefix: "fmc_live_afc_bus_...",
      createdAt: "2026-01-20 14:05"
    },
    {
      clientId: "cli-viettelpay-app-03",
      clientName: "ViettelPay Ticket Selling Integration",
      role: "PARTNER_APP",
      status: "ACTIVE",
      tokenPrefix: "fmc_live_part_vtp_...",
      createdAt: "2026-02-10 09:30"
    }
  ]);

  const [webhooks, setWebhooks] = useState<WebhookSub[]>([
    {
      id: "wh-vtp",
      url: "https://partner-api.viettelpay.vn/fmc-webhook",
      events: ["transaction.created", "blacklist.sync"],
      status: "ACTIVE",
      secretKey: "whsec_VTP_fmc_integration_2026_key"
    },
    {
      id: "wh-transerco",
      url: "https://fmc-integration.transerco.com.vn/api/v1/notify",
      events: ["blacklist.sync"],
      status: "ACTIVE",
      secretKey: "whsec_TRC_bus_sync_secret_key"
    }
  ]);

  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [showSecretId, setShowSecretId] = useState<string | null>(null);

  // Client form
  const [clientName, setClientName] = useState("");
  const [clientRole, setClientRole] = useState<"AFC_DEVICE" | "PARTNER_APP">("AFC_DEVICE");

  // Webhook form
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["transaction.created"]);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newCli: ApiClient = {
      clientId: `cli-${clientName.toLowerCase().replace(/\s+/g, "-")}-${Math.floor(10 + Math.random() * 90)}`,
      clientName,
      role: clientRole,
      status: "ACTIVE",
      tokenPrefix: `fmc_live_${clientRole === "AFC_DEVICE" ? "afc" : "part"}_${Math.random().toString(36).substring(2, 6)}_...`,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    setClients([...clients, newCli]);
    setIsClientModalOpen(false);
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    const newWh: WebhookSub = {
      id: `wh-${Math.floor(100 + Math.random() * 900)}`,
      url: webhookUrl,
      events: selectedEvents,
      status: "ACTIVE",
      secretKey: `whsec_${Math.random().toString(36).substring(2, 10).toUpperCase()}_key`
    };
    setWebhooks([...webhooks, newWh]);
    setIsWebhookModalOpen(false);
  };

  const handleToggleClient = (id: string) => {
    setClients(
      clients.map((c) =>
        c.clientId === id ? { ...c, status: c.status === "ACTIVE" ? "REVOKED" : "ACTIVE" } : c
      )
    );
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(
      webhooks.map((w) =>
        w.id === id ? { ...w, status: w.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : w
      )
    );
  };

  const handleToggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Sliders className="h-6 w-6 text-secondary" /> Cấu hình Tích hợp hệ thống
          </h2>
          <p className="text-sm text-on-surface-variant">
            Quản lý khóa API kết nối thiết bị AFC đầu cuối và cấu hình cổng đẩy dữ liệu Webhook đối tác.
          </p>
        </div>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-grid-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <Server className="h-10 w-10 text-tertiary-fixed-dim" />
          <div>
            <h3 className="font-label-caps text-xs text-on-surface-variant uppercase">
              HURC API Gateway
            </h3>
            <div className="text-sm font-semibold text-on-surface flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span> ONLINE
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <Server className="h-10 w-10 text-tertiary-fixed-dim" />
          <div>
            <h3 className="font-label-caps text-xs text-on-surface-variant uppercase">
              TRANSERCO Hub Sync
            </h3>
            <div className="text-sm font-semibold text-on-surface flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span> ONLINE
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <Link className="h-10 w-10 text-secondary-fixed-dim" />
          <div>
            <h3 className="font-label-caps text-xs text-on-surface-variant uppercase">
              Blacklist Distribution
            </h3>
            <div className="text-sm font-semibold text-on-surface flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span> ACTIVE (Sync: 5s)
            </div>
          </div>
        </div>
      </div>

      {/* API Clients Grid & Webhooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-grid-gutter">
        {/* API Clients Section */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-secondary" /> Danh sách Thiết bị & Client Kết nối (API Clients)
            </h3>
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="p-1 hover:bg-surface-container-high rounded text-secondary flex items-center gap-1 text-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm Client
            </button>
          </div>

          <div className="space-y-3">
            {clients.map((cli) => (
              <div key={cli.clientId} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-on-surface">{cli.clientName}</span>
                    <span className="text-[9px] bg-surface-container-high px-1.5 py-0.5 rounded text-outline font-data-mono">{cli.role}</span>
                  </div>
                  <div className="text-[10px] text-outline font-data-mono flex items-center gap-1 select-all">
                    <span>ID: {cli.clientId}</span> | <span>Prefix: {cli.tokenPrefix}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    cli.status === "ACTIVE" ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant" : "bg-error-container text-on-error-container"
                  }`}>
                    {cli.status === "ACTIVE" ? "ACTIVE" : "REVOKED"}
                  </span>
                  <button
                    onClick={() => handleToggleClient(cli.clientId)}
                    className={`p-1 rounded cursor-pointer ${
                      cli.status === "ACTIVE" ? "text-error hover:bg-error-container/20" : "text-tertiary-fixed-dim hover:bg-tertiary-fixed-dim/20"
                    }`}
                    title={cli.status === "ACTIVE" ? "Thu hồi Key" : "Khôi phục Key"}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm">
              <Code className="h-4 w-4 text-secondary" /> Cổng đẩy dữ liệu (Webhook Subscriptions)
            </h3>
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="p-1 hover:bg-surface-container-high rounded text-secondary flex items-center gap-1 text-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm Webhook
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-on-surface truncate max-w-[250px]" title={wh.url}>{wh.url}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      wh.status === "ACTIVE" ? "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant" : "bg-outline-variant text-on-surface-variant"
                    }`}>
                      {wh.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <button
                      onClick={() => handleToggleWebhook(wh.id)}
                      className="text-on-surface-variant hover:text-primary cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {wh.events.map(ev => (
                    <span key={ev} className="text-[9px] bg-secondary-container/10 border border-secondary-container/30 px-1.5 py-0.5 rounded text-secondary-fixed-dim font-data-mono">
                      {ev}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-outline font-data-mono">
                  <span>Secret:</span>
                  <span className="select-all">
                    {showSecretId === wh.id ? wh.secretKey : "••••••••••••••••••••••••"}
                  </span>
                  <button
                    onClick={() => setShowSecretId(showSecretId === wh.id ? null : wh.id)}
                    className="p-0.5 text-on-surface-variant hover:text-primary cursor-pointer"
                  >
                    {showSecretId === wh.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsClientModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="text-lg font-bold text-on-surface">
                Thêm Kết Nối Client Mới
              </h3>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Tên Client / Thiết bị tích hợp
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đầu đọc Xe Bus Tuyến 02"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Vai trò quyền hạn (Role)
                </label>
                <select
                  value={clientRole}
                  onChange={(e) => setClientRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm cursor-pointer"
                >
                  <option value="AFC_DEVICE">AFC_DEVICE (Đồng bộ thẻ, đẩy giao dịch)</option>
                  <option value="PARTNER_APP">PARTNER_APP (Liên thông bán vé, thanh toán)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Tạo Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsWebhookModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6 z-10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="text-lg font-bold text-on-surface">
                Đăng Ký Đẩy Dữ Liệu Webhook
              </h3>
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-full text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Đường dẫn nhận Webhook (Payload URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://your-domain.com/fmc-webhook-receiver"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-sm font-data-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Sự kiện đăng ký nhận (Event subscriptions)
                </label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes("transaction.created")}
                      onChange={() => handleToggleEvent("transaction.created")}
                      className="rounded text-secondary focus:ring-secondary"
                    />
                    <span>transaction.created (Khi có giao dịch quẹt thẻ phát sinh)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes("blacklist.sync")}
                      onChange={() => handleToggleEvent("blacklist.sync")}
                      className="rounded text-secondary focus:ring-secondary"
                    />
                    <span>blacklist.sync (Đồng bộ danh sách đen khi có thay đổi)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsWebhookModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors text-xs font-semibold uppercase cursor-pointer"
                >
                  Đăng ký Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
