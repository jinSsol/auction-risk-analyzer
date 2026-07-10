export type PropertyType = "아파트" | "빌라" | "오피스텔";
export type SaleChannel = "경매" | "공매";
export type RiskLevel = "안정" | "주의" | "위험";

export type AuctionItem = {
  id: number;
  channel: SaleChannel;
  agency: string;
  caseNo: string;
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
};

export const won = new Intl.NumberFormat("ko-KR");

export const items: AuctionItem[] = [
  {
    id: 1,
    channel: "경매",
    agency: "법원경매",
    caseNo: "2025타경18432",
    title: "마포구 공덕동 래미안 84",
    type: "아파트",
    district: "서울 마포구",
    address: "서울 마포구 공덕동 29층 중 12층",
    appraised: 125000,
    minimum: 100000,
    market: 132000,
    lastTrade: 129500,
    deposit: 70000,
    monthlyRent: 0,
    area: 84.9,
    floor: "12/29층",
    failedBids: 1,
    auctionDate: "2026-08-18",
    tenant: "전입 있음",
    seniorDeposit: 0,
    takeoverAmount: 0,
    liens: false,
    illegalBuilding: false,
    taxRisk: false,
    occupancy: "협의 필요",
    notes: ["말소기준 이후 임차인으로 추정", "대단지, 실거래 비교 쉬움"],
  },
  {
    id: 2,
    channel: "경매",
    agency: "법원경매",
    caseNo: "2024타경9127",
    title: "관악구 신림동 다세대 2층",
    type: "빌라",
    district: "서울 관악구",
    address: "서울 관악구 신림동 4층 중 2층",
    appraised: 36000,
    minimum: 23040,
    market: 33000,
    lastTrade: 31800,
    deposit: 18000,
    monthlyRent: 25,
    area: 48.2,
    floor: "2/4층",
    failedBids: 2,
    auctionDate: "2026-07-29",
    tenant: "대항력 가능",
    seniorDeposit: 12000,
    takeoverAmount: 12000,
    liens: false,
    illegalBuilding: true,
    taxRisk: false,
    occupancy: "명도 난이도 높음",
    notes: ["선순위 보증금 인수 가능성", "위반건축물 여부 추가 확인 필요"],
  },
  {
    id: 3,
    channel: "경매",
    agency: "법원경매",
    caseNo: "2025타경2201",
    title: "성남 분당구 정자동 오피스텔",
    type: "오피스텔",
    district: "경기 성남시",
    address: "경기 성남시 분당구 정자동 18층 중 8층",
    appraised: 52000,
    minimum: 36400,
    market: 50500,
    lastTrade: 49800,
    deposit: 30000,
    monthlyRent: 15,
    area: 39.6,
    floor: "8/18층",
    failedBids: 1,
    auctionDate: "2026-08-05",
    tenant: "확인 필요",
    seniorDeposit: 0,
    takeoverAmount: 0,
    liens: false,
    illegalBuilding: false,
    taxRisk: true,
    occupancy: "협의 필요",
    notes: ["체납 공과금, 관리비 확인 필요", "수익형 임대 비교 가능"],
  },
  {
    id: 4,
    channel: "경매",
    agency: "법원경매",
    caseNo: "2025타경7810",
    title: "인천 서구 청라동 아파트 59",
    type: "아파트",
    district: "인천 서구",
    address: "인천 서구 청라동 25층 중 20층",
    appraised: 61000,
    minimum: 42700,
    market: 59500,
    lastTrade: 58800,
    deposit: 0,
    monthlyRent: 0,
    area: 59.7,
    floor: "20/25층",
    failedBids: 1,
    auctionDate: "2026-08-12",
    tenant: "없음",
    seniorDeposit: 0,
    takeoverAmount: 0,
    liens: false,
    illegalBuilding: false,
    taxRisk: false,
    occupancy: "명도 쉬움",
    notes: ["공실 가능성 높음", "주변 거래량 양호"],
  },
  {
    id: 5,
    channel: "경매",
    agency: "법원경매",
    caseNo: "2024타경14663",
    title: "강서구 화곡동 신축급 빌라",
    type: "빌라",
    district: "서울 강서구",
    address: "서울 강서구 화곡동 6층 중 5층",
    appraised: 41500,
    minimum: 21248,
    market: 37000,
    lastTrade: 36200,
    deposit: 25000,
    monthlyRent: 0,
    area: 46.8,
    floor: "5/6층",
    failedBids: 3,
    auctionDate: "2026-07-24",
    tenant: "대항력 가능",
    seniorDeposit: 22000,
    takeoverAmount: 22000,
    liens: true,
    illegalBuilding: false,
    taxRisk: true,
    occupancy: "명도 난이도 높음",
    notes: ["유치권 신고 있음", "선순위 임차보증금 검증 전까지 보수 접근"],
  },
  {
    id: 6,
    channel: "경매",
    agency: "법원경매",
    caseNo: "2025타경5069",
    title: "수원 영통구 광교 아파트 74",
    type: "아파트",
    district: "경기 수원시",
    address: "경기 수원시 영통구 이의동 34층 중 9층",
    appraised: 89000,
    minimum: 62300,
    market: 91000,
    lastTrade: 90500,
    deposit: 45000,
    monthlyRent: 0,
    area: 74.5,
    floor: "9/34층",
    failedBids: 1,
    auctionDate: "2026-08-26",
    tenant: "전입 있음",
    seniorDeposit: 0,
    takeoverAmount: 0,
    liens: false,
    illegalBuilding: false,
    taxRisk: false,
    occupancy: "협의 필요",
    notes: ["시세 대비 최저가 여유", "학교, 교통 수요 확인"],
  },
  {
    id: 7,
    channel: "공매",
    agency: "온비드",
    caseNo: "2026-03122-001",
    title: "판교 힐스테이트 아파트 84",
    type: "아파트",
    district: "경기 성남시",
    address: "경기 성남시 분당구 판교동 22층 중 11층",
    appraised: 166000,
    minimum: 149400,
    market: 171000,
    lastTrade: 168500,
    deposit: 85000,
    monthlyRent: 0,
    area: 84.6,
    floor: "11/22층",
    failedBids: 0,
    auctionDate: "2026-08-09",
    tenant: "전입 있음",
    seniorDeposit: 0,
    takeoverAmount: 0,
    liens: false,
    illegalBuilding: false,
    taxRisk: false,
    occupancy: "협의 필요",
    notes: ["공매 샘플 물건", "관리비, 점유자 협의 조건 확인 필요"],
  },
  {
    id: 8,
    channel: "공매",
    agency: "캠코",
    caseNo: "2026-04491-002",
    title: "부천 중동 역세권 오피스텔",
    type: "오피스텔",
    district: "경기 부천시",
    address: "경기 부천시 중동 15층 중 6층",
    appraised: 28500,
    minimum: 22800,
    market: 27600,
    lastTrade: 26900,
    deposit: 16000,
    monthlyRent: 20,
    area: 31.4,
    floor: "6/15층",
    failedBids: 1,
    auctionDate: "2026-07-31",
    tenant: "확인 필요",
    seniorDeposit: 0,
    takeoverAmount: 0,
    liens: false,
    illegalBuilding: false,
    taxRisk: true,
    occupancy: "협의 필요",
    notes: ["압류재산 공매 샘플", "체납, 관리비, 인도 조건 재확인"],
  },
  {
    id: 9,
    channel: "공매",
    agency: "온비드",
    caseNo: "2026-02774-004",
    title: "인천 부평구 구축 빌라",
    type: "빌라",
    district: "인천 부평구",
    address: "인천 부평구 부평동 5층 중 3층",
    appraised: 24000,
    minimum: 16800,
    market: 22500,
    lastTrade: 21800,
    deposit: 12000,
    monthlyRent: 0,
    area: 42.1,
    floor: "3/5층",
    failedBids: 2,
    auctionDate: "2026-08-02",
    tenant: "대항력 가능",
    seniorDeposit: 9000,
    takeoverAmount: 9000,
    liens: false,
    illegalBuilding: true,
    taxRisk: true,
    occupancy: "명도 난이도 높음",
    notes: ["공매 샘플 물건", "선순위 임차권과 위반건축물 여부 보수 확인"],
  },
];

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
