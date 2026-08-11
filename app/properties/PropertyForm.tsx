"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  createUserAuctionItem,
  loadUserAuctionItems,
  saveUserAuctionItems,
  upsertUserAuctionItem,
  type UserAuctionItem,
} from "../lib/auction-storage";
import {
  CHECKLIST_ANSWERS,
  RIGHTS_CHECKLIST_ITEMS,
  createDefaultRightsChecklist,
  summarizeRightsChecklist,
} from "../lib/rights-checklist";
import type {
  AuctionItem,
  BidCalculatorInputs,
  ComparableSale,
  PropertyType,
  RightsChecklistAnswer,
  RightsChecklistAnswers,
  RightsChecklistId,
  SaleChannel,
} from "../lib/auction-types";

type FormMode = "create" | "edit";
type StepId = 0 | 1 | 2 | 3;

type Draft = {
  channel: SaleChannel;
  agency: string;
  caseNo: string;
  sourceUrl: string;
  title: string;
  district: string;
  address: string;
  type: PropertyType;
  area: string;
  floor: string;
  auctionDate: string;
  appraised: string;
  minimum: string;
  market: string;
  lastTrade: string;
  failedBids: string;
  tenant: AuctionItem["tenant"];
  seniorDeposit: string;
  takeoverAmount: string;
  liens: boolean;
  illegalBuilding: boolean;
  taxRisk: boolean;
  occupancy: AuctionItem["occupancy"];
  userMemo: string;
  comparableSales: ComparableSaleDraft[];
  rightsChecklist: RightsChecklistAnswers;
  bidCalculator: BidCalculatorDraft;
};

type ComparableSaleDraft = {
  id: string;
  label: string;
  tradeDate: string;
  area: string;
  floor: string;
  price: string;
  memo: string;
};

type BidCalculatorDraft = {
  plannedBid: string;
  takeoverAmount: string;
  acquisitionTaxAndFees: string;
  repairBudget: string;
  evictionBudget: string;
  unpaidFees: string;
  desiredMarginRate: string;
};

const emptyDraft: Draft = {
  channel: "경매",
  agency: "법원경매",
  caseNo: "",
  sourceUrl: "",
  title: "",
  district: "",
  address: "",
  type: "아파트",
  area: "",
  floor: "",
  auctionDate: "",
  appraised: "",
  minimum: "",
  market: "",
  lastTrade: "",
  failedBids: "0",
  tenant: "확인 필요",
  seniorDeposit: "",
  takeoverAmount: "",
  liens: false,
  illegalBuilding: false,
  taxRisk: false,
  occupancy: "협의 필요",
  userMemo: "",
  comparableSales: createEmptyComparableSaleDrafts(),
  rightsChecklist: createDefaultRightsChecklist(),
  bidCalculator: createEmptyBidCalculatorDraft(),
};

const steps = ["출처", "기본 정보", "가격", "점유·메모"];

export function PropertyForm({
  mode,
  itemId,
}: {
  mode: FormMode;
  itemId?: string;
}) {
  const [step, setStep] = useState<StepId>(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [userItems, setUserItems] = useState<UserAuctionItem[]>([]);
  const [loaded, setLoaded] = useState(mode === "create");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const items = loadUserAuctionItems();
      setUserItems(items);

      if (mode === "edit" && itemId) {
        const item = items.find((candidate) => candidate.id === itemId);
        if (item) {
          setDraft(draftFromItem(item));
        }
        setLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [itemId, mode]);

  const existingItem = useMemo(
    () => userItems.find((item) => item.id === itemId),
    [itemId, userItems]
  );

  const isMissingEditTarget = mode === "edit" && loaded && !existingItem;
  const progress = ((step + 1) / steps.length) * 100;

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function goNext() {
    if (step === 3) return;
    setStep((current) => (Math.min(3, current + 1) as StepId));
  }

  function goBack() {
    if (step === 0) return;
    setStep((current) => (Math.max(0, current - 1) as StepId));
  }

  function submit() {
    const validation = validateDraft(draft);
    if (validation) {
      setError(validation);
      return;
    }

    const itemInput = itemFromDraft(draft);
    const savedItem =
      mode === "edit" && existingItem
        ? { ...existingItem, ...itemInput, id: existingItem.id, source: "user" as const }
        : createUserAuctionItem(itemInput);
    const nextItems = upsertUserAuctionItem(userItems, savedItem);
    saveUserAuctionItems(nextItems);
    window.location.assign(`/properties/${savedItem.id}`);
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#F6F8F7] px-5 py-8 text-[#17211D]">
        <div className="mx-auto max-w-3xl rounded-xl border border-[#DDE5E1] bg-white p-6 text-sm font-medium text-[#66736D] shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
          저장된 물건을 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (isMissingEditTarget) {
    return (
      <main className="min-h-screen bg-[#F6F8F7] px-5 py-8 text-[#17211D]">
        <div className="mx-auto max-w-3xl rounded-xl border border-[#DDE5E1] bg-white p-6 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="text-sm font-semibold text-[#1F8A5B]">
            목록으로
          </a>
          <h1 className="mt-4 text-2xl font-semibold">수정할 수 없는 물건입니다.</h1>
          <p className="mt-2 text-sm leading-6 text-[#66736D]">
            직접 등록한 물건만 수정할 수 있습니다. 샘플 물건은 읽기 전용으로
            유지됩니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen text-[#17211D]">
      <section className="hero-surface border-b border-[#DDE5E1]">
        <div className="mx-auto max-w-4xl px-5 py-6 lg:px-8">
          <a
            href={mode === "edit" && itemId ? `/properties/${itemId}` : "/"}
            className="button-lift inline-flex rounded-lg border border-[#DDE5E1] bg-white/85 px-3 py-2 text-sm font-semibold text-[#34423C] backdrop-blur transition hover:bg-white"
          >
            돌아가기
          </a>
          <div className="mt-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#1F8A5B] ring-1 ring-[#BFE3D0] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1F8A5B] shadow-[0_0_0_4px_rgba(31,138,91,0.12)]" />
              {mode === "edit" ? "내 물건 수정" : "새 물건 등록"}
            </p>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-[#17211D] md:text-4xl">
              공고 정보를 단계별로 정리하고 분석 기준을 남겨두세요.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#66736D]">
              모르는 값은 비워도 됩니다. 다만 제목과 예상 시세는 분석을 위해
              필요합니다. 직접 등록한 물건은 현재 브라우저에 저장됩니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-5 lg:px-8">
        <div className="interactive-card rounded-xl border border-[#DDE5E1] bg-white/94 p-4 shadow-[0_12px_32px_rgba(23,33,29,0.07)] backdrop-blur md:p-5">
          <div className="grid gap-2 sm:grid-cols-4">
            {steps.map((label, index) => (
              <button
                key={label}
                onClick={() => setStep(index as StepId)}
                className={`button-lift rounded-lg border px-3 py-3 text-left text-sm transition ${
                  step === index
                    ? "border-[#1F8A5B] bg-[#E7F6EE] font-semibold text-[#1F8A5B] shadow-[0_8px_18px_rgba(31,138,91,0.1)]"
                    : index < step
                      ? "border-[#BFE3D0] bg-white font-semibold text-[#1F8A5B] hover:bg-[#F9FBFA]"
                      : "border-[#DDE5E1] bg-white font-medium text-[#66736D] hover:bg-[#F9FBFA]"
                }`}
              >
                <span className="block text-xs opacity-70">Step {index + 1}</span>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEF3F1]">
            <div
              className="risk-fill h-full rounded-full bg-[#1F8A5B]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="reveal-up mt-5" key={step}>
            {step === 0 ? <SourceStep draft={draft} update={update} /> : null}
            {step === 1 ? <BasicStep draft={draft} update={update} /> : null}
            {step === 2 ? <PriceStep draft={draft} update={update} /> : null}
            {step === 3 ? <RightsStep draft={draft} update={update} /> : null}
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-[#F2B8AE] bg-[#FDE8E5] px-3 py-2 text-sm font-semibold text-[#B53A2E]">
              {error}
            </p>
          ) : null}

          {step === 3 ? (
            <div className="mt-4 rounded-lg border border-[#DDE5E1] bg-[#F9FBFA] p-4 text-sm leading-6 text-[#66736D]">
              <p className="font-semibold text-[#17211D]">저장 전 확인</p>
              <p className="mt-1">
                이 내용은 현재 브라우저에만 저장됩니다. 다른 기기나 시크릿
                브라우저에서는 다시 등록해야 보일 수 있습니다.
              </p>
              <p className="mt-1">
                분석 결과는 입력값을 정리한 참고 자료이며 법률·투자 자문이
                아닙니다. 입찰 전 원문 서류와 전문가 확인을 함께 진행하세요.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="button-lift h-11 rounded-lg border border-[#DDE5E1] bg-white px-4 text-sm font-semibold text-[#34423C] transition hover:bg-[#F9FBFA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            <div className="flex gap-2 sm:justify-end">
              {step < 3 ? (
                <button
                  onClick={goNext}
                  className="button-lift h-11 w-full rounded-lg bg-[#17211D] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,33,29,0.16)] transition hover:bg-[#26332E] sm:w-auto"
                >
                  다음
                </button>
              ) : (
                <button
                  onClick={submit}
                  className="button-lift h-11 w-full rounded-lg bg-[#17211D] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,33,29,0.16)] transition hover:bg-[#26332E] sm:w-auto"
                >
                  저장하고 상세 보기
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SourceStep({ draft, update }: StepProps) {
  return (
    <div className="grid gap-4">
      <Segmented
        label="매각 방식"
        options={["경매", "공매"]}
        value={draft.channel}
        onChange={(value) => update("channel", value as SaleChannel)}
      />
      <Field label="출처">
        <select
          value={draft.agency}
          onChange={(event) => update("agency", event.target.value)}
          className={inputClass}
        >
          {["법원경매", "온비드", "캠코", "직접 입력"].map((agency) => (
            <option key={agency}>{agency}</option>
          ))}
        </select>
      </Field>
      <TextInput
        label="사건번호 또는 공고번호"
        value={draft.caseNo}
        onChange={(value) => update("caseNo", value)}
        placeholder="2026타경1234, 2026-00001-001"
      />
      <TextInput
        label="원문 URL"
        value={draft.sourceUrl}
        onChange={(value) => update("sourceUrl", value)}
        placeholder="https://..."
      />
    </div>
  );
}

function BasicStep({ draft, update }: StepProps) {
  return (
    <div className="grid gap-4">
      <TextInput
        label="물건명"
        value={draft.title}
        onChange={(value) => update("title", value)}
        placeholder="예: 강동구 성내동 아파트 59"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="지역" value={draft.district} onChange={(value) => update("district", value)} placeholder="서울 강동구" />
        <Field label="물건 종류">
          <select
            value={draft.type}
            onChange={(event) => update("type", event.target.value as PropertyType)}
            className={inputClass}
          >
            {["아파트", "빌라", "오피스텔"].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
      </div>
      <TextInput label="주소" value={draft.address} onChange={(value) => update("address", value)} placeholder="상세 주소 또는 확인 가능한 범위" />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput label="면적(㎡)" value={draft.area} onChange={(value) => update("area", value)} inputMode="decimal" placeholder="84.9" />
        <TextInput label="층수" value={draft.floor} onChange={(value) => update("floor", value)} placeholder="12/29층" />
        <TextInput label="마감일" value={draft.auctionDate} onChange={(value) => update("auctionDate", value)} type="date" />
      </div>
    </div>
  );
}

function PriceStep({ draft, update }: StepProps) {
  function updateComparableSale<K extends keyof ComparableSaleDraft>(
    index: number,
    key: K,
    value: ComparableSaleDraft[K]
  ) {
    update(
      "comparableSales",
      draft.comparableSales.map((sale, saleIndex) =>
        saleIndex === index ? { ...sale, [key]: value } : sale
      )
    );
  }

  function updateBidCalculator<K extends keyof BidCalculatorDraft>(
    key: K,
    value: BidCalculatorDraft[K]
  ) {
    update("bidCalculator", { ...draft.bidCalculator, [key]: value });
    if (key === "takeoverAmount") update("takeoverAmount", value);
  }

  return (
    <div className="grid gap-4">
      <p className="rounded-lg border border-[#CFE3F8] bg-[#E7F0FF] px-3 py-2 text-sm font-medium text-[#255C99]">
        금액은 `만원` 단위로 입력하면 됩니다.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="감정가" value={draft.appraised} onChange={(value) => update("appraised", value)} inputMode="numeric" placeholder="125000" />
        <TextInput label="최저가" value={draft.minimum} onChange={(value) => update("minimum", value)} inputMode="numeric" placeholder="100000" />
        <TextInput label="예상 시세" value={draft.market} onChange={(value) => update("market", value)} inputMode="numeric" placeholder="132000" />
        <TextInput label="최근 실거래" value={draft.lastTrade} onChange={(value) => update("lastTrade", value)} inputMode="numeric" placeholder="129500" />
      </div>
      <TextInput label="유찰 횟수" value={draft.failedBids} onChange={(value) => update("failedBids", value)} inputMode="numeric" placeholder="0" />
      <section className="rounded-xl border border-[#DDE5E1] bg-white p-4 shadow-[0_1px_2px_rgba(23,33,29,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#17211D]">
              고급 입찰 계산기
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#66736D]">
              입찰가 외 취득비, 수리비, 명도비, 체납 비용과 목표 안전마진을
              넣으면 상세에서 총투입금과 상한가를 다시 계산합니다.
            </p>
          </div>
          <span className="rounded-full bg-[#E7F0FF] px-2.5 py-1 text-xs font-semibold text-[#255C99]">
            만원 단위
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextInput
            label="예상 입찰가"
            value={draft.bidCalculator.plannedBid}
            onChange={(value) => updateBidCalculator("plannedBid", value)}
            inputMode="numeric"
            placeholder="예: 98000"
          />
          <TextInput
            label="인수 추정액"
            value={draft.bidCalculator.takeoverAmount}
            onChange={(value) => updateBidCalculator("takeoverAmount", value)}
            inputMode="numeric"
            placeholder="0"
          />
          <TextInput
            label="취득세·수수료"
            value={draft.bidCalculator.acquisitionTaxAndFees}
            onChange={(value) => updateBidCalculator("acquisitionTaxAndFees", value)}
            inputMode="numeric"
            placeholder="비우면 입찰가의 3.5%"
          />
          <TextInput
            label="수리 예산"
            value={draft.bidCalculator.repairBudget}
            onChange={(value) => updateBidCalculator("repairBudget", value)}
            inputMode="numeric"
            placeholder="예: 1500"
          />
          <TextInput
            label="명도·이사 협의비"
            value={draft.bidCalculator.evictionBudget}
            onChange={(value) => updateBidCalculator("evictionBudget", value)}
            inputMode="numeric"
            placeholder="예: 500"
          />
          <TextInput
            label="체납·관리비 추정"
            value={draft.bidCalculator.unpaidFees}
            onChange={(value) => updateBidCalculator("unpaidFees", value)}
            inputMode="numeric"
            placeholder="예: 200"
          />
          <TextInput
            label="목표 안전마진(%)"
            value={draft.bidCalculator.desiredMarginRate}
            onChange={(value) => updateBidCalculator("desiredMarginRate", value)}
            inputMode="numeric"
            placeholder="12"
          />
        </div>
      </section>
      <div className="rounded-xl border border-[#DDE5E1] bg-[#F9FBFA] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#17211D]">비교 실거래</h2>
            <p className="mt-1 text-xs leading-5 text-[#66736D]">
              비슷한 단지·면적의 최근 거래를 최대 3개까지 남겨두면 상세에서
              입력 시세의 근거를 비교합니다.
            </p>
          </div>
          <span className="rounded-full bg-[#E7F6EE] px-2.5 py-1 text-xs font-semibold text-[#1F8A5B]">
            선택 입력
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {draft.comparableSales.map((sale, index) => (
            <ComparableSaleCard
              key={sale.id}
              index={index}
              sale={sale}
              update={updateComparableSale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RightsStep({ draft, update }: StepProps) {
  const checklistSummary = summarizeRightsChecklist(draft.rightsChecklist);

  function updateChecklist(id: RightsChecklistId, answer: RightsChecklistAnswer) {
    update("rightsChecklist", { ...draft.rightsChecklist, [id]: answer });
  }

  function updateTakeoverAmount(value: string) {
    update("takeoverAmount", value);
    update("bidCalculator", { ...draft.bidCalculator, takeoverAmount: value });
  }

  return (
    <div className="grid gap-4">
      <Field label="임차인 상태">
        <select
          value={draft.tenant}
          onChange={(event) => update("tenant", event.target.value as AuctionItem["tenant"])}
          className={inputClass}
        >
          {["없음", "전입 있음", "대항력 가능", "확인 필요"].map((tenant) => (
            <option key={tenant}>{tenant}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="선순위 보증금" value={draft.seniorDeposit} onChange={(value) => update("seniorDeposit", value)} inputMode="numeric" placeholder="0" />
        <TextInput label="인수 추정액" value={draft.takeoverAmount} onChange={updateTakeoverAmount} inputMode="numeric" placeholder="0" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Toggle label="유치권" checked={draft.liens} onChange={(value) => update("liens", value)} />
        <Toggle label="위반건축물" checked={draft.illegalBuilding} onChange={(value) => update("illegalBuilding", value)} />
        <Toggle label="체납/관리비 리스크" checked={draft.taxRisk} onChange={(value) => update("taxRisk", value)} />
      </div>
      <Field label="점유·명도">
        <select
          value={draft.occupancy}
          onChange={(event) => update("occupancy", event.target.value as AuctionItem["occupancy"])}
          className={inputClass}
        >
          {["명도 쉬움", "협의 필요", "명도 난이도 높음"].map((occupancy) => (
            <option key={occupancy}>{occupancy}</option>
          ))}
        </select>
      </Field>
      <Field label="메모">
        <textarea
          value={draft.userMemo}
          onChange={(event) => update("userMemo", event.target.value)}
          rows={4}
          className={`${inputClass} h-auto resize-none py-3`}
          placeholder="확인해야 할 서류, 시세 근거, 통화 내용 등을 적어두세요."
        />
      </Field>
      <section className="rounded-xl border border-[#DDE5E1] bg-[#F9FBFA] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#17211D]">
              권리분석 질문
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#66736D]">
              법률 용어를 몰라도 문서에서 확인한 내용대로 답하면 됩니다. 모르면
              `모름`으로 남겨두세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#E7F6EE] px-2.5 py-1 text-xs font-semibold text-[#1F8A5B]">
              확인 {checklistSummary.completedCount}/{checklistSummary.totalCount}
            </span>
            <span className="rounded-full bg-[#FFF4D7] px-2.5 py-1 text-xs font-semibold text-[#8A5B00]">
              모름 {checklistSummary.unknownCount}
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {RIGHTS_CHECKLIST_ITEMS.map((item) => (
            <RightsChecklistCard
              key={item.id}
              item={item}
              value={draft.rightsChecklist[item.id]}
              onChange={(answer) => updateChecklist(item.id, answer)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

type StepProps = {
  draft: Draft;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
};

function ComparableSaleCard({
  index,
  sale,
  update,
}: {
  index: number;
  sale: ComparableSaleDraft;
  update: <K extends keyof ComparableSaleDraft>(
    index: number,
    key: K,
    value: ComparableSaleDraft[K]
  ) => void;
}) {
  return (
    <div className="rounded-lg border border-[#E5ECE8] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[#66736D]">실거래 {index + 1}</p>
        {sale.price ? (
          <span className="rounded-full bg-[#EEF3F1] px-2 py-0.5 text-xs font-semibold text-[#34423C]">
            {sale.price}만
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextInput
          label="단지/라벨"
          value={sale.label}
          onChange={(value) => update(index, "label", value)}
          placeholder="예: 같은 단지 84A"
        />
        <TextInput
          label="거래일"
          value={sale.tradeDate}
          onChange={(value) => update(index, "tradeDate", value)}
          type="date"
        />
        <TextInput
          label="면적(㎡)"
          value={sale.area}
          onChange={(value) => update(index, "area", value)}
          inputMode="decimal"
          placeholder="84.9"
        />
        <TextInput
          label="층수"
          value={sale.floor}
          onChange={(value) => update(index, "floor", value)}
          placeholder="12층"
        />
        <TextInput
          label="거래가"
          value={sale.price}
          onChange={(value) => update(index, "price", value)}
          inputMode="numeric"
          placeholder="129500"
        />
        <TextInput
          label="차이 메모"
          value={sale.memo}
          onChange={(value) => update(index, "memo", value)}
          placeholder="층 낮음, 수리 상태 좋음"
        />
      </div>
    </div>
  );
}

function RightsChecklistCard({
  item,
  value,
  onChange,
}: {
  item: (typeof RIGHTS_CHECKLIST_ITEMS)[number];
  value: RightsChecklistAnswer;
  onChange: (value: RightsChecklistAnswer) => void;
}) {
  return (
    <div className="rounded-lg border border-[#E5ECE8] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[#EEF3F1] px-2.5 py-1 text-xs font-semibold text-[#34423C]">
          {item.group}
        </span>
        <span className="text-xs font-medium text-[#8A9690]">
          {item.documentHint}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#17211D]">
        {item.question}
      </p>
      <p className="mt-1 text-xs leading-5 text-[#66736D]">{item.helper}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CHECKLIST_ANSWERS.map((answer) => (
          <button
            key={answer}
            type="button"
            onClick={() => onChange(answer)}
            className={`button-lift h-9 rounded-lg border px-2 text-sm font-semibold transition ${
              value === answer
                ? checklistAnswerActiveClass(answer)
                : "border-[#DDE5E1] bg-white text-[#66736D] hover:bg-[#F9FBFA]"
            }`}
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 text-sm font-medium text-[#17211D] outline-none transition placeholder:text-[#9AA6A0] focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#D8F1E4]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#66736D]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "decimal";
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </Field>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#66736D]">{label}</p>
      <div className="mt-1 grid grid-cols-2 gap-2 rounded-lg border border-[#DDE5E1] bg-[#EEF3F1] p-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`h-10 rounded-md text-sm transition ${
              value === option
                ? "bg-white font-semibold text-[#17211D] shadow-[0_4px_12px_rgba(23,33,29,0.08)]"
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`button-lift flex h-11 items-center justify-between rounded-lg border px-3 text-sm font-semibold transition ${
        checked
          ? "border-[#F3D083] bg-[#FFF4D7] text-[#8A5B00]"
          : "border-[#DDE5E1] bg-white text-[#66736D] hover:bg-[#F9FBFA]"
      }`}
    >
      <span>{label}</span>
      <span>{checked ? "있음" : "없음"}</span>
    </button>
  );
}

function checklistAnswerActiveClass(answer: RightsChecklistAnswer) {
  if (answer === "예") return "border-[#F3D083] bg-[#FFF4D7] text-[#8A5B00]";
  if (answer === "아니요") return "border-[#BFE3D0] bg-[#E7F6EE] text-[#1F8A5B]";
  if (answer === "해당 없음") return "border-[#CFE3F8] bg-[#E7F0FF] text-[#255C99]";
  return "border-[#F3D083] bg-[#FFF4D7] text-[#8A5B00]";
}

function validateDraft(draft: Draft) {
  if (!draft.title.trim()) return "물건명을 입력해주세요.";
  if (toNumber(draft.market) <= 0) return "예상 시세는 0보다 크게 입력해주세요.";
  return "";
}

function itemFromDraft(draft: Draft): Omit<UserAuctionItem, "id" | "source" | "createdAt" | "updatedAt"> {
  const market = toNumber(draft.market);
  const appraised = toNumber(draft.appraised) || market;
  const minimum = toNumber(draft.minimum) || market;
  const lastTrade = toNumber(draft.lastTrade) || market;
  const memo = draft.userMemo.trim();

  return {
    channel: draft.channel,
    agency: draft.agency.trim() || "직접 입력",
    caseNo: draft.caseNo.trim() || "미입력",
    sourceUrl: draft.sourceUrl.trim(),
    title: draft.title.trim(),
    type: draft.type,
    district: draft.district.trim() || "지역 미입력",
    address: draft.address.trim() || "주소 확인 필요",
    appraised,
    minimum,
    market,
    lastTrade,
    deposit: 0,
    monthlyRent: 0,
    area: toNumber(draft.area),
    floor: draft.floor.trim() || "층수 확인 필요",
    failedBids: toNumber(draft.failedBids),
    auctionDate: draft.auctionDate || "날짜 확인 필요",
    tenant: draft.tenant,
    seniorDeposit: toNumber(draft.seniorDeposit),
    takeoverAmount: toNumber(draft.takeoverAmount),
    liens: draft.liens,
    illegalBuilding: draft.illegalBuilding,
    taxRisk: draft.taxRisk,
    occupancy: draft.occupancy,
    notes: memo ? [memo] : ["직접 등록한 물건입니다."],
    userMemo: memo,
    comparableSales: comparableSalesFromDraft(draft.comparableSales),
    rightsChecklist: draft.rightsChecklist,
    bidCalculator: bidCalculatorFromDraft(draft.bidCalculator),
  };
}

function draftFromItem(item: UserAuctionItem): Draft {
  return {
    channel: item.channel,
    agency: item.agency,
    caseNo: item.caseNo,
    sourceUrl: item.sourceUrl ?? "",
    title: item.title,
    district: item.district,
    address: item.address,
    type: item.type,
    area: String(item.area || ""),
    floor: item.floor,
    auctionDate: item.auctionDate,
    appraised: String(item.appraised || ""),
    minimum: String(item.minimum || ""),
    market: String(item.market || ""),
    lastTrade: String(item.lastTrade || ""),
    failedBids: String(item.failedBids || 0),
    tenant: item.tenant,
    seniorDeposit: String(item.seniorDeposit || ""),
    takeoverAmount: String(item.takeoverAmount || ""),
    liens: item.liens,
    illegalBuilding: item.illegalBuilding,
    taxRisk: item.taxRisk,
    occupancy: item.occupancy,
    userMemo: item.userMemo ?? item.notes.join("\n"),
    comparableSales: comparableSalesToDraft(item.comparableSales ?? []),
    rightsChecklist: item.rightsChecklist ?? createDefaultRightsChecklist(),
    bidCalculator: bidCalculatorToDraft(item.bidCalculator, item.takeoverAmount),
  };
}

function createEmptyComparableSaleDrafts(): ComparableSaleDraft[] {
  return [0, 1, 2].map((index) => ({
    id: `comp-${index + 1}`,
    label: "",
    tradeDate: "",
    area: "",
    floor: "",
    price: "",
    memo: "",
  }));
}

function createEmptyBidCalculatorDraft(): BidCalculatorDraft {
  return {
    plannedBid: "",
    takeoverAmount: "",
    acquisitionTaxAndFees: "",
    repairBudget: "",
    evictionBudget: "",
    unpaidFees: "",
    desiredMarginRate: "12",
  };
}

function bidCalculatorFromDraft(draft: BidCalculatorDraft): BidCalculatorInputs {
  return {
    plannedBid: toNumber(draft.plannedBid),
    takeoverAmount: toNumber(draft.takeoverAmount),
    acquisitionTaxAndFees: toNumber(draft.acquisitionTaxAndFees),
    repairBudget: toNumber(draft.repairBudget),
    evictionBudget: toNumber(draft.evictionBudget),
    unpaidFees: toNumber(draft.unpaidFees),
    desiredMarginRate: toNumber(draft.desiredMarginRate) || 12,
  };
}

function bidCalculatorToDraft(
  calculator: BidCalculatorInputs | undefined,
  takeoverAmount: number
): BidCalculatorDraft {
  return {
    plannedBid: calculator?.plannedBid ? String(calculator.plannedBid) : "",
    takeoverAmount: String(calculator?.takeoverAmount || takeoverAmount || ""),
    acquisitionTaxAndFees: calculator?.acquisitionTaxAndFees
      ? String(calculator.acquisitionTaxAndFees)
      : "",
    repairBudget: calculator?.repairBudget ? String(calculator.repairBudget) : "",
    evictionBudget: calculator?.evictionBudget
      ? String(calculator.evictionBudget)
      : "",
    unpaidFees: calculator?.unpaidFees ? String(calculator.unpaidFees) : "",
    desiredMarginRate: String(calculator?.desiredMarginRate || 12),
  };
}

function comparableSalesFromDraft(sales: ComparableSaleDraft[]): ComparableSale[] {
  return sales
    .map((sale, index) => ({
      id: sale.id || `comp-${index + 1}`,
      label: sale.label.trim(),
      tradeDate: sale.tradeDate,
      area: toNumber(sale.area),
      floor: sale.floor.trim(),
      price: toNumber(sale.price),
      memo: sale.memo.trim(),
    }))
    .filter((sale) => sale.price > 0)
    .slice(0, 3);
}

function comparableSalesToDraft(sales: ComparableSale[]): ComparableSaleDraft[] {
  const drafts = createEmptyComparableSaleDrafts();
  sales.slice(0, 3).forEach((sale, index) => {
    drafts[index] = {
      id: sale.id || `comp-${index + 1}`,
      label: sale.label,
      tradeDate: sale.tradeDate,
      area: sale.area ? String(sale.area) : "",
      floor: sale.floor,
      price: sale.price ? String(sale.price) : "",
      memo: sale.memo,
    };
  });
  return drafts;
}

function toNumber(value: string) {
  const numberValue = Number(value.replaceAll(",", "").trim());
  return Number.isFinite(numberValue) ? numberValue : 0;
}
