"use client";

import Link from "next/link";
import {
  ChartNoAxesColumnIncreasing,
  HomeIcon,
  Search,
  SquarePlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { items } from "./auction-data";
import {
  MiniStat,
  RiskBadge,
  RiskMeter,
  StatusBadge,
  Verdict,
  riskAccentClass,
} from "./components/auction-ui";
import { analyze, percent, uk, type AnalyzedItem } from "./lib/auction-analysis";
import { mergeAuctionItems } from "./lib/auction-merge";
import { loadUserAuctionItems, type UserAuctionItem } from "./lib/auction-storage";
import { summarizeRightsChecklist } from "./lib/rights-checklist";
import type { PropertyType, RiskLevel, SaleChannel } from "./lib/auction-types";

const DEFAULT_COMPARE_IDS = ["sample-4", "sample-6", "sample-7"];
const COMPARISON_STORAGE_KEY = "auction-risk-analyzer:comparison:v1";
const MAX_COMPARE_COUNT = 4;
type MobileTab = "browse" | "compare" | "profile";

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
  };
  const activeFilterCount = [
    channel !== "전체",
    type !== "전체",
    level !== "전체",
    owner !== "전체",
  ].filter(Boolean).length;
  const coachTask = getCoachTask(enriched);
  const priorityItems = [...enriched].sort(compareForBasket).slice(0, 3);
  const riskSummary = getRiskSummary(enriched);
  const desktopFeatured = coachTask?.item ?? priorityItems[0];

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
    <main className="app-shell min-h-screen pb-24 text-[#1F2A24] md:pb-0">
      <div className="hidden md:block">
        <header className="sticky top-0 z-30 border-b border-[#DDE5E1] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <span className="text-xl font-black text-[#173B35]">≡</span>
              <span className="text-lg font-bold text-[#173B35]">경매정석</span>
            </div>
            <nav className="flex items-center gap-7 text-sm font-semibold text-[#6F766F]">
              <a className="border-b-2 border-[#173B35] pb-1 text-[#173B35]" href="#">물건</a>
              <Link className="transition hover:text-[#173B35]" href="/properties/new">등록</Link>
              <button className="transition hover:text-[#173B35]" type="button" onClick={() => changeMobileTab("compare")}>비교</button>
            </nav>
            <Search className="h-5 w-5 text-[#173B35]" aria-hidden="true" strokeWidth={2.2} />
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_300px] gap-8 px-8 py-8">
          <div className="min-w-0 space-y-6">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-[#1F2A24]">
                오늘 먼저 확인할 리스크를 알려드려요.
              </h1>
              <p className="mt-2 text-sm font-medium text-[#6F766F]">
                2026년 8월 13일 기준 업데이트 되었습니다.
              </p>
            </div>

            <TopSummaryBanner summary={riskSummary} />

            {desktopFeatured ? (
              <DesktopDecisionCard item={desktopFeatured} task={coachTask} />
            ) : null}

            <div className="rounded-xl border border-[#DDE5E1] bg-white p-3">
              <label className="sr-only" htmlFor="desktop-property-search">
                사건번호 또는 지역 검색
              </label>
              <div className="flex h-12 items-center gap-3 rounded-lg border border-[#DDE5E1] bg-white px-3">
                <Search className="h-4 w-4 shrink-0 text-[#85938C]" aria-hidden="true" strokeWidth={2.2} />
                <input
                  id="desktop-property-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="사건번호 또는 지역 검색"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#1F2A24] outline-none placeholder:text-[#85938C]"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <QuickFilterChip active={channel === "전체"} label="전체" onClick={() => setChannel("전체")} />
                <QuickFilterChip active={channel === "경매"} label="경매" onClick={() => setChannel("경매")} />
                <QuickFilterChip active={channel === "공매"} label="공매" onClick={() => setChannel("공매")} />
                <QuickFilterChip active={level === "주의"} label="주의" onClick={() => setLevel(level === "주의" ? "전체" : "주의")} />
                <QuickFilterChip active={level === "위험"} label="위험" onClick={() => setLevel(level === "위험" ? "전체" : "위험")} />
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-9 rounded-full border border-[#DDE5E1] bg-white px-3 text-xs font-semibold text-[#6F766F]"
                >
                  초기화
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((item) => (
                <DesktopPropertyCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  onToggle={() => toggleSelected(item.id)}
                />
              ))}
            </div>
          </div>

          <aside className="sticky top-24 h-fit rounded-xl border border-[#DDE5E1] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#6F766F]">오늘의 후보 정리</p>
                <h2 className="mt-1 text-base font-semibold text-[#1F2A24]">먼저 열어볼 물건</h2>
              </div>
              <span className="rounded-full bg-[#F3F7F4] px-2.5 py-1 text-xs font-bold text-[#173B35]">
                {priorityItems.length}건
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {priorityItems.map((item, index) => (
                <CoachCandidateRow key={item.id} item={item} index={index} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => changeMobileTab("compare")}
              className="mt-5 h-11 w-full rounded-lg border border-[#173B35] bg-white text-sm font-semibold text-[#173B35]"
            >
              후보 비교하기
            </button>
          </aside>
        </section>
      </div>

      <div className="md:hidden">
        <MobileAppHome
          activeFilterCount={activeFilterCount}
          bidRatio={bidRatio}
          bufferRatio={bufferRatio}
          channel={channel}
          contentRef={contentRef}
          enriched={enriched}
          filtered={filtered}
          level={level}
          mobileTab={mobileTab}
          query={query}
          resetFilters={resetFilters}
          riskSummary={riskSummary}
          selected={selected}
          selectedIds={selectedIds}
          setBidRatio={setBidRatio}
          setBufferRatio={setBufferRatio}
          setChannel={setChannel}
          setLevel={setLevel}
          setQuery={setQuery}
          stats={stats}
          toggleSelected={toggleSelected}
          userItemCount={userItems.length}
          onClearCompare={() => setSelectedIds([])}
          onRemoveCompare={(id) =>
            setSelectedIds((current) => current.filter((itemId) => itemId !== id))
          }
          onTabChange={changeMobileTab}
        />
      </div>
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

function MobileAppHome({
  activeFilterCount,
  bidRatio,
  bufferRatio,
  channel,
  contentRef,
  enriched,
  filtered,
  level,
  mobileTab,
  query,
  resetFilters,
  riskSummary,
  selected,
  selectedIds,
  setBidRatio,
  setBufferRatio,
  setChannel,
  setLevel,
  setQuery,
  stats,
  toggleSelected,
  userItemCount,
  onClearCompare,
  onRemoveCompare,
  onTabChange,
}: {
  activeFilterCount: number;
  bidRatio: number;
  bufferRatio: number;
  channel: SaleChannel | "전체";
  contentRef: { current: HTMLElement | null };
  enriched: AnalyzedItem[];
  filtered: AnalyzedItem[];
  level: RiskLevel | "전체";
  mobileTab: MobileTab;
  query: string;
  resetFilters: () => void;
  riskSummary: ReturnType<typeof getRiskSummary>;
  selected: AnalyzedItem[];
  selectedIds: string[];
  setBidRatio: (value: number) => void;
  setBufferRatio: (value: number) => void;
  setChannel: (value: SaleChannel | "전체") => void;
  setLevel: (value: RiskLevel | "전체") => void;
  setQuery: (value: string) => void;
  stats: { total: number };
  toggleSelected: (id: string) => void;
  userItemCount: number;
  onClearCompare: () => void;
  onRemoveCompare: (id: string) => void;
  onTabChange: (tab: MobileTab) => void;
}) {
  const featured = filtered[0];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-center border-b border-[#E3E8E5] bg-white px-4">
        <h1 className="text-[17px] font-bold text-[#002520]">경매 권리분석 코치</h1>
      </header>

      <main className="min-h-screen bg-white px-4 pb-32 pt-24">
        <section className="space-y-3">
          <h2 className="text-[26px] font-semibold leading-[34px] text-[#131E18]">
            오늘 먼저 확인할 리스크를 알려드려요.
          </h2>
          <p className="text-[15px] font-medium leading-6 text-[#414846]">
            물건을 고르기 전에 권리, 인수금, 입찰 상한을 쉬운 말로 정리해
            무엇을 먼저 확인해야 하는지 보여줍니다.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-[#E3E8E5] bg-white p-4">
          <p className="text-xs font-bold text-[#002520]">
            오늘 검토할 권리 리스크를 먼저 정리했어요.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#54615B]">
            <SummaryDot label={`확인 필요 ${riskSummary.needsReview}건`} tone="primary" />
            <SummaryDot label={`위험 신호 ${riskSummary.danger}건`} tone="danger" />
            <SummaryDot label={`입찰 검토 ${riskSummary.bidReady}건`} tone="primary" />
          </div>
        </section>

        {featured ? <MobileDecisionCard item={featured} /> : null}

        <section className="mt-8 space-y-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#717976]"
              aria-hidden="true"
              strokeWidth={2.2}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="지역, 사건번호, 온비드, 아파트"
              className="h-12 w-full rounded-lg border border-[#E3E8E5] bg-white pl-11 pr-4 text-[15px] font-medium text-[#131E18] outline-none placeholder:text-[#717976] focus:border-[#173B35] focus:ring-2 focus:ring-[#173B35]/10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MobileFilterPill active={channel === "전체"} label="전체보기" onClick={() => setChannel("전체")} />
            <MobileFilterPill active={channel === "경매"} label="경매" onClick={() => setChannel("경매")} />
            <MobileFilterPill active={channel === "공매"} label="공매" onClick={() => setChannel("공매")} />
            <MobileFilterPill active={level === "주의"} label="주의" onClick={() => setLevel(level === "주의" ? "전체" : "주의")} />
            <MobileFilterPill active={level === "위험"} label="위험" onClick={() => setLevel(level === "위험" ? "전체" : "위험")} />
          </div>

          {activeFilterCount > 0 || query ? (
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 rounded-lg border border-[#E3E8E5] bg-white px-3 text-xs font-bold text-[#414846]"
            >
              필터 초기화
            </button>
          ) : null}
        </section>

        <section ref={contentRef} className="mt-8">
          {mobileTab === "browse" ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#131E18]">추천 물건</h3>
                <span className="text-xs font-bold text-[#54615B]">{stats.total}건</span>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
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
                  label="비용 버퍼"
                  value={bufferRatio}
                  suffix="비용 차감"
                  min={0}
                  max={12}
                  onChange={setBufferRatio}
                  tone="sage"
                />
              </div>

              <div className="space-y-4">
                {filtered.map((item) => (
                  <MobilePropertyCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    onToggle={() => toggleSelected(item.id)}
                  />
                ))}
                {filtered.length === 0 ? (
                  <div className="rounded-lg border border-[#E3E8E5] bg-white p-8 text-center text-sm font-semibold text-[#54615B]">
                    조건에 맞는 물건이 없습니다.
                  </div>
                ) : null}
              </div>
            </>
          ) : mobileTab === "compare" ? (
            <ComparePanel
              selected={selected}
              onClear={onClearCompare}
              onRemove={onRemoveCompare}
            />
          ) : (
            <MobileProfilePanel
              enriched={enriched}
              selected={selected}
              userItemCount={userItemCount}
            />
          )}
        </section>
      </main>

      <MobileBottomTabs
        activeTab={mobileTab}
        selectedCount={selected.length}
        resultCount={stats.total}
        onTabChange={onTabChange}
      />
    </>
  );
}

function getCoachTask(items: AnalyzedItem[]) {
  const item = [...items].sort((left, right) => right.analysis.risk - left.analysis.risk)[0];
  if (!item) return null;

  const checklist = summarizeRightsChecklist(item.rightsChecklist);
  const primaryReason =
    item.analysis.riskFactors[0]?.label ??
    (checklist.unknownCount > 0 ? "권리 미확인 항목" : "입찰 상한 확인");
  const action =
    item.analysis.verdict === "전문가 검토"
      ? "공식 문서와 전문가 확인이 먼저 필요해요."
      : item.analysis.verdict === "가격 조정"
        ? "입찰가를 낮춰도 마진이 남는지 먼저 보세요."
        : "상한가 안에서 비교 후보로 담아볼 수 있어요.";

  return { item, primaryReason, action, unknownCount: checklist.unknownCount };
}

function getRiskSummary(items: AnalyzedItem[]) {
  return {
    needsReview: items.filter(
      (item) => summarizeRightsChecklist(item.rightsChecklist).unknownCount > 0
    ).length,
    danger: items.filter((item) => item.analysis.level === "위험").length,
    bidReady: items.filter((item) => item.analysis.verdict === "입찰 검토").length,
  };
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

function TopSummaryBanner({
  summary,
}: {
  summary: ReturnType<typeof getRiskSummary>;
}) {
  return (
    <div className="rounded-xl border border-[#DDE5E1] bg-white p-4">
      <p className="text-sm font-bold text-[#173B35]">
        오늘 검토할 권리 리스크를 먼저 정리했어요.
      </p>
      <div className="mt-3 grid gap-2 text-xs font-semibold text-[#56635C] sm:grid-cols-3">
        <SummaryDot label={`확인 필요 ${summary.needsReview}건`} tone="primary" />
        <SummaryDot label={`위험 신호 ${summary.danger}건`} tone="danger" />
        <SummaryDot label={`입찰 검토 ${summary.bidReady}건`} tone="primary" />
      </div>
    </div>
  );
}

function SummaryDot({ label, tone }: { label: string; tone: "primary" | "danger" }) {
  return (
    <span className="flex items-center gap-2 rounded-lg bg-[#F7F9F8] px-3 py-2">
      <span className={`h-2 w-2 rounded-full ${tone === "danger" ? "bg-[#B42318]" : "bg-[#173B35]"}`} />
      {label}
    </span>
  );
}

function DesktopDecisionCard({
  item,
  task,
}: {
  item: AnalyzedItem;
  task: ReturnType<typeof getCoachTask>;
}) {
  const checklist = summarizeRightsChecklist(item.rightsChecklist);
  const message =
    task?.item.id === item.id
      ? `${task.primaryReason}부터 확인해요.`
      : "입찰 상한과 권리 미확인 항목을 먼저 확인해요.";

  return (
    <section className="rounded-xl border border-[#DDE5E1] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#6F766F]">{item.caseNo}</p>
          <h2 className="mt-2 text-xl font-semibold text-[#1F2A24]">{item.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Verdict value={item.analysis.verdict} />
          <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-[#F7F9F8] px-4 py-3 text-sm font-semibold leading-6 text-[#34423C]">
        {message} 공식 문서 확인 전에는 참고용으로만 보세요.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <CoachMiniStat label="입찰 상한" value={uk(item.analysis.suggested)} strong />
        <CoachMiniStat label="리스크" value={`${item.analysis.risk}점`} />
        <CoachMiniStat label="권리 미확인" value={`${checklist.unknownCount}건`} />
      </div>

      <Link
        href={`/properties/${item.id}`}
        className="button-lift mt-4 flex h-12 items-center justify-center rounded-lg bg-[#173B35] text-sm font-semibold text-white"
      >
        리스크 상세 분석 보기
      </Link>
    </section>
  );
}

function QuickFilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition ${
        active
          ? "border-[#173B35] bg-[#173B35] text-white"
          : "border-[#DDE5E1] bg-white text-[#56635C] hover:border-[#173B35] hover:text-[#173B35]"
      }`}
    >
      {label}
    </button>
  );
}

function MobileDecisionCard({ item }: { item: AnalyzedItem }) {
  const checklist = summarizeRightsChecklist(item.rightsChecklist);

  return (
    <section className="mt-8 rounded-lg border border-[#E3E8E5] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold leading-7 text-[#131E18]">
          오늘의 확인 항목
        </h3>
        <div className="flex shrink-0 gap-2">
          <Verdict value={item.analysis.verdict} />
          <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
        </div>
      </div>

      <p className="mt-4 text-lg font-semibold leading-7 text-[#173B35]">
        {item.analysis.riskFactors[0]?.label ?? "입찰 상한"}부터 확인해요.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#E3E8E5] py-3">
        <MobileMiniMetric label="입찰 상한" value={uk(item.analysis.suggested)} />
        <MobileMiniMetric label="리스크" value={`${item.analysis.risk}점`} danger />
        <MobileMiniMetric label="권리 미확인" value={`${checklist.unknownCount}건`} />
      </div>

      <Link
        href={`/properties/${item.id}`}
        className="mt-4 flex h-12 items-center justify-center rounded-lg bg-[#173B35] text-sm font-bold text-white transition active:scale-[0.98]"
      >
        이 물건 먼저 보기
      </Link>
    </section>
  );
}

function MobileMiniMetric({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[11px] font-semibold text-[#54615B]">{label}</p>
      <p
        className={`mt-1 break-words text-sm font-bold tabular-nums ${
          danger ? "text-[#B42318]" : "text-[#131E18]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MobileFilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 shrink-0 rounded-full px-4 text-xs font-semibold transition active:scale-[0.98] ${
        active
          ? "bg-[#173B35] text-white"
          : "border border-[#E3E8E5] bg-white text-[#414846] hover:border-[#173B35]"
      }`}
    >
      {label}
    </button>
  );
}

function MobilePropertyCard({
  item,
  selected,
  onToggle,
}: {
  item: AnalyzedItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const gapToSuggested = item.analysis.suggested - item.analysis.plannedBid;
  const riskFrame = mobileRiskFrameFor(item.analysis.level);
  const checklist = summarizeRightsChecklist(item.rightsChecklist);

  return (
    <article
      className={`rounded-lg border bg-white p-4 transition active:scale-[0.99] ${riskFrame.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#54615B]">
            {item.caseNo} · {item.channel}
          </p>
          <Link href={`/properties/${item.id}`}>
            <h4 className="mt-1 text-lg font-semibold leading-6 text-[#131E18]">
              {item.title}
            </h4>
          </Link>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${riskFrame.badge}`}>
          {item.analysis.level === "안정" ? "양호" : item.analysis.level}
        </span>
      </div>

      <Link href={`/properties/${item.id}`} className="mt-4 flex gap-4">
        <div
          aria-label={`${item.title} 참고 이미지`}
          className="aspect-[4/3] w-[34%] shrink-0 rounded-lg bg-[#D9E6DC] bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url(${propertyImageFor(item)})` }}
        />
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <MobilePriceRow label="시세" value={uk(item.market)} />
          <MobilePriceRow label="최저가" value={uk(item.minimum)} danger />
          <MobilePriceRow
            label="안전마진"
            value={uk(Math.abs(gapToSuggested))}
            strong={gapToSuggested >= 0}
          />
        </div>
      </Link>

      <div className={`mt-4 rounded-lg px-3 py-2 ${riskFrame.panel}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-[#414846]">리스크 테두리</span>
          <span className="text-xs font-bold tabular-nums text-[#131E18]">
            {item.analysis.risk}점
          </span>
        </div>
        <p className="mt-1 text-xs font-medium leading-5 text-[#54615B]">
          {item.analysis.riskFactors[0]?.label ?? "입찰 상한"} · 권리 미확인 {checklist.unknownCount}건
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge label={item.status} />
        <span className="rounded-full bg-[#FBFCFC] px-2.5 py-1 text-xs font-semibold text-[#54615B]">
          {item.analysis.verdict}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`mt-4 h-12 w-full rounded-lg border text-sm font-bold transition active:scale-[0.98] ${
          selected
            ? "border-[#173B35] bg-[#173B35] text-white"
            : "border-[#E3E8E5] bg-white text-[#131E18] hover:border-[#173B35] hover:text-[#173B35]"
        }`}
      >
        {selected ? "비교 담김" : "비교 담기"}
      </button>
    </article>
  );
}

function mobileRiskFrameFor(level: RiskLevel) {
  const frames = {
    안정: {
      card: "border-[#D7E4DC] shadow-[0_10px_24px_rgba(23,59,53,0.06)]",
      badge: "bg-[#EEF5F1] text-[#173B35]",
      panel: "bg-[#F7FAF8]",
    },
    주의: {
      card: "border-[#CBD9C2] shadow-[0_10px_24px_rgba(86,106,75,0.08)]",
      badge: "bg-[#EEF3E8] text-[#566A4B]",
      panel: "bg-[#F8FAF4]",
    },
    위험: {
      card: "border-[#FCA5A5] shadow-[0_10px_24px_rgba(180,35,24,0.08)]",
      badge: "bg-[#FEE2E2] text-[#B42318]",
      panel: "bg-[#FFF7F7]",
    },
  } satisfies Record<RiskLevel, { card: string; badge: string; panel: string }>;

  return frames[level];
}

function MobilePriceRow({
  label,
  value,
  danger,
  strong,
}: {
  label: string;
  value: string;
  danger?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E3E8E5] py-1.5 last:border-b-0">
      <span className="text-xs font-semibold text-[#54615B]">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          danger ? "text-[#B42318]" : strong ? "text-[#173B35]" : "text-[#131E18]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MobileProfilePanel({
  enriched,
  selected,
  userItemCount,
}: {
  enriched: AnalyzedItem[];
  selected: AnalyzedItem[];
  userItemCount: number;
}) {
  const needsReview = enriched.filter(
    (item) => summarizeRightsChecklist(item.rightsChecklist).unknownCount > 0
  ).length;
  const highRisk = enriched.filter((item) => item.analysis.level === "위험").length;
  const watchItems = [...selected].sort(compareForBasket).slice(0, 2);
  const recentItems = [...enriched].sort(compareForBasket).slice(0, 3);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-bold text-[#54615B]">마이페이지</p>
        <h2 className="mt-1 text-2xl font-semibold leading-8 text-[#131E18]">
          내 경매 분석 현황을 한눈에 봐요.
        </h2>
      </div>

      <div className="rounded-lg border border-[#D7E4DC] bg-[#F7FAF8] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#173B35]">현재 사용 모드</p>
            <h3 className="mt-1 text-lg font-semibold text-[#131E18]">비회원 MVP</h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#173B35]">
            로컬 저장
          </span>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#54615B]">
          직접 등록한 물건과 비교 바구니는 현재 브라우저에 저장됩니다.
          계정 기능은 실제 데이터 연동 이후 붙이는 흐름이 좋아요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MobileProfileStat label="비교 바구니" value={`${selected.length}/${MAX_COMPARE_COUNT}`} />
        <MobileProfileStat label="직접 등록" value={`${userItemCount}건`} />
        <MobileProfileStat label="확인 필요" value={`${needsReview}건`} />
        <MobileProfileStat label="위험 신호" value={`${highRisk}건`} danger />
      </div>

      <section className="rounded-lg border border-[#E3E8E5] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#131E18]">내 비교 후보</h3>
          <span className="text-xs font-bold text-[#54615B]">{selected.length}건</span>
        </div>
        <div className="mt-3 space-y-3">
          {watchItems.length > 0 ? (
            watchItems.map((item) => <MobileProfileItem key={item.id} item={item} />)
          ) : (
            <p className="rounded-lg bg-[#FBFCFC] p-3 text-sm font-medium text-[#54615B]">
              아직 비교 바구니에 담긴 물건이 없어요.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[#E3E8E5] bg-white p-4">
        <h3 className="text-base font-semibold text-[#131E18]">최근 분석 추천</h3>
        <div className="mt-3 space-y-3">
          {recentItems.map((item) => (
            <MobileProfileItem key={item.id} item={item} compact />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#E3E8E5] bg-white p-4">
        <h3 className="text-base font-semibold text-[#131E18]">다음에 연결할 기능</h3>
        <div className="mt-3 space-y-2 text-sm font-medium text-[#54615B]">
          <MobileTodoLine label="관심 조건 저장" status="준비중" />
          <MobileTodoLine label="실제 경매/공매 연동" status="설계 필요" />
          <MobileTodoLine label="시세 데이터 비교" status="범위 결정" />
        </div>
      </section>
    </section>
  );
}

function MobileProfileStat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#E3E8E5] bg-white p-3">
      <p className="text-xs font-semibold text-[#54615B]">{label}</p>
      <p className={`mt-2 text-xl font-bold tabular-nums ${danger ? "text-[#B42318]" : "text-[#173B35]"}`}>
        {value}
      </p>
    </div>
  );
}

function MobileProfileItem({
  item,
  compact,
}: {
  item: AnalyzedItem;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/properties/${item.id}`}
      className="block rounded-lg border border-[#E3E8E5] bg-[#FBFCFC] p-3 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#54615B]">{item.caseNo}</p>
          <p className="mt-1 truncate text-sm font-bold text-[#131E18]">{item.title}</p>
          {!compact ? (
            <p className="mt-1 text-xs font-medium text-[#54615B]">
              {compareReason(item)}
            </p>
          ) : null}
        </div>
        <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
      </div>
    </Link>
  );
}

function MobileTodoLine({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-[#FBFCFC] px-3 py-2">
      <span>{label}</span>
      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#173B35]">
        {status}
      </span>
    </div>
  );
}

const propertyImageUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCctVB4ztNz-qOXKw4MOs7UB7iM29_StBOkVJbkorYo7XiiYfwTI0Y42zL_up4Q1n8PojlNL-SuVH0nDbWh8MWgR-UG7m-9WvpwbSvUv8ahKgLu4yls_NWoFigt568GyTqAR5UKuN-LZmgYKolfKfKY7H0b_TY2IEGyBUn7SOLdFEwFr6TGQxIklngW9KSHRo8azQEbAm6IuCgx0zL_i5_4xYS2Mlow-J4BC0jqisVpdIJGzgL9PxE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBvlYsfBHplFbW1GRwi5-1flapUlni3FEeTPv8tTgBN16sHkXzZAp_gquz3EcVsolY5nIS0BkaPPrgJtk0jwzp2CBXpZF-FP1L6sWBY97lqDdI5ig-5Ze7Etn3SDy2ahZB6NB7nQqVLF8-YHkWZBf_eZ4-GDeeEUP8XtCRwmi9OJgrnLxwWizrq1LX9IRQqamqK0dIyMaVaLfm02w0wPAZVl9cM5qZPnFj-hQVQgPz7BqlH4LTPOrk",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCZmiY4WfwpYic1PRBb6NeBoR1JC6j1VZNdHd4MDxekr2rqWUC88mQaSqSGQ0iLOa9hhHKXV6-_hWU5Pc5kRCgRMOzDbhEq4cptuxYKvLQZD2UWmbwMjZ5kGOGQWpy-IUtim2nR0SDsFkhpe8JXjbhkHurWuhySF3eJYGDeoq-bM6gSC5aIGjiKmptVbqgUm5jOQPZmv1IJVwaZZK8daKGfsrYbs4mug5DJE-_HP0QxwBumGKx5ONg",
];

function propertyImageFor(item: AnalyzedItem) {
  const index = Math.abs(
    [...item.id].reduce((total, char) => total + char.charCodeAt(0), 0)
  ) % propertyImageUrls.length;
  return propertyImageUrls[index];
}

function DesktopPropertyCard({
  item,
  selected,
  onToggle,
}: {
  item: AnalyzedItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const checklist = summarizeRightsChecklist(item.rightsChecklist);

  return (
    <article className="interactive-card overflow-hidden rounded-xl border border-[#DDE5E1] bg-white hover:border-[#CAD8D1] hover:shadow-[0_16px_32px_rgba(47,55,45,0.08)]">
      <Link href={`/properties/${item.id}`} className="block">
        <div
          aria-label={`${item.title} 참고 이미지`}
          className="aspect-[16/9] bg-[#F7F9F8] bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url(${propertyImageFor(item)})` }}
        />
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#6F766F]">{item.caseNo}</span>
          <ChannelBadge channel={item.channel} />
        </div>
        <Link href={`/properties/${item.id}`} className="block">
          <h3 className="text-base font-semibold leading-snug text-[#1F2A24] transition hover:text-[#173B35]">
            {item.title}
          </h3>
          <p className="mt-1 text-xs font-medium text-[#6F766F]">{item.district} · {item.area}㎡</p>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <CoachMiniStat label="최저가" value={uk(item.minimum)} />
          <CoachMiniStat label="적정 상한" value={uk(item.analysis.suggested)} strong />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Verdict value={item.analysis.verdict} />
          <span className="rounded-full bg-[#F7F9F8] px-2.5 py-1 text-xs font-semibold text-[#56635C]">
            미확인 {checklist.unknownCount}건
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`h-10 w-full rounded-lg border text-sm font-semibold transition ${
            selected
              ? "border-[#173B35] bg-[#173B35] text-white"
              : "border-[#DDE5E1] bg-white text-[#34423C] hover:border-[#173B35] hover:text-[#173B35]"
          }`}
        >
          {selected ? "비교중" : "비교 담기"}
        </button>
      </div>
    </article>
  );
}

function CoachMiniStat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-[#DDE5E1] bg-[#FFFFFF] px-3 py-2">
      <p className="text-[11px] font-bold text-[#6F766F]">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${strong ? "text-[#173B35]" : "text-[#1F2A24]"}`}>
        {value}
      </p>
    </div>
  );
}

function CoachCandidateRow({ item, index }: { item: AnalyzedItem; index: number }) {
  const checklist = summarizeRightsChecklist(item.rightsChecklist);

  return (
    <Link
      href={`/properties/${item.id}`}
      className="interactive-card block rounded-[20px] border border-[#DDE5E1] bg-white p-3 hover:border-[#CAD8D1] hover:shadow-[0_12px_24px_rgba(47,55,45,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-[#173B35]">추천 #{index + 1}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[#1F2A24]">{item.title}</p>
          <p className="mt-1 text-xs font-medium text-[#6F766F]">
            {item.district} · {item.channel} · {item.analysis.verdict}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#EEF5F1] px-2 py-1 text-xs font-bold text-[#173B35]">
          {item.analysis.risk}점
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-[#56635C]">
        <span className="rounded-full bg-[#F3F7F4] px-2 py-1">
          상한 {uk(item.analysis.suggested)}
        </span>
        <span className="rounded-full bg-[#F3F7F4] px-2 py-1">
          미확인 {checklist.unknownCount}개
        </span>
      </div>
    </Link>
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
  tone: "green" | "sage";
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1F2A24]">{label}</p>
          <p className="text-xs font-medium text-[#6F766F]">{suffix}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
            tone === "green"
              ? "bg-[#EEF5F1] text-[#173B35]"
              : "bg-[#EEF3E8] text-[#566A4B]"
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
          tone === "green" ? "accent-[#173B35]" : "accent-[#416F67]"
        }`}
      />
    </div>
  );
}

function ChannelBadge({ channel }: { channel: SaleChannel }) {
  const style =
    channel === "경매"
      ? "bg-[#EEF5F1] text-[#173B35]"
      : "bg-[#F3F7F4] text-[#253858]";
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

// Kept temporarily while the mobile redesign settles; remove after the app-style cards are finalized.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      className={`app-card interactive-card reveal-up group relative overflow-hidden rounded-[26px] p-4 hover:border-[#CAD8D1] hover:shadow-[0_20px_44px_rgba(47,55,45,0.12)] ${
        selected
          ? "border-[#173B35] ring-2 ring-[#D7E4DC] md:ring-[#EAF3EE]"
          : "border-[#DDE5E1]"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${riskAccentClass[item.analysis.level]}`} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <a href={href} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={item.channel} />
            <span className="rounded-full bg-[#F3F7F4] px-2.5 py-1 text-xs font-semibold text-[#56635C]">
              {item.agency}
            </span>
            {statusLabels.map((label) => (
              <StatusBadge key={label} label={label} />
            ))}
            <span className="text-xs font-semibold text-[#6F766F]">
              {item.caseNo}
            </span>
            {selected ? (
              <span className="rounded-full bg-[#173B35] px-2.5 py-1 text-xs font-semibold text-white md:hidden">
                비교 담김
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug text-[#1F2A24] transition group-hover:text-[#173B35] md:text-lg">
                {item.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-[#6F766F]">
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
            className={`${detailsOpen ? "block" : "hidden"} rounded-[20px] border border-[#DDE5E1] bg-[#FFFFFF] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] md:block`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#6F766F]">체크 난이도</span>
              <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
            </div>
            <RiskMeter level={item.analysis.level} score={item.analysis.risk} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-between">
            <span
              className={`min-w-0 text-xs font-bold ${
                gapToSuggested >= 0 ? "text-[#173B35]" : "text-[#B42318]"
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
              className="h-9 rounded-2xl border border-[#DDE5E1] bg-[#FFFFFF] px-3 text-sm font-semibold text-[#34423C] transition hover:bg-white md:hidden"
            >
              {detailsOpen ? "접기" : "더보기"}
            </button>
            <button
              onClick={onToggle}
              aria-pressed={selected}
              className={`button-lift h-10 min-w-28 rounded-lg px-3 text-sm transition md:h-9 md:min-w-0 ${
                selected
                  ? "bg-[#173B35] font-semibold text-white shadow-[0_10px_22px_rgba(23,59,53,0.22)]"
                  : "border border-[#DDE5E1] bg-white font-semibold text-[#34423C] hover:border-[#173B35] hover:text-[#173B35]"
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
    <div className="min-w-0 rounded-[18px] border border-[#DDE5E1] bg-[#FFFFFF] px-3 py-2">
      <p className="text-[11px] font-bold text-[#6F766F]">{label}</p>
      <p
        className={`mt-0.5 break-words text-sm font-semibold tabular-nums ${
          danger
            ? "text-[#B42318]"
            : strong
              ? "text-[#173B35]"
              : "text-[#1F2A24]"
        }`}
      >
        {value}
      </p>
    </div>
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
    <div className="min-w-0 rounded-[18px] border border-[#DDE5E1] bg-[#FFFFFF] p-3">
      <p className="text-xs font-semibold text-[#6F766F]">{label}</p>
      <p
        className={`mt-1 break-words text-base font-semibold tabular-nums ${
          danger
            ? "text-[#B42318]"
            : strong
              ? "text-[#173B35]"
              : "text-[#1F2A24]"
        }`}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs font-medium text-[#85938C]">{sub}</p> : null}
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
            <h2 className="text-lg font-semibold text-[#1F2A24]">비교 바구니</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                selected.length > 0
                  ? "bg-[#EEF5F1] text-[#173B35] ring-1 ring-[#D7E4DC]"
                  : "bg-[#F3F7F4] text-[#56635C]"
              }`}
            >
              {selected.length}/{MAX_COMPARE_COUNT}
            </span>
          </div>
          <p className="text-sm text-[#6F766F]">
            2-4개 물건을 총투입금, 권리 미확인, 마진, 판정 기준으로 비교합니다.
          </p>
          {best ? (
            <p className="mt-2 text-xs font-semibold text-[#173B35]">
              현재 1순위: {best.title} · {compareReason(best)}
            </p>
          ) : null}
        </div>
        <button
          onClick={onClear}
          disabled={selected.length === 0}
          className="h-10 rounded-2xl border border-[#DDE5E1] bg-white px-3 text-sm font-semibold text-[#34423C] transition hover:bg-[#FFFFFF] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
        >
          선택 비우기
        </button>
      </div>
      {selected.length === 1 ? (
        <p className="mt-3 rounded-2xl border border-[#D7E4DC] bg-[#EEF5F1] px-3 py-2 text-sm font-semibold text-[#173B35]">
          하나 더 담으면 총투입금과 권리 리스크를 나란히 비교할 수 있습니다.
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {selected.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#CAD8D1] bg-[#FFFFFF] p-6 text-center md:col-span-2 xl:col-span-4">
            <p className="text-base font-semibold text-[#1F2A24]">아직 비교할 물건이 없어요.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-[#6F766F]">
              물건 탭에서 마음에 드는 후보의 비교 담기를 누르면 총투입금과 권리 리스크를 여기서 바로 비교할 수 있습니다.
            </p>
          </div>
        ) : (
          ranked.map((item, index) => {
            const checklist = summarizeRightsChecklist(item.rightsChecklist);

            return (
            <div
              key={item.id}
              className={`interactive-card rounded-[22px] border bg-white p-4 hover:border-[#CAD8D1] hover:shadow-[0_14px_30px_rgba(47,55,45,0.09)] ${
                index === 0
                  ? "border-[#D7E4DC] ring-2 ring-[#EEF5F1]"
                  : "border-[#DDE5E1]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      index === 0
                        ? "bg-[#173B35] text-white"
                        : "bg-[#173B35] text-white"
                    }`}
                  >
                    {index === 0 ? "검토 우선 #1" : `비교 #${index + 1}`}
                  </span>
                  <ChannelBadge channel={item.channel} />
                </div>
                <Verdict value={item.analysis.verdict} />
              </div>
              <p className="mt-3 rounded-2xl bg-[#FFFFFF] px-3 py-2 text-xs font-bold leading-5 text-[#34423C]">
                {compareReason(item)}
              </p>
              <a
                href={`/properties/${item.id}`}
                className="mt-2 flex min-h-11 items-center text-sm font-semibold text-[#1F2A24] transition hover:text-[#173B35]"
              >
                {item.title}
              </a>
              <p className="mt-1 text-xs font-medium text-[#6F766F]">
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
              <div className="mt-3 border-t border-[#DDE5E1] pt-3">
                <button
                  onClick={() => onRemove(item.id)}
                  className="h-10 w-full rounded-2xl border border-[#DDE5E1] bg-[#FFFFFF] text-sm font-semibold text-[#34423C] transition hover:border-[#FCA5A5] hover:bg-[#FEE2E2] hover:text-[#B42318]"
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
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E3E8E5] bg-white px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid h-24 max-w-md grid-cols-4 items-stretch">
        <MobileTabButton
          active={activeTab === "browse"}
          label="홈"
          meta={`${resultCount}건`}
          icon="home"
          onClick={() => onTabChange("browse")}
        />
        <MobileTabButton
          active={false}
          label="등록"
          meta="직접"
          icon="plus"
          href="/properties/new"
        />
        <MobileTabButton
          active={activeTab === "compare"}
          label="분석"
          meta={`${selectedCount}/${MAX_COMPARE_COUNT}`}
          highlighted={selectedCount > 0}
          icon="analytics"
          onClick={() => onTabChange("compare")}
        />
        <MobileTabButton
          active={activeTab === "profile"}
          label="마이페이지"
          meta="내 정보"
          icon="user"
          onClick={() => onTabChange("profile")}
        />
      </div>
    </nav>
  );
}

function MobileTabButton({
  active,
  label,
  meta,
  icon,
  href,
  highlighted,
  onClick,
}: {
  active: boolean;
  label: string;
  meta: string;
  icon: "home" | "plus" | "analytics" | "user";
  href?: string;
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const className = `relative flex flex-col items-center justify-center rounded-lg p-2 text-center text-xs transition active:scale-95 active:bg-[#F6F8F7] ${
    active
      ? "font-bold text-[#173B35]"
      : highlighted
        ? "font-semibold text-[#173B35]"
      : "font-semibold text-[#54615B]"
  }`;
  const iconActive = active || Boolean(highlighted);

  const content = (
    <>
      {highlighted && !active ? (
        <span className="absolute right-5 top-2 h-2 w-2 rounded-full bg-[#416F67] ring-2 ring-white" />
      ) : null}
      <TabIcon type={icon} active={iconActive} />
      <span className="mt-1 block">{label}</span>
      <span className="mt-0.5 block text-[10px] font-bold opacity-60">{meta}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  );
}

function TabIcon({ type, active }: { type: "home" | "plus" | "analytics" | "user"; active: boolean }) {
  const icons: Record<"home" | "plus" | "analytics" | "user", LucideIcon> = {
    home: HomeIcon,
    plus: SquarePlus,
    analytics: ChartNoAxesColumnIncreasing,
    user: UserRound,
  };
  const Icon = icons[type];

  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
        active ? "bg-[#EEF5F1] text-[#173B35]" : "text-[#85938C]"
      }`}
      aria-hidden="true"
    >
      <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.5 : 2.1} />
    </span>
  );
}
