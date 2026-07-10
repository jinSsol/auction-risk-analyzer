"use client";

import { useMemo, useState } from "react";

type PropertyType = "아파트" | "빌라" | "오피스텔";
type RiskLevel = "안정" | "주의" | "위험";

type AuctionItem = {
  id: number;
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
  const [type, setType] = useState<PropertyType | "전체">("전체");
  const [level, setLevel] = useState<RiskLevel | "전체">("전체");
  const [bidRatio, setBidRatio] = useState(78);
  const [bufferRatio, setBufferRatio] = useState(4);
  const [selectedIds, setSelectedIds] = useState<number[]>([4, 6]);
  const [activeId, setActiveId] = useState(4);

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
      item.caseNo.includes(query);
    const matchType = type === "전체" || item.type === type;
    const matchLevel = level === "전체" || item.analysis.level === level;
    return matchQuery && matchType && matchLevel;
  });

  const active =
    enriched.find((item) => item.id === activeId) ?? enriched[0];
  const selected = enriched.filter((item) => selectedIds.includes(item.id));
  const stats = {
    total: filtered.length,
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
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d2522]">
      <section className="border-b border-[#d8d1c4] bg-[#f9f7f1]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-[#6c5f4c]">
              경매 물건 권리분석 워크벤치
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-[#14211d] md:text-5xl">
              아파트와 빌라 경매를 모아보고, 위험도와 적정 입찰가를 한 번에 비교하세요.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#53615b]">
              샘플 데이터 기반의 시제품입니다. 말소기준권리, 임차인 인수 가능성,
              유치권, 위반건축물, 체납 리스크를 점수화하고 시세 대비 안전마진을
              계산합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end md:grid-cols-4 lg:grid-cols-2">
            <Metric label="검색 물건" value={`${stats.total}건`} />
            <Metric label="안정" value={`${stats.stable}건`} tone="green" />
            <Metric label="주의" value={`${stats.caution}건`} tone="amber" />
            <Metric label="위험" value={`${stats.risky}건`} tone="red" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[310px_1fr] lg:px-8">
        <aside className="space-y-4">
          <div className="rounded-lg border border-[#d8d1c4] bg-white p-4 shadow-sm">
            <label className="text-sm font-semibold text-[#29332f]">
              지역, 사건번호, 물건명 검색
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 화곡, 2025타경, 아파트"
              className="mt-2 h-11 w-full rounded-md border border-[#c8c0b2] bg-[#fbfaf7] px-3 text-sm outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#95d5b2]"
            />
          </div>

          <FilterGroup
            title="물건 종류"
            options={["전체", "아파트", "빌라", "오피스텔"]}
            value={type}
            onChange={(value) => setType(value as PropertyType | "전체")}
          />

          <FilterGroup
            title="권리분석 결과"
            options={["전체", "안정", "주의", "위험"]}
            value={level}
            onChange={(value) => setLevel(value as RiskLevel | "전체")}
          />

          <div className="rounded-lg border border-[#d8d1c4] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-[#29332f]">
                예상 입찰가
              </label>
              <span className="text-sm font-bold text-[#2d6a4f]">
                시세의 {bidRatio}%
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="95"
              value={bidRatio}
              onChange={(event) => setBidRatio(Number(event.target.value))}
              className="mt-3 w-full accent-[#2d6a4f]"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-[#29332f]">
                보수 비용 버퍼
              </label>
              <span className="text-sm font-bold text-[#8a5a00]">
                시세의 {bufferRatio}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              value={bufferRatio}
              onChange={(event) => setBufferRatio(Number(event.target.value))}
              className="mt-3 w-full accent-[#b08900]"
            />
          </div>

          <div className="rounded-lg border border-[#d8d1c4] bg-[#1f2f2a] p-4 text-white shadow-sm">
            <p className="text-sm font-semibold">체크 기준</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#dbe7e0]">
              <li>말소기준보다 앞선 임차권은 인수 가능성 반영</li>
              <li>유치권, 체납, 위반건축물은 별도 위험 가산</li>
              <li>적정가는 시세 할인, 인수금, 비용 버퍼 차감</li>
            </ul>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-lg border border-[#d8d1c4] bg-white shadow-sm">
              <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_0.7fr] border-b border-[#e5ded2] bg-[#fbfaf7] px-4 py-3 text-xs font-bold uppercase tracking-normal text-[#6c5f4c]">
                <span>물건</span>
                <span>최저가</span>
                <span>시세비율</span>
                <span>권리분석</span>
                <span>판단</span>
              </div>
              <div className="divide-y divide-[#eee8dd]">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    className={`grid w-full grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_0.7fr] items-center gap-3 px-4 py-4 text-left text-sm transition hover:bg-[#f7f5ef] ${
                      active.id === item.id ? "bg-[#edf6f1]" : ""
                    }`}
                  >
                    <span>
                      <span className="block font-semibold text-[#1f2f2a]">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs text-[#68756f]">
                        {item.caseNo} · {item.district} · {item.floor}
                      </span>
                    </span>
                    <span className="font-semibold">{uk(item.minimum)}</span>
                    <span>{percent(item.analysis.marketRatio)}</span>
                    <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
                    <Verdict value={item.analysis.verdict} />
                  </button>
                ))}
              </div>
            </div>

            <DetailPanel item={active} onToggle={toggleSelected} selected={selectedIds.includes(active.id)} />
          </section>

          <section className="rounded-lg border border-[#d8d1c4] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#1f2f2a]">
                  선택 물건 비교
                </h2>
                <p className="text-sm text-[#68756f]">
                  최대 4개까지 비교합니다. 입찰가 슬라이더를 움직이면 전체 계산이
                  같이 바뀝니다.
                </p>
              </div>
              <button
                onClick={() => setSelectedIds([])}
                className="h-9 rounded-md border border-[#c8c0b2] px-3 text-sm font-semibold text-[#44504b] transition hover:bg-[#f4f1ea]"
              >
                선택 비우기
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5ded2] bg-[#fbfaf7] text-left text-xs text-[#6c5f4c]">
                    <th className="px-3 py-3">물건</th>
                    <th className="px-3 py-3">시세</th>
                    <th className="px-3 py-3">최저가</th>
                    <th className="px-3 py-3">예상 입찰</th>
                    <th className="px-3 py-3">인수금</th>
                    <th className="px-3 py-3">총 투입</th>
                    <th className="px-3 py-3">안전마진</th>
                    <th className="px-3 py-3">추천</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-[#68756f]" colSpan={8}>
                        비교할 물건을 선택하세요.
                      </td>
                    </tr>
                  ) : (
                    selected.map((item) => (
                      <tr key={item.id} className="border-b border-[#f0ebe1]">
                        <td className="px-3 py-3 font-semibold">{item.title}</td>
                        <td className="px-3 py-3">{uk(item.market)}</td>
                        <td className="px-3 py-3">{uk(item.minimum)}</td>
                        <td className="px-3 py-3">{uk(item.analysis.plannedBid)}</td>
                        <td className="px-3 py-3">{uk(item.takeoverAmount)}</td>
                        <td className="px-3 py-3">{uk(item.analysis.allIn)}</td>
                        <td className={`px-3 py-3 font-semibold ${item.analysis.marginRate < 10 ? "text-[#b42318]" : "text-[#20724f]"}`}>
                          {uk(item.analysis.margin)} · {percent(item.analysis.marginRate)}
                        </td>
                        <td className="px-3 py-3">
                          <Verdict value={item.analysis.verdict} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
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
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-white text-[#1f2f2a]",
    green: "bg-[#e6f4ec] text-[#17643f]",
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
    <aside className="rounded-lg border border-[#d8d1c4] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#6c5f4c]">{item.caseNo}</p>
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

      <div className="mt-5 rounded-lg bg-[#f4f1ea] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#29332f]">적정 입찰 상한</span>
          <span className="text-2xl font-bold text-[#2d6a4f]">
            {uk(item.analysis.suggested)}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#ded6c9]">
          <div
            className={`h-full rounded-full ${
              item.analysis.level === "위험"
                ? "bg-[#d1493f]"
                : item.analysis.level === "주의"
                  ? "bg-[#d89b17]"
                  : "bg-[#2d6a4f]"
            }`}
            style={{ width: `${item.analysis.risk}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#68756f]">
          <span>위험도 {item.analysis.risk}점</span>
          <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1f2f2a]">권리분석 체크</h3>
        <Check label="임차인" value={item.tenant} />
        <Check label="선순위 보증금" value={uk(item.seniorDeposit)} />
        <Check label="인수 추정액" value={uk(item.takeoverAmount)} />
        <Check label="점유/명도" value={item.occupancy} />
      </div>

      <div className="mt-5 rounded-lg border border-[#e5ded2] p-4">
        <h3 className="text-sm font-bold text-[#1f2f2a]">위험 신호</h3>
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
