import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const moduleDir = path.join(tmpdir(), "auction-risk-analyzer-analysis-tests");

async function writeModule(sourcePath, outputName) {
  const source = await readFile(new URL(sourcePath, import.meta.url), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  const rewritten = transpiled.replace(
    /from "\.\/rights-checklist";/g,
    'from "./rights-checklist.mjs";'
  );
  await writeFile(path.join(moduleDir, outputName), rewritten);
}

async function loadAnalysisModules() {
  await mkdir(moduleDir, { recursive: true });
  await writeModule("../app/lib/rights-checklist.ts", "rights-checklist.mjs");
  await writeModule("../app/lib/auction-analysis.ts", "auction-analysis.mjs");

  const cacheBust = `?test=${Date.now()}-${Math.random()}`;
  const analysis = await import(
    new URL(`auction-analysis.mjs${cacheBust}`, `file://${moduleDir}/`).href
  );
  const checklist = await import(
    new URL(`rights-checklist.mjs${cacheBust}`, `file://${moduleDir}/`).href
  );

  return { analysis, checklist };
}

function baseAuction(overrides = {}) {
  return {
    id: "unit-1",
    channel: "경매",
    agency: "법원경매",
    caseNo: "2026타경1000",
    title: "단위 테스트 아파트",
    type: "아파트",
    district: "서울 테스트구",
    address: "서울 테스트구 테스트동",
    appraised: 100000,
    minimum: 70000,
    market: 100000,
    lastTrade: 99000,
    deposit: 0,
    monthlyRent: 0,
    area: 84,
    floor: "10/20층",
    failedBids: 1,
    auctionDate: "2026-09-01",
    tenant: "없음",
    seniorDeposit: 0,
    takeoverAmount: 0,
    liens: false,
    illegalBuilding: false,
    taxRisk: false,
    occupancy: "명도 쉬움",
    notes: [],
    ...overrides,
  };
}

function answeredChecklist(checklistModule, answer = "아니요") {
  const answers = checklistModule.createDefaultRightsChecklist();
  Object.keys(answers).forEach((key) => {
    answers[key] = key === "publicSaleTransfer" ? "해당 없음" : answer;
  });
  return answers;
}

function cleanChecklist(checklistModule) {
  const answers = answeredChecklist(checklistModule, "아니요");
  answers.distributionDemand = "예";
  answers.baselineRight = "예";
  answers.publicSaleTransfer = "해당 없음";
  return answers;
}

test("risk scoring stays low when checklist and property inputs are clean", async () => {
  const { analysis, checklist } = await loadAnalysisModules();
  const item = baseAuction({
    rightsChecklist: cleanChecklist(checklist),
  });

  const result = analysis.analyze(item, 78, 4);

  assert.equal(result.risk, 8);
  assert.equal(result.level, "안정");
  assert.equal(result.verdict, "입찰 검토");
  assert.deepEqual(result.flags, []);
});

test("unknown checklist answers add caution points and visible risk reasons", async () => {
  const { analysis, checklist } = await loadAnalysisModules();
  const clean = analysis.analyze(
    baseAuction({ rightsChecklist: cleanChecklist(checklist) }),
    78,
    4
  );
  const unknown = analysis.analyze(baseAuction(), 78, 4);

  assert.ok(unknown.risk > clean.risk);
  assert.equal(unknown.level, "주의");
  assert.match(unknown.flags.join(","), /전입\/확정일자 확인 필요/);
  assert.match(unknown.flags.join(","), /배당요구 여부 확인 필요/);
});

test("hard checklist triggers require expert review even below danger score", async () => {
  const { analysis, checklist } = await loadAnalysisModules();
  const rightsChecklist = cleanChecklist(checklist);
  rightsChecklist.lienClaim = "예";

  const result = analysis.analyze(baseAuction({ rightsChecklist }), 78, 4);

  assert.equal(result.verdict, "전문가 검토");
  assert.ok(result.expertTriggers.includes("유치권 신고"));
  assert.ok(result.riskFactors.some((factor) => factor.label === "유치권 주장 가능성"));
});

test("bid calculator uses explicit all-in costs and bid ceiling inputs", async () => {
  const { analysis, checklist } = await loadAnalysisModules();
  const item = baseAuction({
    rightsChecklist: cleanChecklist(checklist),
    bidCalculator: {
      plannedBid: 70000,
      takeoverAmount: 5000,
      acquisitionTaxAndFees: 2000,
      repairBudget: 3000,
      evictionBudget: 1000,
      unpaidFees: 500,
      desiredMarginRate: 15,
    },
  });

  const result = analysis.analyze(item, 78, 4);

  assert.equal(result.extraCosts, 6500);
  assert.equal(result.allIn, 81500);
  assert.equal(result.conservativeBidCeiling, 75500);
  assert.equal(result.doNotBidAbove, 73500);
  assert.equal(result.suggested, 73500);
  assert.equal(result.margin, 18500);
  assert.equal(Math.round(result.marginRate), 19);
});

test("comparable sale verdicts describe market evidence quality", async () => {
  const { analysis } = await loadAnalysisModules();

  assert.equal(
    analysis.analyzeComparableSales(baseAuction()).verdict,
    "시세 근거 부족"
  );
  assert.equal(
    analysis.analyzeComparableSales(
      baseAuction({
        comparableSales: [
          { id: "c1", label: "A", tradeDate: "", area: 84, floor: "10층", price: 98000, memo: "" },
          { id: "c2", label: "B", tradeDate: "", area: 84, floor: "12층", price: 102000, memo: "" },
        ],
      })
    ).verdict,
    "입력 시세 적정"
  );
  assert.equal(
    analysis.analyzeComparableSales(
      baseAuction({
        market: 110000,
        comparableSales: [
          { id: "c1", label: "A", tradeDate: "", area: 84, floor: "10층", price: 100000, memo: "" },
        ],
      })
    ).verdict,
    "입력 시세 높음"
  );
  assert.equal(
    analysis.analyzeComparableSales(
      baseAuction({
        market: 90000,
        comparableSales: [
          { id: "c1", label: "A", tradeDate: "", area: 84, floor: "10층", price: 100000, memo: "" },
        ],
      })
    ).verdict,
    "입력 시세 보수적"
  );
});
