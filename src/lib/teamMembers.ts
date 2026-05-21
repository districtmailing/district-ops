import { supabase } from "@/lib/supabase";

export type TeamMemberProfile = {
  first_name?: string;
  last_name?: string;
  email?: string;
};

export type TeamMemberRow = {
  user_id: string;
  profiles?: TeamMemberProfile | TeamMemberProfile[];
};

export function profileToDisplayName(
  profile: TeamMemberProfile | undefined,
  fallbackEmail?: string
) {
  const name =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    profile?.email?.split("@")[0] ||
    fallbackEmail?.split("@")[0] ||
    "";
  return name;
}

export function buildCurrentUserName(user: {
  user_metadata?: Record<string, string | undefined>;
  email?: string | null;
}) {
  const firstName = user.user_metadata?.first_name || "";
  const lastName = user.user_metadata?.last_name || "";
  return (
    `${firstName} ${lastName}`.trim() ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    ""
  );
}

/** Prefer team profile name over stored email for buyer / rep display. */
export function resolveSalesRepDisplayName(options: {
  storedBuyer?: string;
  userId?: string | null;
  displayNamesByUserId?: Record<string, string>;
  authUser?: {
    user_metadata?: Record<string, string | undefined>;
    email?: string | null;
  };
}) {
  const { storedBuyer, userId, displayNamesByUserId, authUser } = options;
  const profileName = userId ? displayNamesByUserId?.[userId]?.trim() : "";
  if (profileName) return profileName;

  if (authUser) {
    const fromAuth = buildCurrentUserName(authUser).trim();
    if (fromAuth) return fromAuth;
  }

  const trimmed = (storedBuyer || "").trim();
  if (trimmed && !trimmed.includes("@")) return trimmed;

  return trimmed.split("@")[0] || trimmed;
}

export async function loadTeamMemberNamesForUser(userId: string) {
  const { data: teamMemberData, error: teamError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (teamError) {
    console.error("Error loading team:", teamError);
    return {
      teamId: null as string | null,
      names: [] as string[],
      displayNamesByUserId: {} as Record<string, string>,
    };
  }

  const teamId = teamMemberData?.team_id || null;
  if (!teamId) {
    return { teamId: null, names: [] as string[], displayNamesByUserId: {} };
  }

  const { data: membersData, error: membersError } = await supabase
    .from("team_members")
    .select(`
      user_id,
      profiles:user_id (
        first_name,
        last_name,
        email
      )
    `)
    .eq("team_id", teamId);

  if (membersError) {
    console.error("Error loading team members:", membersError);
    return { teamId, names: [] as string[], displayNamesByUserId: {} };
  }

  const displayNamesByUserId: Record<string, string> = {};
  const names = ((membersData || []) as TeamMemberRow[])
    .map((member) => {
      const profile = Array.isArray(member.profiles)
        ? member.profiles[0]
        : member.profiles;
      const name = profileToDisplayName(profile);
      if (member.user_id && name) {
        displayNamesByUserId[member.user_id] = name;
      }
      return name;
    })
    .filter(Boolean);

  return {
    teamId,
    names: Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)),
    displayNamesByUserId,
  };
}

export function getSalesRepOptions(
  teamMemberNames: string[],
  currentUserName: string
) {
  if (teamMemberNames.length > 0) {
    return ["Unassigned", ...teamMemberNames];
  }

  const fallback = currentUserName.trim();
  if (fallback) {
    return [fallback, "Unassigned"];
  }

  return ["Unassigned"];
}

export function matchTeamMemberRep(
  repName: string,
  teamMemberNames: string[],
  currentUserName: string
) {
  const trimmed = repName.trim();
  if (!trimmed || trimmed === "Unassigned") {
    return "Unassigned";
  }

  const exact = teamMemberNames.find(
    (name) => name.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) return exact;

  if (
    currentUserName &&
    trimmed.toLowerCase() === currentUserName.toLowerCase()
  ) {
    return currentUserName;
  }

  return teamMemberNames.length > 0
    ? "Unassigned"
    : currentUserName.trim() || "Unassigned";
}
