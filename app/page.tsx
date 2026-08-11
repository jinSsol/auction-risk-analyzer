"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { items } from "./auction-data";
import { analyze, percent, uk, type AnalyzedItem } from "./lib/auction-analysis";
import { mergeAuctionItems } from "./lib/auction-merge";
import { loadUserAuctionItems, type UserAuctionItem } from "./lib/auction-storage";
import { summarizeRightsChecklist } from "./lib/rights-checklist";
import type { PropertyType, RiskLevel, SaleChannel } from "./lib/auction-types";

const DEFAULT_COMPARE_IDS = ["sample-4", "sample-6", "sample-7"];
const COMPARISON_STORAGE_KEY = "auction-risk-analyzer:comparison:v1";
const MAX_COMPARE_COUNT = 4;
type MobileTab = "browse" | "compare";

export default function Home() {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<SaleChannel | "전체">("전체");
  const [type, setType] = useState<PropertyType | "전체">("전체");
  const [level, setLevel] = useState<RiskLevel | "전체">("전체");
  const [owner, setOwner] = useState<"전체" | "내 물건" | "샘플">("전체");
  const [bidRatio, setBidRatio] = useState(78);
  const [bufferRatio, setBufferRatio] = useState(4);
  const [userItems, setUserItems] = useState<UserAuctionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_COMPARE_IDS);
  const [comparisonReady, setComparisonReady] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("browse");
  const contentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUserItems(loadUserAuctionItems());
      setSelectedIds(loadComparisonIds() ?? DEFAULT_COMPARE_IDS);
      setComparisonReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!comparisonReady) return;
    saveComparisonIds(selectedIds);
  }, [comparisonReady, selectedIds]);

  const mergedItems = useMemo(
    () => mergeAuctionItems(items, userItems),
    [userItems]
  );

  const enriched = useMemo(
    () =>
      mergedItems.map((item) => ({
        ...item,
        analysis: analyze(item, bidRatio, bufferRatio),
      })),
    [bidRatio, bufferRatio, mergedItems]
  );

  const filtered = enriched.filter((item) => {
    const matchQuery =
      item.title.includes(query) ||
      item.district.includes(query) ||
      item.caseNo.includes(query) ||
      item.channel.includes(query) ||
      item.agency.includes(query) ||
      item.address.includes(query) ||
      (item.userMemo ?? "").includes(query);
    const matchChannel = channel === "전체" || item.channel === channel;
    const matchType = type === "전체" || item.type === type;
    const matchLevel = level === "전체" || item.analysis.level === level;
    const matchOwner =
      owner === "전체" ||
      (owner === "내 물건" && item.id.startsWith("user-")) ||
      (owner === "샘플" && item.id.startsWith("sample-"));
    return matchQuery && matchChannel && matchType && matchLevel && matchOwner;
  });

  const selected = selectedIds
    .map((id) => enriched.find((item) => item.id === id))
    .filter((item): item is AnalyzedItem => Boolean(item));
  const stats = {
    total: filtered.length,
    auction: filtered.filter((item) => item.channel === "경매").length,
    publicSale: filtered.filter((item) => item.channel === "공매").length,
    stable: filtered.filter((item) => item.analysis.level === "안정").length,
    caution: filtered.filter((item) => item.analysis.level === "주의").length,
    risky: filtered.filter((item) => item.analysis.level === "위험").length,
    mine: filtered.filter((item) => item.id.startsWith("user-")).length,
  };
  const activeFilterCount = [
    channel !== "전체",
    type !== "전체",
    level !== "전체",
    owner !== "전체",
  ].filter(Boolean).length;

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id].slice(-MAX_COMPARE_COUNT)
    );
  }

  function changeMobileTab(tab: MobileTab) {
    setMobileTab(tab);
    window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function resetFilters() {
    setQuery("");
    setChannel("전체");
    setType("전체");
    setLevel("전체");
    setOwner("전체");
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-[#17211D] md:pb-0">
      <section className="hero-surface border-b border-[#DDE5E1]">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#1F8A5B] ring-1 ring-[#BFE3D0] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1F8A5B] shadow-[0_0_0_4px_rgba(31,138,91,0.12)]" />
                권리 리스크 · 입찰가 분석
              </p>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-[#17211D] md:text-5xl">
                경매·공매 물건의 권리 리스크와 입찰 상한을 한 화면에서 비교하세요.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#66736D]">
                지금은 실시간 연동 전 샘플 데이터입니다. 어려운 권리 용어는
                체크리스트로 풀고, 시세·인수금·안전마진은 한눈에 비교합니다.
              </p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/properties/new"
                className="button-lift mt-5 inline-flex h-11 items-center rounded-lg bg-[#17211D] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,33,29,0.16)] hover:bg-[#26332E]"
              >
                새 물건 등록
                <span className="ml-2 text-base leading-none">+</span>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
              <Metric label="검색 결과" value={`${stats.total}건`} />
              <Metric label="경매" value={`${stats.auction}건`} tone="green" />
              <Metric label="공매" value={`${stats.publicSale}건`} tone="blue" />
              <Metric label="내 물건" value={`${stats.mine}건`} tone="amber" />
            </div>
          </div>
        </div>
      </section>

      <section
        className={`sticky top-0 z-10 border-b border-[#DDE5E1] bg-white/90 backdrop-blur ${
          mobileTab === "browse" ? "block" : "hidden md:block"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-3 xl:px-8">
          <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_auto] xl:items-start">
            <div className="rounded-xl border border-[#DDE5E1] bg-white shadow-[0_8px_24px_rgba(23,33,29,0.06)]">
              <label className="sr-only" htmlFor="property-search">
                물건 검색
              </label>
              <div className="flex min-h-12 items-center gap-2 px-3">
                <span className="h-2 w-2 rounded-full bg-[#1F8A5B] shadow-[0_0_0_5px_rgba(31,138,91,0.12)]" />
                <input
                  id="property-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="지역, 사건번호, 온비드, 아파트"
                  className="h-11 min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#17211D] outline-none placeholder:text-[#9AA6A0]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="h-8 rounded-full bg-[#EEF3F1] px-3 text-xs font-bold text-[#66736D] transition hover:bg-[#DDE5E1]"
                  >
                    지우기
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 xl:justify-end">
              <div>
                <p className="text-xs font-bold text-[#66736D]">검색 결과</p>
                <p className="text-sm font-semibold text-[#17211D]">{stats.total}건</p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!query && activeFilterCount === 0}
                className="h-10 rounded-lg border border-[#DDE5E1] bg-white px-3 text-sm font-semibold text-[#34423C] transition hover:bg-[#F9FBFA] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
              >
                초기화
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <InlineFilter
              title="방식"
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
              options={["전체", "검토 쉬움", "주의", "위험"]}
              value={level === "안정" ? "검토 쉬움" : level}
              onChange={(value) =>
                setLevel(value === "검토 쉬움" ? "안정" : (value as RiskLevel | "전체"))
              }
            />
            <InlineFilter
              title="구분"
              options={["전체", "내 물건", "샘플"]}
              value={owner}
              onChange={(value) => setOwner(value as "전체" | "내 물건" | "샘플")}
            />
          </div>
          {activeFilterCount > 0 ? (
            <p className="mt-2 text-xs font-semibold text-[#66736D]">
              필터 {activeFilterCount}개 적용 중
            </p>
          ) : null}
        </div>
      </section>

      <section ref={contentRef} className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
        <div className="space-y-5">
          <div
            className={`interactive-card gap-3 rounded-xl border border-[#DDE5E1] bg-white/92 p-4 shadow-[0_12px_32px_rgba(23,33,29,0.07)] backdrop-blur md:grid md:grid-cols-[1fr_1fr_auto] md:items-center ${
              mobileTab === "browse" ? "grid" : "hidden"
            }`}
          >
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
            <div className="rounded-lg bg-[#17211D] px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <p className="font-semibold">계산 기준</p>
              <p className="mt-1 text-[#d9eee5]">
                시세 할인 - 인수금 - 비용 버퍼
              </p>
            </div>
          </div>

          <div
            className={`gap-3 md:grid ${
              mobileTab === "browse" ? "grid" : "hidden"
            }`}
          >
            {filtered.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                selected={selectedIds.includes(item.id)}
                href={`/properties/${item.id}`}
                onToggle={() => toggleSelected(item.id)}
              />
            ))}
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-[#DDE5E1] bg-white p-8 text-center text-sm font-semibold text-[#66736D]">
                조건에 맞는 물건이 없습니다.
              </div>
            ) : null}
          </div>

          <div
            className={`md:block ${
              mobileTab === "compare" ? "block" : "hidden"
            }`}
          >
            <ComparePanel
              selected={selected}
              onClear={() => setSelectedIds([])}
              onRemove={(id) =>
                setSelectedIds((current) => current.filter((itemId) => itemId !== id))
              }
            />
          </div>
        </div>
      </section>

      <MobileBottomTabs
        activeTab={mobileTab}
        selectedCount={selected.length}
        resultCount={stats.total}
        onTabChange={changeMobileTab}
      />
    </main>
  );
}

function loadComparisonIds() {
  try {
    const raw = window.localStorage.getItem(COMPARISON_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const ids = parsed
      .filter((id): id is string => typeof id === "string")
      .slice(0, MAX_COMPARE_COUNT);

    return ids.length > 0 ? ids : [];
  } catch {
    return null;
  }
}

function saveComparisonIds(ids: string[]) {
  try {
    window.localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(ids.slice(0, MAX_COMPARE_COUNT))
    );
  } catch {
    // Local persistence is a convenience layer; the comparison UI still works without it.
  }
}

function compareForBasket(left: AnalyzedItem, right: AnalyzedItem) {
  return basketScore(left) - basketScore(right);
}

function basketScore(item: AnalyzedItem) {
  const verdictPenalty =
    item.analysis.verdict === "입찰 검토"
      ? 0
      : item.analysis.verdict === "가격 조정"
        ? 300
        : 700;
  const checklist = summarizeRightsChecklist(item.rightsChecklist);

  return (
    verdictPenalty +
    item.analysis.risk * 4 +
    checklist.unknownCount * 18 +
    Math.max(0, 12 - item.analysis.marginRate) * 10 +
    item.analysis.allIn / 1000
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
    neutral: "bg-white text-[#17211D]",
    green: "bg-[#E7F6EE] text-[#1F8A5B]",
    blue: "bg-[#E7F0FF] text-[#255C99]",
    amber: "bg-[#FFF4D7] text-[#8A5B00]",
    red: "bg-[#FDE8E5] text-[#B53A2E]",
  };
  return (
    <div className={`interactive-card relative overflow-hidden rounded-xl border border-[#DDE5E1] p-4 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_28px_rgba(23,33,29,0.08)] ${tones[tone]}`}>
      <span className="absolute inset-x-0 top-0 h-1 bg-current opacity-25" />
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
    <div className="shrink-0">
      <p className="mb-1 px-1 text-[11px] font-bold text-[#66736D]">{title}</p>
      <div className="flex min-h-10 gap-1 rounded-full border border-[#DDE5E1] bg-[#EEF3F1] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onChange(option)}
            className={`min-h-9 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
              value === option
                ? "bg-[#17211D] font-semibold text-white shadow-[0_6px_16px_rgba(23,33,29,0.16)]"
                : "font-medium text-[#66736D] hover:bg-white/70"
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
          <p className="text-sm font-semibold text-[#17211D]">{label}</p>
          <p className="text-xs font-medium text-[#66736D]">{suffix}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
            tone === "green"
              ? "bg-[#E7F6EE] text-[#1F8A5B]"
              : "bg-[#FFF4D7] text-[#8A5B00]"
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
          tone === "green" ? "accent-[#1F8A5B]" : "accent-[#1F8A5B]"
        }`}
      />
    </div>
  );
}

function ChannelBadge({ channel }: { channel: SaleChannel }) {
  const style =
    channel === "경매"
      ? "bg-[#E7F6EE] text-[#1F8A5B]"
      : "bg-[#E7F0FF] text-[#255C99]";
  return (
    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {channel}
    </span>
  );
}

function ListingCard({
  item,
  selected,
  href,
  onToggle,
}: {
  item: AnalyzedItem;
  selected: boolean;
  href: string;
  onToggle: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const gapToSuggested = item.analysis.suggested - item.analysis.plannedBid;
  const detailId = `listing-details-${item.id}`;

  return (
    <article
      className={`interactive-card reveal-up group relative overflow-hidden rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:border-[#B8C7C0] hover:shadow-[0_14px_34px_rgba(23,33,29,0.09)] ${
        selected
          ? "border-[#0F766E] ring-2 ring-[#9DDBC2] md:ring-[#D8F1E4]"
          : "border-[#DDE5E1]"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${riskAccent[item.analysis.level]}`} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <a href={href} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={item.channel} />
            <span className="rounded-full bg-[#EEF3F1] px-2.5 py-1 text-xs font-semibold text-[#34423C]">
              {item.agency}
            </span>
            {item.id.startsWith("user-") ? (
              <span className="rounded-full bg-[#EEF3F1] px-2.5 py-1 text-xs font-semibold text-[#34423C]">
                내 물건
              </span>
            ) : null}
            <span className="text-xs font-semibold text-[#66736D]">
              {item.caseNo}
            </span>
            {selected ? (
              <span className="rounded-full bg-[#0F766E] px-2.5 py-1 text-xs font-semibold text-white md:hidden">
                비교 담김
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug text-[#17211D] transition group-hover:text-[#0F766E] md:text-lg">
                {item.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-[#66736D]">
                {item.district} · 마감 {item.auctionDate}
                <span className="hidden md:inline">
                  {" "}· {item.area}㎡ · {item.floor}
                </span>
              </p>
            </div>
            <Verdict value={item.analysis.verdict} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
            <CompactStat label="적정 상한" value={uk(item.analysis.suggested)} strong />
            <CompactStat
              label="안전마진"
              value={percent(item.analysis.marginRate)}
              danger={item.analysis.marginRate < 10}
            />
          </div>

          <div
            id={detailId}
            className={`${detailsOpen ? "grid" : "hidden"} mt-4 gap-2 sm:grid-cols-4 md:grid`}
          >
            <PriceStat label="시세" value={uk(item.market)} />
            <PriceStat label="최저가" value={uk(item.minimum)} sub={percent(item.analysis.marketRatio)} />
            <PriceStat label="적정 상한" value={uk(item.analysis.suggested)} strong />
            <PriceStat
              label="안전마진"
              value={percent(item.analysis.marginRate)}
              danger={item.analysis.marginRate < 10}
            />
          </div>
        </a>

        <div className="space-y-3">
          <div
            className={`${detailsOpen ? "block" : "hidden"} rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] md:block`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#66736D]">체크 난이도</span>
              <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
            </div>
            <RiskMeter level={item.analysis.level} score={item.analysis.risk} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-between">
            <span
              className={`min-w-0 text-xs font-bold ${
                gapToSuggested >= 0 ? "text-[#1F8A5B]" : "text-[#B53A2E]"
              }`}
            >
              현재 예상가가 상한보다 {uk(Math.abs(gapToSuggested))}
              {gapToSuggested >= 0 ? " 낮음" : " 높음"}
            </span>
            <button
              type="button"
              onClick={() => setDetailsOpen((current) => !current)}
              aria-expanded={detailsOpen}
              aria-controls={detailId}
              className="h-9 rounded-lg border border-[#DDE5E1] bg-[#F9FBFA] px-3 text-sm font-semibold text-[#34423C] transition hover:bg-white md:hidden"
            >
              {detailsOpen ? "접기" : "더보기"}
            </button>
            <button
              onClick={onToggle}
              aria-pressed={selected}
              className={`button-lift h-10 min-w-28 rounded-lg px-3 text-sm transition md:h-9 md:min-w-0 ${
                selected
                  ? "bg-[#0F766E] font-semibold text-white shadow-[0_8px_18px_rgba(15,118,110,0.18)]"
                  : "border border-[#DDE5E1] bg-white font-semibold text-[#34423C] hover:border-[#1F8A5B] hover:text-[#1F8A5B]"
              }`}
            >
              {selected ? "비교중 ✓" : "비교 담기"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CompactStat({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] px-3 py-2">
      <p className="text-[11px] font-bold text-[#66736D]">{label}</p>
      <p
        className={`mt-0.5 break-words text-sm font-semibold tabular-nums ${
          danger
            ? "text-[#B53A2E]"
            : strong
              ? "text-[#1F8A5B]"
              : "text-[#17211D]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const riskAccent: Record<RiskLevel, string> = {
  안정: "bg-[#1F8A5B]",
  주의: "bg-[#B7791F]",
  위험: "bg-[#DC2626]",
};

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
    <div className="min-w-0 rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3">
      <p className="text-xs font-semibold text-[#66736D]">{label}</p>
      <p
        className={`mt-1 break-words text-base font-semibold tabular-nums ${
          danger
            ? "text-[#B53A2E]"
            : strong
              ? "text-[#1F8A5B]"
              : "text-[#17211D]"
        }`}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs font-medium text-[#8A9690]">{sub}</p> : null}
    </div>
  );
}

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#DC2626]" : level === "주의" ? "bg-[#B7791F]" : "bg-[#1F8A5B]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#DDE5E1]">
      <div className={`risk-fill h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function ComparePanel({
  selected,
  onClear,
  onRemove,
}: {
  selected: AnalyzedItem[];
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  const ranked = [...selected].sort(compareForBasket);

  return (
    <section className="interactive-card rounded-xl border border-[#DDE5E1] bg-white/92 p-4 shadow-[0_12px_32px_rgba(23,33,29,0.07)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[#17211D]">비교 바구니</h2>
            <span className="rounded-full bg-[#EEF3F1] px-2.5 py-1 text-xs font-semibold text-[#34423C]">
              {selected.length}/{MAX_COMPARE_COUNT}
            </span>
          </div>
          <p className="text-sm text-[#66736D]">
            2-4개 물건을 총투입금, 권리 미확인, 마진, 판정 기준으로 비교합니다.
          </p>
        </div>
        <button
          onClick={onClear}
          className="h-9 rounded-lg border border-[#DDE5E1] bg-white px-3 text-sm font-semibold text-[#34423C] transition hover:bg-[#F9FBFA]"
        >
          선택 비우기
        </button>
      </div>
      {selected.length === 1 ? (
        <p className="mt-3 rounded-lg border border-[#CFE3F8] bg-[#E7F0FF] px-3 py-2 text-sm font-semibold text-[#255C99]">
          하나 더 담으면 총투입금과 권리 리스크를 나란히 비교할 수 있습니다.
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {selected.length === 0 ? (
          <div className="rounded-lg bg-[#F9FBFA] p-5 text-center text-sm font-medium text-[#66736D] md:col-span-2 xl:col-span-4">
            비교할 물건을 선택하세요.
          </div>
        ) : (
          ranked.map((item, index) => {
            const checklist = summarizeRightsChecklist(item.rightsChecklist);

            return (
            <div key={item.id} className="interactive-card rounded-lg border border-[#E5ECE8] bg-white p-4 hover:border-[#B8C7C0] hover:shadow-[0_10px_24px_rgba(23,33,29,0.07)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#17211D] px-2.5 py-1 text-xs font-semibold text-white">
                    #{index + 1}
                  </span>
                  <ChannelBadge channel={item.channel} />
                </div>
                <Verdict value={item.analysis.verdict} />
              </div>
              <a
                href={`/properties/${item.id}`}
                className="mt-3 block text-sm font-semibold text-[#17211D] transition hover:text-[#0F766E]"
              >
                {item.title}
              </a>
              <p className="mt-1 text-xs font-medium text-[#66736D]">
                {item.district} · {item.area}㎡ · {item.auctionDate}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <MiniStat label="예상 입찰" value={uk(item.analysis.plannedBid)} />
                <MiniStat label="총투입" value={uk(item.analysis.allIn)} />
                <MiniStat label="인수금" value={uk(item.analysis.takeoverAmount)} />
                <MiniStat label="예상 마진" value={uk(item.analysis.margin)} danger={item.analysis.margin < 0} />
                <MiniStat
                  label="마진율"
                  value={percent(item.analysis.marginRate)}
                  danger={item.analysis.marginRate < 10}
                />
                <MiniStat
                  label="권리 미확인"
                  value={`${checklist.unknownCount}개`}
                  danger={checklist.unknownCount >= 4}
                />
                <MiniStat label="리스크" value={`${item.analysis.risk}점`} danger={item.analysis.level === "위험"} />
                <MiniStat label="상한 기준" value={uk(item.analysis.doNotBidAbove)} />
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="mt-3 h-9 w-full rounded-lg border border-[#DDE5E1] bg-[#F9FBFA] text-sm font-semibold text-[#34423C] transition hover:border-[#B53A2E] hover:bg-[#FDE8E5] hover:text-[#B53A2E]"
              >
                비교에서 제외
              </button>
            </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function MobileBottomTabs({
  activeTab,
  selectedCount,
  resultCount,
  onTabChange,
}: {
  activeTab: MobileTab;
  selectedCount: number;
  resultCount: number;
  onTabChange: (tab: MobileTab) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#DDE5E1] bg-white/94 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 shadow-[0_-14px_32px_rgba(23,33,29,0.12)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <MobileTabButton
          active={activeTab === "browse"}
          label="물건"
          meta={`${resultCount}건`}
          onClick={() => onTabChange("browse")}
        />
        <MobileTabButton
          active={activeTab === "compare"}
          label="비교"
          meta={`${selectedCount}/${MAX_COMPARE_COUNT}`}
          onClick={() => onTabChange("compare")}
        />
        <Link
          href="/properties/new"
          className="button-lift flex min-h-14 flex-col items-center justify-center rounded-xl bg-[#17211D] px-2 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,33,29,0.18)]"
        >
          등록
          <span className="mt-0.5 text-[11px] font-bold text-[#D9EEE5]">새 물건</span>
        </Link>
      </div>
    </nav>
  );
}

function MobileTabButton({
  active,
  label,
  meta,
  onClick,
}: {
  active: boolean;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`button-lift min-h-14 rounded-xl px-2 text-center text-sm font-semibold transition ${
        active
          ? "bg-[#E7F6EE] text-[#0F766E] ring-1 ring-[#BFE3D0]"
          : "bg-[#F6F8F7] text-[#34423C] ring-1 ring-[#DDE5E1]"
      }`}
    >
      <span className="block">{label}</span>
      <span className="mt-0.5 block text-[11px] font-bold opacity-70">{meta}</span>
    </button>
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
      <p className="text-xs font-bold text-[#66736D]">{label}</p>
      <p className={`mt-0.5 break-words font-semibold tabular-nums ${danger ? "text-[#B53A2E]" : "text-[#17211D]"}`}>
        {value}
      </p>
    </div>
  );
}

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const styles = {
    안정: "bg-[#E7F6EE] text-[#1F8A5B]",
    주의: "bg-[#FFF4D7] text-[#8A5B00]",
    위험: "bg-[#FDE8E5] text-[#B53A2E]",
  };
  const label = level === "안정" ? "검토 쉬움" : level;
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[level]}`}>
      {label} · {score}점
    </span>
  );
}

function Verdict({ value }: { value: string }) {
  const style =
    value === "입찰 검토"
      ? "border-[#BFE3D0] bg-[#E7F6EE] text-[#1F8A5B]"
      : value === "가격 조정"
        ? "border-[#F3D083] bg-[#FFF4D7] text-[#8A5B00]"
        : "border-[#F2B8AE] bg-[#FDE8E5] text-[#B53A2E]";
  return (
    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      {value}
    </span>
  );
}
