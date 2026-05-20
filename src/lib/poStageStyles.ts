export const PO_STAGES = ["Sourcing", "Ordered", "Receiving", "Closed"] as const;

export type PoStage = (typeof PO_STAGES)[number];

/** Map legacy DB value to current stage label. */
export function normalizePoStage(stage: string): string {
  if (stage === "Received") return "Receiving";
  return stage;
}

export function getPoStagePillClasses(stage: string): string {
  switch (normalizePoStage(stage)) {
    case "Sourcing":
      return "bg-amber-100 text-amber-950 ring-1 ring-amber-200/80";
    case "Ordered":
      return "bg-blue-100 text-blue-950 ring-1 ring-blue-200/80";
    case "Receiving":
      return "bg-teal-100 text-teal-950 ring-1 ring-teal-200/80";
    case "Closed":
      return "bg-red-100 text-red-950 ring-1 ring-red-200/80";
    default:
      return "bg-gray-100 text-gray-800 ring-1 ring-gray-200/80";
  }
}

export function getPoStageSelectClasses(stage: string): string {
  switch (normalizePoStage(stage)) {
    case "Sourcing":
      return "border-amber-300 bg-amber-50 text-amber-950";
    case "Ordered":
      return "border-blue-300 bg-blue-50 text-blue-950";
    case "Receiving":
      return "border-teal-300 bg-teal-50 text-teal-950";
    case "Closed":
      return "border-red-300 bg-red-50 text-red-950";
    default:
      return "border-gray-300 bg-white text-gray-900";
  }
}
