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
      <main className="min-h-screen bg-[#f7f3ea] px-5 py-8 text-[#181713]">
        <div className="mx-auto max-w-3xl rounded-lg border border-[#d8cfbf] bg-white p-6 text-sm font-bold text-[#6f695f]">
          저장된 물건을 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-5 py-8 text-[#181713]">
        <div className="mx-auto max-w-3xl rounded-lg border border-[#d8cfbf] bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="text-sm font-black text-[#13663d]">
            목록으로
          </a>
          <h1 className="mt-4 text-2xl font-black">물건을 찾을 수 없습니다.</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#6f695f]">
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
    <main className="min-h-screen bg-[#f7f3ea] text-[#181713]">
      <section className="border-b border-[#ded7c9] bg-[#f7f3ea]">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex rounded-md border border-[#181713] bg-white px-3 py-2 text-sm font-black text-[#4f493f] shadow-[3px_3px_0_#d7ff6f] transition hover:-translate-y-0.5"
            >
              목록으로
            </a>
            {isUserItem ? (
              <div className="flex gap-2">
                <a
                  href={`/properties/${item.id}/edit`}
                  className="inline-flex rounded-md border border-[#cfc6b8] bg-white px-3 py-2 text-sm font-black text-[#4f493f] transition hover:bg-[#fffaf1]"
                >
                  수정
                </a>
                <button
                  onClick={deleteCurrentItem}
                  className="rounded-md border border-[#ffc2b6] bg-[#ffe0d5] px-3 py-2 text-sm font-black text-[#b83a24] transition hover:bg-[#ffd2c5]"
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
                  <span className="rounded-md bg-[#181713] px-2 py-0.5 text-xs font-bold text-white">
                    내 물건
                  </span>
                ) : null}
                <span className="rounded-md bg-[#f3eadb] px-2 py-0.5 text-xs font-bold text-[#6a6258]">
                  {item.agency}
                </span>
                <span className="text-xs font-bold text-[#6f695f]">
                  {item.caseNo}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-normal text-[#181713] md:text-5xl">
                {item.title}
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#625f56] md:text-base">
                {item.district} · {item.area || "면적 확인 필요"}㎡ · {item.floor} · 마감 {item.auctionDate}
              </p>
            </div>

            <div className="rounded-lg border border-[#181713] bg-[#d7ff6f] p-4 shadow-[5px_5px_0_#181713]">
              <p className="text-xs font-black text-[#181713]">가볍게 보는 결론</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <Verdict value={analysis.verdict} />
                <RiskBadge level={analysis.level} score={analysis.risk} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="text-sm font-bold text-[#29332f]">추천 상한가</span>
                <span className="text-3xl font-black text-[#181713]">
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
          <section className="rounded-lg border border-[#d8cfbf] bg-white p-5 shadow-sm shadow-[#18171310]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">가격 한눈에 보기</h2>
                <p className="mt-1 text-sm font-semibold text-[#6f695f]">
                  현재 계산은 시세의 78%, 비용 버퍼 4% 기준입니다.
                </p>
              </div>
              <span className="rounded-full bg-[#dff4ff] px-3 py-1 text-sm font-black text-[#176785]">
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

          <section className="rounded-lg border border-[#d8cfbf] bg-white p-5 shadow-sm shadow-[#18171310]">
            <h2 className="text-xl font-black">입찰 전 체크리스트</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CheckCard title="임차인 상태" value={item.tenant} />
              <CheckCard title="선순위 보증금" value={uk(item.seniorDeposit)} />
              <CheckCard title="인수 추정액" value={uk(item.takeoverAmount)} />
              <CheckCard title="점유·명도" value={item.occupancy} />
              <CheckCard title="유치권" value={item.liens ? "신고 있음" : "신고 없음"} />
              <CheckCard title="위반건축물" value={item.illegalBuilding ? "확인 필요" : "특이사항 없음"} />
            </div>
          </section>

          <section className="rounded-lg border border-[#d8cfbf] bg-white p-5 shadow-sm shadow-[#18171310]">
            <h2 className="text-xl font-black">조심해서 볼 포인트</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.flags.length === 0 ? (
                <span className="rounded-md bg-[#dffbe8] px-3 py-1.5 text-sm font-black text-[#13663d]">
                  큰 체크 포인트 없음
                </span>
              ) : (
                analysis.flags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-md bg-[#fff1bd] px-3 py-1.5 text-sm font-black text-[#80620a]"
                  >
                    {flag}
                  </span>
                ))
              )}
            </div>
            <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-[#6f695f]">
              {item.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#d8cfbf] bg-white p-5 shadow-sm shadow-[#18171310]">
            <h2 className="text-lg font-black">주소 정보</h2>
            <p className="mt-3 rounded-md bg-[#fffaf1] p-3 text-sm font-bold leading-6 text-[#4f493f]">
              {item.address}
            </p>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-md border border-[#cfc6b8] px-3 py-2 text-sm font-black text-[#4f493f] transition hover:bg-[#fffaf1]"
              >
                원문 보기
              </a>
            ) : null}
            <p className="mt-3 text-xs font-semibold leading-5 text-[#6f695f]">
              실제 서비스에서는 목록에는 동네·단지 중심으로 보여주고, 상세에서
              원문 기준 주소와 첨부 문서를 확인하는 흐름이 좋습니다.
            </p>
          </section>

          {item.userMemo ? (
            <section className="rounded-lg border border-[#d8cfbf] bg-white p-5 shadow-sm shadow-[#18171310]">
              <h2 className="text-lg font-black">내 메모</h2>
              <p className="mt-3 whitespace-pre-wrap rounded-md bg-[#fffaf1] p-3 text-sm font-bold leading-6 text-[#4f493f]">
                {item.userMemo}
              </p>
            </section>
          ) : null}

          <section className="rounded-lg border border-[#d8cfbf] bg-white p-5 shadow-sm shadow-[#18171310]">
            <h2 className="text-lg font-black">비용 감 잡기</h2>
            <div className="mt-4 space-y-3">
              <MiniLine label="입찰가" value={uk(analysis.plannedBid)} />
              <MiniLine label="인수금" value={uk(item.takeoverAmount)} />
              <MiniLine label="취득 비용 추정" value={uk(acquisitionCosts)} />
              <MiniLine label="수리·명도 버퍼" value={uk(repairReserve)} />
              <div className="border-t border-[#eee2d1] pt-3">
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
      ? "bg-[#dffbe8] text-[#13663d]"
      : "bg-[#dff4ff] text-[#176785]";
  return (
    <span className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-bold ${style}`}>
      {channel}
    </span>
  );
}

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const styles = {
    안정: "bg-white text-[#13663d]",
    주의: "bg-white text-[#80620a]",
    위험: "bg-white text-[#b83a24]",
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
      ? "border-[#b8f3c8] bg-white text-[#13663d]"
      : value === "가격 조정"
        ? "border-[#ffd979] bg-white text-[#80620a]"
        : "border-[#ffc2b6] bg-white text-[#b83a24]";
  return (
    <span className={`inline-flex w-fit rounded-md border px-2.5 py-1 text-xs font-bold ${style}`}>
      {value}
    </span>
  );
}

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#ff6f61]" : level === "주의" ? "bg-[#ffb84d]" : "bg-[#00a86b]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#18171324]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#eee2d1] bg-[#fffaf1] p-4">
      <p className="text-xs font-bold text-[#70685d]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#181713]">{value}</p>
    </div>
  );
}

function CheckCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-[#eee2d1] bg-[#fffaf1] p-4">
      <p className="text-xs font-bold text-[#70685d]">{title}</p>
      <p className="mt-1 font-black text-[#181713]">{value}</p>
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
      <span className="font-bold text-[#6f695f]">{label}</span>
      <span className={strong ? "text-lg font-black text-[#13663d]" : "font-black text-[#181713]"}>
        {value}
      </span>
    </div>
  );
}
