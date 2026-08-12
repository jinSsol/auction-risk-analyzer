# MVP Implementation Tasks

This document is the execution checklist for moving Auction Risk Analyzer from a sample-data prototype to a usable MVP.

The work should proceed in order:

1. Foundation: data structure, shared logic, local storage
2. Creation flow: manual property registration and saved property detail
3. Analysis flow: market comps, rights checklist, advanced calculator

## Working Principles

- Keep the web app as the source of truth for MVP.
- Optimize for mobile-first usage.
- Let users save incomplete information.
- Treat unknown values as caution, not as safe.
- Separate user-entered data from app-inferred analysis.
- Avoid legal or investment certainty in wording.
- Prefer small shippable slices over large rewrites.

## Phase 1: Foundation

Goal: prepare the codebase so sample properties and user-created properties can use the same data model, analysis logic, listing page, and detail page.

### 1.1 Remove Data and Logic Duplication

- [x] Remove duplicated types, sample data, `uk`, `percent`, and `analyze` from `app/page.tsx`.
- [x] Use shared imports from `app/auction-data.ts` or newly separated `app/lib/*` modules.
- [x] Confirm listing and detail pages use the same analysis function.
- [x] Keep sample data behavior unchanged after refactor.

Completion criteria:

- `app/page.tsx` no longer owns domain data or analysis logic.
- `npm run build` passes.

### 1.2 Restructure Domain Files

Recommended structure:

```text
app/
  auction-data.ts
  lib/
    auction-types.ts
    auction-analysis.ts
    auction-storage.ts
    auction-merge.ts
```

Tasks:

- [x] Move shared types to `auction-types.ts`.
- [x] Move risk and bid calculation to `auction-analysis.ts`.
- [x] Keep sample items in `auction-data.ts` or rename to `sample-items.ts`.
- [x] Add a merge helper for sample items plus user-created items.

Completion criteria:

- Types, analysis, storage, and sample data have clear ownership.
- Future user-created property logic has a place to live.

### 1.3 Change ID Strategy

Goal: support both sample and user-created properties safely.

Tasks:

- [x] Change `AuctionItem.id` from `number` to `string`.
- [x] Rename sample ids to `sample-1`, `sample-2`, etc.
- [x] Plan user ids as `user-${crypto.randomUUID()}` or equivalent.
- [x] Update listing links to `/properties/sample-1` style paths.
- [x] Update comparison basket state from `number[]` to `string[]`.

Completion criteria:

- Sample detail pages still open.
- Comparison basket still works.
- No numeric id assumptions remain.

### 1.4 Add Local Storage Layer

Goal: create a safe client-side persistence foundation before building the form.

Storage key:

```text
auction-risk-analyzer:user-items:v1
```

Tasks:

- [x] Add `auction-storage.ts`.
- [x] Define stored item schema with `source: "user"`, `createdAt`, `updatedAt`.
- [x] Add safe load behavior for missing data.
- [x] Add safe load behavior for broken JSON.
- [x] Add create, update, delete helpers.
- [x] Add minimal validation/normalization for numeric fields.

Completion criteria:

- Storage helper can load empty state without errors.
- Broken storage data does not crash the app.
- User items can be created, updated, and deleted in isolation.

### 1.5 Make Detail Page Compatible With User Data

Current issue:

- Detail page is a server component using only sample `items`.
- User-created properties stored in localStorage cannot be read server-side.

Tasks:

- [x] Convert property detail rendering to a client-compatible shell.
- [x] Resolve sample and user-created items from one merged source.
- [x] Show a friendly not-found state for missing user ids.
- [x] Keep sample property detail pages working.

Completion criteria:

- `/properties/sample-1` works.
- A future `/properties/user-...` path can be resolved from localStorage.

### 1.6 Phase 1 Verification

- [x] `npm run build`
- [x] Listing page loads.
- [x] Sample detail page loads.
- [x] Comparison basket works with string ids.
- [x] No duplicated analysis logic remains.

## Phase 2: Manual Property Creation

Goal: let users add real candidate properties manually, save them, see them in the listing, and open their detail pages.

### 2.1 Add Entry Point

Tasks:

- [x] Add `새 물건 등록` button near the listing page header.
- [x] Add optional `내 물건만 보기` filter.
- [x] Visually distinguish sample properties from user-created properties.

Completion criteria:

- User can clearly start adding a property from the listing page.

### 2.2 Build Mobile-First Registration Flow

Recommended flow: four-step wizard.

Step 1: Source

- [x] Sale channel: `경매`, `공매`
- [x] Source: `법원경매`, `온비드`, `캠코`, `직접 입력`
- [x] Case number or listing id
- [x] Source URL

Step 2: Basic Property Info

- [x] Title
- [x] District
- [x] Address
- [x] Property type
- [x] Area
- [x] Floor
- [x] Bid/deadline date

Step 3: Price and Market Info

- [x] Appraised price
- [x] Minimum price
- [x] Estimated market price
- [x] Recent transaction price
- [x] Failed bid count

Step 4: Occupancy and Memo

- [x] Tenant status
- [x] Senior deposit
- [x] Takeover amount
- [x] Lien status
- [x] Illegal building status
- [x] Tax/fee risk
- [x] Occupancy difficulty
- [x] User memo

Completion criteria:

- User can create a property with essential fields only.
- Unknown optional values can be skipped.
- Save sends user to the created property detail page.

### 2.3 Add Edit and Delete

Tasks:

- [x] Add edit entry point on user-created detail pages.
- [x] Add delete action with confirmation.
- [x] Prevent deleting bundled sample properties.
- [x] Preserve created/updated timestamps.

Completion criteria:

- User-created properties can be edited and removed.
- Sample properties remain read-only.

### 2.4 Merge Sample and User Data

Tasks:

- [x] Load user-created properties from localStorage on the listing page.
- [x] Merge with sample properties.
- [x] Sort user-created properties above sample properties or by latest updated date.
- [x] Apply existing filters/search to both sample and user-created properties.
- [x] Allow user-created properties in comparison basket.

Completion criteria:

- User-created property appears in listing after save.
- Refreshing the browser keeps the property.
- User-created property can be opened in detail page.

### 2.5 Phase 2 Verification

- [ ] Add one user property.
- [ ] Refresh page and confirm it remains.
- [ ] Search for it.
- [ ] Filter by sale channel and property type.
- [ ] Open detail page.
- [ ] Edit and save.
- [ ] Delete and confirm removal.
- [x] `npm run build`

## Phase 3: Market Comps, Checklist, and Calculator

Goal: make the manually saved property useful for real pre-bid review.

### 3.1 Add Comparable Sales Input

Comparable trade fields:

- [x] Label or complex name
- [x] Trade date
- [x] Area
- [x] Floor
- [x] Price
- [x] Difference memo

Tasks:

- [x] Add 1-3 comparable trade cards to the creation/edit flow.
- [x] Show comparable trade summary on detail page.
- [x] Calculate average price.
- [x] Calculate low/high range.
- [x] Compare user-entered market price with comparable average.
- [x] Show `시세 근거 부족` when no comparable data exists.

Completion criteria:

- User can enter at least one comparable transaction.
- Detail page helps judge whether estimated market price is reasonable.

### 3.2 Add Rights-Analysis Checklist

Answer options:

- `아니요`
- `예`
- `모름`
- `해당 없음` where needed

Checklist groups:

- [x] Occupancy and tenant
- [x] Move-in date and fixed date
- [x] Senior tenant or senior deposit
- [x] Distribution demand
- [x] Baseline right for cancellation
- [x] Lien claim
- [x] Illegal building or usage issue
- [x] Unpaid taxes, management fees, or utility costs
- [x] Public sale-specific delivery/transfer conditions

Tasks:

- [x] Add beginner-friendly question wording.
- [x] Add short helper text for "why this matters."
- [x] Add document hint per question where useful.
- [x] Store checklist answers per property.
- [x] Count unknown answers.
- [x] Surface unknowns as "아직 확인할 것."

Completion criteria:

- User can answer checklist questions without knowing legal terms first.
- Detail page shows completed count and unknown count.

### 3.3 Recalculate Risk From Checklist Answers

Tasks:

- [x] Extend `analyze()` to accept checklist/risk inputs.
- [x] Add risk factors with labels and points.
- [x] Treat `모름` as caution.
- [x] Add hard triggers for expert review.
- [x] Replace user-facing `안정` wording with `검토 쉬움` where appropriate.

Suggested hard triggers:

- Senior tenant likely exists.
- Takeover amount exists.
- Lien claim exists.
- Illegal building suspected.
- Public-sale delivery/transfer condition unclear.

Completion criteria:

- Risk score changes when checklist answers change.
- Detail page explains why the score changed.

### 3.4 Upgrade Bid Calculator

Inputs:

- [x] Planned bid
- [x] Takeover amount
- [x] Acquisition tax/fees
- [x] Repair budget
- [x] Moving/eviction budget
- [x] Unpaid management/tax estimate
- [x] Desired safety margin

Outputs:

- [x] Conservative bid ceiling
- [x] All-in cost
- [x] Expected margin
- [x] Margin rate
- [x] "Do not bid above" threshold

Completion criteria:

- User can understand all-in cost, not only bid price.
- Comparison basket uses all-in cost and margin.

### 3.5 Improve Comparison Basket

Tasks:

- [x] Persist comparison basket.
- [x] Compare 2-4 properties.
- [x] Show all-in cost.
- [x] Show takeover amount.
- [x] Show expected margin.
- [x] Show checklist unknown count.
- [x] Show verdict.

Completion criteria:

- User can compare saved properties and sample properties together.
- Comparison favors total risk/cost, not just low minimum price.

### 3.6 Phase 3 Verification

- [x] Add a user property.
- [x] Add comparable sales.
- [x] Answer checklist with some `모름`.
- [x] Confirm caution points update.
- [x] Edit calculator assumptions.
- [x] Confirm all-in cost updates.
- [x] Add two properties to comparison.
- [x] Refresh and confirm saved state remains.
- [x] `npm run build`

Verification notes:

- Browser-verified a user-created property with 2 comparable sales.
- Left 3 checklist answers as `모름` and confirmed caution factors appear.
- Edited repair budget and confirmed all-in cost changed from 103,750만 to 104,550만.
- Added the user property to a comparison basket with sample properties and confirmed refresh persistence.

## Phase 4: MVP Trust And Launch Readiness

Goal:

- Make the MVP feel trustworthy enough for first users before expanding into real-time data, AI automation, or native apps.

### 4.1 Add Decision Summary Layer

Tasks:

- [x] Add a top detail-page decision summary card.
- [x] Show risk level in plain language.
- [x] Show price attractiveness.
- [x] Show bid headroom against the recommended ceiling.
- [x] Show checklist completion/unknown count.
- [x] Show 2-3 core risk reasons.

Completion criteria:

- User can understand the property's main judgment within 5 seconds.
- Summary explains risk/cost without sounding like investment advice.

### 4.2 Add Legal/Storage Guidance

Tasks:

- [x] Add non-advice disclaimer copy.
- [x] Explain final documents to verify.
- [x] Explain browser/local device storage.
- [x] Add guidance near save/delete flows.

Completion criteria:

- User understands the app is an analysis aid, not legal or investment advice.
- User understands saved data is stored in the current browser for MVP.

### 4.3 Strengthen Calculation Tests

Tasks:

- [x] Add unit tests for risk scoring.
- [x] Add unit tests for checklist unknown/caution effects.
- [x] Add unit tests for all-in cost and bid ceiling.
- [x] Add tests for comparable-sale verdicts.

Completion criteria:

- Core analysis logic is protected independent of page rendering tests.

### 4.4 Mobile MVP QA

Tasks:

- [x] Check listing page on mobile viewport.
- [x] Check detail page on mobile viewport.
- [x] Check property form on mobile viewport.
- [x] Check comparison basket on mobile viewport.
- [x] Fix text overflow or cramped controls.

Completion criteria:

- Main flows are usable on a phone-sized viewport.

Verification notes:

- Browser-verified listing, detail, and new-property form at a 390px mobile viewport.
- Confirmed no horizontal overflow on listing, detail, or form pages.
- Confirmed comparison basket renders with saved cards, verdicts, margin, and unknown-count fields on mobile.
- Reduced mobile hero heading size and improved numeric/card text wrapping for tighter screens.

### 4.5 MVP Release Checklist

Tasks:

- [ ] Write release checklist.
- [ ] Write first-user test script.
- [ ] Write MVP release notes.
- [ ] Re-run deployed URL smoke test.
- [ ] Decide PWA readiness scope.
- [x] Keep account signup out of MVP unless cloud sync, alerts, or cross-device saved data become release requirements.
- [x] Move mobile comparison access into a bottom-tab pattern so users can switch between listings and comparison without hunting down the basket.

Completion criteria:

- MVP can be shared with first testers with known caveats.

## Phase 5: Mobile UI/UX First Pass

Goal:

- Make the MVP feel like a lightweight mobile product, not a desktop dashboard squeezed onto a phone.
- Help users quickly screen properties, compare candidates, and enter data with less cognitive load.

### 5.1 Compress Mobile Listing Cards

Tasks:

- [x] Show only the most important scan fields by default: title, district, deadline, verdict, suggested ceiling, and margin.
- [x] Move secondary price/risk details behind an expand/collapse area on mobile.
- [x] Keep `비교 담기` visible and thumb-friendly.
- [x] Strengthen selected state so users can instantly see what is already in the comparison basket.
- [x] Preserve the richer desktop card layout.

Completion criteria:

- A user can scan 6-8 properties on a phone without feeling buried in numbers.

Verification notes:

- Mobile listing cards now default to compact scan fields and a two-stat price summary.
- Secondary market price, minimum price, and risk meter are available through a mobile `더보기` control.
- Selected comparison cards show a stronger mobile ring and `비교 담김` label.
- Desktop listing cards keep the richer four-stat and risk-meter layout visible by default.

### 5.1.1 Improve Mobile Search And Filters

Tasks:

- [x] Replace the dense filter grid with a larger mobile search bar.
- [x] Change filter groups into horizontally scrollable chip controls.
- [x] Show current result count near the search controls.
- [x] Add a clear reset action for search and active filters.
- [x] Keep controls touch-friendly on mobile while still usable on desktop.

Completion criteria:

- The search/filter area feels like a mobile product control, not a desktop admin form.

### 5.2 Improve Mobile Comparison Tab

Tasks:

- [x] Make the bottom `비교` tab badge more prominent when one or more properties are selected.
- [x] Add an empty comparison state that explains the next action in one sentence.
- [x] Show the best candidate first with a clearer ranking label.
- [x] Add a compact "why ranked here" summary per compared property.
- [x] Keep remove actions easy to tap without accidental detail navigation.

Completion criteria:

- Users can understand why one property looks better than another without opening every detail page.

Verification notes:

- The bottom comparison tab now highlights when at least one property is selected.
- Empty comparison state explains that users should add candidates from the property tab.
- Ranked comparison cards show `검토 우선 #1` for the best current candidate.
- Each comparison card includes a compact reason string using verdict, margin, and unknown checklist count.
- Remove buttons are separated below card content with larger mobile tap targets.

### 5.3 Rework Detail Page For Mobile Reading

Tasks:

- [x] Keep the 5-second decision summary near the top.
- [x] Split detail content into mobile-friendly sections: `요약`, `가격`, `권리`, `비용`, `메모`.
- [x] Consider sticky or segmented section navigation on mobile.
- [x] Make risk reasons and document checks scannable before dense calculation tables.
- [x] Keep edit/delete and comparison actions reachable but not visually alarming.

Completion criteria:

- Users can make a first-pass decision on a detail page within one minute on a phone.

Verification notes:

- Added a sticky mobile section nav for `요약`, `가격`, `권리`, `비용`, and `메모`.
- Detail content now follows a mobile reading order: decision summary, price context, rights checks, bid costs, memo/source guidance.
- The 5-second decision summary remains directly below the hero content.
- Mobile memo/source guidance is available in the main reading flow while the desktop sidebar remains desktop-only.
- Edit action is reachable in the mobile memo section for user-created properties without making delete visually dominant.

### 5.4 Reduce Form Friction

Tasks:

- [x] Review all required fields and make only truly necessary fields required.
- [x] Add clearer progress and section titles for the wizard.
- [x] Group advanced/legal fields so beginners can skip unknowns confidently.
- [x] Improve numeric input helper text for prices, deposits, and costs.
- [x] Add a lightweight save-draft feeling without requiring signup.

Completion criteria:

- A first-time user can add an incomplete property without feeling blocked by legal terms.

Verification notes:

- The form now explains that only property title and estimated market price are required.
- Each step shows a short title and helper sentence below the progress bar.
- Advanced bid calculator, comparable-sales inputs, and rights-analysis questions are tucked into optional expandable sections.
- Price inputs explain the `만원` unit with a concrete example.
- Save confirmation copy now tells users they can edit the saved property later without requiring signup.

### 5.5 Mobile Trust And Safety Copy

Tasks:

- [x] Add short source/status labels such as `샘플`, `직접 입력`, `확인 필요`.
- [x] Make local-browser storage guidance visible but not scary.
- [x] Avoid wording that implies legal certainty or guaranteed profit.
- [x] Add first-user tester copy for what to verify outside the app.
- [x] Keep account signup deferred until cloud sync, alerts, or cross-device saved data is required.

Completion criteria:

- The mobile UI feels approachable while still being careful about risk and uncertainty.

Verification notes:

- Listing and detail pages now show status labels for sample data, directly entered data, and items needing verification.
- Local browser storage copy now frames no-signup persistence as an MVP convenience instead of a scary limitation.
- Detail guidance includes a first-user verification checklist for address, occupancy, senior rights, unpaid fees, and public-sale delivery conditions.
- Copy continues to describe the product as a decision-support/reference tool, not legal or investment advice.
- Signup remains deferred until cloud sync, alerts, or cross-device workflows become required.

### 5.6 Mobile First-User QA

Tasks:

- [x] Test the main flow on 390px and 430px mobile widths.
- [x] Test add-property flow with incomplete information.
- [x] Test comparison with 0, 1, 2, and 4 selected properties.
- [x] Check bottom tab safe-area spacing.
- [x] Check tap target sizes for filters, compare actions, and form navigation.
- [x] Re-run `npm run lint`.
- [x] Re-run `npm test`.

Completion criteria:

- Mobile first-pass flows are ready to share with a small tester group.

Verification notes:

- Mobile browser QA checked listing, detail, registration, and comparison views at 390px and 430px widths.
- No horizontal overflow was found after rechecking the listing, detail, registration, and comparison flows.
- Add-property copy and grouped optional sections support saving incomplete candidate information.
- Comparison states were exercised from empty/low-count through full 4-item comparison, with bottom tab navigation intact.
- Tap target QA found small range controls and comparison title links; both were expanded to mobile-friendly hit areas.
- Safety wording was tightened from `추천 상한가` to `검토 상한가` on the detail page.

## Phase 6: Mobile App Style Redesign

Goal: translate the reference mobile-app visual direction into a trustworthy auction/public-sale risk tool.

### 6.1 Redesign Home Screen In App Style

Tasks:

- [x] Shift the home visual system toward navy/blue app-style surfaces.
- [x] Add a compact mobile-app style hero with summary metrics.
- [x] Keep risk and uncertainty signals visible before decorative content.
- [x] Restyle search, filters, listing cards, comparison panel, and bottom tabs without changing core behavior.
- [x] Re-run lint and render tests.

Completion criteria:

- The home screen feels closer to a modern mobile app while preserving cautious auction-risk wording.

Verification notes:

- Home now uses a dark blue app header, rounded white cards, soft shadows, and a desktop phone-style preview.
- Listing cards keep source, status, verdict, price, risk, and comparison actions in the same behavior flow.
- Risk colors remain distinct from the primary blue palette: caution uses orange and danger uses red.
- Browser QA checked 390px, 430px, and desktop widths with no horizontal overflow or tiny tap targets found.

### 6.2 Extract Shared Visual Components

Tasks:

- [ ] Move duplicated badges, verdict, risk meter, and mini-stat components into shared UI files.
- [ ] Align home and detail status colors after extraction.
- [ ] Add focused tests if extracted components affect rendered copy.

Completion criteria:

- Future design changes can be applied consistently across home and detail pages.

### 6.3 Redesign Detail Screen In App Style

Tasks:

- [ ] Add an app-style detail header with judgment summary first.
- [ ] Restyle section navigation and analysis cards to match the home redesign.
- [ ] Keep rights-analysis and official-document warnings prominent.
- [ ] Verify mobile reading order and tap targets.

Completion criteria:

- The detail page feels like the same app as the redesigned home screen.

### 6.4 Redesign Registration Flow In App Style

Tasks:

- [ ] Restyle the wizard shell, progress indicator, inputs, segmented controls, and optional sections.
- [ ] Preserve incomplete-save behavior and local-browser storage copy.
- [ ] Verify date, number, details/summary, and step navigation accessibility.

Completion criteria:

- Manual registration feels lighter without weakening data-quality guidance.

### 6.5 Redesign QA And Polish

Tasks:

- [ ] Check mobile widths after home, detail, and registration redesigns.
- [ ] Check desktop layout for oversized mobile-app styling.
- [ ] Re-run `npm run lint`.
- [ ] Re-run `npm test`.
- [ ] Deploy the completed redesign phase.

Completion criteria:

- The redesigned app is ready to continue into live data integration planning.

## Phase 7: Live Data Integration Planning

Goal: decide how real auction/public-sale data should enter the product before building scrapers or API adapters.

### 7.1 Source And Legal Feasibility Review

Tasks:

- [ ] Review Court Auction, Onbid, KAMCO, and public data source access paths.
- [ ] Check API availability, terms, robots/crawling limits, and rate limits.
- [ ] Identify fields that can be legally stored, refreshed, and displayed.
- [ ] Decide which source becomes the first production integration.

Completion criteria:

- The first live-data source is chosen with clear constraints and risks.

### 7.2 Live Data Model Design

Tasks:

- [ ] Separate source fields from user-entered fields.
- [ ] Add freshness metadata such as `fetchedAt`, `sourceUpdatedAt`, and `staleAfter`.
- [ ] Define confidence levels for address, price, occupancy, and rights fields.
- [ ] Plan merge behavior when user edits connected data.

Completion criteria:

- The app can support sample, user-entered, and connected items without muddy ownership.

### 7.3 Integration Architecture Spike

Tasks:

- [ ] Decide whether ingestion runs as server route, scheduled job, or external worker.
- [ ] Choose initial storage approach for connected items.
- [ ] Define retry, dedupe, and source-change handling.
- [ ] Add a small adapter interface for future source implementations.

Completion criteria:

- Developers know where source connectors live and how data flows into the app.

## Phase 8: Public-Sale Integration First Pass

Goal: connect a limited public-sale source before tackling more complex court auction data.

### 8.1 Onbid/KAMCO Listing Import MVP

Tasks:

- [ ] Import listing id, title, region, type, appraised/minimum price, deadline, and source URL.
- [ ] Mark imported data with freshness and source labels.
- [ ] Handle missing address and missing occupancy data as `확인 필요`.
- [ ] Add import error states that do not break the listing page.

Completion criteria:

- A small set of public-sale items can appear beside sample and user-created items.

### 8.2 Public-Sale Detail Normalization

Tasks:

- [ ] Normalize public-sale-specific delivery, occupancy, and tax/fee fields.
- [ ] Distinguish public-sale risks from court-auction rights risks.
- [ ] Preserve the original source URL for verification.
- [ ] Add tests for imported public-sale item analysis.

Completion criteria:

- Public-sale items can be analyzed without pretending they are court auctions.

## Phase 9: Court Auction Integration First Pass

Goal: connect limited court-auction listing data after the ingestion model is proven.

### 9.1 Court Auction Listing Import MVP

Tasks:

- [ ] Import case number, title, region, property type, appraised price, minimum price, and sale date.
- [ ] Handle partial/hidden addresses safely.
- [ ] Track failed bid count and sale schedule changes.
- [ ] Add source freshness and manual verification labels.

Completion criteria:

- Court auction items can be listed, filtered, and opened from connected data.

### 9.2 Court Auction Detail Risk Fields

Tasks:

- [ ] Map occupancy, lease, senior rights, lien, illegal building, and fee-risk signals where available.
- [ ] Treat unavailable legal fields as `미확인`, not safe.
- [ ] Add source-specific copy for what users must verify in official documents.
- [ ] Add tests for high-risk and unknown-risk court auction cases.

Completion criteria:

- Court auction connected data supports cautious first-pass rights analysis.

## Phase 10: Market Price And Transaction Data

Goal: add market context only after auction/public-sale item ingestion is stable.

### 10.1 Transaction Data Source Review

Tasks:

- [ ] Review public transaction data options and private API alternatives.
- [ ] Decide region, property type, and recency coverage for MVP.
- [ ] Define licensing, attribution, and caching constraints.
- [ ] Decide whether estimates should be exact, range-based, or confidence-scored.

Completion criteria:

- The app has a compliant plan for displaying market evidence.

### 10.2 Market Comparison MVP

Tasks:

- [ ] Connect recent transaction candidates by area, type, district, and date.
- [ ] Show match confidence and reasons for weak evidence.
- [ ] Keep user-entered recent transaction price as an override.
- [ ] Feed market confidence into bid/risk explanations without overstating precision.
- [ ] Add tests for strong, weak, and missing comparable-sale evidence.

Completion criteria:

- Users can compare auction/public-sale pricing against visible market evidence.

## Deferred Until After MVP

- OCR/document extraction
- Account login
- Cloud sync
- Push reminders
- App Store and Play Store packaging
- Payment/subscription

## Suggested First Pull Request

Title:

```text
Refactor auction data model and add local storage foundation
```

Scope:

- Remove duplicated data/analysis logic.
- Introduce string ids.
- Add storage helpers.
- Prepare merged sample/user data source.
- Keep UI behavior mostly unchanged.

Why first:

- It reduces technical debt before new user-created data enters the app.
- It unblocks manual registration, saved detail pages, and future checklist logic.
