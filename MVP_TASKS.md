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

- [ ] Remove duplicated types, sample data, `uk`, `percent`, and `analyze` from `app/page.tsx`.
- [ ] Use shared imports from `app/auction-data.ts` or newly separated `app/lib/*` modules.
- [ ] Confirm listing and detail pages use the same analysis function.
- [ ] Keep sample data behavior unchanged after refactor.

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

- [ ] Move shared types to `auction-types.ts`.
- [ ] Move risk and bid calculation to `auction-analysis.ts`.
- [ ] Keep sample items in `auction-data.ts` or rename to `sample-items.ts`.
- [ ] Add a merge helper for sample items plus user-created items.

Completion criteria:

- Types, analysis, storage, and sample data have clear ownership.
- Future user-created property logic has a place to live.

### 1.3 Change ID Strategy

Goal: support both sample and user-created properties safely.

Tasks:

- [ ] Change `AuctionItem.id` from `number` to `string`.
- [ ] Rename sample ids to `sample-1`, `sample-2`, etc.
- [ ] Plan user ids as `user-${crypto.randomUUID()}` or equivalent.
- [ ] Update listing links to `/properties/sample-1` style paths.
- [ ] Update comparison basket state from `number[]` to `string[]`.

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

- [ ] Add `auction-storage.ts`.
- [ ] Define stored item schema with `source: "user"`, `createdAt`, `updatedAt`.
- [ ] Add safe load behavior for missing data.
- [ ] Add safe load behavior for broken JSON.
- [ ] Add create, update, delete helpers.
- [ ] Add minimal validation/normalization for numeric fields.

Completion criteria:

- Storage helper can load empty state without errors.
- Broken storage data does not crash the app.
- User items can be created, updated, and deleted in isolation.

### 1.5 Make Detail Page Compatible With User Data

Current issue:

- Detail page is a server component using only sample `items`.
- User-created properties stored in localStorage cannot be read server-side.

Tasks:

- [ ] Convert property detail rendering to a client-compatible shell.
- [ ] Resolve sample and user-created items from one merged source.
- [ ] Show a friendly not-found state for missing user ids.
- [ ] Keep sample property detail pages working.

Completion criteria:

- `/properties/sample-1` works.
- A future `/properties/user-...` path can be resolved from localStorage.

### 1.6 Phase 1 Verification

- [ ] `npm run build`
- [ ] Listing page loads.
- [ ] Sample detail page loads.
- [ ] Comparison basket works with string ids.
- [ ] No duplicated analysis logic remains.

## Phase 2: Manual Property Creation

Goal: let users add real candidate properties manually, save them, see them in the listing, and open their detail pages.

### 2.1 Add Entry Point

Tasks:

- [ ] Add `새 물건 등록` button near the listing page header.
- [ ] Add optional `내 물건만 보기` filter.
- [ ] Visually distinguish sample properties from user-created properties.

Completion criteria:

- User can clearly start adding a property from the listing page.

### 2.2 Build Mobile-First Registration Flow

Recommended flow: four-step wizard.

Step 1: Source

- [ ] Sale channel: `경매`, `공매`
- [ ] Source: `법원경매`, `온비드`, `캠코`, `직접 입력`
- [ ] Case number or listing id
- [ ] Source URL

Step 2: Basic Property Info

- [ ] Title
- [ ] District
- [ ] Address
- [ ] Property type
- [ ] Area
- [ ] Floor
- [ ] Bid/deadline date

Step 3: Price and Market Info

- [ ] Appraised price
- [ ] Minimum price
- [ ] Estimated market price
- [ ] Recent transaction price
- [ ] Failed bid count

Step 4: Occupancy and Memo

- [ ] Tenant status
- [ ] Senior deposit
- [ ] Takeover amount
- [ ] Lien status
- [ ] Illegal building status
- [ ] Tax/fee risk
- [ ] Occupancy difficulty
- [ ] User memo

Completion criteria:

- User can create a property with essential fields only.
- Unknown optional values can be skipped.
- Save sends user to the created property detail page.

### 2.3 Add Edit and Delete

Tasks:

- [ ] Add edit entry point on user-created detail pages.
- [ ] Add delete action with confirmation.
- [ ] Prevent deleting bundled sample properties.
- [ ] Preserve created/updated timestamps.

Completion criteria:

- User-created properties can be edited and removed.
- Sample properties remain read-only.

### 2.4 Merge Sample and User Data

Tasks:

- [ ] Load user-created properties from localStorage on the listing page.
- [ ] Merge with sample properties.
- [ ] Sort user-created properties above sample properties or by latest updated date.
- [ ] Apply existing filters/search to both sample and user-created properties.
- [ ] Allow user-created properties in comparison basket.

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
- [ ] `npm run build`

## Phase 3: Market Comps, Checklist, and Calculator

Goal: make the manually saved property useful for real pre-bid review.

### 3.1 Add Comparable Sales Input

Comparable trade fields:

- [ ] Label or complex name
- [ ] Trade date
- [ ] Area
- [ ] Floor
- [ ] Price
- [ ] Difference memo

Tasks:

- [ ] Add 1-3 comparable trade cards to the creation/edit flow.
- [ ] Show comparable trade summary on detail page.
- [ ] Calculate average price.
- [ ] Calculate low/high range.
- [ ] Compare user-entered market price with comparable average.
- [ ] Show `시세 근거 부족` when no comparable data exists.

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

- [ ] Occupancy and tenant
- [ ] Move-in date and fixed date
- [ ] Senior tenant or senior deposit
- [ ] Distribution demand
- [ ] Baseline right for cancellation
- [ ] Lien claim
- [ ] Illegal building or usage issue
- [ ] Unpaid taxes, management fees, or utility costs
- [ ] Public sale-specific delivery/transfer conditions

Tasks:

- [ ] Add beginner-friendly question wording.
- [ ] Add short helper text for "why this matters."
- [ ] Add document hint per question where useful.
- [ ] Store checklist answers per property.
- [ ] Count unknown answers.
- [ ] Surface unknowns as "아직 확인할 것."

Completion criteria:

- User can answer checklist questions without knowing legal terms first.
- Detail page shows completed count and unknown count.

### 3.3 Recalculate Risk From Checklist Answers

Tasks:

- [ ] Extend `analyze()` to accept checklist/risk inputs.
- [ ] Add risk factors with labels and points.
- [ ] Treat `모름` as caution.
- [ ] Add hard triggers for expert review.
- [ ] Replace user-facing `안정` wording with `검토 쉬움` where appropriate.

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

- [ ] Planned bid
- [ ] Takeover amount
- [ ] Acquisition tax/fees
- [ ] Repair budget
- [ ] Moving/eviction budget
- [ ] Unpaid management/tax estimate
- [ ] Desired safety margin

Outputs:

- [ ] Conservative bid ceiling
- [ ] All-in cost
- [ ] Expected margin
- [ ] Margin rate
- [ ] "Do not bid above" threshold

Completion criteria:

- User can understand all-in cost, not only bid price.
- Comparison basket uses all-in cost and margin.

### 3.5 Improve Comparison Basket

Tasks:

- [ ] Persist comparison basket.
- [ ] Compare 2-4 properties.
- [ ] Show all-in cost.
- [ ] Show takeover amount.
- [ ] Show expected margin.
- [ ] Show checklist unknown count.
- [ ] Show verdict.

Completion criteria:

- User can compare saved properties and sample properties together.
- Comparison favors total risk/cost, not just low minimum price.

### 3.6 Phase 3 Verification

- [ ] Add a user property.
- [ ] Add comparable sales.
- [ ] Answer checklist with some `모름`.
- [ ] Confirm caution points update.
- [ ] Edit calculator assumptions.
- [ ] Confirm all-in cost updates.
- [ ] Add two properties to comparison.
- [ ] Refresh and confirm saved state remains.
- [ ] `npm run build`

## Deferred Until After MVP

- Real court auction data integration
- Real Onbid/KAMCO integration
- Real transaction API integration
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
