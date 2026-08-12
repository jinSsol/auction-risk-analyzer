"use client";

import { useEffect, useMemo, useState } from "react";

import { items } from "../../auction-data";
import { analyze, analyzeComparableSales, percent, uk } from "../../lib/auction-analysis";
import { mergeAuctionItems } from "../../lib/auction-merge";
import { deleteUserAuctionItem, loadUserAuctionItems, saveUserAuctionItems, type UserAuctionItem } from "../../lib/auction-storage";
import {
  RIGHTS_CHECKLIST_ITEMS,
  summarizeRightsChecklist,
} from "../../lib/rights-checklist";
import type { AuctionItem, RightsChecklistAnswer, RiskLevel, SaleChannel } from "../../lib/auction-types";

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
    const ok = window.confirm(
      "이 브라우저에 저장된 물건을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다."
    );
    if (!ok) return;

    const nextItems = deleteUserAuctionItem(userItems, item.id);
    saveUserAuctionItems(nextItems);
    window.location.assign("/");
  }

  const analysis = analyze(item, 78, 4);
  const comparableAnalysis = analyzeComparableSales(item);
  const rightsSummary = summarizeRightsChecklist(item.rightsChecklist);
  const priceSignal = getPriceSignal(item, analysis, comparableAnalysis.verdict);
  const bidHeadroom = analysis.suggested - analysis.plannedBid;
  const coreRiskReasons = analysis.riskFactors
    .filter((factor) => factor.severity === "danger")
    .concat(analysis.riskFactors.filter((factor) => factor.severity !== "danger"))
    .slice(0, 3);
  const statusLabels = detailStatusLabels(item, rightsSummary.unknownCount);

  return (
    <main className="app-shell min-h-screen text-[#17211D]">
      <section className="hero-surface border-b border-[#DDE5E1]">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="button-lift inline-flex rounded-lg border border-[#DDE5E1] bg-white/85 px-3 py-2 text-sm font-semibold text-[#34423C] backdrop-blur transition hover:bg-white"
            >
              목록으로
            </a>
            {isUserItem ? (
              <div className="flex gap-2">
                <a
                  href={`/properties/${item.id}/edit`}
                  className="button-lift inline-flex rounded-lg border border-[#DDE5E1] bg-white/85 px-3 py-2 text-sm font-semibold text-[#34423C] backdrop-blur transition hover:bg-white"
                >
                  수정
                </a>
                <button
                  onClick={deleteCurrentItem}
                  className="button-lift rounded-lg border border-[#F2B8AE] bg-[#FDE8E5] px-3 py-2 text-sm font-semibold text-[#B53A2E] transition hover:bg-[#FBD6CF]"
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
                {statusLabels.map((label) => (
                  <StatusBadge key={label} label={label} />
                ))}
                <span className="rounded-full bg-[#EEF3F1] px-2.5 py-1 text-xs font-semibold text-[#34423C]">
                  {item.agency}
                </span>
                <span className="text-xs font-medium text-[#66736D]">
                  {item.caseNo}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-[#17211D] md:text-5xl">
                {item.title}
              </h1>
              <p className="mt-3 text-sm font-medium leading-6 text-[#66736D] md:text-base">
                {item.district} · {item.area || "면적 확인 필요"}㎡ · {item.floor} · 마감 {item.auctionDate}
              </p>
            </div>

            <div className="interactive-card reveal-up relative overflow-hidden rounded-xl border border-[#BFE3D0] bg-white/92 p-5 shadow-[0_16px_36px_rgba(31,138,91,0.11)] backdrop-blur">
              <div className={`absolute inset-y-0 left-0 w-1 ${riskAccent[analysis.level]}`} />
              <p className="text-xs font-semibold text-[#1F8A5B]">분석 요약</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <Verdict value={analysis.verdict} />
                <RiskBadge level={analysis.level} score={analysis.risk} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="text-sm font-medium text-[#34423C]">검토 상한가</span>
                <span className="break-words text-2xl font-semibold tabular-nums text-[#17211D] sm:text-3xl">
                  {uk(analysis.suggested)}
                </span>
              </div>
              <RiskMeter level={analysis.level} score={analysis.risk} />
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-20 border-b border-[#DDE5E1] bg-white/90 px-5 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            ["#summary", "요약"],
            ["#price", "가격"],
            ["#rights", "권리"],
            ["#costs", "비용"],
            ["#memo", "메모"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-full border border-[#DDE5E1] bg-[#F9FBFA] px-3 py-2 text-sm font-semibold text-[#34423C] transition hover:border-[#1F8A5B] hover:text-[#1F8A5B]"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-5">
          <section id="summary" className="scroll-mt-20 interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#1F8A5B]">
                  5초 판단 요약
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  이 물건은 {getDecisionHeadline(analysis.verdict)}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#66736D]">
                  입력한 시세, 권리 체크, 비용 가정을 기준으로 정리한 참고 요약입니다.
                  최종 입찰 전 원문 서류와 전문가 확인이 필요합니다.
                </p>
              </div>
              <Verdict value={analysis.verdict} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DecisionStat
                label="위험도"
                value={analysis.level === "안정" ? "검토 쉬움" : analysis.level}
                helper={`${analysis.risk}점 · ${riskPlainText[analysis.level]}`}
                tone={analysis.level === "위험" ? "danger" : analysis.level === "주의" ? "caution" : "good"}
              />
              <DecisionStat
                label="가격 매력도"
                value={priceSignal.label}
                helper={priceSignal.helper}
                tone={priceSignal.tone}
              />
              <DecisionStat
                label="입찰 여유"
                value={bidHeadroom >= 0 ? `${uk(bidHeadroom)} 여유` : `${uk(Math.abs(bidHeadroom))} 초과`}
                helper={`검토 상한 ${uk(analysis.suggested)} 기준`}
                tone={bidHeadroom >= 0 ? "good" : "danger"}
              />
              <DecisionStat
                label="권리 확인"
                value={`${rightsSummary.completedCount}/${rightsSummary.totalCount} 완료`}
                helper={
                  rightsSummary.unknownCount > 0
                    ? `모름 ${rightsSummary.unknownCount}개 남음`
                    : "미확인 항목 없음"
                }
                tone={rightsSummary.unknownCount >= 4 ? "caution" : "good"}
              />
            </div>
            <div className="mt-5 rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-4">
              <p className="text-sm font-semibold text-[#17211D]">
                먼저 볼 핵심 리스크
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {coreRiskReasons.length === 0 ? (
                  <span className="rounded-full bg-[#E7F6EE] px-3 py-1.5 text-sm font-semibold text-[#1F8A5B]">
                    큰 체크 포인트 없음
                  </span>
                ) : (
                  coreRiskReasons.map((factor, index) => (
                    <span
                      key={`${factor.label}-${index}`}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                        factor.severity === "danger"
                          ? "bg-[#FDE8E5] text-[#B53A2E]"
                          : "bg-[#FFF4D7] text-[#8A5B00]"
                      }`}
                    >
                      {factor.label}
                    </span>
                  ))
                )}
              </div>
            </div>
          </section>

          <section id="price" className="scroll-mt-20 interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
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
              <Info label="총투입 예상" value={uk(analysis.allIn)} />
            </div>
          </section>

          <section className="interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">시세 근거</h2>
                <p className="mt-1 text-sm text-[#66736D]">
                  직접 입력한 비교 실거래로 예상 시세가 무리 없는지 확인합니다.
                </p>
              </div>
              <MarketVerdict value={comparableAnalysis.verdict} />
            </div>

            {comparableAnalysis.count === 0 ? (
              <div className="mt-5 rounded-lg border border-[#F3D083] bg-[#FFF4D7] p-4 text-sm leading-6 text-[#8A5B00]">
                시세 근거 부족: 가격 단계에서 비슷한 실거래를 1개 이상 입력하면
                평균가와 예상 시세 차이를 비교할 수 있습니다.
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Info label="비교 거래 수" value={`${comparableAnalysis.count}건`} />
                  <Info label="평균 거래가" value={uk(comparableAnalysis.average)} />
                  <Info
                    label="거래가 범위"
                    value={`${uk(comparableAnalysis.low)} ~ ${uk(comparableAnalysis.high)}`}
                  />
                  <Info
                    label="입력 시세 차이"
                    value={`${comparableAnalysis.marketGap >= 0 ? "+" : ""}${uk(comparableAnalysis.marketGap)}`}
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {(item.comparableSales ?? []).map((sale) => (
                    <ComparableSaleSummary key={sale.id} sale={sale} />
                  ))}
                </div>
              </>
            )}
          </section>

          <section id="rights" className="scroll-mt-20 interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
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

          <section className="interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">권리분석 질문</h2>
                <p className="mt-1 text-sm text-[#66736D]">
                  문서에서 확인한 답변 기준입니다. `모름`은 다음 단계에서 주의
                  신호로 다룰 예정입니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#E7F6EE] px-3 py-1 text-sm font-semibold text-[#1F8A5B]">
                  확인 {rightsSummary.completedCount}/{rightsSummary.totalCount}
                </span>
                <span className="rounded-full bg-[#FFF4D7] px-3 py-1 text-sm font-semibold text-[#8A5B00]">
                  모름 {rightsSummary.unknownCount}
                </span>
              </div>
            </div>

            {rightsSummary.unknownCount > 0 ? (
              <div className="mt-5 rounded-lg border border-[#F3D083] bg-[#FFF4D7] p-4">
                <p className="text-sm font-semibold text-[#8A5B00]">
                  아직 확인할 것
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rightsSummary.unknownItems.map((question) => (
                    <span
                      key={question.id}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#8A5B00]"
                    >
                      {question.group}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {RIGHTS_CHECKLIST_ITEMS.map((question) => (
                <RightsAnswerCard
                  key={question.id}
                  group={question.group}
                  question={question.question}
                  documentHint={question.documentHint}
                  answer={rightsSummary.answers[question.id]}
                />
              ))}
            </div>
          </section>

          <section className="interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
            <h2 className="text-xl font-semibold">조심해서 볼 포인트</h2>
            {analysis.expertTriggers.length > 0 ? (
              <div className="mt-4 rounded-lg border border-[#F2B8AE] bg-[#FDE8E5] p-4">
                <p className="text-sm font-semibold text-[#B53A2E]">
                  전문가 검토 권장
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.expertTriggers.map((trigger, index) => (
                    <span
                      key={`${trigger}-${index}`}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#B53A2E]"
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.flags.length === 0 ? (
                <span className="rounded-full bg-[#E7F6EE] px-3 py-1.5 text-sm font-semibold text-[#1F8A5B]">
                  큰 체크 포인트 없음
                </span>
              ) : (
                analysis.flags.map((flag, index) => (
                  <span
                    key={`${flag}-${index}`}
                    className="rounded-full bg-[#FFF4D7] px-3 py-1.5 text-sm font-semibold text-[#8A5B00]"
                  >
                    {flag}
                  </span>
                ))
              )}
            </div>
            {analysis.riskFactors.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {analysis.riskFactors.map((factor, index) => (
                  <RiskFactorCard
                    key={`${factor.label}-${factor.points}-${index}`}
                    label={factor.label}
                    points={factor.points}
                    severity={factor.severity}
                  />
                ))}
              </div>
            ) : null}
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#66736D]">
              {item.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

          <section id="costs" className="scroll-mt-20 interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">입찰 계산기</h2>
                <p className="mt-1 text-sm text-[#66736D]">
                  입찰가와 추가 비용을 합산해 넘지 말아야 할 금액을 계산합니다.
                </p>
              </div>
              <span className="rounded-full bg-[#E7F6EE] px-3 py-1 text-sm font-semibold text-[#1F8A5B]">
                목표 마진 {percent(analysis.desiredMarginRate)}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Info label="보수 상한" value={uk(analysis.conservativeBidCeiling)} />
              <Info label="넘지 말아야 할 금액" value={uk(analysis.doNotBidAbove)} />
              <Info label="총투입금" value={uk(analysis.allIn)} />
              <Info
                label="예상 마진"
                value={`${uk(analysis.margin)} · ${percent(analysis.marginRate)}`}
              />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <CostLine label="예상 입찰가" value={uk(analysis.plannedBid)} />
              <CostLine label="인수 추정액" value={uk(analysis.takeoverAmount)} />
              <CostLine label="취득세·수수료" value={uk(analysis.acquisitionTaxAndFees)} />
              <CostLine label="수리 예산" value={uk(analysis.repairBudget)} />
              <CostLine label="명도·이사 협의비" value={uk(analysis.evictionBudget)} />
              <CostLine label="체납·관리비 추정" value={uk(analysis.unpaidFees)} />
            </div>
          </section>

          <section id="memo" className="scroll-mt-20 interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)] lg:hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">메모와 확인 안내</h2>
                <p className="mt-1 text-sm leading-6 text-[#66736D]">
                  최종 판단 전에 원문 주소, 저장 방식, 확인 문서를 한 번 더 확인하세요.
                </p>
              </div>
              {isUserItem ? (
                <a
                  href={`/properties/${item.id}/edit`}
                  className="button-lift rounded-lg border border-[#DDE5E1] px-3 py-2 text-sm font-semibold text-[#34423C] transition hover:border-[#1F8A5B] hover:text-[#1F8A5B]"
                >
                  수정
                </a>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3">
              <GuidanceLine
                label="분석 보조"
                value="이 화면은 법률·투자 자문이 아니라 입력값을 정리해 보는 참고 도구입니다."
              />
              <GuidanceLine
                label="최종 문서"
                value="등기사항전부증명서, 매각물건명세서, 현황조사서, 공매 공고문 원문 확인이 필요합니다."
              />
              <GuidanceLine
                label="저장 방식"
                value="직접 등록한 물건과 비교 바구니는 현재 브라우저에만 저장됩니다."
              />
              <GuidanceLine
                label="처음 공유 전 확인"
                value="주소, 점유자, 선순위 권리, 체납/관리비, 공매 인도 조건은 앱 밖 원문과 현장 정보로 다시 확인하세요."
              />
            </div>
            <div className="mt-5 rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3">
              <p className="text-xs font-semibold text-[#66736D]">주소 정보</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#34423C]">
                {item.address}
              </p>
              {item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button-lift mt-3 inline-flex rounded-lg border border-[#DDE5E1] px-3 py-2 text-sm font-semibold text-[#34423C] transition hover:border-[#1F8A5B] hover:text-[#1F8A5B]"
                >
                  원문 보기
                </a>
              ) : null}
            </div>
            {item.userMemo ? (
              <p className="mt-5 whitespace-pre-wrap rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3 text-sm font-medium leading-6 text-[#34423C]">
                {item.userMemo}
              </p>
            ) : (
              <p className="mt-5 rounded-lg border border-dashed border-[#B8C7C0] bg-[#F9FBFA] p-3 text-sm font-medium leading-6 text-[#66736D]">
                아직 직접 남긴 메모가 없습니다.
              </p>
            )}
          </section>
        </div>

        <aside className="hidden space-y-5 lg:sticky lg:top-24 lg:block lg:self-start">
          <section className="interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
            <h2 className="text-lg font-semibold">확인 안내</h2>
            <div className="mt-4 space-y-3">
              <GuidanceLine
                label="분석 보조"
                value="이 화면은 법률·투자 자문이 아니라 입력값을 정리해 보는 참고 도구입니다."
              />
              <GuidanceLine
                label="최종 문서"
                value="입찰 전 등기사항전부증명서, 매각물건명세서, 현황조사서, 공매 공고문을 원문으로 확인하세요."
              />
              <GuidanceLine
                label="저장 방식"
                value="직접 등록한 물건과 비교 바구니는 현재 브라우저에만 저장됩니다."
              />
              <GuidanceLine
                label="처음 공유 전 확인"
                value="주소, 점유자, 선순위 권리, 체납/관리비, 공매 인도 조건은 앱 밖 원문과 현장 정보로 다시 확인하세요."
              />
            </div>
          </section>

          <section className="interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
            <h2 className="text-lg font-semibold">주소 정보</h2>
            <p className="mt-3 rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3 text-sm font-medium leading-6 text-[#34423C]">
              {item.address}
            </p>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="button-lift mt-3 inline-flex rounded-lg border border-[#DDE5E1] px-3 py-2 text-sm font-semibold text-[#34423C] transition hover:border-[#1F8A5B] hover:text-[#1F8A5B]"
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
            <section className="interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
              <h2 className="text-lg font-semibold">내 메모</h2>
              <p className="mt-3 whitespace-pre-wrap rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3 text-sm font-medium leading-6 text-[#34423C]">
                {item.userMemo}
              </p>
            </section>
          ) : null}

          <section className="interactive-card rounded-xl border border-[#DDE5E1] bg-white p-5 shadow-[0_1px_2px_rgba(23,33,29,0.05)] hover:shadow-[0_12px_30px_rgba(23,33,29,0.07)]">
            <h2 className="text-lg font-semibold">총투입 비용</h2>
            <div className="mt-4 space-y-3">
              <MiniLine label="입찰가" value={uk(analysis.plannedBid)} />
              <MiniLine label="인수금" value={uk(analysis.takeoverAmount)} />
              <MiniLine label="취득 비용" value={uk(analysis.acquisitionTaxAndFees)} />
              <MiniLine label="수리 예산" value={uk(analysis.repairBudget)} />
              <MiniLine label="명도·이사 비용" value={uk(analysis.evictionBudget)} />
              <MiniLine label="체납·관리비" value={uk(analysis.unpaidFees)} />
              <div className="border-t border-[#E5ECE8] pt-3">
                <MiniLine label="총투입 예상" value={uk(analysis.allIn)} strong />
              </div>
              <div className="border-t border-[#E5ECE8] pt-3">
                <MiniLine label="상한 기준" value={uk(analysis.doNotBidAbove)} />
                <MiniLine label="예상 마진" value={percent(analysis.marginRate)} strong />
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

function detailStatusLabels(item: AuctionItem, unknownCount: number) {
  const labels = [item.id.startsWith("user-") ? "직접 입력" : "샘플"];

  if (
    unknownCount > 0 ||
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
      ? "bg-[#FFF4D7] text-[#8A5B00]"
      : label === "직접 입력"
        ? "bg-[#EEF3F1] text-[#34423C]"
        : "bg-[#E7F0FF] text-[#255C99]";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
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

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#DC2626]" : level === "주의" ? "bg-[#B7791F]" : "bg-[#1F8A5B]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#17211D24]">
      <div className={`risk-fill h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

const riskAccent: Record<RiskLevel, string> = {
  안정: "bg-[#1F8A5B]",
  주의: "bg-[#B7791F]",
  위험: "bg-[#DC2626]",
};

const riskPlainText: Record<RiskLevel, string> = {
  안정: "확인할 변수가 비교적 적음",
  주의: "남은 확인 항목이 있음",
  위험: "전문가 확인이 필요한 신호가 있음",
};

type DecisionTone = "good" | "caution" | "danger" | "neutral";

function DecisionStat({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: DecisionTone;
}) {
  const styles: Record<DecisionTone, string> = {
    good: "border-[#BFE3D0] bg-[#E7F6EE] text-[#1F8A5B]",
    caution: "border-[#F3D083] bg-[#FFF4D7] text-[#8A5B00]",
    danger: "border-[#F2B8AE] bg-[#FDE8E5] text-[#B53A2E]",
    neutral: "border-[#DDE5E1] bg-[#F9FBFA] text-[#34423C]",
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[tone]}`}>
      <p className="text-xs font-semibold opacity-75">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium leading-5 opacity-80">{helper}</p>
    </div>
  );
}

function getDecisionHeadline(verdict: string) {
  if (verdict === "입찰 검토") return "입찰 검토 후보입니다";
  if (verdict === "가격 조정") return "가격을 낮춰 봐야 합니다";
  return "전문가 확인이 먼저입니다";
}

function getPriceSignal(
  item: AuctionItem,
  analysis: ReturnType<typeof analyze>,
  comparableVerdict: string
): { label: string; helper: string; tone: DecisionTone } {
  const minimumDiscount = 100 - analysis.marketRatio;
  const allInRate = item.market > 0 ? (analysis.allIn / item.market) * 100 : 0;

  if (analysis.marginRate < 8 || analysis.plannedBid > analysis.suggested) {
    return {
      label: "가격 조정 필요",
      helper: `총투입이 시세의 ${percent(allInRate)} 수준`,
      tone: "danger",
    };
  }

  if (minimumDiscount >= 20 && comparableVerdict !== "입력 시세 높음") {
    return {
      label: "할인폭 있음",
      helper: `최저가가 시세보다 ${percent(minimumDiscount)} 낮음`,
      tone: "good",
    };
  }

  return {
    label: "추가 비교 필요",
    helper:
      comparableVerdict === "시세 근거 부족"
        ? "비교 실거래를 더 넣어야 함"
        : `${comparableVerdict} · 마진 ${percent(analysis.marginRate)}`,
    tone: "caution",
  };
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-4">
      <p className="text-xs font-semibold text-[#66736D]">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold tabular-nums text-[#17211D]">{value}</p>
    </div>
  );
}

function CostLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3 text-sm">
      <span className="font-medium text-[#66736D]">{label}</span>
      <span className="break-words text-right font-semibold tabular-nums text-[#17211D]">{value}</span>
    </div>
  );
}

function GuidanceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-3">
      <p className="text-xs font-semibold text-[#1F8A5B]">{label}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-[#66736D]">
        {value}
      </p>
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

function RiskFactorCard({
  label,
  points,
  severity,
}: {
  label: string;
  points: number;
  severity: "caution" | "danger";
}) {
  const style =
    severity === "danger"
      ? "border-[#F2B8AE] bg-[#FDE8E5] text-[#B53A2E]"
      : "border-[#F3D083] bg-[#FFF4D7] text-[#8A5B00]";

  return (
    <div className={`rounded-lg border p-3 ${style}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className="shrink-0 rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold tabular-nums">
          +{points}점
        </span>
      </div>
    </div>
  );
}

function RightsAnswerCard({
  group,
  question,
  documentHint,
  answer,
}: {
  group: string;
  question: string;
  documentHint: string;
  answer: RightsChecklistAnswer;
}) {
  return (
    <div className="rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#34423C]">
          {group}
        </span>
        <AnswerBadge value={answer} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#17211D]">
        {question}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#66736D]">
        확인 문서: {documentHint}
      </p>
    </div>
  );
}

function AnswerBadge({ value }: { value: RightsChecklistAnswer }) {
  const style =
    value === "아니요"
      ? "bg-[#E7F6EE] text-[#1F8A5B]"
      : value === "예"
        ? "bg-[#FFF4D7] text-[#8A5B00]"
        : value === "해당 없음"
          ? "bg-[#E7F0FF] text-[#255C99]"
          : "bg-[#FDE8E5] text-[#B53A2E]";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {value}
    </span>
  );
}

function ComparableSaleSummary({
  sale,
}: {
  sale: NonNullable<UserAuctionItem["comparableSales"]>[number];
}) {
  return (
    <div className="rounded-lg border border-[#E5ECE8] bg-[#F9FBFA] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#17211D]">
            {sale.label || "비교 실거래"}
          </p>
          <p className="mt-1 text-xs font-medium text-[#66736D]">
            {[sale.tradeDate, sale.area ? `${sale.area}㎡` : "", sale.floor]
              .filter(Boolean)
              .join(" · ") || "세부 정보 미입력"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-[#1F8A5B]">
          {uk(sale.price)}
        </span>
      </div>
      {sale.memo ? (
        <p className="mt-3 text-xs leading-5 text-[#66736D]">{sale.memo}</p>
      ) : null}
    </div>
  );
}

function MarketVerdict({ value }: { value: string }) {
  const style =
    value === "입력 시세 적정"
      ? "bg-[#E7F6EE] text-[#1F8A5B]"
      : value === "입력 시세 보수적"
        ? "bg-[#E7F0FF] text-[#255C99]"
        : value === "입력 시세 높음"
          ? "bg-[#FFF4D7] text-[#8A5B00]"
          : "bg-[#FDE8E5] text-[#B53A2E]";

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${style}`}>
      {value}
    </span>
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
      <span className={strong ? "break-words text-right text-lg font-semibold tabular-nums text-[#1F8A5B]" : "break-words text-right font-semibold tabular-nums text-[#17211D]"}>
        {value}
      </span>
    </div>
  );
}
