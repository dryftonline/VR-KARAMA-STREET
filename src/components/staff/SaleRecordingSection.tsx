"use client";

import { useState } from "react";
import { Check, Banknote, Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatINR, isValidMonetaryAmount } from "@/lib/utils/currency";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

interface SaleRecordingSectionProps {
  onSaleRecorded?: () => void;
}

export function SaleRecordingSection({ onSaleRecorded }: SaleRecordingSectionProps) {
  const { error: toastError, success: toastSuccess } = useToast();

  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success state for transaction confirmation modal
  const [lastSale, setLastSale] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleQuickAdd = (addVal: number) => {
    const currentNum = parseFloat(amount) || 0;
    const newTotal = (currentNum + addVal).toFixed(0);
    setAmount(newTotal);
  };

  const handleClear = () => {
    setAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod) {
      toastError("Please select a Payment Method (Cash or GPay / UPI).", "Payment Method Required");
      return;
    }

    if (!isValidMonetaryAmount(amount)) {
      toastError("Please enter a valid amount greater than ₹0.00.", "Invalid Amount");
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      toastError("Sale amount must be greater than zero.", "Invalid Amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/sales/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          paymentMethod,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to commit sale record");
      }

      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      setLastSale(data.sale);
      setShowSuccessModal(true);

      // Reset form
      setAmount("");
      setPaymentMethod(null);
      setNotes("");

      toastSuccess(`Sale of ${formatINR(numAmount)} recorded!`, "Sale Recorded");
      if (onSaleRecorded) onSaleRecorded();
    } catch (err: any) {
      console.error("Sale recording failed:", err);
      toastError(err.message, "Transaction Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="finnova-card p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Record Sale</h2>
            <p className="text-xs text-slate-500">
              One-touch sales submission for VR Street Karama
            </p>
          </div>
          {paymentMethod && (
            <span
              className={cn(
                "text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider",
                paymentMethod === "CASH"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-indigo-50 text-[#5850EC] border border-indigo-200"
              )}
            >
              {paymentMethod === "CASH" ? "Cash Selected" : "GPay Selected"}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: SELECT PAYMENT METHOD */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Step 1: Payment Method <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* CASH BUTTON */}
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 select-none active:scale-[0.98]",
                  paymentMethod === "CASH"
                    ? "border-emerald-500 bg-emerald-50/60 shadow-md text-emerald-900"
                    : "border-slate-200 bg-slate-50/60 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                    paymentMethod === "CASH"
                      ? "bg-emerald-500 text-white shadow"
                      : "bg-white border border-slate-200 text-emerald-600"
                  )}
                >
                  <Banknote className="w-6 h-6" />
                </div>
                <span className="text-base font-bold tracking-wide">CASH</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Physical Cash</span>

                {paymentMethod === "CASH" && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* GPAY / UPI BUTTON */}
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 select-none active:scale-[0.98]",
                  paymentMethod === "UPI"
                    ? "border-[#5850EC] bg-indigo-50/70 shadow-md text-indigo-900"
                    : "border-slate-200 bg-slate-50/60 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                    paymentMethod === "UPI"
                      ? "bg-[#5850EC] text-white shadow"
                      : "bg-white border border-slate-200 text-[#5850EC]"
                  )}
                >
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-base font-bold tracking-wide">GPay / UPI</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Digital Payment</span>

                {paymentMethod === "UPI" && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#5850EC] text-white flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* STEP 2: ENTER AMOUNT */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Step 2: Enter Amount (INR) <span className="text-rose-500">*</span>
            </label>

            {/* Giant Currency Input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl sm:text-3xl font-extrabold text-[#5850EC] pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="1"
                placeholder="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-16 sm:h-20 pl-12 pr-4 rounded-2xl bg-slate-50/80 border-2 border-slate-200 focus:border-[#5850EC] text-slate-900 text-3xl sm:text-4xl font-black tracking-tight placeholder:text-slate-300 focus:outline-none transition-colors tabular-nums focus:bg-white"
              />
            </div>

            {/* Quick Amount Add Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="px-3.5 py-1.5 rounded-full bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-100 text-xs font-bold text-[#5850EC] transition-colors active:scale-95"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors ml-auto active:scale-95"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Optional Short Notes */}
          <div>
            <input
              type="text"
              placeholder="Optional notes (e.g. VIP VR session, customer request)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#5850EC] focus:bg-white transition-colors"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting || !paymentMethod || !amount || parseFloat(amount) <= 0}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#5850EC] to-[#4F46E5] text-white text-base sm:text-lg font-black tracking-wide shadow-lg shadow-indigo-500/30 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Recording Sale...</span>
            ) : (
              <span>
                RECORD SALE {amount && parseFloat(amount) > 0 ? `(${formatINR(amount)})` : ""}
              </span>
            )}
          </button>
        </form>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sale Successfully Recorded"
        maxWidth="sm"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-fade-in">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Transaction ID
            </div>
            <div className="text-lg font-mono font-bold text-slate-900">
              {lastSale?.transactionNumber || "--"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <div className="text-3xl font-black text-slate-900">
              {formatINR(lastSale?.amount)}
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
              {lastSale?.paymentMethod === "CASH" ? "Cash Payment" : "GPay / UPI Payment"}
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Committed to shared ledger &amp; push notification dispatched.
          </div>

          <button
            className="w-full py-3.5 rounded-2xl bg-[#5850EC] hover:bg-[#4F46E5] text-white text-sm font-bold shadow-md shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            onClick={() => setShowSuccessModal(false)}
          >
            <span>Record Next Sale</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Modal>
    </>
  );
}
