"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  BarChart2,
  FileSpreadsheet,
  FileCode,
  Clock,
  User,
  CheckCircle,
  Plus,
  RefreshCw,
  X
} from "lucide-react";

interface ExportedReport {
  id: string;
  fileName: string;
  category: "REVENUE" | "TRAFFIC" | "ANOMALY" | "SETTLEMENT";
  format: "PDF" | "EXCEL" | "CSV";
  fileSize: string;
  generatedAt: string;
  generatedBy: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ExportedReport[]>([
    {
      id: "rep-101",
      fileName: "bao-cao-doanh-thu-lien-thong-thang-05-2026.xlsx",
      category: "REVENUE",
      format: "EXCEL",
      fileSize: "1.2 MB",
      generatedAt: "2026-06-05 15:00",
      generatedBy: "Trần Văn B (Admin)"
    },
    {
      id: "rep-102",
      fileName: "bao-cao-luu-luong-hanh-khach-tuan-22.pdf",
      category: "TRAFFIC",
      format: "PDF",
      fileSize: "840 KB",
      generatedAt: "2026-06-01 09:15",
      generatedBy: "Nguyễn Văn A (System)"
    },
    {
      id: "rep-103",
      fileName: "nhat-ky-doi-soat-va-chenh-lech-thang-04-2026.csv",
      category: "SETTLEMENT",
      format: "CSV",
      fileSize: "320 KB",
      generatedAt: "2026-05-02 10:30",
      generatedBy: "Lê Văn C (Kế toán)"
    }
  ]);

  const [category, setCategory] = useState<"REVENUE" | "TRAFFIC" | "ANOMALY" | "SETTLEMENT">("REVENUE");
  const [format, setFormat] = useState<"PDF" | "EXCEL" | "CSV">("EXCEL");
  const [dateRange, setDateRange] = useState("2026-05");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const catLabel = category === "REVENUE" ? "doanh-thu" : category === "TRAFFIC" ? "luu-luong" : category === "ANOMALY" ? "canh-bao-loi" : "quyet-toan";
      const ext = format === "PDF" ? "pdf" : format === "EXCEL" ? "xlsx" : "csv";
      const newRep: ExportedReport = {
        id: `rep-${Math.floor(104 + Math.random() * 800)}`,
        fileName: `bao-cao-${catLabel}-${dateRange}.${ext}`,
        category,
        format,
        fileSize: `${(150 + Math.floor(Math.random() * 1000))} KB`,
        generatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        generatedBy: "Trần Văn B (Admin)"
      };

      setReports([newRep, ...reports]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <FileText className="h-6 w-6 text-secondary" /> Kết xuất Báo cáo Thống kê
          </h2>
          <p className="text-sm text-on-surface-variant">
            Tạo, lưu trữ và xuất bản các báo cáo lưu lượng quẹt thẻ, báo cáo đối soát tài chính và doanh thu FMC.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
        {/* Report Generator Form */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-on-surface text-sm flex items-center gap-2 pb-2 border-b border-outline-variant">
            <BarChart2 className="h-4 w-4 text-secondary" /> Cấu hình Tham số Báo cáo
          </h3>

          <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Loại báo cáo thống kê
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-xs cursor-pointer"
                disabled={isGenerating}
              >
                <option value="REVENUE">Báo cáo doanh thu liên thông (Revenue)</option>
                <option value="TRAFFIC">Báo cáo lưu lượng & hành khách (Traffic)</option>
                <option value="SETTLEMENT">Báo cáo đối soát & phân chia (Settlement)</option>
                <option value="ANOMALY">Báo cáo sự cố & cảnh báo bất thường (Anomaly)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">
                  Định dạng tệp
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-xs cursor-pointer"
                  disabled={isGenerating}
                >
                  <option value="EXCEL">MS Excel (.xlsx)</option>
                  <option value="PDF">Adobe PDF (.pdf)</option>
                  <option value="CSV">Comma Separated Values (.csv)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">
                  Khoảng thời gian (Tháng)
                </label>
                <input
                  type="month"
                  required
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-bright border border-outline-variant rounded text-on-surface focus:ring-2 focus:ring-secondary outline-none text-xs font-data-mono"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded hover:bg-secondary-container transition-colors font-label-caps text-xs uppercase cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Đang tổng hợp dữ liệu...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Kết xuất báo cáo
                </>
              )}
            </button>
          </form>
        </div>

        {/* Exported Reports List */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm col-span-1 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-on-surface text-sm flex items-center gap-2 pb-2 border-b border-outline-variant">
            <Clock className="h-4 w-4 text-secondary" /> Danh sách báo cáo đã kết xuất thành công
          </h3>

          <div className="divide-y divide-outline-variant">
            {reports.map((rep) => (
              <div key={rep.id} className="py-3 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-3 items-start">
                  <span className="p-2 bg-surface-container-high rounded border border-outline-variant text-on-surface-variant">
                    {rep.format === "EXCEL" ? (
                      <FileSpreadsheet className="h-5 w-5 text-tertiary-fixed-dim" />
                    ) : rep.format === "PDF" ? (
                      <FileText className="h-5 w-5 text-error" />
                    ) : (
                      <FileCode className="h-5 w-5 text-secondary-fixed-dim" />
                    )}
                  </span>
                  <div>
                    <h4 className="font-semibold text-xs text-on-surface break-all">{rep.fileName}</h4>
                    <p className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-2">
                      <span>Dung lượng: <strong className="text-on-surface font-data-mono">{rep.fileSize}</strong></span>
                      <span>|</span>
                      <span>Xuất ngày: <span className="font-data-mono">{rep.generatedAt}</span></span>
                      <span>|</span>
                      <span className="flex items-center gap-0.5"><User className="h-3 w-3" /> {rep.generatedBy}</span>
                    </p>
                  </div>
                </div>

                <button
                  className="flex items-center gap-1 px-3 py-1.5 border border-outline-variant rounded text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold uppercase cursor-pointer w-full sm:w-auto justify-center"
                  onClick={() => alert(`Đang tải tệp: ${rep.fileName}`)}
                >
                  <Download className="h-3.5 w-3.5" /> Tải về
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
