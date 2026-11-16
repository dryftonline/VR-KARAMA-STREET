"use client";

import { useState, useRef } from "react";
import { Camera, Upload, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface OpeningShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OpeningShiftModal({
  isOpen,
  onClose,
  onSuccess,
}: OpeningShiftModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toastError("Photo must be less than 10MB in size.", "File Too Large");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toastError("Please take or upload an opening photograph.", "Photo Required");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const res = await fetch("/api/shifts/open", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit opening shift");
      }

      toastSuccess("Opening shift recorded successfully!", "Shift Started");
      setSelectedFile(null);
      setPreviewUrl(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error submitting opening shift:", err);
      toastError(err.message, "Submission Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Opening Shift"
      description="Opening timestamp will be captured automatically by the server."
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 text-xs text-slate-300">
          <p className="font-medium text-white mb-1">Shift Opening Instructions:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400">
            <li>Ensure the cash counter and store front are visible.</li>
            <li>Opening time is recorded from the server at the exact moment of submission.</li>
          </ul>
        </div>

        {/* Photo Upload / Camera Area */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Opening Photograph <span className="text-red-400">*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-navy-700 bg-navy-950 max-h-64 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Opening Preview"
                className="w-full h-full object-cover max-h-64"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-3 py-1.5 px-3 rounded-lg bg-navy-900/90 text-white text-xs border border-navy-700 hover:bg-navy-800 flex items-center gap-1.5 backdrop-blur-sm"
              >
                <Camera className="w-3.5 h-3.5 text-gold" /> Retake Photo
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-navy-700 hover:border-gold/50 rounded-2xl p-8 text-center cursor-pointer bg-navy-950/50 hover:bg-navy-950 transition-all flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-gold">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Tap to Take Photo or Upload
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Camera capture or gallery image (Max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            className="w-1/3"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="gold"
            className="w-2/3"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!selectedFile}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            SUBMIT OPENING
          </Button>
        </div>
      </div>
    </Modal>
  );
}

