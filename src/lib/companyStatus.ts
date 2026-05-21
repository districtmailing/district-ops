export const STATUS_OPTIONS = ["NEW", "WIP", "YES", "FOLLOW UP", "NO"] as const;

export function normalizeCompanyStatus(value: unknown) {
  if (value === null || value === undefined) return "NEW";

  const normalizedStatus = String(value).trim().toLowerCase();

  if (!normalizedStatus) return "NEW";

  const statusMap: Record<string, string> = {
    new: "NEW",
    none: "NEW",
    wip: "WIP",
    yes: "YES",
    y: "YES",
    true: "YES",
    "1": "YES",
    no: "NO",
    n: "NO",
    false: "NO",
    "0": "NO",
    "follow up": "FOLLOW UP",
    followup: "FOLLOW UP",
    "follow-up": "FOLLOW UP",
    "company call done": "FOLLOW UP",
    "company call": "FOLLOW UP",
  };

  if (statusMap[normalizedStatus]) {
    return statusMap[normalizedStatus];
  }

  const upper = String(value).trim().toUpperCase();
  if (STATUS_OPTIONS.includes(upper as (typeof STATUS_OPTIONS)[number])) {
    return upper;
  }

  return "NEW";
}

export function companyStatusClass(status: string) {
  const normalizedStatus = normalizeCompanyStatus(status);

  if (normalizedStatus === "NEW") return "bg-gray-200 text-gray-700";
  if (normalizedStatus === "WIP") return "bg-blue-100 text-blue-700";
  if (normalizedStatus === "YES") return "bg-green-100 text-green-700";
  if (normalizedStatus === "FOLLOW UP") return "bg-amber-100 text-amber-700";
  if (normalizedStatus === "NO") return "bg-rose-100 text-rose-700";

  return "bg-gray-100 text-gray-700";
}
