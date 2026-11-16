"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils/currency";
import { formatTimeIST, formatDateIST } from "@/lib/utils/timezone";
import { Sale } from "@/lib/types";

interface DeleteSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSuccess: () => void;
}

export function DeleteSaleModal({
  isOpen,
  onClose,
  sale,
  onSuccess,
}: DeleteSaleModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [reason, setReason] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!sale) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsDeleting(true);
      const res = await fetch("/api/sales/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: sale.id,
          reason: reason.trim() || "Deleted by Owner",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete sale transaction");
      }

      toastSuccess(
        `Transaction ${sale.transaction_number} was permanently deleted.`,
        "Sale Deleted"
      );

      // Trigger cross-component refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refresh-owner-ledger"));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Delete sale error:", err);
      toastError(err.message, "Deletion Failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const staffName = (sale as any).staff_name || sale.staff?.full_name || "Staff Cashier";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Sale Transaction"
      description="Permanently remove this transaction from the live business ledger."
      maxWidth="md"
    >
      <form onSubmit={handleDelete} className="space-y-4 pt-1">
        {/* Transaction Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Transaction ID:</span>
            <span className="font-mono font-bold text-slate-900">#{sale.transaction_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Staff Member:</span>
            <span className="font-semibold text-slate-900">{staffName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Recorded Amount:</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatINR(sale.amount)} ({sale.payment_method === "UPI" ? "GPay / UPI" : "Cash"})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Recorded At:</span>
            <span className="text-slate-600">
              {formatTimeIST(sale.created_at)} • {formatDateIST(sale.created_at)}
            </span>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 leading-relaxed">
            <strong>Warning:</strong> Deleting this sale will subtract{" "}
            <strong>{formatINR(sale.amount)}</strong> from total revenue, update all sales reports, and remove it immediately from staff cashier terminals.
          </div>
        </div>

        {/* Deletion Reason (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Reason for Deletion</span>
            <span className="text-[10px] text-slate-400">Recorded in audit log</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Accidental duplicate entry, customer test, voided order"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5850EC]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Deleting..." : "Permanently Delete Sale"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

