"use client";

import { useEffect, useMemo, useState } from "react";

import { items } from "../../auction-data";
import { analyze, percent, uk } from "../../lib/auction-analysis";
import { mergeAuctionItems } from "../../lib/auction-merge";
import { deleteUserAuctionItem, loadUserAuctionItems, saveUserAuctionItems, type UserAuctionItem } from "../../lib/auction-storage";
import type { RiskLevel, SaleChannel } from "../../lib/auction-types";

export function PropertyDetailClient({ id }: { id: string }) {
  const [userItems, setUserItems] = useState<UserAuctionItem[]>([]);
  const [loaded, setLoaded] = useState(!id.startsWith("user-"));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loadedItems = loadUserAuctionItems();
      setUserItems(loadedItems);
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const mergedItems = useMemo(
    () => mergeAuctionItems(items, userItems),
    [userItems]
  );
  const item = mergedItems.find((candidate) => candidate.id === id);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#F6F8F7] px-5 py-8 text-[#17211D]">
        <div className="mx-auto max-w-3xl rounded-xl border border-[#DDE5E1] bg-white p-6 text-sm font-medium text-[#66736D] shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
          저장된 물건을 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-[#F6F8F7] px-5 py-8 text-[#17211D]">
        <div className="mx-auto max-w-3xl rounded-xl border border-[#DDE5E1] bg-white p-6 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="text-sm font-semibold text-[#1F8A5B]">
            목록으로
          </a>
          <h1 className="mt-4 text-2xl font-semibold">물건을 찾을 수 없습니다.</h1>
          <p className="mt-2 text-sm leading-6 text-[#66736D]">
            직접 등록한 물건은 이 브라우저에 저장됩니다. 다른 기기나 브라우저에서는
            다시 등록해야 보일 수 있습니다.
          </p>
        </div>
      </main>
    );
  }

  const isUserItem = item.id.startsWith("user-");

  function deleteCurrentItem() {
    if (!isUserItem) return;
    const ok = window.confirm("이 물건을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.");
    if (!ok) return;

    const nextItems = deleteUserAuctionItem(userItems, item.id);
    saveUserAuctionItems(nextItems);
    window.location.assign("/");
  }

  const analysis = analyze(item, 78, 4);
  const acquisitionCosts = Math.round(analysis.plannedBid * 0.035);
  const repairReserve = Math.round(item.market * 0.04);
  const totalWithBuffer = analysis.allIn + acquisitionCosts + repairReserve;

  return (
    <main className="min-h-screen bg-[#F6F8F7] text-[#17211D]">
      <section className="border-b border-[#DDE5E1] bg-[#F6F8F7]">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
            className="inline-flex rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm font-semibold text-[#34423C] transition hover:bg-[#F9FBFA]"
            >
              목록으로
            </a>
            {isUserItem ? (
              <div className="flex gap-2">
                <a
                  href={`/properties/${item.id}/edit`}
                  className="inline-flex rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm font-semibold text-[#34423C] transition hover:bg-[#F9FBFA]"
                >
                  수정
                </a>
                <button
                  onClick={deleteCurrentItem}
                  className="rounded-lg border border-[#F2B8AE] bg-[#FDE8E5] px-3 py-2 text-sm font-semibold text-[#B53A2E] transition hover:bg-[#FBD6CF]"
                >
                  삭제
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <ChannelBadge channel={item.channel} />
                {isUserItem ? (
                  <span className="rounded-full bg-[#EEF3F1] px-2.5 py-1 text-xs font-semibold text-[#34423C]">
                    내 물건
                  </span>
                ) : null}
                <span className="rounded-full bg-[#EEF3F1] px-2.5 py-1 text-xs font-semibold text-[#34423C]">
                  {item.agency}
                </span>
                <span className="text-xs font-medium text-[#66736D]">
                  {item.caseNo}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-[#17211D] md:text-5xl">
                {item.title}
              </h1>
              <p className="mt-3 text-sm font-medium leading-6 text-[#66736D] md:text-base">
                {item.district} · {item.area || "면적 확인 필요"}㎡ · {item.floor} · 마감 {item.auctionDate}
              </p>
            </div>

            <div className="rounded-xl border border-[#BFE3D0] bg-white p-5 shadow-[0_8px_24px_rgba(31,138,91,0.08)]">
              <p className="text-xs font-semibold text-[#1F8A5B]">분석 요약</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <Verdict value={analysis.verdict} />
                <RiskBadge level={analysis.level} score={analysis.risk} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="text-sm font-medium text-[#34423C]">추천 상한가</span>
                <span className="text-3xl font-semibold tabular-nums text-[#17211D]">
                  {uk(analysis.suggested)}
                </span>
              </div>
              <RiskMeter level={analysis.level} score={analysis.risk} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-5">
          <section className="rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">가격 한눈에 보기</h2>
                <p className="mt-1 text-sm text-[#66736D]">
                  현재 계산은 시세의 78%, 비용 버퍼 4% 기준입니다.
                </p>
              </div>
              <span className="rounded-full bg-[#E7F0FF] px-3 py-1 text-sm font-semibold text-[#255C99]">
                최저가 / 시세 {percent(analysis.marketRatio)}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Info label="예상 시세" value={uk(item.market)} />
              <Info label="최저가" value={uk(item.minimum)} />
              <Info label="예상 입찰" value={uk(analysis.plannedBid)} />
              <Info label="총투입 예상" value={uk(totalWithBuffer)} />
            </div>
          </section>

          <section className="rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
            <h2 className="text-xl font-semibold">입찰 전 체크리스트</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CheckCard title="임차인 상태" value={item.tenant} />
              <CheckCard title="선순위 보증금" value={uk(item.seniorDeposit)} />
              <CheckCard title="인수 추정액" value={uk(item.takeoverAmount)} />
              <CheckCard title="점유·명도" value={item.occupancy} />
              <CheckCard title="유치권" value={item.liens ? "신고 있음" : "신고 없음"} />
              <CheckCard title="위반건축물" value={item.illegalBuilding ? "확인 필요" : "특이사항 없음"} />
            </div>
          </section>

          <section className="rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
            <h2 className="text-xl font-semibold">조심해서 볼 포인트</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.flags.length === 0 ? (
                <span className="rounded-full bg-[#E7F6EE] px-3 py-1.5 text-sm font-semibold text-[#1F8A5B]">
                  큰 체크 포인트 없음
                </span>
              ) : (
                analysis.flags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-full bg-[#FFF4D7] px-3 py-1.5 text-sm font-semibold text-[#8A5B00]"
                  >
                    {flag}
                  </span>
                ))
              )}
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#66736D]">
              {item.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
            <h2 className="text-lg font-semibold">주소 정보</h2>
            <p className="mt-3 rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3 text-sm font-medium leading-6 text-[#34423C]">
              {item.address}
            </p>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-lg border border-[#DDE5E1] px-3 py-2 text-sm font-semibold text-[#34423C] transition hover:bg-[#F9FBFA]"
              >
                원문 보기
              </a>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-[#66736D]">
              실제 서비스에서는 목록에는 동네·단지 중심으로 보여주고, 상세에서
              원문 기준 주소와 첨부 문서를 확인하는 흐름이 좋습니다.
            </p>
          </section>

          {item.userMemo ? (
            <section className="rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
              <h2 className="text-lg font-semibold">내 메모</h2>
              <p className="mt-3 whitespace-pre-wrap rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3 text-sm font-medium leading-6 text-[#34423C]">
                {item.userMemo}
              </p>
            </section>
          ) : null}

          <section className="rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
            <h2 className="text-lg font-semibold">총투입 비용</h2>
            <div className="mt-4 space-y-3">
              <MiniLine label="입찰가" value={uk(analysis.plannedBid)} />
              <MiniLine label="인수금" value={uk(item.takeoverAmount)} />
              <MiniLine label="취득 비용 추정" value={uk(acquisitionCosts)} />
              <MiniLine label="수리·명도 버퍼" value={uk(repairReserve)} />
              <div className="border-t border-[#E5ECE8] pt-3">
                <MiniLine label="총투입 예상" value={uk(totalWithBuffer)} strong />
              </div>
            </div>
          </section>
        </aside>
      </section>
    </main>
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

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#DC2626]" : level === "주의" ? "bg-[#B7791F]" : "bg-[#1F8A5B]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#17211D24]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-4">
      <p className="text-xs font-semibold text-[#66736D]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[#17211D]">{value}</p>
    </div>
  );
}

function CheckCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-4">
      <p className="text-xs font-semibold text-[#66736D]">{title}</p>
      <p className="mt-1 font-semibold text-[#17211D]">{value}</p>
    </div>
  );
}

function MiniLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium text-[#66736D]">{label}</span>
      <span className={strong ? "text-lg font-semibold tabular-nums text-[#1F8A5B]" : "font-semibold tabular-nums text-[#17211D]"}>
        {value}
      </span>
    </div>
  );
}
