"use client";

import React, { useState } from "react";
import {
  FileText,
  Info,
  Calculator,
  Code,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Coins,
  Cpu
} from "lucide-react";

export default function RevenueSharePage() {
  // Simulator State
  const [ticketPrice, setTicketPrice] = useState<number>(200000);

  // Operator 1 (Metro - HURC)
  const [op1Trips, setOp1Trips] = useState<number>(10);
  const [op1Km, setOp1Km] = useState<number>(50);
  const [op1Base, setOp1Base] = useState<number>(8000);
  const [op1Rate, setOp1Rate] = useState<number>(850);

  // Operator 2 (Bus - TRANSERCO)
  const [op2Trips, setOp2Trips] = useState<number>(15);
  const [op2Km, setOp2Km] = useState<number>(45);
  const [op2Base, setOp2Base] = useState<number>(3000);
  const [op2Rate, setOp2Rate] = useState<number>(450);

  // Calculations
  const op1Weight = op1Trips * op1Base + op1Km * op1Rate;
  const op2Weight = op2Trips * op2Base + op2Km * op2Rate;
  const totalWeight = op1Weight + op2Weight;

  const op1Ratio = totalWeight > 0 ? op1Weight / totalWeight : 0;
  const op2Ratio = totalWeight > 0 ? op2Weight / totalWeight : 0;

  const op1Share = ticketPrice * op1Ratio;
  const op2Share = ticketPrice * op2Ratio;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <FileText className="h-6 w-6 text-secondary" /> Công thức Phân bổ Doanh thu (QD3316)
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Mô tả thuật toán phân chia doanh thu vé liên thông định kỳ giữa các đơn vị vận hành dựa trên trọng số lượt đi và cự ly.
        </p>
      </div>

      {/* Math Formula Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
          <Info className="h-5 w-5 text-secondary" /> Công thức Toán học
        </h3>
        
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Doanh thu thu được từ vé định kỳ (ví dụ: vé tháng liên tuyến) được phân chia cho từng tuyến của các nhà vận hành theo tỷ trọng chi phí tính toán tương đương của tuyến đó:
        </p>

        {/* Render Fraction Formula in HTML/CSS */}
        <div className="flex items-center justify-center gap-3 py-6 bg-surface-container-low rounded-xl border border-outline-variant/30 my-4 select-none">
          <div className="text-lg font-bold text-on-surface font-data-mono">DT<sub>i</sub> =</div>
          
          <div className="flex flex-col items-center">
            <div className="px-3 pb-1 border-b-2 border-outline-variant text-center text-[11px] font-bold text-on-surface font-data-mono">
              a<sub>i</sub> × Giá mở cửa<sub>i</sub> + b<sub>i</sub> × Giá 1km<sub>i</sub>
            </div>
            <div className="px-3 pt-1 text-center text-[11px] font-bold text-outline font-data-mono">
              ∑<sub>j=1</sub><sup>n</sup> (a<sub>j</sub> × Giá mở cửa<sub>j</sub> + b<sub>j</sub> × Giá 1km<sub>j</sub>)
            </div>
          </div>
          
          <div className="text-lg font-bold text-on-surface font-data-mono">×</div>
          
          <div className="text-[11px] font-bold text-secondary-fixed-dim bg-secondary-container/20 px-2 py-0.5 rounded border border-secondary/20 font-data-mono">
            Giá vé định kỳ
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5 text-xs text-on-surface-variant bg-surface-container-low/50 p-4 rounded-lg border border-outline-variant/20">
          <div className="flex items-start gap-2">
            <span className="font-bold font-data-mono text-secondary-fixed-dim shrink-0">DT<sub>i</sub> :</span>
            <span>Doanh thu phân chia cho nhà vận hành / tuyến thứ <span className="font-semibold font-data-mono">i</span>.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold font-data-mono text-secondary-fixed-dim shrink-0">a<sub>i</sub> :</span>
            <span>Số lượt hành khách sử dụng vé định kỳ để đi trên tuyến <span className="font-semibold font-data-mono">i</span> (Số lượt quẹt thẻ).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold font-data-mono text-secondary-fixed-dim shrink-0">b<sub>i</sub> :</span>
            <span>Tổng cự ly di chuyển thực tế của hành khách trên tuyến <span className="font-semibold font-data-mono">i</span> (Đơn vị: Km).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold font-data-mono text-secondary-fixed-dim shrink-0">Giá mở cửa<sub>i</sub> :</span>
            <span>Mức phí cơ bản của phương thức vận tải tương ứng cấu hình trong Fare Rule.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold font-data-mono text-secondary-fixed-dim shrink-0">Giá 1km<sub>i</sub> :</span>
            <span>Đơn giá mỗi Km tiếp theo của phương thức tương ứng.</span>
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-outline-variant pb-3">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Calculator className="h-5 w-5 text-secondary" /> Trình giả lập Tính toán Phân bổ
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Thay đổi các thông số bên dưới để xem tỷ lệ phân bổ doanh thu trực tiếp giữa 2 Operator đại diện (Metro và Bus).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* General and Operator 1 Parameters */}
          <div className="space-y-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
            <h4 className="text-xs font-bold text-secondary-fixed-dim uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/40 pb-1.5">
              <span>Mức Vé & Đơn vị 1 (Đường sắt)</span>
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                  Giá trị vé định kỳ cần phân chia (đ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="border-t border-outline-variant/30 pt-3 space-y-3">
                <div className="text-[11px] font-bold text-on-surface">Metro - Thiết lập quy tắc & Lượt đi</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-outline mb-0.5">Giá mở cửa (đ)</label>
                    <input
                      type="number"
                      value={op1Base}
                      onChange={(e) => setOp1Base(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-outline mb-0.5">Giá mỗi Km (đ)</label>
                    <input
                      type="number"
                      value={op1Rate}
                      onChange={(e) => setOp1Rate(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-outline mb-0.5">Số lượt đi (a₁)</label>
                    <input
                      type="number"
                      min="0"
                      value={op1Trips}
                      onChange={(e) => setOp1Trips(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-outline mb-0.5">Quãng đường (b₁ - km)</label>
                    <input
                      type="number"
                      min="0"
                      value={op1Km}
                      onChange={(e) => setOp1Km(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operator 2 Parameters */}
          <div className="space-y-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
            <h4 className="text-xs font-bold text-tertiary-fixed-dim uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/40 pb-1.5">
              <span>Đơn vị 2 (Xe buýt)</span>
            </h4>
            
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-on-surface">Bus - Thiết lập quy tắc & Lượt đi</div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-outline mb-0.5">Giá mở cửa (đ)</label>
                  <input
                    type="number"
                    value={op2Base}
                    onChange={(e) => setOp2Base(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-outline mb-0.5">Giá mỗi Km (đ)</label>
                  <input
                    type="number"
                    value={op2Rate}
                    onChange={(e) => setOp2Rate(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-outline mb-0.5">Số lượt đi (a₂)</label>
                  <input
                    type="number"
                    min="0"
                    value={op2Trips}
                    onChange={(e) => setOp2Trips(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-outline mb-0.5">Quãng đường (b₂ - km)</label>
                  <input
                    type="number"
                    min="0"
                    value={op2Km}
                    onChange={(e) => setOp2Km(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1 bg-surface-bright border border-outline-variant rounded text-xs font-data-mono outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="bg-surface-container-high p-4 rounded-xl border border-outline-variant/60 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/60 pb-1.5 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-secondary" /> Kết quả Phân chia thực tế
              </h4>

              <div className="mt-4 space-y-4 text-xs">
                {/* Operator 1 Metro Shares */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-secondary-fixed-dim">1. Đường sắt (HURC)</span>
                    <span className="font-data-mono text-on-surface">{(op1Ratio * 100).toFixed(2)}%</span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-data-mono">
                    W₁ = {op1Trips} × {op1Base.toLocaleString()} + {op1Km} × {op1Rate.toLocaleString()} = {op1Weight.toLocaleString()}
                  </div>
                  <div className="text-sm font-bold text-on-surface font-data-mono">
                    ₫ {Math.round(op1Share).toLocaleString()}
                  </div>
                </div>

                {/* Operator 2 Bus Shares */}
                <div className="space-y-1 border-t border-outline-variant/40 pt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-tertiary-fixed-dim">2. Xe buýt (TRANSERCO)</span>
                    <span className="font-data-mono text-on-surface">{(op2Ratio * 100).toFixed(2)}%</span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-data-mono">
                    W₂ = {op2Trips} × {op2Base.toLocaleString()} + {op2Km} × {op2Rate.toLocaleString()} = {op2Weight.toLocaleString()}
                  </div>
                  <div className="text-sm font-bold text-on-surface font-data-mono">
                    ₫ {Math.round(op2Share).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-outline-variant/60 pt-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-on-surface-variant">Tổng Trọng số (Σ W):</span>
                <span className="font-data-mono text-on-surface">{totalWeight.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold mt-1">
                <span className="text-on-surface-variant">Tổng doanh thu chia:</span>
                <span className="font-data-mono text-secondary-fixed-dim text-sm">₫ {ticketPrice.toLocaleString()}</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
