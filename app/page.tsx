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
  };
  const activeFilterCount = [
    channel !== "전체",
    type !== "전체",
    level !== "전체",
    owner !== "전체",
  ].filter(Boolean).length;
  const coachTask = getCoachTask(enriched);
  const priorityItems = [...enriched].sort(compareForBasket).slice(0, 3);

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
      <section className="relative overflow-hidden bg-[#FAF8F3]">
        <div className="mx-auto max-w-7xl px-5 pb-5 pt-5 lg:px-8 lg:pb-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black text-[#173B35]">경매 권리분석 코치</p>
            <div className="flex items-center gap-2 text-xs font-bold text-[#6F766F]">
              <span>경매</span>
              <span>공매</span>
              <span className="rounded-full bg-[#EEF5F1] px-2 py-1 text-[#173B35]">MVP</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="min-w-0 space-y-4">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#EEF5F1] px-3 py-1 text-xs font-bold text-[#173B35] ring-1 ring-[#D7E4DC]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#173B35]" />
                  오늘의 판단 시작점
                </p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-[#1F2A24] md:text-5xl">
                  오늘 먼저 확인할 리스크를 알려드려요.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#56635C]">
                  물건을 고르기 전에 권리, 인수금, 입찰 상한을 쉬운 말로 정리해
                  무엇을 먼저 확인해야 하는지 보여줍니다.
                </p>
              </div>

              <CoachTaskCard task={coachTask} />

              <div className="app-card rounded-[24px] p-3">
                <label className="sr-only" htmlFor="property-search">
                  물건 검색
                </label>
                <div className="flex min-h-14 items-center gap-3 rounded-[18px] bg-white px-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF5F1] text-sm font-black text-[#173B35]">
                    Q
                  </span>
                  <input
                    id="property-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="지역, 사건번호, 온비드, 아파트"
                    className="h-12 min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#1F2A24] outline-none placeholder:text-[#9A958B]"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="h-9 rounded-full bg-[#F7F2E8] px-3 text-xs font-bold text-[#56635C] transition hover:bg-[#EAF3EE]"
                    >
                      지우기
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="app-card rounded-[28px] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#6F766F]">오늘의 후보 정리</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#1F2A24]">
                    먼저 열어볼 물건
                  </h2>
                </div>
                <span className="rounded-full bg-[#173B35] px-2.5 py-1 text-xs font-bold text-white">
                  {priorityItems.length}건
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {priorityItems.map((item, index) => (
                  <CoachCandidateRow key={item.id} item={item} index={index} />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section
        className={`sticky top-0 z-10 bg-[#FAF8F3]/88 shadow-[0_12px_30px_rgba(47,55,45,0.08)] backdrop-blur ${
          mobileTab === "browse" ? "block" : "hidden md:block"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-3 xl:px-8">
          <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#6F766F]">검색 결과</p>
                <p className="text-sm font-semibold text-[#1F2A24]">{stats.total}건</p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!query && activeFilterCount === 0}
                className="h-11 rounded-2xl border border-[#E5DED3] bg-white px-4 text-sm font-semibold text-[#34423C] transition hover:bg-[#FFFDF8] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
              >
                초기화
              </button>
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
            <p className="mt-2 text-xs font-semibold text-[#6F766F]">
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
              tone="sage"
            />
            <div className="rounded-[20px] bg-[#173B35] px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <p className="font-semibold">계산 기준</p>
              <p className="mt-1 text-[#EAF3EE]">
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
              <div className="rounded-[24px] border border-[#E5DED3] bg-white p-8 text-center text-sm font-semibold text-[#6F766F]">
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

function CoachTaskCard({
  task,
}: {
  task: ReturnType<typeof getCoachTask>;
}) {
  if (!task) {
    return (
      <div className="app-card rounded-[26px] p-5">
        <p className="text-sm font-bold text-[#6F766F]">오늘의 확인 항목</p>
        <p className="mt-2 text-xl font-semibold text-[#1F2A24]">
          아직 검토할 물건이 없어요.
        </p>
      </div>
    );
  }

  const { item } = task;

  return (
    <div className="app-card rounded-[28px] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#173B35] px-2.5 py-1 text-xs font-bold text-white">
          오늘의 확인 항목
        </span>
        <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
        <Verdict value={item.analysis.verdict} />
      </div>
      <h2 className="mt-4 text-2xl font-semibold leading-snug text-[#1F2A24] md:text-3xl">
        {task.primaryReason}부터 확인해요.
      </h2>
      <p className="mt-3 text-sm font-medium leading-6 text-[#56635C]">
        {item.title}은 {task.action} 공식 문서 확인 전에는 참고용으로만 보세요.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <CoachMiniStat label="입찰 상한" value={uk(item.analysis.suggested)} strong />
        <CoachMiniStat label="리스크" value={`${item.analysis.risk}점`} />
        <CoachMiniStat label="권리 미확인" value={`${task.unknownCount}개`} />
      </div>
      <Link
        href={`/properties/${item.id}`}
        className="button-lift mt-4 inline-flex min-h-11 items-center rounded-2xl bg-[#173B35] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,59,53,0.18)]"
      >
        이 물건 먼저 보기
      </Link>
    </div>
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
    <div className="rounded-[18px] border border-[#E5DED3] bg-[#FFFDF8] px-3 py-2">
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
      className="interactive-card block rounded-[20px] border border-[#E5DED3] bg-white p-3 hover:border-[#D7CDC0] hover:shadow-[0_12px_24px_rgba(47,55,45,0.08)]"
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
        <span className="rounded-full bg-[#F7F2E8] px-2 py-1">
          상한 {uk(item.analysis.suggested)}
        </span>
        <span className="rounded-full bg-[#F7F2E8] px-2 py-1">
          미확인 {checklist.unknownCount}개
        </span>
      </div>
    </Link>
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
      <p className="mb-1 px-1 text-[11px] font-bold text-[#6F766F]">{title}</p>
      <div className="flex min-h-11 gap-1 rounded-full border border-[#E5DED3] bg-[#F7F2E8] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onChange(option)}
            className={`min-h-9 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
              value === option
                ? "bg-[#173B35] font-semibold text-white shadow-[0_8px_18px_rgba(23,59,53,0.22)]"
                : "font-medium text-[#6F766F] hover:bg-white/78"
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
      : "bg-[#F7F2E8] text-[#253858]";
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
      ? "bg-[#EEF3E8] text-[#566A4B]"
      : label === "직접 입력"
        ? "bg-[#F7F2E8] text-[#56635C]"
        : "bg-[#EEF5F1] text-[#173B35]";

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
      className={`app-card interactive-card reveal-up group relative overflow-hidden rounded-[26px] p-4 hover:border-[#D7CDC0] hover:shadow-[0_20px_44px_rgba(47,55,45,0.12)] ${
        selected
          ? "border-[#173B35] ring-2 ring-[#D7E4DC] md:ring-[#EAF3EE]"
          : "border-[#E5DED3]"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${riskAccent[item.analysis.level]}`} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <a href={href} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={item.channel} />
            <span className="rounded-full bg-[#F7F2E8] px-2.5 py-1 text-xs font-semibold text-[#56635C]">
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
            className={`${detailsOpen ? "block" : "hidden"} rounded-[20px] border border-[#E5DED3] bg-[#FFFDF8] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] md:block`}
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
              className="h-9 rounded-2xl border border-[#E5DED3] bg-[#FFFDF8] px-3 text-sm font-semibold text-[#34423C] transition hover:bg-white md:hidden"
            >
              {detailsOpen ? "접기" : "더보기"}
            </button>
            <button
              onClick={onToggle}
              aria-pressed={selected}
              className={`button-lift h-10 min-w-28 rounded-lg px-3 text-sm transition md:h-9 md:min-w-0 ${
                selected
                  ? "bg-[#173B35] font-semibold text-white shadow-[0_10px_22px_rgba(23,59,53,0.22)]"
                  : "border border-[#E5DED3] bg-white font-semibold text-[#34423C] hover:border-[#173B35] hover:text-[#173B35]"
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
    <div className="min-w-0 rounded-[18px] border border-[#E5DED3] bg-[#FFFDF8] px-3 py-2">
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

const riskAccent: Record<RiskLevel, string> = {
  안정: "bg-[#173B35]",
  주의: "bg-[#6B7F5D]",
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
    <div className="min-w-0 rounded-[18px] border border-[#E5DED3] bg-[#FFFDF8] p-3">
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
      {sub ? <p className="mt-0.5 text-xs font-medium text-[#9A958B]">{sub}</p> : null}
    </div>
  );
}

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#DC2626]" : level === "주의" ? "bg-[#6B7F5D]" : "bg-[#173B35]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5DED3]">
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
            <h2 className="text-lg font-semibold text-[#1F2A24]">비교 바구니</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                selected.length > 0
                  ? "bg-[#EEF5F1] text-[#173B35] ring-1 ring-[#D7E4DC]"
                  : "bg-[#F7F2E8] text-[#56635C]"
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
          className="h-10 rounded-2xl border border-[#E5DED3] bg-white px-3 text-sm font-semibold text-[#34423C] transition hover:bg-[#FFFDF8] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
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
          <div className="rounded-[22px] border border-dashed border-[#D7CDC0] bg-[#FFFDF8] p-6 text-center md:col-span-2 xl:col-span-4">
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
              className={`interactive-card rounded-[22px] border bg-white p-4 hover:border-[#D7CDC0] hover:shadow-[0_14px_30px_rgba(47,55,45,0.09)] ${
                index === 0
                  ? "border-[#D7E4DC] ring-2 ring-[#EEF5F1]"
                  : "border-[#E5DED3]"
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
              <p className="mt-3 rounded-2xl bg-[#FFFDF8] px-3 py-2 text-xs font-bold leading-5 text-[#34423C]">
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
              <div className="mt-3 border-t border-[#E5DED3] pt-3">
                <button
                  onClick={() => onRemove(item.id)}
                  className="h-10 w-full rounded-2xl border border-[#E5DED3] bg-[#FFFDF8] text-sm font-semibold text-[#34423C] transition hover:border-[#FCA5A5] hover:bg-[#FEE2E2] hover:text-[#B42318]"
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
    <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)] md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 items-end rounded-[30px] border border-white/80 bg-white/94 px-3 pb-2 pt-3 shadow-[0_-16px_38px_rgba(47,55,45,0.14)] backdrop-blur">
        <MobileTabButton
          active={activeTab === "browse"}
          label="물건"
          meta={`${resultCount}건`}
          icon="browse"
          onClick={() => onTabChange("browse")}
        />
        <Link
          href="/properties/new"
          className="button-lift -mt-8 flex min-h-[76px] flex-col items-center justify-start text-center text-xs font-black text-[#173B35]"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#173B35] text-3xl font-light leading-none text-white shadow-[0_14px_28px_rgba(23,59,53,0.24)] ring-4 ring-white">
            +
          </span>
          <span className="mt-1.5">등록</span>
        </Link>
        <MobileTabButton
          active={activeTab === "compare"}
          label="비교"
          meta={`${selectedCount}/${MAX_COMPARE_COUNT}`}
          highlighted={selectedCount > 0}
          icon="compare"
          onClick={() => onTabChange("compare")}
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
  highlighted,
  onClick,
}: {
  active: boolean;
  label: string;
  meta: string;
  icon: "browse" | "compare";
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative flex min-h-[62px] flex-col items-center justify-center rounded-3xl px-2 text-center text-xs font-black transition ${
        active
          ? "text-[#173B35]"
          : highlighted
            ? "text-[#173B35]"
          : "text-[#6F766F]"
      }`}
    >
      {highlighted && !active ? (
        <span className="absolute right-5 top-2 h-2 w-2 rounded-full bg-[#416F67] ring-2 ring-white" />
      ) : null}
      <TabIcon type={icon} active={active || Boolean(highlighted)} />
      <span className="mt-1 block">{label}</span>
      <span className="mt-0.5 block text-[10px] font-bold opacity-60">{meta}</span>
    </button>
  );
}

function TabIcon({ type, active }: { type: "browse" | "compare"; active: boolean }) {
  const color = active ? "bg-[#173B35]" : "bg-[#9A958B]";
  const shell = active ? "bg-[#EEF5F1]" : "bg-transparent";

  if (type === "browse") {
    return (
      <span className={`relative flex h-9 w-9 items-end justify-center rounded-full ${shell}`} aria-hidden="true">
        <span className={`absolute bottom-2.5 h-3.5 w-4 rounded-[5px] ${color}`} />
        <span className={`absolute bottom-4.5 h-3 w-3 rotate-45 rounded-[3px] ${color}`} />
        <span className="absolute bottom-3 h-2 w-1.5 rounded-t-full bg-white/90" />
      </span>
    );
  }

  return (
    <span className={`relative flex h-9 w-9 items-center justify-center rounded-full ${shell}`} aria-hidden="true">
      <span className={`absolute left-2.5 top-2.5 h-4 w-2 rounded-full ${color}`} />
      <span className={`absolute bottom-2.5 right-2.5 h-4 w-2 rounded-full ${color}`} />
      <span className="absolute h-0.5 w-4 -rotate-12 rounded-full bg-white/90" />
    </span>
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
      <p className="text-xs font-bold text-[#6F766F]">{label}</p>
      <p className={`mt-0.5 break-words font-semibold tabular-nums ${danger ? "text-[#B42318]" : "text-[#1F2A24]"}`}>
        {value}
      </p>
    </div>
  );
}

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const styles = {
    안정: "bg-[#EEF5F1] text-[#173B35]",
    주의: "bg-[#EEF3E8] text-[#566A4B]",
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
      ? "border-[#D7E4DC] bg-[#EEF5F1] text-[#173B35]"
      : value === "가격 조정"
        ? "border-[#CBD9C2] bg-[#EEF3E8] text-[#566A4B]"
        : "border-[#FCA5A5] bg-[#FEE2E2] text-[#B42318]";
  return (
    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      {value}
    </span>
  );
}
