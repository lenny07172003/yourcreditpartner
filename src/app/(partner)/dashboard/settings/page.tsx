"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface PartnerProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  zelle_handle: string | null;
  partner_slug: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/partner/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.partner);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/partner/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: profile.phone,
        company_name: profile.company_name,
        zelle_handle: profile.zelle_handle,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError("Failed to save changes.");
    }
    setSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8 || newPassword !== confirmPassword) return;

    setPasswordSaving(true);
    setPasswordMsg(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMsg(error.message);
    } else {
      setPasswordMsg("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-sm text-ink-muted">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-sm text-danger">
        Could not load profile.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Profile</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">First Name</label>
            <input
              type="text"
              disabled
              value={profile.first_name}
              className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink-muted"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Last Name</label>
            <input
              type="text"
              disabled
              value={profile.last_name}
              className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink-muted"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Email</label>
          <input
            type="email"
            disabled
            value={profile.email}
            className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink-muted"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Phone</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Company</label>
          <input
            type="text"
            value={profile.company_name ?? ""}
            onChange={(e) => setProfile({ ...profile, company_name: e.target.value || null })}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Zelle Handle</label>
          <input
            type="text"
            value={profile.zelle_handle ?? ""}
            onChange={(e) => setProfile({ ...profile, zelle_handle: e.target.value || null })}
            placeholder="Email or phone for Zelle payouts"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        {saved && <p className="text-xs text-success">Changes saved!</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordChange} className="space-y-4 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Change Password</h2>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">New Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1 text-xs text-danger">Passwords don&rsquo;t match</p>
          )}
        </div>

        {passwordMsg && (
          <p className={`text-xs ${passwordMsg.includes("success") ? "text-success" : "text-danger"}`}>
            {passwordMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={passwordSaving || newPassword.length < 8 || newPassword !== confirmPassword}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {passwordSaving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
