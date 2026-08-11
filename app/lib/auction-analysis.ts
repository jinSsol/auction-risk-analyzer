import type { AuctionItem, RightsChecklistAnswer, RightsChecklistId, RiskLevel } from "./auction-types";
import { summarizeRightsChecklist } from "./rights-checklist";

export const won = new Intl.NumberFormat("ko-KR");

export function uk(amount: number) {
  return `${won.format(amount)}만`;
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}

type RiskFactor = {
  label: string;
  points: number;
  severity: "caution" | "danger";
};

function addRiskFactor(
  factors: RiskFactor[],
  label: string,
  points: number,
  severity: RiskFactor["severity"] = "caution"
) {
  factors.push({ label, points, severity });
}

export function analyze(item: AuctionItem, bidRatio: number, bufferRatio: number) {
  let risk = 8;
  const riskFactors: RiskFactor[] = [];
  const expertTriggers: string[] = [];

  if (item.tenant === "대항력 가능") {
    addRiskFactor(riskFactors, "대항력 임차인 가능성", 28, "danger");
    expertTriggers.push("선순위 임차인 가능성");
  } else if (item.tenant === "확인 필요") {
    addRiskFactor(riskFactors, "전입/확정일자 확인 필요", 14);
  } else if (item.tenant === "전입 있음") {
    addRiskFactor(riskFactors, "임차인 명도 협의 필요", 8);
  }

  if (item.takeoverAmount > 0) {
    addRiskFactor(riskFactors, `인수 추정 ${uk(item.takeoverAmount)}`, 22, "danger");
    expertTriggers.push("인수금 존재");
  }
  if (item.liens) {
    addRiskFactor(riskFactors, "유치권 신고", 22, "danger");
    expertTriggers.push("유치권 신고");
  }
  if (item.illegalBuilding) {
    addRiskFactor(riskFactors, "위반건축물 확인", 14, "danger");
    expertTriggers.push("위반건축물 가능성");
  }
  if (item.taxRisk) {
    addRiskFactor(riskFactors, "체납/관리비 리스크", 10);
  }
  if (item.occupancy === "명도 난이도 높음") {
    addRiskFactor(riskFactors, "명도 난이도 높음", 12);
  }
  if (item.failedBids >= 3) {
    addRiskFactor(riskFactors, "유찰 3회 이상", 8);
  }
  if (item.minimum / item.market > 0.85) {
    addRiskFactor(riskFactors, "최저가가 시세 대비 높음", 6);
  }

  const checklistSummary = summarizeRightsChecklist(item.rightsChecklist);
  const checklistFactors = analyzeRightsChecklistAnswers(
    checklistSummary.answers,
    item.channel
  );
  checklistFactors.riskFactors.forEach((factor) => riskFactors.push(factor));
  checklistFactors.expertTriggers.forEach((trigger) => {
    if (!expertTriggers.includes(trigger)) expertTriggers.push(trigger);
  });

  risk += riskFactors.reduce((total, factor) => total + factor.points, 0);

  const cappedRisk = Math.min(96, risk);
  const level: RiskLevel =
    cappedRisk >= 65 ? "위험" : cappedRisk >= 38 ? "주의" : "안정";
  const baseDiscount = level === "위험" ? 0.72 : level === "주의" ? 0.8 : 0.87;
  const calculator = item.bidCalculator;
  const takeoverAmount = calculator?.takeoverAmount ?? item.takeoverAmount;
  const plannedBid =
    calculator && calculator.plannedBid > 0
      ? calculator.plannedBid
      : Math.round(item.market * (bidRatio / 100));
  const desiredMarginRate =
    calculator && calculator.desiredMarginRate > 0
      ? calculator.desiredMarginRate
      : 12;
  const acquisitionTaxAndFees =
    calculator && calculator.acquisitionTaxAndFees > 0
      ? calculator.acquisitionTaxAndFees
      : Math.round(plannedBid * 0.035);
  const repairBudget =
    calculator && calculator.repairBudget > 0
      ? calculator.repairBudget
      : Math.round(item.market * (bufferRatio / 100));
  const evictionBudget = calculator?.evictionBudget ?? 0;
  const unpaidFees = calculator?.unpaidFees ?? 0;
  const extraCosts =
    acquisitionTaxAndFees + repairBudget + evictionBudget + unpaidFees;
  const conservativeBidCeiling = Math.max(
    0,
    Math.round(item.market * baseDiscount - takeoverAmount - extraCosts)
  );
  const doNotBidAbove = Math.max(
    0,
    Math.round(
      item.market * (1 - desiredMarginRate / 100) - takeoverAmount - extraCosts
    )
  );
  const suggested = Math.min(conservativeBidCeiling, doNotBidAbove);
  const allIn = plannedBid + takeoverAmount + extraCosts;
  const margin = item.market - allIn;
  const marginRate = (margin / item.market) * 100;
  const minGap = plannedBid - item.minimum;
  const verdict =
    expertTriggers.length > 0 || level === "위험"
      ? "전문가 검토"
      : plannedBid <= suggested && marginRate >= 12
        ? "입찰 검토"
        : "가격 조정";
  const flags = riskFactors.map((factor) => factor.label);

  return {
    flags,
    riskFactors,
    expertTriggers,
    risk: cappedRisk,
    level,
    suggested,
    conservativeBidCeiling,
    doNotBidAbove,
    plannedBid,
    takeoverAmount,
    acquisitionTaxAndFees,
    repairBudget,
    evictionBudget,
    unpaidFees,
    extraCosts,
    desiredMarginRate,
    allIn,
    margin,
    marginRate,
    minGap,
    verdict,
    saleRatio: (item.minimum / item.appraised) * 100,
    marketRatio: (item.minimum / item.market) * 100,
  };
}

function analyzeRightsChecklistAnswers(
  answers: Record<RightsChecklistId, RightsChecklistAnswer>,
  channel: AuctionItem["channel"]
) {
  const riskFactors: RiskFactor[] = [];
  const expertTriggers: string[] = [];

  const add = (
    label: string,
    points: number,
    severity: RiskFactor["severity"] = "caution",
    expertTrigger?: string
  ) => {
    riskFactors.push({ label, points, severity });
    if (expertTrigger) expertTriggers.push(expertTrigger);
  };

  if (answers.occupancyTenant === "예") {
    add("점유자 있음", 8);
  } else if (answers.occupancyTenant === "모름") {
    add("점유자 확인 필요", 4);
  }

  if (answers.moveInFixedDate === "예") {
    add("전입/확정일자 선순위 가능", 18, "danger", "선순위 임차인 가능성");
  } else if (answers.moveInFixedDate === "모름") {
    add("전입/확정일자 확인 필요", 8);
  }

  if (answers.seniorTenantDeposit === "예") {
    add("선순위 보증금 가능성", 24, "danger", "선순위 보증금 가능성");
  } else if (answers.seniorTenantDeposit === "모름") {
    add("선순위 보증금 확인 필요", 8);
  }

  if (answers.distributionDemand === "아니요") {
    add("배당요구 미확인", 10);
  } else if (answers.distributionDemand === "모름") {
    add("배당요구 여부 확인 필요", 6);
  }

  if (answers.baselineRight === "아니요") {
    add("말소기준권리 미확인", 16, "danger", "말소되지 않는 권리 가능성");
  } else if (answers.baselineRight === "모름") {
    add("말소기준권리 확인 필요", 8);
  }

  if (answers.lienClaim === "예") {
    add("유치권 주장 가능성", 24, "danger", "유치권 신고");
  } else if (answers.lienClaim === "모름") {
    add("유치권 여부 확인 필요", 8);
  }

  if (answers.illegalBuildingUse === "예") {
    add("건축물 이슈 가능성", 16, "danger", "위반건축물 가능성");
  } else if (answers.illegalBuildingUse === "모름") {
    add("건축물대장 확인 필요", 6);
  }

  if (answers.unpaidFees === "예") {
    add("체납/관리비 승계 가능성", 10);
  } else if (answers.unpaidFees === "모름") {
    add("체납/관리비 확인 필요", 5);
  }

  if (channel === "공매") {
    if (answers.publicSaleTransfer === "아니요") {
      add("공매 인도조건 불명확", 16, "danger", "공매 인도·이전 조건 불명확");
    } else if (answers.publicSaleTransfer === "모름") {
      add("공매 인도조건 확인 필요", 10, "danger", "공매 인도·이전 조건 불명확");
    }
  }

  return { riskFactors, expertTriggers };
}

export function analyzeComparableSales(item: AuctionItem) {
  const sales = (item.comparableSales ?? []).filter((sale) => sale.price > 0);

  if (sales.length === 0) {
    return {
      count: 0,
      average: 0,
      low: 0,
      high: 0,
      marketGap: 0,
      marketGapRate: 0,
      verdict: "시세 근거 부족" as const,
    };
  }

  const prices = sales.map((sale) => sale.price);
  const average = Math.round(
    prices.reduce((total, price) => total + price, 0) / prices.length
  );
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const marketGap = item.market - average;
  const marketGapRate = average > 0 ? (marketGap / average) * 100 : 0;
  const absGapRate = Math.abs(marketGapRate);
  const verdict =
    absGapRate <= 5
      ? "입력 시세 적정"
      : marketGapRate > 5
        ? "입력 시세 높음"
        : "입력 시세 보수적";

  return {
    count: sales.length,
    average,
    low,
    high,
    marketGap,
    marketGapRate,
    verdict,
  };
}

export type AnalyzedItem = AuctionItem & {
  analysis: ReturnType<typeof analyze>;
};
