export const UNKNOWN_ACTIVITY_USER = "Unknown User";

export type ActivityCreatorFields = {
  created_by?: string | null;
  created_by_name?: string | null;
};

function isUsableRepName(name: string | null | undefined) {
  const trimmed = name?.trim() || "";
  return Boolean(trimmed) && trimmed.toLowerCase() !== "unassigned";
}

export function resolveCallEmailRepName(
  note: ActivityCreatorFields,
  namesByUserId: Record<string, string>,
  companyRep: string
): string {
  const storedName = note.created_by_name?.trim();
  if (storedName && storedName !== UNKNOWN_ACTIVITY_USER) {
    return storedName;
  }

  if (note.created_by && namesByUserId[note.created_by]?.trim()) {
    return namesByUserId[note.created_by].trim();
  }

  if (isUsableRepName(companyRep)) {
    return companyRep.trim();
  }

  return UNKNOWN_ACTIVITY_USER;
}

export function resolveContactingRepForSave(
  userId: string | null | undefined,
  namesByUserId: Record<string, string>,
  currentUserName: string,
  companyRep: string
): string {
  if (userId && namesByUserId[userId]?.trim()) {
    return namesByUserId[userId].trim();
  }

  if (currentUserName.trim()) {
    return currentUserName.trim();
  }

  if (isUsableRepName(companyRep)) {
    return companyRep.trim();
  }

  return UNKNOWN_ACTIVITY_USER;
}

export function buildCreatorFieldsForSave(
  userId: string | null | undefined,
  namesByUserId: Record<string, string>,
  currentUserName: string,
  companyRep: string
): { created_by: string | null; created_by_name: string } {
  const created_by = userId || null;
  const created_by_name = resolveContactingRepForSave(
    created_by,
    namesByUserId,
    currentUserName,
    companyRep
  );

  return { created_by, created_by_name };
}

export function isMissingCreatorColumnError(error: {
  message?: string;
  code?: string;
} | null) {
  const message = error?.message?.toLowerCase() || "";
  return (
    error?.code === "PGRST204" ||
    message.includes("created_by") ||
    message.includes("schema cache")
  );
}
