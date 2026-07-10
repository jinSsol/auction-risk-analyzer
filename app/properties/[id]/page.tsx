import Link from "next/link";
import { notFound } from "next/navigation";
import {
  analyze,
  items,
  percent,
  type RiskLevel,
  type SaleChannel,
  uk,
} from "../../auction-data";

export function generateStaticParams() {
  return items.map((item) => ({ id: String(item.id) }));
}

export default async function PropertyDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = items.find((candidate) => String(candidate.id) === id);

  if (!item) {
    notFound();
  }

  const analysis = analyze(item, 78, 4);
  const acquisitionCosts = Math.round(analysis.plannedBid * 0.035);
  const repairReserve = Math.round(item.market * 0.04);
  const totalWithBuffer = analysis.allIn + acquisitionCosts + repairReserve;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#17211d]">
      <section className="border-b border-[#dde7e2] bg-[#fbfdfb]">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <Link
            href="/"
            className="inline-flex rounded-md border border-[#cad8d1] bg-white px-3 py-2 text-sm font-black text-[#44504b] transition hover:bg-[#f6faf8]"
          >
            목록으로
          </Link>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <ChannelBadge channel={item.channel} />
                <span className="rounded-md bg-[#f3f5f2] px-2 py-0.5 text-xs font-bold text-[#65706b]">
                  {item.agency}
                </span>
                <span className="text-xs font-bold text-[#68756f]">
                  {item.caseNo}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-normal text-[#101b17] md:text-4xl">
                {item.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#5c6963] md:text-base">
                {item.district} · {item.area}㎡ · {item.floor} · 마감 {item.auctionDate}
              </p>
            </div>

            <div className="rounded-lg border border-[#bdf2d1] bg-[#e9fbf0] p-4">
              <p className="text-xs font-black text-[#1b7a4d]">가볍게 보는 결론</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <Verdict value={analysis.verdict} />
                <RiskBadge level={analysis.level} score={analysis.risk} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="text-sm font-bold text-[#29332f]">추천 상한가</span>
                <span className="text-3xl font-black text-[#1b7a4d]">
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
          <section className="rounded-lg border border-[#dde7e2] bg-white p-5 shadow-sm shadow-[#1a2d2410]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">가격 한눈에 보기</h2>
                <p className="mt-1 text-sm text-[#68756f]">
                  현재 계산은 시세의 78%, 비용 버퍼 4% 기준입니다.
                </p>
              </div>
              <span className="rounded-full bg-[#eaf5ff] px-3 py-1 text-sm font-black text-[#2563a8]">
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

          <section className="rounded-lg border border-[#dde7e2] bg-white p-5 shadow-sm shadow-[#1a2d2410]">
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

          <section className="rounded-lg border border-[#dde7e2] bg-white p-5 shadow-sm shadow-[#1a2d2410]">
            <h2 className="text-xl font-black">조심해서 볼 포인트</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.flags.length === 0 ? (
                <span className="rounded-md bg-[#e9fbf0] px-3 py-1.5 text-sm font-black text-[#1b7a4d]">
                  큰 체크 포인트 없음
                </span>
              ) : (
                analysis.flags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-md bg-[#fff7da] px-3 py-1.5 text-sm font-black text-[#916100]"
                  >
                    {flag}
                  </span>
                ))
              )}
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#5b6862]">
              {item.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#dde7e2] bg-white p-5 shadow-sm shadow-[#1a2d2410]">
            <h2 className="text-lg font-black">주소 정보</h2>
            <p className="mt-3 rounded-md bg-[#f6faf8] p-3 text-sm font-bold leading-6 text-[#34423c]">
              {item.address}
            </p>
            <p className="mt-3 text-xs leading-5 text-[#68756f]">
              실제 서비스에서는 목록에는 동네·단지 중심으로 보여주고, 상세에서
              원문 기준 주소와 첨부 문서를 확인하는 흐름이 좋습니다.
            </p>
          </section>

          <section className="rounded-lg border border-[#dde7e2] bg-white p-5 shadow-sm shadow-[#1a2d2410]">
            <h2 className="text-lg font-black">비용 감 잡기</h2>
            <div className="mt-4 space-y-3">
              <MiniLine label="입찰가" value={uk(analysis.plannedBid)} />
              <MiniLine label="인수금" value={uk(item.takeoverAmount)} />
              <MiniLine label="취득 비용 추정" value={uk(acquisitionCosts)} />
              <MiniLine label="수리·명도 버퍼" value={uk(repairReserve)} />
              <div className="border-t border-[#e3ece7] pt-3">
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
      ? "bg-[#e9fbf0] text-[#1b7a4d]"
      : "bg-[#eaf5ff] text-[#2563a8]";
  return (
    <span className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-bold ${style}`}>
      {channel}
    </span>
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

function RiskMeter({ level, score }: { level: RiskLevel; score: number }) {
  const color =
    level === "위험" ? "bg-[#ff6b57]" : level === "주의" ? "bg-[#f5a524]" : "bg-[#22a06b]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe8e3]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e3ece7] bg-[#fbfdfb] p-4">
      <p className="text-xs font-semibold text-[#68756f]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#17211d]">{value}</p>
    </div>
  );
}

function CheckCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e3ece7] bg-[#fbfdfb] p-4">
      <p className="text-xs font-bold text-[#68756f]">{title}</p>
      <p className="mt-1 font-black text-[#17211d]">{value}</p>
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
      <span className="font-bold text-[#5b6862]">{label}</span>
      <span className={strong ? "text-lg font-black text-[#1b7a4d]" : "font-black text-[#17211d]"}>
        {value}
      </span>
    </div>
  );
}
