"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils/currency";
import { Sale } from "@/lib/types";

interface TransactionCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSuccess: () => void;
}

export function TransactionCorrectionModal({
  isOpen,
  onClose,
  sale,
  onSuccess,
}: TransactionCorrectionModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [newAmount, setNewAmount] = useState<string>("");
  const [newPaymentMethod, setNewPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (sale) {
      setNewAmount(sale.amount.toString());
      setNewPaymentMethod(sale.payment_method);
      setReason("");
    }
  }, [sale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    if (!reason || reason.trim().length < 5) {
      toastError(
        "A detailed correction reason (minimum 5 characters) is required for audit logs.",
        "Reason Required"
      );
      return;
    }

    const numAmount = parseFloat(newAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toastError("Please enter a valid amount greater than zero.", "Invalid Amount");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/sales/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: sale.id,
          newAmount: numAmount,
          newPaymentMethod,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to commit correction");
      }

      toastSuccess(
        `Transaction ${sale.transaction_number} corrected to ${formatINR(numAmount)}!`,
        "Correction Saved"
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Correction error:", err);
      toastError(err.message, "Correction Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sale) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Correct Sale Transaction"
      description="All corrections are permanently recorded in the immutable audit trail."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Transaction Summary Header */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Transaction ID:</span>
            <span className="font-mono font-bold text-slate-900">{sale.transaction_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Staff Member:</span>
            <span className="font-semibold text-slate-900">
              {(sale as any).staff_name || sale.staff?.full_name || "Staff"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Original Value:</span>
            <span className="font-bold text-emerald-600">
              {formatINR(sale.amount)} ({sale.payment_method})
            </span>
          </div>
        </div>

        {/* New Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Corrected Amount (₹ INR)
          </label>
          <Input
            type="number"
            step="0.01"
            min="1"
            required
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="bg-white border-slate-200 text-slate-900 focus:border-[#5850EC]"
          />
        </div>

        {/* New Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNewPaymentMethod("CASH")}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                newPaymentMethod === "CASH"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Cash Payment
            </button>
            <button
              type="button"
              onClick={() => setNewPaymentMethod("UPI")}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                newPaymentMethod === "UPI"
                  ? "bg-indigo-50 border-[#5850EC] text-[#5850EC] shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              GPay / UPI Payment
            </button>
          </div>
        </div>

        {/* Mandatory Correction Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Mandatory Correction Reason</span>
            <span className="text-[10px] text-amber-600 font-mono">Min 5 chars</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder="e.g., Staff entered ₹500 instead of ₹50. Customer paid ₹50 Cash."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5850EC]"
          />
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            This action will modify the live ledger and create an entry in the immutable audit log containing your user ID, previous values, and reasoning.
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !reason || reason.trim().length < 5}
            className="w-2/3 py-2.5 rounded-full bg-[#5850EC] hover:bg-[#4F46E5] text-white text-xs font-bold shadow-md shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Applying..." : "Apply Correction"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
