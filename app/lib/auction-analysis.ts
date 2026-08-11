import type { AuctionItem, RiskLevel } from "./auction-types";

export const won = new Intl.NumberFormat("ko-KR");

export function uk(amount: number) {
  return `${won.format(amount)}만`;
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}

export function analyze(item: AuctionItem, bidRatio: number, bufferRatio: number) {
  let risk = 8;
  const flags: string[] = [];

  if (item.tenant === "대항력 가능") {
    risk += 28;
    flags.push("대항력 임차인 가능성");
  } else if (item.tenant === "확인 필요") {
    risk += 14;
    flags.push("전입/확정일자 확인 필요");
  } else if (item.tenant === "전입 있음") {
    risk += 8;
    flags.push("임차인 명도 협의 필요");
  }

  if (item.takeoverAmount > 0) {
    risk += 22;
    flags.push(`인수 추정 ${uk(item.takeoverAmount)}`);
  }
  if (item.liens) {
    risk += 22;
    flags.push("유치권 신고");
  }
  if (item.illegalBuilding) {
    risk += 14;
    flags.push("위반건축물 확인");
  }
  if (item.taxRisk) {
    risk += 10;
    flags.push("체납/관리비 리스크");
  }
  if (item.occupancy === "명도 난이도 높음") risk += 12;
  if (item.failedBids >= 3) risk += 8;
  if (item.minimum / item.market > 0.85) risk += 6;

  const cappedRisk = Math.min(96, risk);
  const level: RiskLevel =
    cappedRisk >= 65 ? "위험" : cappedRisk >= 38 ? "주의" : "안정";
  const baseDiscount = level === "위험" ? 0.72 : level === "주의" ? 0.8 : 0.87;
  const buffer = item.market * (bufferRatio / 100);
  const suggested = Math.max(
    0,
    Math.round(item.market * baseDiscount - item.takeoverAmount - buffer)
  );
  const plannedBid = Math.round(item.market * (bidRatio / 100));
  const allIn = plannedBid + item.takeoverAmount;
  const margin = item.market - allIn;
  const marginRate = (margin / item.market) * 100;
  const minGap = plannedBid - item.minimum;
  const verdict =
    level === "위험"
      ? "보류"
      : plannedBid <= suggested && marginRate >= 12
        ? "입찰 검토"
        : "가격 조정";

  return {
    flags,
    risk: cappedRisk,
    level,
    suggested,
    plannedBid,
    allIn,
    margin,
    marginRate,
    minGap,
    verdict,
    saleRatio: (item.minimum / item.appraised) * 100,
    marketRatio: (item.minimum / item.market) * 100,
  };
}

export type AnalyzedItem = AuctionItem & {
  analysis: ReturnType<typeof analyze>;
};
