"use client";

import type { ChangeEventHandler } from "react";
import { useEffect, useRef, useState } from "react";
import { acceptPendingTeamInviteForUser } from "@/lib/acceptTeamInvite";
import { supabase } from "@/lib/supabase";

const COMPANY_LOGOS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_COMPANY_LOGOS_BUCKET ?? "company-logos";

type SettingsTab =
  | "profile"
  | "company"
  | "team"
  | "fba"
  | "shipping"
  | "amazon"
  | "appearance"
  | "billing";

  type CurrentUser = {
  firstName: string;
  lastName: string;
  email: string;
};

type TeamMember = {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: string;
  joined: string;
  status?: "Active" | "Pending";
  isCurrentUser?: boolean;
};



const tabs: { id: SettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "company", label: "Company" },
  { id: "team", label: "Team" },
  { id: "fba", label: "FBA Fees" },
  { id: "shipping", label: "Shipping & Labels" },
  { id: "amazon", label: "Amazon" },
  { id: "appearance", label: "Appearance" },
  { id: "billing", label: "Billing" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
const [inviteEmail, setInviteEmail] = useState("");
const [inviteRole, setInviteRole] = useState("viewer");
const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
const [manageOpen, setManageOpen] = useState(false);
const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
const [manageRole, setManageRole] = useState("viewer");

const handleInvite = async () => {
  if (!inviteEmail.trim() || !currentTeamId) return;

  const cleanEmail = inviteEmail.trim().toLowerCase();
  const { data: userData } = await supabase.auth.getUser();

  const { data: savedInvite, error } = await supabase
    .from("team_invites")
    .upsert(
      {
        team_id: currentTeamId,
        email: cleanEmail,
        role: inviteRole,
        status: "pending",
        invited_by: userData.user?.id,
      },
      {
        onConflict: "team_id,email",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Invite DB error:", error);
    alert("Error saving invite");
    return;
  }
alert("LIVE TEST: calling /api/invite-member Resend route");
  const res = await fetch("/api/invite-member", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail }),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error("Invite email error:", result);
    alert("Invite saved, but email failed.");
    return;
  }

  setInviteOpen(false);
  setInviteEmail("");
  setInviteRole("viewer");
  setActiveTab("team");

  setTeamMembers((prev) => [
    ...prev.filter((member) => member.email.toLowerCase() !== cleanEmail),
    {
      id: savedInvite.id,
      name: "Pending Member",
      email: cleanEmail,
      role: inviteRole,
      joined: "Pending",
      status: "Pending" as const,
    },
  ]);

  alert("Invite sent successfully.");
};

const openManageMember = (member: TeamMember) => {
  setSelectedMember(member);
  setManageRole(member.role.toLowerCase());
  setManageOpen(true);
};

const handleUpdateRole = async () => {
  if (!selectedMember) return;

  const table =
    selectedMember.status === "Pending" ? "team_invites" : "team_members";

  const { error } = await supabase
    .from(table)
    .update({ role: manageRole })
    .eq("id", selectedMember.id);

  if (error) {
    console.error("Error updating role:", error);
    alert("Error updating role");
    return;
  }

  window.location.reload();
};

const handleRemoveMember = async () => {
  if (!selectedMember) return;

  const confirmed = confirm(
    selectedMember.status === "Pending"
      ? "Delete this pending invite?"
      : "Remove this user from the team?"
  );

  if (!confirmed) return;

  const table =
    selectedMember.status === "Pending" ? "team_invites" : "team_members";

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", selectedMember.id);

  if (error) {
    console.error("Error removing member:", error);
    alert("Error removing member");
    return;
  }

  window.location.reload();
};



  useEffect(() => {
  const loadSettingsData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    await acceptPendingTeamInviteForUser(user);

    const firstName = user.user_metadata?.first_name || "";
const lastName = user.user_metadata?.last_name || "";

const fullName =
  `${firstName} ${lastName}`.trim() ||
  user.user_metadata?.full_name ||
  user.user_metadata?.name ||
  user.email?.split("@")[0] ||
  "";

    const nameParts = fullName.split(" ");

    setCurrentUser({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: user.email || "",
    });

    const { data: teamMemberData } = await supabase
  .from("team_members")
  .select("*")
  .eq("user_id", user.id)
  .limit(1)
  .maybeSingle();

setCurrentTeamId(teamMemberData?.team_id || null);
     

   if (!teamMemberData?.team_id) {
  const { data: newTeam, error: teamError } = await supabase
    .from("teams")
    .insert([
      {
        name: `${fullName || user.email?.split("@")[0] || "My"} Team`,
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (teamError) {
    console.error("Error creating team:", JSON.stringify(teamError, null, 2));
    return;
  }

  const { data: newMember, error: memberError } = await supabase
    .from("team_members")
    .insert([
      {
        team_id: newTeam.id,
        user_id: user.id,
        role: "owner",
      },
    ])
    .select()
    .single();

  if (memberError) {
    console.error("Error creating team member:", memberError);
    return;
  }

  setTeamMembers([
    {
      id: newMember.id,
      userId: user.id,
      name: fullName || user.email?.split("@")[0] || "User",
      email: user.email || "No email saved",
      role: "owner",
      joined: newMember.created_at
        ? new Date(newMember.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—",
      status: "Active",
      isCurrentUser: true,
    },
  ]);

  return;
}

    const { data: membersData, error } = await supabase
  .from("team_members")
  .select(`
    *,
    profiles:user_id (
      first_name,
      last_name,
      email
    )
  `)
  .eq("team_id", teamMemberData.team_id)
  .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading team members:", error);
      return;
    }

   const activeMembers: TeamMember[] = (membersData || []).map((member: any) => {
  const role = member.role || "Viewer";
  const isCurrentUser = member.user_id === user.id;

  const profile = Array.isArray(member.profiles)
    ? member.profiles[0]
    : member.profiles;

  const memberFirstName = isCurrentUser
    ? user.user_metadata?.first_name || profile?.first_name || ""
    : profile?.first_name || "";

  const memberLastName = isCurrentUser
    ? user.user_metadata?.last_name || profile?.last_name || ""
    : profile?.last_name || "";

  const memberFullName =
    `${memberFirstName} ${memberLastName}`.trim() ||
    profile?.email?.split("@")[0] ||
    "Team Member";

  const memberEmail =
    profile?.email ||
    (isCurrentUser ? user.email || "" : "No email saved");

  return {
    id: member.id,
    userId: member.user_id,
    name: memberFullName,
    email: memberEmail,
    role,
    joined: member.created_at
      ? new Date(member.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
    status: "Active",
    isCurrentUser,
  };
});

   const { data: invites } = await supabase
  .from("team_invites")
  .select("*")
  .eq("team_id", teamMemberData.team_id)
  .eq("status", "pending");

const pendingMembers: TeamMember[] =
  invites?.map((inv: any) => ({
    id: inv.id,
    name: "Pending Member",
    email: inv.email,
    role: inv.role,
    joined: "Pending",
    status: "Pending" as const,
  })) || [];

setTeamMembers([...activeMembers, ...pendingMembers]);
  };

  loadSettingsData();
}, []);

  return (
    <section className="min-w-0 flex-1 bg-[#f6f8fb] px-6 py-6 text-[#111827] lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-[#111827]">
            Settings
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Manage your account and preferences
          </p>
        </div>

        <div className="mb-5 flex justify-center overflow-x-auto">
          <div className="inline-flex w-max min-w-0 gap-2 rounded-3xl border border-gray-200 bg-white p-2 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap cursor-pointer rounded-2xl px-5 py-3 text-[15px] font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#2F80ED] text-white shadow-sm"
                    : "text-gray-600 hover:bg-[#f3f4f6] hover:text-[#111827]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:p-7">
          {activeTab === "profile" && <ProfileSection currentUser={currentUser} />}
          {activeTab === "company" && (
            <CompanySection teamScopeId={currentTeamId} />
          )}
          {activeTab === "team" && (
  <TeamSection
  teamMembers={teamMembers}
  onInviteClick={() => setInviteOpen(true)}
  onManageClick={openManageMember}
/>
)}
          {activeTab === "fba" && <FbaFeesSection />}
          {activeTab === "shipping" && <ShippingLabelsSection />}
          {activeTab === "amazon" && <AmazonSection />}
          {activeTab === "appearance" && <AppearanceSection />}
          {activeTab === "billing" && <BillingSection />}
        </div>
      </div>
      {inviteOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onClick={() => setInviteOpen(false)}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-xl font-semibold text-[#111827]">
        Invite Team Member
      </h3>

      <div className="mt-4 space-y-4">
        <input
          type="email"
          placeholder="Enter email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3"
        />

        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-3"
        >
          <option value="viewer">Viewer</option>
          <option value="buyer">Buyer</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleInvite}
          className="w-full cursor-pointer rounded-xl bg-[#2F80ED] py-3 font-semibold text-white"
        >
          Send Invite
        </button>
      </div>
    </div>
  </div>
)}

{manageOpen && selectedMember && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onClick={() => setManageOpen(false)}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-xl font-semibold text-[#111827]">
        Manage Team Member
      </h3>

      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        <div className="font-semibold text-[#111827]">
          {selectedMember.name}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          {selectedMember.email}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <select
          value={manageRole}
          onChange={(e) => setManageRole(e.target.value)}
          className="w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-3"
        >
          <option value="viewer">Viewer</option>
          <option value="buyer">Buyer</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>

        <button
          onClick={handleUpdateRole}
          className="w-full cursor-pointer rounded-xl bg-[#2F80ED] py-3 font-semibold text-white"
        >
          Save Role
        </button>

        <button
  onClick={handleRemoveMember}
  style={{ backgroundColor: "#dc2626" }}
  className="w-full cursor-pointer rounded-xl py-3 font-semibold text-white"
>
  Delete Rep
</button>
      </div>
    </div>
  </div>
)}
    </section>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-[26px] font-semibold text-[#111827]">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-[15px] text-gray-500">{subtitle}</p> : null}
    </div>
  );
}

function Input({
  label,
  placeholder,
  defaultValue = "",
  value,
  onChange,
  type = "text",
  disabled,
  compact,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const controlled = value !== undefined;
  return (
    <label className="block">
      <span
        className={`block font-medium text-gray-700 ${compact ? "mb-1 text-[13px]" : "mb-2 text-sm"}`}
      >
        {label}
      </span>
      <input
        type={type}
        {...(controlled
          ? { value, onChange }
          : { defaultValue })}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border border-gray-300 bg-[#f8fafc] text-[#111827] outline-none placeholder:text-gray-400 focus:border-[var(--brand-blue)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${
          compact
            ? "h-11 rounded-xl px-3 text-[15px]"
            : "h-14 rounded-2xl px-4 text-[16px]"
        }`}
      />
    </label>
  );
}

function Textarea({
  label,
  placeholder,
  defaultValue = "",
  value,
  onChange,
  disabled,
  rows = 4,
  compact,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  rows?: number;
  compact?: boolean;
}) {
  const controlled = value !== undefined;
  return (
    <label className="block">
      <span
        className={`block font-medium text-gray-700 ${compact ? "mb-1 text-[13px]" : "mb-2 text-sm"}`}
      >
        {label}
      </span>
      <textarea
        {...(controlled
          ? { value, onChange }
          : { defaultValue })}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full border border-gray-300 bg-[#f8fafc] text-[#111827] outline-none placeholder:text-gray-400 focus:border-[var(--brand-blue)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${
          compact
            ? "rounded-xl px-3 py-2.5 text-[15px] leading-snug"
            : "rounded-2xl px-4 py-4 text-[16px]"
        }`}
      />
    </label>
  );
}

function SaveButton({
  children = "Save Changes",
  onClick,
  disabled,
}: {
  children?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-2xl bg-[#2F80ED] px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-5">
      {children}
    </div>
  );
}

function ProfileSection({ currentUser }: { currentUser: CurrentUser }) {
  return (
    <div>
      <SectionHeading
        title="Profile Information"
        subtitle="Update your personal details and login settings."
      />

      <div className="grid gap-2 md:grid-cols-2">
        <Input label="First Name" defaultValue={currentUser.firstName} />
        <Input label="Last Name" defaultValue={currentUser.lastName} />
        <div className="md:col-span-2">
          <Input label="Email" type="email" defaultValue={currentUser.email} />
        </div>
      </div>

      <div className="my-0 border-t border-gray-200" />

      <div className="grid gap-4 md:max-w-[780px]">
        <Input label="Current Password" placeholder="Enter current password" />
        <Input label="New Password" placeholder="Enter new password" />
      </div>

      <div className="mt-6">
        <SaveButton />
      </div>
    </div>
  );
}

async function uploadCompanyLogo(
  userId: string,
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  const safeName = file.name.replace(/[^\w.\-]/g, "_") || "logo";
  const path = `${userId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from(COMPANY_LOGOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) {
    console.error("Company logo upload error:", error);
    return { error: error.message };
  }
  const { data } = supabase.storage.from(COMPANY_LOGOS_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

function CompanySection({ teamScopeId }: { teamScopeId: string | null }) {
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCompanySettings = async () => {
      setLoadingSettings(true);
      if (!teamScopeId) {
        setCompanyName("");
        setAddress("");
        setPhone("");
        setWebsite("");
        setLogoUrl("");
        setLoadingSettings(false);
        return;
      }

      const { data, error } = await supabase
        .from("team_company_settings")
        .select("company_name, address, phone, website, logo_url")
        .eq("team_id", teamScopeId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Error loading team company settings:", error);
        setCompanyName("");
        setAddress("");
        setPhone("");
        setWebsite("");
        setLogoUrl("");
        setLoadingSettings(false);
        return;
      }

      if (!data) {
        setCompanyName("");
        setAddress("");
        setPhone("");
        setWebsite("");
        setLogoUrl("");
        setLoadingSettings(false);
        return;
      }

      setCompanyName(data.company_name ?? "");
      setAddress(data.address ?? "");
      setPhone(data.phone ?? "");
      setWebsite(data.website ?? "");
      setLogoUrl(data.logo_url ?? "");
      setLoadingSettings(false);
    };

    void loadCompanySettings();

    return () => {
      cancelled = true;
    };
  }, [teamScopeId]);

  const displayLogoSrc = logoPreview || logoUrl || null;

  const handleLogoInput: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file (JPG, PNG, or WebP).");
      return;
    }
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(URL.createObjectURL(file));
    setPendingLogoFile(file);
  };

  const clearPendingPreview = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    setPendingLogoFile(null);
  };

  const handleRemoveLogo = () => {
    clearPendingPreview();
    setLogoUrl("");
  };

  const handleSaveCompany = async () => {
    if (!teamScopeId) {
      alert("You need an active team before company settings can be saved.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        alert("You must be signed in to save company settings.");
        return;
      }

      let nextLogoUrl = logoUrl;
      let logoNotice: string | null = null;
      if (pendingLogoFile) {
        const result = await uploadCompanyLogo(userId, pendingLogoFile);
        if ("error" in result) {
          logoNotice = `Logo upload failed (${result.error}). Create a public bucket "${COMPANY_LOGOS_BUCKET}" in Supabase Storage if needed.`;
        } else {
          nextLogoUrl = result.publicUrl;
          clearPendingPreview();
          setLogoUrl(nextLogoUrl);
        }
      }

      const { error: upsertError } = await supabase.from("team_company_settings").upsert(
        {
          team_id: teamScopeId,
          company_name: companyName,
          address,
          phone,
          website,
          logo_url: nextLogoUrl,
          updated_by: userId,
        },
        { onConflict: "team_id" }
      );

      if (upsertError) {
        console.error("Error saving team company settings:", upsertError);
        alert(`Could not save company settings: ${upsertError.message}`);
        return;
      }

      alert(
        logoNotice
          ? `${logoNotice} Your other company details were saved for the team.`
          : "Company settings saved."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[920px]">
      {!teamScopeId && !loadingSettings ? (
        <p className="mb-2 text-sm text-gray-500">
          Company settings are available once you belong to a team. Open Settings again after your
          team has loaded, or finish account setup.
        </p>
      ) : null}

      <h2 className="text-lg font-semibold tracking-tight text-[#111827] md:text-xl">
        Company Settings
      </h2>
      <p className="mt-1 text-sm leading-snug text-gray-500">
        This information can be used across quotes, reports, and internal records.
      </p>

      <div className="mt-3 grid gap-2 md:mt-4 md:gap-2.5">
        <div className="grid gap-2 sm:grid-cols-2 sm:items-end">
          <Input
            label="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={loadingSettings}
            compact
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loadingSettings}
            compact
          />
        </div>

        <Textarea
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loadingSettings}
          rows={2}
          compact
        />

        <div className="grid gap-2 md:grid-cols-2 md:items-stretch">
          <div className="min-h-0 min-w-0">
            <Input
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={loadingSettings}
              compact
            />
          </div>

          <div className="flex h-full min-h-0 min-w-0">
            <div className="flex h-full w-full flex-nowrap items-center gap-4 rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                {displayLogoSrc ? (
                  <img
                    src={displayLogoSrc}
                    alt="Company logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] font-medium text-gray-400">—</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight text-[#111827]">Logo</p>
                <p className="text-[11px] leading-snug text-gray-500">JPG, PNG, or WebP</p>
              </div>
              <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogoInput}
                  disabled={loadingSettings || !teamScopeId}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingSettings || !teamScopeId}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Upload
                </button>
                {(displayLogoSrc || logoUrl) && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={loadingSettings || !teamScopeId}
                    className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-start md:mt-4">
        <SaveButton
          onClick={handleSaveCompany}
          disabled={saving || loadingSettings || !teamScopeId}
        >
          {saving ? "Saving…" : "Save Company Settings"}
        </SaveButton>
      </div>
    </div>
  );
}

function RoleIcon({ role }: { role: string }) {
  const normalizedRole = role.toLowerCase();

  const color =
    normalizedRole === "owner"
      ? "#8b5cf6"
      : normalizedRole === "admin"
      ? "#2F80ED"
      : normalizedRole === "buyer"
      ? "#10b981"
      : "#f97316";

  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        {normalizedRole === "owner" && (
          <>
            <path d="M4 18h16" />
            <path d="M5 18 6.5 8l4 4 3.5-6 3.5 6 4-4L19 18" />
          </>
        )}

        {normalizedRole === "admin" && (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a7.8 7.8 0 0 0 .1-1 7.8 7.8 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L15 5.5h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.8 7.8 0 0 0-.1 1 7.8 7.8 0 0 0 .1 1l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5Z" />
          </>
        )}

        {normalizedRole === "buyer" && (
          <>
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
            <path d="M2 3h3l3 12h10l3-8H7" />
          </>
        )}

        {normalizedRole !== "owner" &&
          normalizedRole !== "admin" &&
          normalizedRole !== "buyer" && (
            <>
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
      </svg>
    </span>
  );
}

function TeamSection({
  teamMembers,
  onInviteClick,
  onManageClick,
}: {
  teamMembers: TeamMember[];
  onInviteClick: () => void;
  onManageClick: (member: TeamMember) => void;
}) {
  const roleCards = [
    ["Owner", "Full access to everything."],
    ["Admin", "Can manage settings and users."],
    ["Buyer", "Can manage purchasing tasks."],
    ["Viewer", "Read-only access."],
  ];

  return (
    <div>
      <SectionHeading
        title="Team"
        subtitle="Manage users, roles, and access permissions."
      />

      <div className="grid gap-4">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#111827]">
                Team Management
              </h3>
              <p className="mt-1 text-gray-500">
                Manage your team members and their roles
              </p>
            </div>

            <button
  onClick={onInviteClick}
  className="cursor-pointer rounded-2xl bg-[#2F80ED] px-5 py-3 font-medium text-white"
>
  Invite Member
</button>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            {roleCards.map(([title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <RoleIcon role={title} />
                  <div className="text-lg font-semibold text-[#111827]">
                    {title}
                  </div>
                </div>

                <div className="mt-3 text-gray-500">{text}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-[#111827]">Team Members</h3>
          <p className="mt-1 text-gray-500">
            All users with access to your account
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="text-sm text-gray-500">
                <tr className="border-b border-gray-200">
                  <th className="pb-4 font-medium">Member</th>
                  <th className="pb-4 font-medium">Role</th>
                  <th className="pb-4 font-medium">Joined</th>
                  <th className="pb-4 font-medium text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {teamMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-gray-500">
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  teamMembers.map((member) => (
                    <tr
  key={member.id}
  className={`border-b border-gray-100 ${
    member.isCurrentUser ? "bg-blue-50" : ""
  }`}
>
                      <td className="py-5">
                        <div className="flex items-center gap-2 font-medium text-[#111827]">
  {member.name}
  {member.isCurrentUser && (
    <span className="rounded-full bg-[#2F80ED] px-2.5 py-1 text-xs font-semibold text-white">
      You
    </span>
  )}
</div>
                        <div className="mt-1 text-gray-500">{member.email}</div>
                        {member.status === "Pending" && (
  <div className="mt-2 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
    Pending approval
  </div>
)}
                      </td>

                      <td className="py-5">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#eef6ff] px-3 py-1.5 text-sm font-semibold text-[#111827]">
  <RoleIcon role={member.role} />
  {member.role}
</span>
                      </td>

                      <td className="py-5 text-gray-500">{member.joined}</td>

                      <td className="py-5 text-right">
                        <button
  onClick={() => onManageClick(member)}
  className="cursor-pointer text-gray-500 hover:text-[#111827]"
>
  Manage
</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FbaFeesSection() {
  return (
    <div>
      <SectionHeading
        title="FBA Fees"
        subtitle="Configure default inputs for fee calculations."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-5 text-lg font-semibold text-[#111827]">Marketplace & Fee Year</h3>
          <div className="grid gap-5">
            <Input label="Marketplace" defaultValue="Amazon.com (US)" />
            <Input label="Fee Year" defaultValue="2026" />
          </div>
        </Card>

        <Card>
          <h3 className="mb-5 text-lg font-semibold text-[#111827]">Shipping & Weight</h3>
          <div className="grid gap-5">
            <Input label="Ship to FBA ($/lb)" defaultValue="0.35" />
            <Input label="Prep Cost (per unit)" defaultValue="0.10" />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SaveButton>Save FBA Defaults</SaveButton>
      </div>
    </div>
  );
}

function ShippingLabelsSection() {
  return (
    <div>
      <SectionHeading
        title="Shipping & Labels"
        subtitle="Manage label preferences and warehouse defaults."
      />

      <div className="grid gap-5">
        <Card>
          <h3 className="mb-5 text-lg font-semibold text-[#111827]">FNSKU Label Size</h3>
          <div className="grid gap-3">
            {[
              "Standard (30-up)",
              "Medium (24-up)",
              'Thermal (4" x 6")',
            ].map((option, index) => (
              <label
                key={option}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${
                  index === 0
                    ? "border-[var(--brand-blue)] bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <input type="radio" name="label-size" defaultChecked={index === 0} />
                <div>
                  <div className="font-medium text-[#111827]">{option}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-5 text-lg font-semibold text-[#111827]">Warehouse Address</h3>
          <Textarea
            label="Default Ship-From Address"
            placeholder="Enter warehouse address"
          />
        </Card>
      </div>

      <div className="mt-6">
        <SaveButton>Save Shipping Settings</SaveButton>
      </div>
    </div>
  );
}

function AmazonSection() {
  return (
    <div>
      <SectionHeading
        title="Amazon"
        subtitle="Connect and manage Amazon account authorization."
      />

      <Card>
  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[760px]">
            <h3 className="text-xl font-semibold text-[#111827]">Amazon Seller Account</h3>
            <p className="mt-2 text-gray-500">
              Connect your Amazon Seller Central account to fetch product data,
              pricing, and sales rank.
            </p>

            <div className="mt-5 max-w-[320px]">
              <Input label="Marketplace" defaultValue="United States" />
            </div>

            <div className="mt-6">
              <SaveButton>Connect Amazon Account</SaveButton>
            </div>
          </div>

          <div className="rounded-full bg-[#f3f4f6] px-4 py-2 text-sm font-semibold text-gray-500">
            Not Connected
          </div>
        </div>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  return (
    <div>
      <SectionHeading
        title="Appearance"
        subtitle="Choose how the dashboard looks."
      />

      <div className="grid max-w-[780px] gap-5 md:grid-cols-2">
        <button type="button" className="cursor-pointer rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm">
          <div className="text-3xl">🌙</div>
          <div className="mt-6 text-2xl font-semibold text-[#111827]">Dark Mode</div>
          <div className="mt-2 text-gray-500">Alternative</div>
        </button>

        <button type="button" className="cursor-pointer rounded-3xl border-2 border-[var(--brand-blue)] bg-blue-50 p-8 text-left">
          <div className="text-3xl">☀️</div>
          <div className="mt-6 text-2xl font-semibold text-[#111827]">Light Mode</div>
          <div className="mt-2 text-gray-500">Default</div>
        </button>
      </div>
    </div>
  );
}

function BillingSection() {
  return (
    <div>
      <SectionHeading
        title="Billing"
        subtitle="Manage your subscription and billing details."
      />

      <Card>
        <div className="max-w-[700px]">
          <h3 className="text-xl font-semibold text-[#111827]">Billing & Subscription</h3>
          <p className="mt-2 text-gray-500">
            View invoices, update payment method, or cancel subscription.
          </p>

          <div className="mt-6">
            <SaveButton>Manage Subscription</SaveButton>
          </div>
        </div>
      </Card>
    </div>
  );
}