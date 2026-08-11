export type PropertyType = "아파트" | "빌라" | "오피스텔";
export type SaleChannel = "경매" | "공매";
export type RiskLevel = "안정" | "주의" | "위험";
export type RightsChecklistAnswer = "아니요" | "예" | "모름" | "해당 없음";
export type RightsChecklistId =
  | "occupancyTenant"
  | "moveInFixedDate"
  | "seniorTenantDeposit"
  | "distributionDemand"
  | "baselineRight"
  | "lienClaim"
  | "illegalBuildingUse"
  | "unpaidFees"
  | "publicSaleTransfer";
export type RightsChecklistAnswers = Record<
  RightsChecklistId,
  RightsChecklistAnswer
>;

export type ComparableSale = {
  id: string;
  label: string;
  tradeDate: string;
  area: number;
  floor: string;
  price: number;
  memo: string;
};

export type AuctionItem = {
  id: string;
  channel: SaleChannel;
  agency: string;
  caseNo: string;
  sourceUrl?: string;
  title: string;
  type: PropertyType;
  district: string;
  address: string;
  appraised: number;
  minimum: number;
  market: number;
  lastTrade: number;
  deposit: number;
  monthlyRent: number;
  area: number;
  floor: string;
  failedBids: number;
  auctionDate: string;
  tenant: "없음" | "전입 있음" | "대항력 가능" | "확인 필요";
  seniorDeposit: number;
  takeoverAmount: number;
  liens: boolean;
  illegalBuilding: boolean;
  taxRisk: boolean;
  occupancy: "명도 쉬움" | "협의 필요" | "명도 난이도 높음";
  notes: string[];
  userMemo?: string;
  comparableSales?: ComparableSale[];
  rightsChecklist?: RightsChecklistAnswers;
};
