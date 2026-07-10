"use client";

import { useMemo, useState } from "react";

type PropertyType = "아파트" | "빌라" | "오피스텔";
type SaleChannel = "경매" | "공매";
type RiskLevel = "안정" | "주의" | "위험";

type AuctionItem = {
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

const won = new Intl.NumberFormat("ko-KR");

const items: AuctionItem[] = [
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

function uk(amount: number) {
  return `${won.format(amount)}만`;
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

function analyze(item: AuctionItem, bidRatio: number, bufferRatio: number) {
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

export default function Home() {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<SaleChannel | "전체">("전체");
  const [type, setType] = useState<PropertyType | "전체">("전체");
  const [level, setLevel] = useState<RiskLevel | "전체">("전체");
  const [bidRatio, setBidRatio] = useState(78);
  const [bufferRatio, setBufferRatio] = useState(4);
  const [selectedIds, setSelectedIds] = useState<number[]>([4, 6, 7]);
  const [activeId, setActiveId] = useState(7);

  const enriched = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        analysis: analyze(item, bidRatio, bufferRatio),
      })),
    [bidRatio, bufferRatio]
  );

  const filtered = enriched.filter((item) => {
    const matchQuery =
      item.title.includes(query) ||
      item.district.includes(query) ||
      item.caseNo.includes(query) ||
      item.channel.includes(query) ||
      item.agency.includes(query);
    const matchChannel = channel === "전체" || item.channel === channel;
    const matchType = type === "전체" || item.type === type;
    const matchLevel = level === "전체" || item.analysis.level === level;
    return matchQuery && matchChannel && matchType && matchLevel;
  });

  const active =
    enriched.find((item) => item.id === activeId) ?? enriched[0];
  const selected = enriched.filter((item) => selectedIds.includes(item.id));
  const stats = {
    total: filtered.length,
    auction: filtered.filter((item) => item.channel === "경매").length,
    publicSale: filtered.filter((item) => item.channel === "공매").length,
    stable: filtered.filter((item) => item.analysis.level === "안정").length,
    caution: filtered.filter((item) => item.analysis.level === "주의").length,
    risky: filtered.filter((item) => item.analysis.level === "위험").length,
  };

  function toggleSelected(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id].slice(-4)
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#1b2420]">
      <section className="border-b border-[#d9d2c5] bg-[#fcfaf5]">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold text-[#6b5f4f]">
                경매·공매 권리분석 워크벤치
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#13201b] md:text-4xl">
                물건을 고르면 위험 신호와 적정 입찰가가 바로 보입니다.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#5c6963] md:text-base">
                현재는 실시간 연동 전 샘플 데이터입니다. 경매·공매 구분, 인수금,
                점유 리스크, 시세 대비 안전마진을 한 화면에서 비교합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
              <Metric label="검색 결과" value={`${stats.total}건`} />
              <Metric label="경매" value={`${stats.auction}건`} tone="green" />
              <Metric label="공매" value={`${stats.publicSale}건`} tone="blue" />
              <Metric label="위험" value={`${stats.risky}건`} tone="red" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#ddd5c8] bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-4 lg:grid-cols-[minmax(240px,1fr)_auto_auto_auto] lg:items-end lg:px-8">
          <div>
            <label className="text-xs font-bold text-[#5c6963]">
              검색
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="판교, 온비드, 2025타경, 빌라"
              className="mt-1 h-11 w-full rounded-md border border-[#c9c1b4] bg-[#fbfaf7] px-3 text-sm outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#95d5b2]"
            />
          </div>
          <InlineFilter
            title="매각 방식"
            options={["전체", "경매", "공매"]}
            value={channel}
            onChange={(value) => setChannel(value as SaleChannel | "전체")}
          />
          <InlineFilter
            title="물건"
            options={["전체", "아파트", "빌라", "오피스텔"]}
            value={type}
            onChange={(value) => setType(value as PropertyType | "전체")}
          />
          <InlineFilter
            title="판단"
            options={["전체", "안정", "주의", "위험"]}
            value={level}
            onChange={(value) => setLevel(value as RiskLevel | "전체")}
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_410px] lg:px-8">
        <div className="space-y-5">
          <div className="grid gap-3 rounded-lg border border-[#d9d2c5] bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto] md:items-center">
            <RangeControl
              label="예상 입찰가"
              value={bidRatio}
              suffix="시세 기준"
              min={60}
              max={95}
              onChange={setBidRatio}
              tone="green"
            />
            <RangeControl
              label="수리·명도 버퍼"
              value={bufferRatio}
              suffix="비용 차감"
              min={0}
              max={12}
              onChange={setBufferRatio}
              tone="amber"
            />
            <div className="rounded-md bg-[#1f2f2a] px-4 py-3 text-sm text-white">
              <p className="font-bold">계산 기준</p>
              <p className="mt-1 text-[#dfe8e2]">
                시세 할인 - 인수금 - 비용 버퍼
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {filtered.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                active={active.id === item.id}
                selected={selectedIds.includes(item.id)}
                onOpen={() => setActiveId(item.id)}
                onToggle={() => toggleSelected(item.id)}
              />
            ))}
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-[#d9d2c5] bg-white p-8 text-center text-sm font-semibold text-[#68756f]">
                조건에 맞는 샘플 물건이 없습니다.
              </div>
            ) : null}
          </div>

          <ComparePanel selected={selected} onClear={() => setSelectedIds([])} />
        </div>

        <DetailPanel
          item={active}
          onToggle={toggleSelected}
          selected={selectedIds.includes(active.id)}
        />
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-white text-[#1f2f2a]",
    green: "bg-[#e6f4ec] text-[#17643f]",
    blue: "bg-[#e8f1ff] text-[#2256a3]",
    amber: "bg-[#fff4d8] text-[#8a5a00]",
    red: "bg-[#fde8e3] text-[#b42318]",
  };
  return (
    <div className={`rounded-lg border border-[#d8d1c4] p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-semibold text-current opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function InlineFilter({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#5c6963]">{title}</p>
      <div className="mt-1 flex min-h-11 flex-wrap gap-1.5 rounded-md border border-[#d9d2c5] bg-[#fbfaf7] p-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`min-w-14 rounded px-3 py-2 text-sm font-bold transition ${
              value === option
                ? "bg-[#1f2f2a] text-white"
                : "text-[#55635d] hover:bg-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeControl({
  label,
  value,
  suffix,
  min,
  max,
  tone,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  tone: "green" | "amber";
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#29332f]">{label}</p>
          <p className="text-xs font-semibold text-[#68756f]">{suffix}</p>
        </div>
        <span
          className={`rounded-md px-2.5 py-1 text-sm font-black ${
            tone === "green"
              ? "bg-[#e6f4ec] text-[#17643f]"
              : "bg-[#fff4d8] text-[#8a5a00]"
          }`}
        >
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`mt-3 w-full ${
          tone === "green" ? "accent-[#2d6a4f]" : "accent-[#b08900]"
        }`}
      />
    </div>
  );
}

function ChannelBadge({ channel }: { channel: SaleChannel }) {
  const style =
    channel === "경매"
      ? "bg-[#edf6f1] text-[#17643f]"
      : "bg-[#e8f1ff] text-[#2256a3]";
  return (
    <span className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-bold ${style}`}>
      {channel}
    </span>
  );
}

function ListingCard({
  item,
  active,
  selected,
  onOpen,
  onToggle,
}: {
  item: AuctionItem & { analysis: ReturnType<typeof analyze> };
  active: boolean;
  selected: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const gapToSuggested = item.analysis.suggested - item.analysis.plannedBid;

  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-sm transition ${
        active
          ? "border-[#2d6a4f] ring-2 ring-[#b7e4c7]"
          : "border-[#d9d2c5] hover:border-[#b6ad9f]"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <button onClick={onOpen} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={item.channel} />
            <span className="rounded-md bg-[#f0ede5] px-2 py-0.5 text-xs font-bold text-[#655d50]">
              {item.agency}
            </span>
            <span className="text-xs font-semibold text-[#68756f]">
              {item.caseNo}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-[#17231f]">
                {item.title}
              </h2>
              <p className="mt-1 text-sm text-[#68756f]">
                {item.district} · {item.area}㎡ · {item.floor} · 마감 {item.auctionDate}
              </p>
            </div>
            <Verdict value={item.analysis.verdict} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <PriceStat label="시세" value={uk(item.market)} />
            <PriceStat label="최저가" value={uk(item.minimum)} sub={percent(item.analysis.marketRatio)} />
            <PriceStat label="적정 상한" value={uk(item.analysis.suggested)} strong />
            <PriceStat
              label="안전마진"
              value={percent(item.analysis.marginRate)}
              danger={item.analysis.marginRate < 10}
            />
          </div>
        </button>

        <div className="space-y-3">
          <div className="rounded-lg bg-[#f7f5ef] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#68756f]">권리 위험도</span>
              <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
            </div>
            <RiskMeter level={item.analysis.level} score={item.analysis.risk} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`text-xs font-bold ${
                gapToSuggested >= 0 ? "text-[#17643f]" : "text-[#b42318]"
              }`}
            >
              현재 예상가가 상한보다 {uk(Math.abs(gapToSuggested))}
              {gapToSuggested >= 0 ? " 낮음" : " 높음"}
            </span>
            <button
              onClick={onToggle}
              className={`h-9 rounded-md px-3 text-sm font-black transition ${
                selected
                  ? "bg-[#1f2f2a] text-white"
                  : "border border-[#c8c0b2] bg-white text-[#44504b] hover:bg-[#f4f1ea]"
              }`}
            >
              {selected ? "비교중" : "비교 담기"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PriceStat({
  label,
  value,
  sub,
  strong,
  danger,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md border border-[#ebe5da] bg-[#fcfbf8] p-3">
      <p className="text-xs font-bold text-[#6b746f]">{label}</p>
      <p
        className={`mt-1 truncate text-base font-black ${
          danger
            ? "text-[#b42318]"
            : strong
              ? "text-[#17643f]"
              : "text-[#1f2f2a]"
        }`}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs font-bold text-[#8a7f70]">{sub}</p> : null}
    </div>
  );
}

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#d1493f]" : level === "주의" ? "bg-[#d89b17]" : "bg-[#2d6a4f]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfd8cb]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function ComparePanel({
  selected,
  onClear,
}: {
  selected: Array<AuctionItem & { analysis: ReturnType<typeof analyze> }>;
  onClear: () => void;
}) {
  return (
    <section className="rounded-lg border border-[#d8d1c4] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#1f2f2a]">선택 물건 비교</h2>
          <p className="text-sm text-[#68756f]">
            총투입금과 안전마진이 낮은 물건을 먼저 제외하기 좋습니다.
          </p>
        </div>
        <button
          onClick={onClear}
          className="h-9 rounded-md border border-[#c8c0b2] px-3 text-sm font-bold text-[#44504b] transition hover:bg-[#f4f1ea]"
        >
          선택 비우기
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {selected.length === 0 ? (
          <div className="rounded-md bg-[#f7f5ef] p-5 text-center text-sm font-bold text-[#68756f] md:col-span-3">
            비교할 물건을 선택하세요.
          </div>
        ) : (
          selected.map((item) => (
            <div key={item.id} className="rounded-md border border-[#e5ded2] bg-[#fcfbf8] p-4">
              <div className="flex items-center justify-between gap-2">
                <ChannelBadge channel={item.channel} />
                <Verdict value={item.analysis.verdict} />
              </div>
              <h3 className="mt-3 text-sm font-black text-[#1f2f2a]">{item.title}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <MiniStat label="예상 입찰" value={uk(item.analysis.plannedBid)} />
                <MiniStat label="총투입" value={uk(item.analysis.allIn)} />
                <MiniStat label="인수금" value={uk(item.takeoverAmount)} />
                <MiniStat
                  label="마진"
                  value={percent(item.analysis.marginRate)}
                  danger={item.analysis.marginRate < 10}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function MiniStat({
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
      <p className="text-xs font-bold text-[#68756f]">{label}</p>
      <p className={`mt-0.5 font-black ${danger ? "text-[#b42318]" : "text-[#1f2f2a]"}`}>
        {value}
      </p>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#d8d1c4] bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#29332f]">{title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
              value === option
                ? "border-[#2d6a4f] bg-[#2d6a4f] text-white"
                : "border-[#c8c0b2] bg-[#fbfaf7] text-[#44504b] hover:bg-[#f4f1ea]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const styles = {
    안정: "bg-[#e6f4ec] text-[#17643f]",
    주의: "bg-[#fff4d8] text-[#8a5a00]",
    위험: "bg-[#fde8e3] text-[#b42318]",
  };
  return (
    <span className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-bold ${styles[level]}`}>
      {level} · {score}점
    </span>
  );
}

function Verdict({ value }: { value: string }) {
  const style =
    value === "입찰 검토"
      ? "border-[#bfe3cf] bg-[#f0faf4] text-[#17643f]"
      : value === "가격 조정"
        ? "border-[#f1d48a] bg-[#fff8e5] text-[#8a5a00]"
        : "border-[#f2c4ba] bg-[#fff0ed] text-[#b42318]";
  return (
    <span className={`inline-flex w-fit rounded-md border px-2.5 py-1 text-xs font-bold ${style}`}>
      {value}
    </span>
  );
}

function DetailPanel({
  item,
  selected,
  onToggle,
}: {
  item: AuctionItem & { analysis: ReturnType<typeof analyze> };
  selected: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <aside className="h-fit rounded-lg border border-[#d8d1c4] bg-white p-5 shadow-sm xl:sticky xl:top-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6c5f4c]">
            <ChannelBadge channel={item.channel} />
            <span>{item.agency}</span>
            <span>{item.caseNo}</span>
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#1f2f2a]">{item.title}</h2>
          <p className="mt-1 text-sm text-[#68756f]">{item.address}</p>
        </div>
        <button
          onClick={() => onToggle(item.id)}
          className={`h-10 rounded-md px-3 text-sm font-bold transition ${
            selected
              ? "bg-[#1f2f2a] text-white"
              : "border border-[#c8c0b2] bg-[#fbfaf7] text-[#44504b] hover:bg-[#f4f1ea]"
          }`}
        >
          {selected ? "비교중" : "비교"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Info label="감정가" value={uk(item.appraised)} />
        <Info label="최저가" value={uk(item.minimum)} />
        <Info label="예상 시세" value={uk(item.market)} />
        <Info label="최근 실거래" value={uk(item.lastTrade)} />
      </div>

      <div className="mt-5 rounded-lg border border-[#cfe6d8] bg-[#f0faf4] p-4">
        <p className="text-xs font-black text-[#17643f]">추천 결론</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Verdict value={item.analysis.verdict} />
          <span className="text-xs font-bold text-[#53615b]">
            예상 입찰 {uk(item.analysis.plannedBid)}
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <span className="text-sm font-bold text-[#29332f]">적정 입찰 상한</span>
          <span className="text-2xl font-black text-[#2d6a4f]">
            {uk(item.analysis.suggested)}
          </span>
        </div>
        <RiskMeter level={item.analysis.level} score={item.analysis.risk} />
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#68756f]">
          <span>위험도 {item.analysis.risk}점</span>
          <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <h3 className="text-sm font-black text-[#1f2f2a]">확인할 항목</h3>
        <Check label="임차인" value={item.tenant} />
        <Check label="선순위 보증금" value={uk(item.seniorDeposit)} />
        <Check label="인수 추정액" value={uk(item.takeoverAmount)} />
        <Check label="점유/명도" value={item.occupancy} />
        <Check label="입찰 마감" value={item.auctionDate} />
      </div>

      <div className="mt-5 rounded-lg border border-[#e5ded2] bg-[#fcfbf8] p-4">
        <h3 className="text-sm font-black text-[#1f2f2a]">위험 신호</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.analysis.flags.length === 0 ? (
            <span className="rounded-md bg-[#e6f4ec] px-2.5 py-1 text-xs font-bold text-[#17643f]">
              큰 위험 신호 없음
            </span>
          ) : (
            item.analysis.flags.map((flag) => (
              <span
                key={flag}
                className="rounded-md bg-[#fff4d8] px-2.5 py-1 text-xs font-bold text-[#8a5a00]"
              >
                {flag}
              </span>
            ))
          )}
        </div>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5b6862]">
          {item.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e5ded2] bg-[#fbfaf7] p-3">
      <p className="text-xs font-semibold text-[#68756f]">{label}</p>
      <p className="mt-1 font-bold text-[#1f2f2a]">{value}</p>
    </div>
  );
}

function Check({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#e5ded2] px-3 py-2 text-sm">
      <span className="font-semibold text-[#53615b]">{label}</span>
      <span className="text-right font-bold text-[#1f2f2a]">{value}</span>
    </div>
  );
}
