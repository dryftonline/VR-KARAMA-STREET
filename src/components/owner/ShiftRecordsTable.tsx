"use client";

import { useState, useEffect } from "react";
import { Camera, Calendar, ExternalLink, Image as ImageIcon, Eye, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatTimeIST, formatDateIST, getBusinessDateKolkata } from "@/lib/utils/timezone";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ShiftRecordsTable() {
  const { error: toastError } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(getBusinessDateKolkata());
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Photo viewer modal state
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [activePhotoTitle, setActivePhotoTitle] = useState<string>("");
  const [isLoadingPhoto, setIsLoadingPhoto] = useState<boolean>(false);

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/shifts/status?date=${selectedDate}`);
      const data = await res.json();
      if (res.ok && data.shifts) {
        setShifts(data.shifts);
      }
    } catch (err) {
      console.error("Failed to fetch shift records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [selectedDate]);

  const handleViewPhoto = async (photoPath: string, title: string) => {
    try {
      setIsLoadingPhoto(true);
      setActivePhotoTitle(title);
      setActivePhotoUrl(null);

      const res = await fetch(`/api/shifts/photo-url?path=${encodeURIComponent(photoPath)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve signed photograph URL");
      }

      setActivePhotoUrl(data.signedUrl);
    } catch (err: any) {
      console.error("Signed URL error:", err);
      toastError(err.message, "Photo Access Error");
    } finally {
      setIsLoadingPhoto(false);
    }
  };

  return (
    <div className="rounded-2xl bg-navy-900 border border-navy-700/80 p-5 shadow-card space-y-5">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Staff Opening &amp; Closing Records
          </h3>
          <p className="text-xs text-slate-400">
            Secure register photographs and server-generated shift timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-navy-950 border border-navy-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* Shifts Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading shift records for {selectedDate}...
        </div>
      ) : shifts.length === 0 ? (
        <div className="py-12 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">
            No shift submissions recorded for {selectedDate}
          </p>
          <p className="text-[11px] text-slate-500">
            Opening and closing records from staff will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Business Date</th>
                <th className="py-3 px-4">Opening Time</th>
                <th className="py-3 px-4">Opening Photo</th>
                <th className="py-3 px-4">Closing Time</th>
                <th className="py-3 px-4">Closing Photo</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60 bg-navy-900/60">
              {shifts.map((shift) => {
                const isOpened = Boolean(shift.opening_time);
                const isClosed = Boolean(shift.closing_time);

                return (
                  <tr key={shift.id} className="hover:bg-navy-850/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {shift.staff_name}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {shift.business_date}
                    </td>

                    {/* Opening Time */}
                    <td className="py-3 px-4 text-slate-300">
                      {isOpened ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeIST(shift.opening_time)}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not opened</span>
                      )}
                    </td>

                    {/* Opening Photo */}
                    <td className="py-3 px-4">
                      {shift.opening_photo_url ? (
                        <button
                          onClick={() =>
                            handleViewPhoto(
                              shift.opening_photo_url,
                              `${shift.staff_name} - Opening Record (${shift.business_date})`
                            )
                          }
                          className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-navy-800 hover:bg-gold/20 text-gold text-[11px] font-semibold border border-gold/30 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View Photo
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No photo</span>
                      )}
                    </td>

                    {/* Closing Time */}
                    <td className="py-3 px-4 text-slate-300">
                      {isClosed ? (
                        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeIST(shift.closing_time)}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Pending closing</span>
                      )}
                    </td>

                    {/* Closing Photo */}
                    <td className="py-3 px-4">
                      {shift.closing_photo_url ? (
                        <button
                          onClick={() =>
                            handleViewPhoto(
                              shift.closing_photo_url,
                              `${shift.staff_name} - Closing Record (${shift.business_date})`
                            )
                          }
                          className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-navy-800 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View Photo
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No photo</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {isClosed ? (
                        <Badge variant="outline" className="text-slate-400 border-slate-600 bg-slate-800/80">
                          Closed
                        </Badge>
                      ) : isOpened ? (
                        <Badge variant="cash" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
                          Pending
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PHOTO VIEWER MODAL */}
      <Modal
        isOpen={Boolean(activePhotoUrl || isLoadingPhoto)}
        onClose={() => setActivePhotoUrl(null)}
        title={activePhotoTitle || "Shift Photograph"}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {isLoadingPhoto ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span>Generating secure signed URL...</span>
            </div>
          ) : activePhotoUrl ? (
            <div className="rounded-2xl overflow-hidden border border-navy-700 bg-navy-950 max-h-[70vh] flex items-center justify-center">
              <img
                src={activePhotoUrl}
                alt="Shift Verification"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          ) : null}

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Verified via Supabase Private Storage (Signed URL)</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActivePhotoUrl(null)}
            >
              Close Viewer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

