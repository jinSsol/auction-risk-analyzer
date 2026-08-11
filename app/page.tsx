"use client";

import { useEffect, useMemo, useState } from "react";

import { items } from "./auction-data";
import { analyze, percent, uk, type AnalyzedItem } from "./lib/auction-analysis";
import { mergeAuctionItems } from "./lib/auction-merge";
import { loadUserAuctionItems, type UserAuctionItem } from "./lib/auction-storage";
import type { PropertyType, RiskLevel, SaleChannel } from "./lib/auction-types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<SaleChannel | "전체">("전체");
  const [type, setType] = useState<PropertyType | "전체">("전체");
  const [level, setLevel] = useState<RiskLevel | "전체">("전체");
  const [bidRatio, setBidRatio] = useState(78);
  const [bufferRatio, setBufferRatio] = useState(4);
  const [userItems, setUserItems] = useState<UserAuctionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "sample-4",
    "sample-6",
    "sample-7",
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUserItems(loadUserAuctionItems());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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
      item.agency.includes(query);
    const matchChannel = channel === "전체" || item.channel === channel;
    const matchType = type === "전체" || item.type === type;
    const matchLevel = level === "전체" || item.analysis.level === level;
    return matchQuery && matchChannel && matchType && matchLevel;
  });

  const selected = enriched.filter((item) => selectedIds.includes(item.id));
  const stats = {
    total: filtered.length,
    auction: filtered.filter((item) => item.channel === "경매").length,
    publicSale: filtered.filter((item) => item.channel === "공매").length,
    stable: filtered.filter((item) => item.analysis.level === "안정").length,
    caution: filtered.filter((item) => item.analysis.level === "주의").length,
    risky: filtered.filter((item) => item.analysis.level === "위험").length,
  };

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id].slice(-4)
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#17211d]">
      <section className="border-b border-[#dde7e2] bg-[#fbfdfb]">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full bg-[#e9fbf0] px-3 py-1 text-sm font-black text-[#1b7a4d]">
                첫 경매·공매 탐색 보드
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-normal text-[#101b17] md:text-4xl">
                처음 봐도 가볍게 고르고, 중요한 체크만 빠르게 보세요.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#5c6963] md:text-base">
                지금은 실시간 연동 전 샘플 데이터입니다. 어려운 권리 용어는
                체크리스트로 풀고, 시세·인수금·안전마진은 한눈에 비교합니다.
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

      <section className="border-b border-[#dde7e2] bg-white/90">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-4 lg:grid-cols-[minmax(240px,1fr)_auto_auto_auto] lg:items-end lg:px-8">
          <div>
            <label className="text-xs font-bold text-[#5c6963]">
              검색
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="판교, 온비드, 2025타경, 빌라"
              className="mt-1 h-11 w-full rounded-md border border-[#cad8d1] bg-[#fbfdfb] px-3 text-sm outline-none transition focus:border-[#22a06b] focus:ring-2 focus:ring-[#a7f3c5]"
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

      <section className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
        <div className="space-y-5">
          <div className="grid gap-3 rounded-lg border border-[#dde7e2] bg-white p-4 shadow-sm shadow-[#1a2d2410] md:grid-cols-[1fr_1fr_auto] md:items-center">
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
            <div className="rounded-md bg-[#18231f] px-4 py-3 text-sm text-white">
              <p className="font-bold">계산 기준</p>
              <p className="mt-1 text-[#d9eee5]">
                시세 할인 - 인수금 - 비용 버퍼
              </p>
            </div>
          </div>

          <div className="grid gap-3">
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
              <div className="rounded-lg border border-[#dde7e2] bg-white p-8 text-center text-sm font-semibold text-[#68756f]">
                조건에 맞는 샘플 물건이 없습니다.
              </div>
            ) : null}
          </div>

          <ComparePanel selected={selected} onClear={() => setSelectedIds([])} />
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
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-white text-[#17211d]",
    green: "bg-[#e9fbf0] text-[#1b7a4d]",
    blue: "bg-[#eaf5ff] text-[#2563a8]",
    amber: "bg-[#fff7da] text-[#916100]",
    red: "bg-[#fff0ec] text-[#c2412d]",
  };
  return (
    <div className={`rounded-lg border border-white p-4 shadow-sm shadow-[#1a2d2410] ${tones[tone]}`}>
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
      <div className="mt-1 flex min-h-11 flex-wrap gap-1.5 rounded-md border border-[#dde7e2] bg-[#f6faf8] p-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`min-w-14 rounded px-3 py-2 text-sm font-bold transition ${
              value === option
                ? "bg-[#17211d] text-white"
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
              ? "bg-[#e9fbf0] text-[#1b7a4d]"
              : "bg-[#fff7da] text-[#916100]"
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
          tone === "green" ? "accent-[#22a06b]" : "accent-[#f5a524]"
        }`}
      />
    </div>
  );
}

function ChannelBadge({ channel }: { channel: SaleChannel }) {
  const style =
    channel === "경매"
      ? "bg-[#e9fbf0] text-[#1b7a4d]"
      : "bg-[#eaf5ff] text-[#2563a8]";
  return (
    <span className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-bold ${style}`}>
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
  const gapToSuggested = item.analysis.suggested - item.analysis.plannedBid;

  return (
    <article className="rounded-lg border border-[#dde7e2] bg-white p-4 shadow-sm transition hover:border-[#9edcc0] hover:shadow-md">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <a href={href} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={item.channel} />
            <span className="rounded-md bg-[#f3f5f2] px-2 py-0.5 text-xs font-bold text-[#65706b]">
              {item.agency}
            </span>
            <span className="text-xs font-semibold text-[#68756f]">
              {item.caseNo}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-[#17211d]">
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
        </a>

        <div className="space-y-3">
          <div className="rounded-lg bg-[#f6faf8] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#68756f]">체크 난이도</span>
              <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
            </div>
            <RiskMeter level={item.analysis.level} score={item.analysis.risk} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`text-xs font-bold ${
                gapToSuggested >= 0 ? "text-[#1b7a4d]" : "text-[#c2412d]"
              }`}
            >
              현재 예상가가 상한보다 {uk(Math.abs(gapToSuggested))}
              {gapToSuggested >= 0 ? " 낮음" : " 높음"}
            </span>
            <button
              onClick={onToggle}
              className={`h-9 rounded-md px-3 text-sm font-black transition ${
                selected
                  ? "bg-[#17211d] text-white"
                  : "border border-[#cad8d1] bg-white text-[#44504b] hover:bg-[#f6faf8]"
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
    <div className="min-w-0 rounded-md border border-[#e3ece7] bg-[#fbfdfb] p-3">
      <p className="text-xs font-bold text-[#6b746f]">{label}</p>
      <p
        className={`mt-1 truncate text-base font-black ${
          danger
            ? "text-[#c2412d]"
            : strong
              ? "text-[#1b7a4d]"
              : "text-[#17211d]"
        }`}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs font-bold text-[#77817c]">{sub}</p> : null}
    </div>
  );
}

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#ff6b57]" : level === "주의" ? "bg-[#f5a524]" : "bg-[#22a06b]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe8e3]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function ComparePanel({
  selected,
  onClear,
}: {
  selected: AnalyzedItem[];
  onClear: () => void;
}) {
  return (
    <section className="rounded-lg border border-[#dde7e2] bg-white p-4 shadow-sm shadow-[#1a2d2410]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#17211d]">비교 바구니</h2>
          <p className="text-sm text-[#68756f]">
            총투입금과 안전마진이 낮은 물건을 먼저 제외하기 좋습니다.
          </p>
        </div>
        <button
          onClick={onClear}
          className="h-9 rounded-md border border-[#cad8d1] px-3 text-sm font-bold text-[#44504b] transition hover:bg-[#f6faf8]"
        >
          선택 비우기
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {selected.length === 0 ? (
          <div className="rounded-md bg-[#f6faf8] p-5 text-center text-sm font-bold text-[#68756f] md:col-span-3">
            비교할 물건을 선택하세요.
          </div>
        ) : (
          selected.map((item) => (
            <div key={item.id} className="rounded-md border border-[#e3ece7] bg-[#fbfdfb] p-4">
              <div className="flex items-center justify-between gap-2">
                <ChannelBadge channel={item.channel} />
                <Verdict value={item.analysis.verdict} />
              </div>
              <h3 className="mt-3 text-sm font-black text-[#17211d]">{item.title}</h3>
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
      <p className={`mt-0.5 font-black ${danger ? "text-[#c2412d]" : "text-[#17211d]"}`}>
        {value}
      </p>
    </div>
  );
}

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const styles = {
    안정: "bg-[#e9fbf0] text-[#1b7a4d]",
    주의: "bg-[#fff7da] text-[#916100]",
    위험: "bg-[#fff0ec] text-[#c2412d]",
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
      ? "border-[#bdf2d1] bg-[#e9fbf0] text-[#1b7a4d]"
      : value === "가격 조정"
        ? "border-[#ffe08a] bg-[#fff7da] text-[#916100]"
        : "border-[#ffc8bd] bg-[#fff0ec] text-[#c2412d]";
  return (
    <span className={`inline-flex w-fit rounded-md border px-2.5 py-1 text-xs font-bold ${style}`}>
      {value}
    </span>
  );
}
