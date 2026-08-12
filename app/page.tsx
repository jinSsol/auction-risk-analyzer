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
  const urgentItems = filtered.filter((item) => item.analysis.level !== "안정").length;
  const reviewItems = filtered.filter(
    (item) => summarizeRightsChecklist(item.rightsChecklist).unknownCount > 0
  ).length;
  const bestPreview = [...enriched].sort(
    (left, right) => left.analysis.risk - right.analysis.risk
  )[0];

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
    <main className="app-shell min-h-screen pb-24 text-[#152033] md:pb-0">
      <section className="hero-surface relative overflow-hidden rounded-b-[34px]">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 pb-8 pt-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:pb-12">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 text-white/80">
              <p className="text-xs font-bold">9:41</p>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span>경매</span>
                <span>공매</span>
                <span className="rounded-full bg-white/18 px-2 py-1 text-white">MVP</span>
              </div>
            </div>

            <div className="mt-8 max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/18 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" />
                권리 리스크 · 입찰가 분석
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-white md:text-5xl">
                어려운 경매 물건도 앱처럼 가볍게 비교하세요.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#DCEBFF]">
                샘플 데이터를 기준으로 권리 미확인, 총투입금, 입찰 상한을 먼저
                정리합니다. 실전 판단 전 공식 문서 확인은 꼭 필요합니다.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <HeroMetric label="검토 물건" value={`${stats.total}건`} />
              <HeroMetric label="주의 이상" value={`${urgentItems}건`} tone="warn" />
              <HeroMetric label="확인 필요" value={`${reviewItems}건`} tone="soft" />
            </div>
          </div>

          <div className="hidden lg:flex lg:justify-end">
            <div className="phone-mock w-[300px] overflow-hidden bg-[#F8FBFF] text-[#152033]">
              <div className="phone-notch mx-auto h-5 w-28" />
              <div className="bg-[#162A63] px-5 pb-5 pt-2 text-white">
                <p className="text-xs font-semibold text-[#AFC8FF]">오늘의 검토 후보</p>
                <h2 className="mt-2 text-lg font-semibold leading-snug">
                  {bestPreview?.title ?? "경매·공매 리스크 워크벤치"}
                </h2>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                    {bestPreview ? bestPreview.channel : "경매"}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                    {bestPreview ? bestPreview.analysis.verdict : "입찰 검토"}
                  </span>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-3 gap-2">
                  <PhoneMiniStat label="리스크" value={bestPreview ? `${bestPreview.analysis.risk}점` : "18점"} />
                  <PhoneMiniStat label="상한" value={bestPreview ? uk(bestPreview.analysis.suggested) : "8.6억"} />
                  <PhoneMiniStat label="마진" value={bestPreview ? percent(bestPreview.analysis.marginRate) : "15%"} />
                </div>
                <div className="rounded-2xl border border-[#E0E8F4] bg-white p-3 shadow-[0_10px_24px_rgba(21,32,51,0.08)]">
                  <p className="text-xs font-bold text-[#64748B]">체크리스트</p>
                  <div className="mt-3 space-y-2">
                    <PhoneCheckLine label="주소·면적 확인" />
                    <PhoneCheckLine label="점유·임차 확인" muted />
                    <PhoneCheckLine label="체납·인수금 확인" muted />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {["검색", "권리", "비용", "비교"].map((label) => (
                    <div key={label} className="rounded-2xl bg-[#EAF2FF] py-2 text-center text-[11px] font-bold text-[#2563EB]">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`sticky top-0 z-10 bg-white/82 shadow-[0_12px_30px_rgba(21,32,51,0.08)] backdrop-blur ${
          mobileTab === "browse" ? "block" : "hidden md:block"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-3 xl:px-8">
          <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_auto] xl:items-start">
            <div className="app-card rounded-[22px]">
              <label className="sr-only" htmlFor="property-search">
                물건 검색
              </label>
              <div className="flex min-h-14 items-center gap-3 px-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-sm font-black text-[#2563EB]">
                  Q
                </span>
                <input
                  id="property-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="지역, 사건번호, 온비드, 아파트"
                  className="h-12 min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#152033] outline-none placeholder:text-[#94A3B8]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="h-9 rounded-full bg-[#EEF4FF] px-3 text-xs font-bold text-[#475569] transition hover:bg-[#DBEAFE]"
                  >
                    지우기
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 xl:justify-end">
              <div>
                <p className="text-xs font-bold text-[#64748B]">검색 결과</p>
                <p className="text-sm font-semibold text-[#152033]">{stats.total}건</p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!query && activeFilterCount === 0}
                className="h-11 rounded-2xl border border-[#D8E2F0] bg-white px-4 text-sm font-semibold text-[#334155] transition hover:bg-[#F8FBFF] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
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
            <p className="mt-2 text-xs font-semibold text-[#64748B]">
              필터 {activeFilterCount}개 적용 중
            </p>
          ) : null}
        </div>
      </section>

      <section ref={contentRef} className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
        <div className="space-y-5">
          <div
            className={`app-card interactive-card gap-3 rounded-[24px] p-4 backdrop-blur md:grid md:grid-cols-[1fr_1fr_auto] md:items-center ${
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
            <div className="rounded-[20px] bg-[#162A63] px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <p className="font-semibold">계산 기준</p>
              <p className="mt-1 text-[#DCEBFF]">
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
              <div className="rounded-[24px] border border-[#D8E2F0] bg-white p-8 text-center text-sm font-semibold text-[#64748B]">
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

function HeroMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn" | "soft";
}) {
  const styles = {
    default: "bg-white/16 text-white",
    warn: "bg-[#FFEDD5]/22 text-white",
    soft: "bg-[#DBEAFE]/20 text-white",
  };

  return (
    <div className={`rounded-[22px] px-3 py-3 ring-1 ring-white/14 backdrop-blur ${styles[tone]}`}>
      <p className="text-[11px] font-bold text-white/70">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function PhoneMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3 text-center shadow-[0_8px_18px_rgba(21,32,51,0.06)]">
      <p className="text-[10px] font-bold text-[#64748B]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-[#152033]">{value}</p>
    </div>
  );
}

function PhoneCheckLine({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-5 w-5 rounded-full border ${
          muted ? "border-[#CBD5E1] bg-[#F8FAFC]" : "border-[#93C5FD] bg-[#DBEAFE]"
        }`}
      />
      <span className={`text-xs font-bold ${muted ? "text-[#94A3B8]" : "text-[#334155]"}`}>
        {label}
      </span>
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
      <p className="mb-1 px-1 text-[11px] font-bold text-[#64748B]">{title}</p>
      <div className="flex min-h-11 gap-1 rounded-full border border-[#D8E2F0] bg-[#EEF4FF] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onChange(option)}
            className={`min-h-9 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
              value === option
                ? "bg-[#2563EB] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)]"
                : "font-medium text-[#64748B] hover:bg-white/78"
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
          <p className="text-sm font-semibold text-[#152033]">{label}</p>
          <p className="text-xs font-medium text-[#64748B]">{suffix}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
            tone === "green"
              ? "bg-[#EAF2FF] text-[#2563EB]"
              : "bg-[#FFF4D7] text-[#9A5B13]"
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
        className={`mt-2 h-11 w-full cursor-pointer touch-pan-x ${
          tone === "green" ? "accent-[#2563EB]" : "accent-[#F97316]"
        }`}
      />
    </div>
  );
}

function ChannelBadge({ channel }: { channel: SaleChannel }) {
  const style =
    channel === "경매"
      ? "bg-[#EAF2FF] text-[#2563EB]"
      : "bg-[#F0F9FF] text-[#0369A1]";
  return (
    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {channel}
    </span>
  );
}

function statusLabelsFor(item: AnalyzedItem) {
  const checklist = summarizeRightsChecklist(item.rightsChecklist);
  const labels = [item.id.startsWith("user-") ? "직접 입력" : "샘플"];

  if (
    checklist.unknownCount > 0 ||
    item.address.includes("확인 필요") ||
    item.floor.includes("확인 필요") ||
    item.auctionDate.includes("확인 필요")
  ) {
    labels.push("확인 필요");
  }

  return labels;
}

function StatusBadge({ label }: { label: string }) {
  const style =
    label === "확인 필요"
      ? "bg-[#FFF4D7] text-[#9A5B13]"
      : label === "직접 입력"
        ? "bg-[#F1F5F9] text-[#475569]"
        : "bg-[#EAF2FF] text-[#2563EB]";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
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
  const statusLabels = statusLabelsFor(item);

  return (
    <article
      className={`app-card interactive-card reveal-up group relative overflow-hidden rounded-[26px] p-4 hover:border-[#B7C8E8] hover:shadow-[0_20px_44px_rgba(21,32,51,0.12)] ${
        selected
          ? "border-[#2563EB] ring-2 ring-[#BFDBFE] md:ring-[#DBEAFE]"
          : "border-[#D8E2F0]"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${riskAccent[item.analysis.level]}`} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <a href={href} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={item.channel} />
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#475569]">
              {item.agency}
            </span>
            {statusLabels.map((label) => (
              <StatusBadge key={label} label={label} />
            ))}
            <span className="text-xs font-semibold text-[#64748B]">
              {item.caseNo}
            </span>
            {selected ? (
              <span className="rounded-full bg-[#2563EB] px-2.5 py-1 text-xs font-semibold text-white md:hidden">
                비교 담김
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug text-[#152033] transition group-hover:text-[#2563EB] md:text-lg">
                {item.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-[#64748B]">
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
            className={`${detailsOpen ? "block" : "hidden"} rounded-[20px] border border-[#D8E2F0] bg-[#F8FBFF] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] md:block`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#64748B]">체크 난이도</span>
              <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
            </div>
            <RiskMeter level={item.analysis.level} score={item.analysis.risk} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-between">
            <span
              className={`min-w-0 text-xs font-bold ${
                gapToSuggested >= 0 ? "text-[#2563EB]" : "text-[#B42318]"
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
              className="h-9 rounded-2xl border border-[#D8E2F0] bg-[#F8FBFF] px-3 text-sm font-semibold text-[#334155] transition hover:bg-white md:hidden"
            >
              {detailsOpen ? "접기" : "더보기"}
            </button>
            <button
              onClick={onToggle}
              aria-pressed={selected}
              className={`button-lift h-10 min-w-28 rounded-lg px-3 text-sm transition md:h-9 md:min-w-0 ${
                selected
                  ? "bg-[#2563EB] font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]"
                  : "border border-[#D8E2F0] bg-white font-semibold text-[#334155] hover:border-[#2563EB] hover:text-[#2563EB]"
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
    <div className="min-w-0 rounded-[18px] border border-[#D8E2F0] bg-[#F8FBFF] px-3 py-2">
      <p className="text-[11px] font-bold text-[#64748B]">{label}</p>
      <p
        className={`mt-0.5 break-words text-sm font-semibold tabular-nums ${
          danger
            ? "text-[#B42318]"
            : strong
              ? "text-[#2563EB]"
              : "text-[#152033]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const riskAccent: Record<RiskLevel, string> = {
  안정: "bg-[#2563EB]",
  주의: "bg-[#F97316]",
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
    <div className="min-w-0 rounded-[18px] border border-[#D8E2F0] bg-[#F8FBFF] p-3">
      <p className="text-xs font-semibold text-[#64748B]">{label}</p>
      <p
        className={`mt-1 break-words text-base font-semibold tabular-nums ${
          danger
            ? "text-[#B42318]"
            : strong
              ? "text-[#2563EB]"
              : "text-[#152033]"
        }`}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs font-medium text-[#94A3B8]">{sub}</p> : null}
    </div>
  );
}

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#DC2626]" : level === "주의" ? "bg-[#F97316]" : "bg-[#2563EB]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#D8E2F0]">
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
  const best = ranked[0];

  return (
    <section className="app-card interactive-card rounded-[26px] p-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[#152033]">비교 바구니</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                selected.length > 0
                  ? "bg-[#EAF2FF] text-[#2563EB] ring-1 ring-[#BFDBFE]"
                  : "bg-[#F1F5F9] text-[#475569]"
              }`}
            >
              {selected.length}/{MAX_COMPARE_COUNT}
            </span>
          </div>
          <p className="text-sm text-[#64748B]">
            2-4개 물건을 총투입금, 권리 미확인, 마진, 판정 기준으로 비교합니다.
          </p>
          {best ? (
            <p className="mt-2 text-xs font-semibold text-[#2563EB]">
              현재 1순위: {best.title} · {compareReason(best)}
            </p>
          ) : null}
        </div>
        <button
          onClick={onClear}
          disabled={selected.length === 0}
          className="h-10 rounded-2xl border border-[#D8E2F0] bg-white px-3 text-sm font-semibold text-[#334155] transition hover:bg-[#F8FBFF] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
        >
          선택 비우기
        </button>
      </div>
      {selected.length === 1 ? (
        <p className="mt-3 rounded-2xl border border-[#BFDBFE] bg-[#EAF2FF] px-3 py-2 text-sm font-semibold text-[#2563EB]">
          하나 더 담으면 총투입금과 권리 리스크를 나란히 비교할 수 있습니다.
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {selected.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#B7C8E8] bg-[#F8FBFF] p-6 text-center md:col-span-2 xl:col-span-4">
            <p className="text-base font-semibold text-[#152033]">아직 비교할 물건이 없어요.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-[#64748B]">
              물건 탭에서 마음에 드는 후보의 비교 담기를 누르면 총투입금과 권리 리스크를 여기서 바로 비교할 수 있습니다.
            </p>
          </div>
        ) : (
          ranked.map((item, index) => {
            const checklist = summarizeRightsChecklist(item.rightsChecklist);

            return (
            <div
              key={item.id}
              className={`interactive-card rounded-[22px] border bg-white p-4 hover:border-[#B7C8E8] hover:shadow-[0_14px_30px_rgba(21,32,51,0.09)] ${
                index === 0
                  ? "border-[#BFDBFE] ring-2 ring-[#EAF2FF]"
                  : "border-[#D8E2F0]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      index === 0
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#162A63] text-white"
                    }`}
                  >
                    {index === 0 ? "검토 우선 #1" : `비교 #${index + 1}`}
                  </span>
                  <ChannelBadge channel={item.channel} />
                </div>
                <Verdict value={item.analysis.verdict} />
              </div>
              <p className="mt-3 rounded-2xl bg-[#F8FBFF] px-3 py-2 text-xs font-bold leading-5 text-[#334155]">
                {compareReason(item)}
              </p>
              <a
                href={`/properties/${item.id}`}
                className="mt-2 flex min-h-11 items-center text-sm font-semibold text-[#152033] transition hover:text-[#2563EB]"
              >
                {item.title}
              </a>
              <p className="mt-1 text-xs font-medium text-[#64748B]">
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
              <div className="mt-3 border-t border-[#E2E8F0] pt-3">
                <button
                  onClick={() => onRemove(item.id)}
                  className="h-10 w-full rounded-2xl border border-[#D8E2F0] bg-[#F8FBFF] text-sm font-semibold text-[#334155] transition hover:border-[#FCA5A5] hover:bg-[#FEE2E2] hover:text-[#B42318]"
                >
                  비교에서 제외
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function compareReason(item: AnalyzedItem) {
  const checklist = summarizeRightsChecklist(item.rightsChecklist);
  const reasons = [];

  if (item.analysis.verdict === "입찰 검토") {
    reasons.push("판정 양호");
  } else if (item.analysis.verdict === "가격 조정") {
    reasons.push("가격 조정 필요");
  } else {
    reasons.push("전문가 검토 권장");
  }

  if (item.analysis.marginRate >= 12) {
    reasons.push(`마진 ${percent(item.analysis.marginRate)}`);
  } else if (item.analysis.marginRate < 0) {
    reasons.push("마진 음수");
  } else {
    reasons.push(`마진 ${percent(item.analysis.marginRate)}`);
  }

  if (checklist.unknownCount === 0) {
    reasons.push("권리 미확인 없음");
  } else {
    reasons.push(`미확인 ${checklist.unknownCount}개`);
  }

  return reasons.join(" · ");
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
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-white/92 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 shadow-[0_-18px_40px_rgba(21,32,51,0.14)] backdrop-blur md:hidden">
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
          highlighted={selectedCount > 0}
          onClick={() => onTabChange("compare")}
        />
        <Link
          href="/properties/new"
          className="button-lift flex min-h-14 flex-col items-center justify-center rounded-[20px] bg-[#2563EB] px-2 text-center text-sm font-semibold text-white shadow-[0_12px_26px_rgba(37,99,235,0.24)]"
        >
          등록
          <span className="mt-0.5 text-[11px] font-bold text-[#DBEAFE]">새 물건</span>
        </Link>
      </div>
    </nav>
  );
}

function MobileTabButton({
  active,
  label,
  meta,
  highlighted,
  onClick,
}: {
  active: boolean;
  label: string;
  meta: string;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`button-lift min-h-14 rounded-[20px] px-2 text-center text-sm font-semibold transition ${
        active
          ? "bg-[#EAF2FF] text-[#2563EB] ring-1 ring-[#BFDBFE]"
          : highlighted
            ? "bg-white text-[#2563EB] ring-2 ring-[#BFDBFE] shadow-[0_10px_22px_rgba(37,99,235,0.14)]"
          : "bg-[#F8FBFF] text-[#334155] ring-1 ring-[#D8E2F0]"
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
      <p className="text-xs font-bold text-[#64748B]">{label}</p>
      <p className={`mt-0.5 break-words font-semibold tabular-nums ${danger ? "text-[#B42318]" : "text-[#152033]"}`}>
        {value}
      </p>
    </div>
  );
}

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const styles = {
    안정: "bg-[#EAF2FF] text-[#2563EB]",
    주의: "bg-[#FFF4D7] text-[#9A5B13]",
    위험: "bg-[#FEE2E2] text-[#B42318]",
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
      ? "border-[#BFDBFE] bg-[#EAF2FF] text-[#2563EB]"
      : value === "가격 조정"
        ? "border-[#F3D083] bg-[#FFF4D7] text-[#9A5B13]"
        : "border-[#FCA5A5] bg-[#FEE2E2] text-[#B42318]";
  return (
    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      {value}
    </span>
  );
}
