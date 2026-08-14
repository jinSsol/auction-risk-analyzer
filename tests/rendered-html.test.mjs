import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    }
  );
}

test("server-renders the auction listing workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>경매 권리분석 워크벤치<\/title>/i);
  assert.match(html, /오늘 먼저 확인할 리스크를 알려드려요/);
  assert.match(html, /물건을 고르기 전에 권리, 인수금, 입찰 상한을 쉬운 말로 정리해/);
  assert.match(html, /오늘 검토할 권리 리스크를 먼저 정리했어요/);
  assert.match(html, /새소식/);
  assert.match(html, /새로 들어오거나 바뀐 물건을 먼저 봐요/);
  assert.match(html, /aria-label="새소식 필터"/);
  assert.match(html, /전체/);
  assert.match(html, /새로 등록/);
  assert.match(html, /기일 임박/);
  assert.match(html, /조건 변경/);
  assert.match(html, /조건 변경 확인/);
  assert.match(html, /오늘의 확인 항목/);
  assert.match(html, /오늘의 후보 정리/);
  assert.match(html, /추천 물건/);
  assert.match(html, /리스크 테두리/);
  assert.match(html, /href="\/properties\/sample-1"/);
  assert.match(html, /href="\/properties\/sample-7"/);
  assert.match(html, /href="\/properties\/new"/);
  assert.match(html, /판교 힐스테이트 아파트 84/);
  assert.match(html, /전체보기/);
  assert.match(html, /분석/);
  assert.match(html, /새 물건 등록/);
  assert.match(html, /관심 조건 저장/);
  assert.match(html, /내가 추가한 물건/);
  assert.match(html, /마이페이지/);
  assert.match(html, /내 정보/);
  assert.match(html, /권리 미확인/);
});

test("keeps home feed empty-state copy available for filtered views", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /선택한 새소식이 아직 없어요/);
  assert.match(source, /MarketUpdateEmptyState/);
});

test("keeps saved condition empty-state and actions available", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /저장된 관심 조건이 아직 없어요/);
  assert.match(source, /이 조건으로 보기/);
  assert.match(source, /SAVED_CONDITIONS_STORAGE_KEY/);
});

test("server-renders sample property detail pages", async () => {
  const response = await render("/properties/sample-1");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /마포구 공덕동 래미안 84/);
  assert.match(html, /분석 요약/);
  assert.match(html, /검토 상한가/);
  assert.match(html, /5초 판단 요약/);
  assert.match(html, /가격 매력도/);
  assert.match(html, /입찰 여유/);
  assert.match(html, /권리 확인/);
  assert.match(html, /먼저 볼 핵심 리스크/);
  assert.match(html, /확인 안내/);
  assert.match(html, /법률·투자 자문이 아니라 입력값을 정리해 보는 참고 도구입니다/);
  assert.match(html, /등기사항전부증명서, 매각물건명세서, 현황조사서, 공매 공고문/);
  assert.match(html, /직접 등록한 물건과 비교 바구니는 현재 브라우저에만 저장됩니다/);
  assert.match(html, /시세 근거/);
  assert.match(html, /시세 근거 부족/);
  assert.match(html, /입찰 계산기/);
  assert.match(html, /넘지 말아야 할 금액/);
  assert.match(html, /목표 마진/);
  assert.match(html, /입찰 전 체크리스트/);
  assert.match(html, /권리분석 질문/);
  assert.match(html, /아직 확인할 것/);
  assert.match(html, /점유자 확인 필요/);
  assert.match(html, /href="\/"/);
});

test("server-renders the manual property creation flow", async () => {
  const response = await render("/properties/new");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /새 물건 등록/);
  assert.match(html, /공고 정보를 단계별로 정리하고 분석 기준을 남겨두세요/);
  assert.match(html, /직접 등록한 물건은 현재 브라우저에 저장됩니다/);
  assert.match(html, /Step <!-- -->1/);
  assert.match(html, /매각 방식/);
  assert.match(html, /가격/);
  assert.match(html, /다음/);
});
