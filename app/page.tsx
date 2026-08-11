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
  const [owner, setOwner] = useState<"전체" | "내 물건" | "샘플">("전체");
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

  const selected = enriched.filter((item) => selectedIds.includes(item.id));
  const stats = {
    total: filtered.length,
    auction: filtered.filter((item) => item.channel === "경매").length,
    publicSale: filtered.filter((item) => item.channel === "공매").length,
    stable: filtered.filter((item) => item.analysis.level === "안정").length,
    caution: filtered.filter((item) => item.analysis.level === "주의").length,
    risky: filtered.filter((item) => item.analysis.level === "위험").length,
    mine: filtered.filter((item) => item.id.startsWith("user-")).length,
  };

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id].slice(-4)
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8F7] text-[#17211D]">
      <section className="border-b border-[#DDE5E1] bg-[#F6F8F7]">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full bg-[#E7F6EE] px-3 py-1 text-xs font-semibold text-[#1F8A5B]">
                권리 리스크 · 입찰가 분석
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-[#17211D] md:text-5xl">
                경매·공매 물건의 권리 리스크와 입찰 상한을 한 화면에서 비교하세요.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#66736D]">
                지금은 실시간 연동 전 샘플 데이터입니다. 어려운 권리 용어는
                체크리스트로 풀고, 시세·인수금·안전마진은 한눈에 비교합니다.
              </p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/properties/new"
                className="mt-5 inline-flex h-11 items-center rounded-lg bg-[#17211D] px-4 text-sm font-semibold text-white transition hover:bg-[#26332E]"
              >
                새 물건 등록
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

      <section className="sticky top-0 z-10 border-b border-[#DDE5E1] bg-white/85 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-3 xl:grid-cols-[minmax(280px,1fr)_auto_auto_auto_auto] xl:items-end xl:px-8">
          <div>
            <label className="text-xs font-semibold text-[#66736D]">
              검색
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="판교, 온비드, 2025타경, 빌라"
              className="mt-1 h-10 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 text-sm font-medium text-[#17211D] outline-none transition placeholder:text-[#9AA6A0] focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#D8F1E4]"
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
          <InlineFilter
            title="구분"
            options={["전체", "내 물건", "샘플"]}
            value={owner}
            onChange={(value) => setOwner(value as "전체" | "내 물건" | "샘플")}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
        <div className="space-y-5">
          <div className="grid gap-3 rounded-xl border border-[#DDE5E1] bg-white p-4 shadow-[0_1px_2px_rgba(23,33,29,0.05)] md:grid-cols-[1fr_1fr_auto] md:items-center">
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
            <div className="rounded-lg bg-[#17211D] px-4 py-3 text-sm text-white">
              <p className="font-semibold">계산 기준</p>
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
              <div className="rounded-lg border border-[#DDE5E1] bg-white p-8 text-center text-sm font-semibold text-[#66736D]">
                조건에 맞는 물건이 없습니다.
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
    neutral: "bg-white text-[#17211D]",
    green: "bg-[#E7F6EE] text-[#1F8A5B]",
    blue: "bg-[#E7F0FF] text-[#255C99]",
    amber: "bg-[#FFF4D7] text-[#8A5B00]",
    red: "bg-[#FDE8E5] text-[#B53A2E]",
  };
  return (
    <div className={`rounded-xl border border-[#DDE5E1] p-4 shadow-[0_1px_2px_rgba(23,33,29,0.05)] ${tones[tone]}`}>
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
      <p className="text-xs font-semibold text-[#66736D]">{title}</p>
      <div className="mt-1 flex min-h-10 flex-wrap gap-1 rounded-lg border border-[#DDE5E1] bg-[#EEF3F1] p-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`min-w-14 rounded-md px-3 py-1.5 text-sm transition ${
              value === option
                ? "bg-white font-semibold text-[#17211D] shadow-[0_1px_2px_rgba(23,33,29,0.08)]"
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
  const gapToSuggested = item.analysis.suggested - item.analysis.plannedBid;

  return (
    <article className="rounded-xl border border-[#DDE5E1] bg-white p-4 shadow-[0_1px_2px_rgba(23,33,29,0.05)] transition hover:border-[#B8C7C0] hover:shadow-[0_8px_24px_rgba(23,33,29,0.08)]">
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
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#17211D]">
                {item.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-[#66736D]">
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
          <div className="rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#66736D]">체크 난이도</span>
              <RiskBadge level={item.analysis.level} score={item.analysis.risk} />
            </div>
            <RiskMeter level={item.analysis.level} score={item.analysis.risk} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`text-xs font-bold ${
                gapToSuggested >= 0 ? "text-[#1F8A5B]" : "text-[#B53A2E]"
              }`}
            >
              현재 예상가가 상한보다 {uk(Math.abs(gapToSuggested))}
              {gapToSuggested >= 0 ? " 낮음" : " 높음"}
            </span>
            <button
              onClick={onToggle}
              className={`h-9 rounded-lg px-3 text-sm transition ${
                selected
                  ? "bg-[#0F766E] font-semibold text-white"
                  : "border border-[#DDE5E1] bg-white font-semibold text-[#34423C] hover:border-[#1F8A5B] hover:text-[#1F8A5B]"
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
    <div className="min-w-0 rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3">
      <p className="text-xs font-semibold text-[#66736D]">{label}</p>
      <p
        className={`mt-1 truncate text-base font-semibold tabular-nums ${
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
    <section className="rounded-xl border border-[#DDE5E1] bg-white p-4 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#17211D]">비교 바구니</h2>
          <p className="text-sm text-[#66736D]">
            총투입금과 안전마진이 낮은 물건을 먼저 제외하기 좋습니다.
          </p>
        </div>
        <button
          onClick={onClear}
          className="h-9 rounded-lg border border-[#DDE5E1] bg-white px-3 text-sm font-semibold text-[#34423C] transition hover:bg-[#F9FBFA]"
        >
          선택 비우기
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {selected.length === 0 ? (
          <div className="rounded-lg bg-[#F9FBFA] p-5 text-center text-sm font-medium text-[#66736D] md:col-span-3">
            비교할 물건을 선택하세요.
          </div>
        ) : (
          selected.map((item) => (
            <div key={item.id} className="rounded-lg border border-[#E5ECE8] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <ChannelBadge channel={item.channel} />
                <Verdict value={item.analysis.verdict} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[#17211D]">{item.title}</h3>
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
      <p className="text-xs font-bold text-[#66736D]">{label}</p>
      <p className={`mt-0.5 font-semibold tabular-nums ${danger ? "text-[#B53A2E]" : "text-[#17211D]"}`}>
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
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[level]}`}>
      {level} · {score}점
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
