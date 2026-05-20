import { getPoStagePillClasses } from "@/lib/poStageStyles";

export function PoStagePill({ stage }: { stage: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getPoStagePillClasses(stage)}`}
    >
      {stage}
    </span>
  );
}
