"use client";

import { Clock, CheckCircle2, AlertCircle, Camera, LogOut } from "lucide-react";
import { formatTimeIST } from "@/lib/utils/timezone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffShift } from "@/lib/types";

interface ShiftStatusCardProps {
  shift: StaffShift | null;
  onOpenShiftClick: () => void;
  onCloseShiftClick: () => void;
}

export function ShiftStatusCard({
  shift,
  onOpenShiftClick,
  onCloseShiftClick,
}: ShiftStatusCardProps) {
  const isOpened = Boolean(shift?.opening_time);
  const isClosed = Boolean(shift?.closing_time);

  let statusBadge = (
    <Badge variant="outline" className="text-amber-400 border-amber-500/40 bg-amber-500/10">
      <AlertCircle className="w-3 h-3 mr-1" /> Not Opened
    </Badge>
  );

  if (isClosed) {
    statusBadge = (
      <Badge variant="outline" className="text-slate-400 border-slate-600 bg-slate-800">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Shift Closed
      </Badge>
    );
  } else if (isOpened) {
    statusBadge = (
      <Badge variant="cash" className="text-emerald-400 border-emerald-500/40 bg-emerald-500/10">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Shift Active
      </Badge>
    );
  }

  return (
    <div className="rounded-2xl bg-navy-900 border border-navy-700/80 p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold" />
          <span className="text-sm font-semibold text-white">Today&apos;s Shift Status</span>
        </div>
        {statusBadge}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800">
          <div className="text-[11px] text-slate-400 mb-1">Opening Time</div>
          <div className="text-sm font-semibold text-white">
            {isOpened ? formatTimeIST(shift?.opening_time) : "Pending"}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800">
          <div className="text-[11px] text-slate-400 mb-1">Closing Time</div>
          <div className="text-sm font-semibold text-white">
            {isClosed ? formatTimeIST(shift?.closing_time) : "Pending"}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        {!isOpened ? (
          <Button
            variant="gold"
            size="md"
            className="w-full"
            onClick={onOpenShiftClick}
          >
            <Camera className="w-4 h-4 mr-1.5" />
            Submit Opening Shift
          </Button>
        ) : !isClosed ? (
          <Button
            variant="secondary"
            size="md"
            className="w-full text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
            onClick={onCloseShiftClick}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Submit Closing Shift
          </Button>
        ) : (
          <div className="w-full text-center py-2 text-xs text-slate-400">
            Shift completed for today.
          </div>
        )}
      </div>
    </div>
  );
}

