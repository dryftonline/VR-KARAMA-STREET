"use client";

import { useState } from "react";
import { UserPlus, UserCheck, UserX, Shield, Mail, Lock, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDateIST } from "@/lib/utils/timezone";
import { Profile } from "@/lib/types";

interface StaffManagementProps {
  staffList: Profile[];
  onStaffUpdated: () => void;
}

export function StaffManagement({ staffList, onStaffUpdated }: StaffManagementProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toastError("Please fill out all fields.", "Missing Fields");
      return;
    }

    if (password.length < 6) {
      toastError("Password must be at least 6 characters.", "Weak Password");
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch("/api/auth/create-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff account");
      }

      toastSuccess(`Staff account created for ${fullName}!`, "Staff Added");
      setIsAddModalOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
      onStaffUpdated();
    } catch (err: any) {
      console.error("Create staff error:", err);
      toastError(err.message, "Creation Failed");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
    try {
      setTogglingId(staffId);
      const res = await fetch("/api/auth/toggle-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          isActive: !currentStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff status");
      }

      toastSuccess(
        `Staff account ${!currentStatus ? "activated" : "deactivated"} successfully.`,
        "Status Updated"
      );
      onStaffUpdated();
    } catch (err: any) {
      console.error("Toggle staff error:", err);
      toastError(err.message, "Action Failed");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="finnova-card p-6 sm:p-7 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Staff Members &amp; Access Control
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Create verified employee accounts and control access privileges.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-full bg-[#5850EC] hover:bg-[#4F46E5] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff List Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Joined Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {staffList.map((member) => {
              const isOwner = member.role === "OWNER";
              const isToggling = togglingId === member.id;

              return (
                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center text-[#5850EC] font-bold text-xs">
                        {member.full_name?.charAt(0) || "U"}
                      </div>
                      <span>{member.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {member.email || "No email"}
                  </td>
                  <td className="py-3 px-4">
                    {isOwner ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        <Shield className="w-3 h-3" /> OWNER
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                        STAFF
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {formatDateIST(member.created_at)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {member.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!isOwner ? (
                      <button
                        onClick={() => handleToggleActive(member.id, member.is_active)}
                        disabled={isToggling}
                        className={`text-xs px-3 py-1 rounded-xl font-semibold transition-all ${
                          member.is_active
                            ? "text-rose-600 hover:bg-rose-50 border border-rose-200"
                            : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                        }`}
                      >
                        {isToggling
                          ? "Saving..."
                          : member.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Protected</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD STAFF MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Member"
        description="Creates an authenticated staff profile with direct login access."
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                placeholder="Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                required
                placeholder="rahul@vrstreetkarama.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Initial Password
            </label>
            <div className="relative">
              <Input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 rounded-full bg-[#5850EC] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95"
            >
              {isCreating ? "Creating Account..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
