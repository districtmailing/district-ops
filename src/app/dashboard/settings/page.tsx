"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  const { error } = await supabase.from("team_invites").upsert(
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
  );

  if (error) {
    console.error("Invite DB error:", error);
    alert("Error saving invite");
    return;
  }

  const res = await fetch("/api/invite-member", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: cleanEmail,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error("Email error:", result);
    alert("Invite saved but email failed.");
    return;
  }

  setInviteOpen(false);
  setInviteEmail("");
  setInviteRole("viewer");

  window.location.reload();
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
    console.error("Error creating team:", teamError);
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

        <div className="mb-5 overflow-x-auto">
          <div className="inline-flex w-max min-w-0 gap-2 rounded-3xl border border-gray-200 bg-white p-2 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-2xl px-5 py-3 text-[15px] font-semibold transition ${
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
          {activeTab === "company" && <CompanySection />}
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
          className="w-full rounded-xl border border-gray-300 px-4 py-3"
        >
          <option value="viewer">Viewer</option>
          <option value="buyer">Buyer</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleInvite}
          className="w-full rounded-xl bg-[#2F80ED] py-3 font-semibold text-white"
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
          className="w-full rounded-xl border border-gray-300 px-4 py-3"
        >
          <option value="viewer">Viewer</option>
          <option value="buyer">Buyer</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>

        <button
          onClick={handleUpdateRole}
          className="w-full rounded-xl bg-[#2F80ED] py-3 font-semibold text-white"
        >
          Save Role
        </button>

        <button
  onClick={handleRemoveMember}
  style={{ backgroundColor: "#dc2626" }}
  className="w-full rounded-xl py-3 font-semibold text-white"
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
  type = "text",
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-gray-300 bg-[#f8fafc] px-4 text-[16px] text-[#111827] outline-none placeholder:text-gray-400 focus:border-[var(--brand-blue)] focus:bg-white"
      />
    </label>
  );
}

function Textarea({
  label,
  placeholder,
  defaultValue = "",
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <textarea
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-gray-300 bg-[#f8fafc] px-4 py-4 text-[16px] text-[#111827] outline-none placeholder:text-gray-400 focus:border-[var(--brand-blue)] focus:bg-white"
      />
    </label>
  );
}

function SaveButton({ children = "Save Changes" }: { children?: string }) {
  return (
    <button className="rounded-2xl bg-[#2F80ED] px-6 py-3 text-base font-semibold text-white transition hover:opacity-90">
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

function CompanySection() {
  return (
    <div>
      <SectionHeading
        title="Company Settings"
        subtitle="This information can be used across quotes, reports, and internal records."
      />

      <div className="grid gap-4 md:max-w-[820px]">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">
              Logo
            </div>
            <div>
              <p className="text-base font-medium text-[#111827]">Company Logo</p>
              <p className="mt-1 text-sm text-gray-500">
                Upload JPG, PNG, WebP, or PDF
              </p>
            </div>
          </div>
        </Card>

        <Input label="Company Name" defaultValue="District Mailing LLC" />
        <Textarea
          label="Address"
          defaultValue={"123 Business St\nSuite 100\nCity, State 12345"}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Phone" placeholder="(555) 123-4567" />
          <Input label="Website" placeholder="https://yourcompany.com" />
        </div>
      </div>

      <div className="mt-6">
        <SaveButton>Save Company Settings</SaveButton>
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
  className="rounded-2xl bg-[#2F80ED] px-5 py-3 font-medium text-white"
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
  className="text-gray-500 hover:text-[#111827]"
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
        <button className="rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm">
          <div className="text-3xl">🌙</div>
          <div className="mt-6 text-2xl font-semibold text-[#111827]">Dark Mode</div>
          <div className="mt-2 text-gray-500">Alternative</div>
        </button>

        <button className="rounded-3xl border-2 border-[var(--brand-blue)] bg-blue-50 p-8 text-left">
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