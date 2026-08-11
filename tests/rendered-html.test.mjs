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
  assert.match(html, /첫 경매·공매 탐색 보드/);
  assert.match(html, /지금은 실시간 연동 전 샘플 데이터입니다/);
  assert.match(html, /href="\/properties\/sample-1"/);
  assert.match(html, /href="\/properties\/sample-7"/);
  assert.match(html, /판교 힐스테이트 아파트 84/);
  assert.match(html, /비교 바구니/);
});

test("server-renders sample property detail pages", async () => {
  const response = await render("/properties/sample-1");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /마포구 공덕동 래미안 84/);
  assert.match(html, /가볍게 보는 결론/);
  assert.match(html, /추천 상한가/);
  assert.match(html, /입찰 전 체크리스트/);
  assert.match(html, /href="\/"/);
});
