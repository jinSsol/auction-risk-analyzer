import assert from "node:assert/strict";
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
  assert.match(html, /권리 리스크 · 입찰가 분석/);
  assert.match(html, /경매·공매 물건의 권리 리스크와 입찰 상한을 한 화면에서 비교하세요/);
  assert.match(html, /지금은 실시간 연동 전 샘플 데이터입니다/);
  assert.match(html, /href="\/properties\/sample-1"/);
  assert.match(html, /href="\/properties\/sample-7"/);
  assert.match(html, /href="\/properties\/new"/);
  assert.match(html, /판교 힐스테이트 아파트 84/);
  assert.match(html, /내 물건/);
  assert.match(html, /비교 바구니/);
});

test("server-renders sample property detail pages", async () => {
  const response = await render("/properties/sample-1");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /마포구 공덕동 래미안 84/);
  assert.match(html, /분석 요약/);
  assert.match(html, /추천 상한가/);
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
  assert.match(html, /Step <!-- -->1/);
  assert.match(html, /매각 방식/);
  assert.match(html, /가격/);
  assert.match(html, /다음/);
});
