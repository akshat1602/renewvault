"use client";

import { useState } from "react";
import { updateProfile, uploadAvatar } from "@/app/actions/profile";

// Icons
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

interface ProfileFormProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.image || "");

  const initials = (user?.name || "Vault User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const newUrl = await uploadAvatar(formData);
      setAvatarUrl(newUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleCancel() {
    setAvatarUrl(user?.image || "");
    setIsEditing(false);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121214]/90 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/50 px-6 py-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:text-emerald-300 cursor-pointer"
          >
            <PencilIcon />
            Edit Profile
          </button>
        )}
      </div>

      <form action={handleSave} className="p-6">
        <input type="hidden" name="image" value={avatarUrl} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative group">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#4338ca] to-[#3730a3] text-2xl font-bold text-white shadow-lg border-2 border-zinc-800 overflow-hidden">
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatarUrl} alt={user?.name || "User"} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              {isEditing && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  {isUploading ? <span className="text-[10px] text-white">...</span> : <CameraIcon />}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            {isEditing && avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="mt-2 text-[10px] font-medium text-red-400/80 hover:text-red-400 transition-colors cursor-pointer"
              >
                Remove picture
              </button>
            )}
          </div>

          <div className="flex-1 space-y-4 w-full min-w-0">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 min-w-0">
              <UserIcon />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Full Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    defaultValue={user?.name || ""}
                    required
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                ) : (
                  <p className="text-sm font-medium text-white truncate">{user?.name || "Not set"}</p>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 min-w-0 ${isEditing ? "opacity-60" : ""}`}>
              <MailIcon />
              <div className="flex-1 flex justify-between items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Email Address</p>
                  <p className="text-sm font-medium text-white break-all">{user?.email || "Not set"}</p>
                </div>
                {isEditing && (
                  <span className="flex-shrink-0">
                    <LockIcon />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800/50 pt-4 animate-fade-in-up">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}