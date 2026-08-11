import type {
  RightsChecklistAnswer,
  RightsChecklistAnswers,
  RightsChecklistId,
} from "./auction-types";

export type RightsChecklistDefinition = {
  id: RightsChecklistId;
  group: string;
  question: string;
  helper: string;
  documentHint: string;
  options: RightsChecklistAnswer[];
};

export const CHECKLIST_ANSWERS: RightsChecklistAnswer[] = [
  "아니요",
  "예",
  "모름",
  "해당 없음",
];

export const RIGHTS_CHECKLIST_ITEMS: RightsChecklistDefinition[] = [
  {
    id: "occupancyTenant",
    group: "점유·임차인",
    question: "현재 살고 있거나 점유 중인 사람이 있나요?",
    helper: "점유자가 있으면 명도 기간과 협의 비용이 달라질 수 있습니다.",
    documentHint: "현황조사서, 매각물건명세서",
    options: CHECKLIST_ANSWERS,
  },
  {
    id: "moveInFixedDate",
    group: "전입·확정일자",
    question: "임차인의 전입일이나 확정일자가 말소기준권리보다 빠른가요?",
    helper: "앞선 전입이나 확정일자는 보증금 인수 가능성을 키울 수 있습니다.",
    documentHint: "전입세대열람, 주민등록 전입 내역, 매각물건명세서",
    options: CHECKLIST_ANSWERS,
  },
  {
    id: "seniorTenantDeposit",
    group: "선순위 보증금",
    question: "낙찰자가 인수할 수 있는 선순위 임차인 또는 보증금이 있나요?",
    helper: "인수금은 입찰가와 별도로 총투입금에 더해야 합니다.",
    documentHint: "매각물건명세서, 배당요구 종기 내역",
    options: CHECKLIST_ANSWERS,
  },
  {
    id: "distributionDemand",
    group: "배당요구",
    question: "임차인이 배당요구를 했는지 확인했나요?",
    helper: "배당요구 여부에 따라 임차권 인수 판단이 달라질 수 있습니다.",
    documentHint: "매각물건명세서, 배당요구 신청 내역",
    options: CHECKLIST_ANSWERS,
  },
  {
    id: "baselineRight",
    group: "말소기준권리",
    question: "말소기준권리와 그보다 앞선 권리를 확인했나요?",
    helper: "말소되지 않는 권리가 있으면 낙찰 후에도 부담이 남을 수 있습니다.",
    documentHint: "등기사항전부증명서",
    options: CHECKLIST_ANSWERS,
  },
  {
    id: "lienClaim",
    group: "유치권",
    question: "유치권 신고나 점유 주장 문구가 있나요?",
    helper: "유치권은 실제 성립 여부 확인이 필요하고 명도 난이도를 높입니다.",
    documentHint: "매각물건명세서, 현황조사서, 사진 자료",
    options: CHECKLIST_ANSWERS,
  },
  {
    id: "illegalBuildingUse",
    group: "건축·이용",
    question: "위반건축물, 무단 증축, 용도 불일치 가능성이 있나요?",
    helper: "건축물 이슈는 대출, 임대, 매도 가능성에 영향을 줄 수 있습니다.",
    documentHint: "건축물대장, 현황조사서",
    options: CHECKLIST_ANSWERS,
  },
  {
    id: "unpaidFees",
    group: "체납·관리비",
    question: "체납 세금, 관리비, 공과금 승계 가능성을 확인했나요?",
    helper: "일부 비용은 낙찰 후 협의나 정산 부담으로 이어질 수 있습니다.",
    documentHint: "관리사무소 확인, 공매 공고문, 배분계산서",
    options: CHECKLIST_ANSWERS,
  },
  {
    id: "publicSaleTransfer",
    group: "공매 인도조건",
    question: "공매 물건의 인도·이전 조건이 명확한가요?",
    helper: "공매는 법원경매와 인도 절차가 달라질 수 있어 조건 확인이 중요합니다.",
    documentHint: "온비드/캠코 공고문, 입찰 유의사항",
    options: CHECKLIST_ANSWERS,
  },
];

export function createDefaultRightsChecklist(): RightsChecklistAnswers {
  return RIGHTS_CHECKLIST_ITEMS.reduce((answers, item) => {
    answers[item.id] = "모름";
    return answers;
  }, {} as RightsChecklistAnswers);
}

export function normalizeRightsChecklist(
  value: unknown
): RightsChecklistAnswers {
  const defaults = createDefaultRightsChecklist();
  if (!value || typeof value !== "object") return defaults;

  const raw = value as Partial<Record<RightsChecklistId, unknown>>;
  RIGHTS_CHECKLIST_ITEMS.forEach((item) => {
    const answer = raw[item.id];
    if (
      answer === "아니요" ||
      answer === "예" ||
      answer === "모름" ||
      answer === "해당 없음"
    ) {
      defaults[item.id] = answer;
    }
  });

  return defaults;
}

export function summarizeRightsChecklist(answers?: RightsChecklistAnswers) {
  const normalized = normalizeRightsChecklist(answers);
  const completed = RIGHTS_CHECKLIST_ITEMS.filter(
    (item) => normalized[item.id] !== "모름"
  );
  const unknown = RIGHTS_CHECKLIST_ITEMS.filter(
    (item) => normalized[item.id] === "모름"
  );

  return {
    answers: normalized,
    totalCount: RIGHTS_CHECKLIST_ITEMS.length,
    completedCount: completed.length,
    unknownCount: unknown.length,
    unknownItems: unknown,
  };
}
