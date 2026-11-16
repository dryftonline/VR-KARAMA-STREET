"use client";

import { useState } from "react";
import {
  UserPlus,
  Shield,
  Lock,
  User,
  Edit2,
  Trash2,
  AlertTriangle,
  AtSign,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDateIST } from "@/lib/utils/timezone";
import { Profile } from "@/lib/types";

interface StaffManagementProps {
  staffList: Profile[];
  onStaffUpdated: () => void;
}

export function StaffManagement({ staffList, onStaffUpdated }: StaffManagementProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // Create Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Edit Staff Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState<string>("");
  const [editUsername, setEditUsername] = useState<string>("");
  const [editPassword, setEditPassword] = useState<string>("");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Delete Staff Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingStaff, setDeletingStaff] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Status Toggle State
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Helper to extract clean username
  const getUsername = (member: Profile) => {
    if (member.username) return member.username;
    if (member.email) return member.email.split("@")[0];
    return "user";
  };

  // --- CREATE STAFF ---
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");

    if (!fullName || !cleanUsername || !password) {
      toastError("Please fill out all fields.", "Missing Fields");
      return;
    }

    if (cleanUsername.length < 3) {
      toastError("Username must be at least 3 alphanumeric characters.", "Invalid Username");
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
          username: cleanUsername,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff account");
      }

      toastSuccess(`Staff account created for ${fullName} (@${cleanUsername})!`, "Staff Added");
      setIsAddModalOpen(false);
      setFullName("");
      setUsername("");
      setPassword("");
      onStaffUpdated();
    } catch (err: any) {
      console.error("Create staff error:", err);
      toastError(err.message, "Creation Failed");
    } finally {
      setIsCreating(false);
    }
  };

  // --- OPEN EDIT MODAL ---
  const openEditModal = (member: Profile) => {
    setEditingStaffId(member.id);
    setEditFullName(member.full_name);
    setEditUsername(getUsername(member));
    setEditPassword("");
    setEditIsActive(member.is_active);
    setIsEditModalOpen(true);
  };

  // --- UPDATE STAFF ---
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStaffId) return;

    const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");

    if (!editFullName || !cleanUsername) {
      toastError("Name and Username cannot be empty.", "Missing Fields");
      return;
    }

    if (cleanUsername.length < 3) {
      toastError("Username must be at least 3 alphanumeric characters.", "Invalid Username");
      return;
    }

    if (editPassword && editPassword.length < 6) {
      toastError("New password must be at least 6 characters long.", "Weak Password");
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch("/api/auth/update-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: editingStaffId,
          fullName: editFullName.trim(),
          username: cleanUsername,
          password: editPassword.trim() || undefined,
          isActive: editIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff credentials");
      }

      toastSuccess("Staff profile and login credentials updated successfully!", "Staff Updated");
      setIsEditModalOpen(false);
      setEditingStaffId(null);
      setEditFullName("");
      setEditUsername("");
      setEditPassword("");
      onStaffUpdated();
    } catch (err: any) {
      console.error("Update staff error:", err);
      toastError(err.message, "Update Failed");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- OPEN DELETE MODAL ---
  const openDeleteModal = (member: Profile) => {
    setDeletingStaff(member);
    setIsDeleteModalOpen(true);
  };

  // --- DELETE STAFF ---
  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;

    try {
      setIsDeleting(true);
      const res = await fetch("/api/auth/delete-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: deletingStaff.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete staff member");
      }

      toastSuccess(
        `Staff member "${deletingStaff.full_name}" (@${getUsername(deletingStaff)}) was permanently deleted.`,
        "Staff Deleted"
      );
      setIsDeleteModalOpen(false);
      setDeletingStaff(null);
      onStaffUpdated();
    } catch (err: any) {
      console.error("Delete staff error:", err);
      toastError(err.message, "Delete Failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- TOGGLE ACTIVE STATUS ---
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
            Create verified staff accounts, customize usernames and passwords, and manage credentials.
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
              <th className="py-3 px-4">Staff Member</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {staffList.map((member) => {
              const isOwner = member.role === "OWNER";
              const isToggling = togglingId === member.id;
              const staffUsername = getUsername(member);

              return (
                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name & Avatar */}
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center text-[#5850EC] font-bold text-xs shrink-0">
                        {member.full_name?.charAt(0) || "U"}
                      </div>
                      <span className="truncate max-w-[160px]">{member.full_name}</span>
                    </div>
                  </td>

                  {/* Username */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100">
                      <AtSign className="w-3 h-3 text-[#5850EC]" />
                      {staffUsername}
                    </span>
                  </td>

                  {/* Role */}
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

                  {/* Created Date */}
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {formatDateIST(member.created_at)}
                  </td>

                  {/* Status */}
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

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isOwner ? (
                        <>
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Username or Password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active Button */}
                          <button
                            onClick={() => handleToggleActive(member.id, member.is_active)}
                            disabled={isToggling}
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                              member.is_active
                                ? "text-amber-700 hover:bg-amber-50 border border-amber-200"
                                : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            }`}
                          >
                            {isToggling ? "..." : member.is_active ? "Deactivate" : "Activate"}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => openDeleteModal(member)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====================================================================== */}
      {/* 1. ADD NEW STAFF MODAL */}
      {/* ====================================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Member"
        description="Creates an authenticated staff profile with direct username and password login access."
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
              Login Username
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                placeholder="rahul"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                className="pl-9 bg-white border-slate-200 text-slate-900 font-mono"
              />
              <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Alphanumeric characters only. Staff will use this exact username to log in.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Login Password
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
              {isCreating ? "Creating..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====================================================================== */}
      {/* 2. EDIT STAFF MODAL */}
      {/* ====================================================================== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Member"
        description="Update staff profile details, username, or change password."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateStaff} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Login Username
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                className="pl-9 bg-white border-slate-200 text-slate-900 font-mono"
              />
              <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Staff will use this username to authenticate.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Change Password</span>
              <span className="text-[10px] text-slate-400 font-normal">Leave blank to keep existing</span>
            </label>
            <div className="relative">
              <Input
                type="password"
                placeholder="Enter new password (optional)"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">Account Access Status</div>
              <div className="text-[11px] text-slate-500">Allow staff to sign in and record sales</div>
            </div>
            <button
              type="button"
              onClick={() => setEditIsActive(!editIsActive)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                editIsActive
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-rose-100 text-rose-800 border border-rose-300"
              }`}
            >
              {editIsActive ? "Active" : "Disabled"}
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 rounded-full bg-[#5850EC] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====================================================================== */}
      {/* 3. DELETE CONFIRMATION MODAL */}
      {/* ====================================================================== */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Staff Member"
        description="Permanently delete this employee account."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong>{deletingStaff?.full_name}</strong> (
              <span className="font-mono">@{deletingStaff ? getUsername(deletingStaff) : ""}</span>
              )? This user will no longer be able to log in.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteStaff}
              disabled={isDeleting}
              className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 active:scale-95"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
