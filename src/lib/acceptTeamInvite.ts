import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * If the user has a pending team_invites row for their email, add them to
 * team_members and mark the invite accepted. No-ops when there is no invite.
 */
export async function acceptPendingTeamInviteForUser(user: User): Promise<void> {
  const userEmail = user.email?.toLowerCase();
  if (!userEmail) return;

  const { data: pendingInvite, error: inviteLookupError } = await supabase
    .from("team_invites")
    .select("*")
    .eq("email", userEmail)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (inviteLookupError) {
    console.error("Error finding pending invite:", inviteLookupError);
    return;
  }

  if (!pendingInvite) return;

  const { error: joinError } = await supabase.from("team_members").upsert(
    {
      team_id: pendingInvite.team_id,
      user_id: user.id,
      role: pendingInvite.role || "viewer",
    },
    { onConflict: "team_id,user_id" }
  );

  if (joinError) {
    console.error("Error joining invited team:", joinError);
    return;
  }

  const { error: acceptError } = await supabase
    .from("team_invites")
    .update({ status: "accepted" })
    .eq("id", pendingInvite.id);

  if (acceptError) {
    console.error("Error accepting invite:", acceptError);
  }
}
