import type { RiskLevel } from "../lib/auction-types";

export const riskAccentClass: Record<RiskLevel, string> = {
  안정: "bg-[#173B35]",
  주의: "bg-[#6B7F5D]",
  위험: "bg-[#DC2626]",
};

export function StatusBadge({ label }: { label: string }) {
  const style =
    label === "확인 필요"
      ? "bg-[#EEF3E8] text-[#566A4B]"
      : label === "직접 입력"
        ? "bg-[#F7F2E8] text-[#56635C]"
        : "bg-[#EEF5F1] text-[#173B35]";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

export function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const styles = {
    안정: "bg-[#EEF5F1] text-[#173B35]",
    주의: "bg-[#EEF3E8] text-[#566A4B]",
    위험: "bg-[#FEE2E2] text-[#B42318]",
  };
  const label = level === "안정" ? "검토 쉬움" : level;

  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[level]}`}>
      {label} · {score}점
    </span>
  );
}

export function Verdict({ value }: { value: string }) {
  const style =
    value === "입찰 검토"
      ? "border-[#D7E4DC] bg-[#EEF5F1] text-[#173B35]"
      : value === "가격 조정"
        ? "border-[#CBD9C2] bg-[#EEF3E8] text-[#566A4B]"
        : "border-[#FCA5A5] bg-[#FEE2E2] text-[#B42318]";

  return (
    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      {value}
    </span>
  );
}

export function RiskMeter({
  level,
  score,
  className = "mt-3",
}: {
  level: RiskLevel;
  score: number;
  className?: string;
}) {
  return (
    <div className={`${className} h-2 overflow-hidden rounded-full bg-[#E5DED3]`}>
      <div className={`risk-fill h-full rounded-full ${riskAccentClass[level]}`} style={{ width: `${score}%` }} />
    </div>
  );
}

export function MiniStat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#6F766F]">{label}</p>
      <p className={`mt-0.5 break-words font-semibold tabular-nums ${danger ? "text-[#B42318]" : "text-[#1F2A24]"}`}>
        {value}
      </p>
    </div>
  );
}
