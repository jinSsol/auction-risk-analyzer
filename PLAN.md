# Auction Risk Analyzer Plan

## Product Direction

Auction Risk Analyzer helps first-time and casual real-estate auction users browse court auction and public sale listings without feeling overwhelmed. The product should feel approachable, visual, and checklist-driven while still making risk, price, and required due diligence clear.

The core promise:

- Browse auction and public sale properties in one place.
- Understand what needs checking before bidding.
- Estimate a reasonable bid ceiling with conservative assumptions.
- Compare several properties without reading every document first.

This is not a legal judgment engine. It is a decision-support tool that highlights risk signals and guides the user toward documents and checks that still require human confirmation.

## Target Users

- Young or first-time buyers curious about auction/public-sale opportunities.
- Small investors who want fast screening before doing deeper research.
- Users who do not know legal terms such as senior tenant, opposition power, lien, or sale baseline right.
- Users who want to compare price and risk before paying for expert advice.

## Current State

Built:

- Deployed private web app.
- Listing page for sample court auction and public sale items.
- Filters for sale channel, property type, and risk result.
- Friendly card-based UI.
- Detail page per property at `/properties/[id]`.
- Shared sample data and risk calculation logic.
- Basic bid ceiling, margin, risk score, and comparison basket.

Not built yet:

- Real-time data integration.
- User-created properties.
- Persistent saved comparisons.
- Real legal document parsing.
- Real transaction-price API integration.
- Authentication or user accounts.

## MVP Definition

The MVP should prove that a user can manually evaluate and compare real candidate properties before any full data integration.

MVP must include:

- Manual property creation/edit form.
- Question-based rights-analysis checklist.
- Bid calculator with acquisition tax, repair cost, moving/eviction cost, loan ratio, senior deposit, and expected resale/rent.
- Save properties locally or in a database.
- Detail page with clear checklist status.
- Comparison basket with 2-4 properties.
- Export/share summary for one property.

MVP can skip:

- Full real-time court auction scraping.
- Automated legal conclusions.
- Account system, unless persistence requires it.
- Payment/subscription.

## Recommended Build Order

### Phase 1: Product Foundation

Goal: Make the app usable with manually entered real properties.

Tasks:

- Replace sample-only data with an internal property schema.
- Add a "New property" form.
- Add edit/delete for user-created properties.
- Persist data using local storage first, or D1 if we want cross-device persistence.
- Make listing/detail pages work from saved data plus bundled examples.
- Add empty states and onboarding copy.

Success criteria:

- User can paste or type one real property from a listing.
- User can return later and see it.
- User can compare it with sample or other manual entries.

### Phase 2: Checklist-Based Rights Analysis

Goal: Make legal-risk screening less intimidating.

Checklist groups:

- Occupancy and tenant
- Move-in date and fixed date
- Senior tenant or senior deposit
- Distribution demand
- Baseline right for cancellation
- Lien claim
- Illegal building or usage issue
- Unpaid taxes, management fees, or utility costs
- Public sale-specific delivery/transfer conditions

Tasks:

- Convert current risk calculation into weighted checklist answers.
- Use friendly question wording.
- Show "why this matters" helper text for each item.
- Separate "unknown" from "safe" so missing info still increases caution.
- Add final status: Easy to review, Needs document check, Expert review recommended.

Success criteria:

- A beginner can answer questions without knowing legal jargon.
- The app explains why the score changed.

### Phase 3: Bid Calculator

Goal: Estimate conservative bid ceiling and all-in cost.

Inputs:

- Expected market price
- Minimum sale price
- Desired discount/safety margin
- Senior deposit/takeover amount
- Acquisition tax and fees
- Repair budget
- Moving/eviction budget
- Loan amount and interest
- Expected rent or resale value

Outputs:

- Suggested bid ceiling
- All-in cost
- Expected margin
- Monthly cashflow estimate for rental cases
- "Do not bid above" threshold

Success criteria:

- User understands how each cost changes the bid ceiling.
- Comparison page shows total cost, not only bid price.

### Phase 4: Real Data Strategy

Goal: Decide how to bring in real listings legally and reliably.

Candidate sources:

- Court auction listing pages and documents
- Onbid/KAMCO public sale listings
- MOLIT real transaction price data
- Local market-price provider, if available
- User-uploaded PDFs/images for document extraction later

Work needed:

- Confirm source terms and technical access.
- Prefer official APIs where available.
- If scraping is considered, review legal/robots/usage limits first.
- Build import flow before full automation: user pastes URL or uploads document, app extracts what it can.

Recommended first integration:

- Real transaction price API or manual comparable-sales entry.
- It improves valuation without immediately relying on auction scraping.

### Phase 5: Trust and Safety

Goal: Avoid presenting uncertain analysis as legal certainty.

Principles:

- Use "check needed" instead of "safe" when source data is incomplete.
- Keep original document/source links near every automated claim.
- Show confidence level for each analysis section.
- Add clear disclaimers that final bidding requires document review and, for complex cases, expert advice.
- Track assumptions used in the bid calculation.

## Data Model Draft

Property:

- id
- channel: auction or public_sale
- source: court, onbid, kamco, manual
- caseNumber
- title
- propertyType
- addressPublic
- addressDetail
- district
- area
- floor
- appraisedPrice
- minimumPrice
- marketPrice
- lastTradePrice
- failedBidCount
- bidDate
- occupancyStatus
- tenantStatus
- seniorDeposit
- takeoverAmount
- lienStatus
- illegalBuildingStatus
- taxOrFeeRisk
- notes
- createdAt
- updatedAt

Analysis:

- propertyId
- checklistAnswers
- riskScore
- riskLevel
- flags
- suggestedBid
- plannedBid
- allInCost
- margin
- marginRate
- assumptions

Comparable Sale:

- propertyId
- addressOrComplex
- area
- price
- tradeDate
- floor
- source

## UI Principles

- Listing page should stay light and browseable.
- Detail page should be the "pre-bid check room."
- Avoid scary legal language in primary UI; put precise terms in helper text.
- Show one clear next action per section.
- Use visual grouping: price, checklist, risk points, documents, notes.
- Mobile-first detail page matters because users may inspect listings on the go.

## Near-Term Backlog

High priority:

- Add manual property form.
- Add persistent local storage or D1.
- Add rights-analysis checklist UI.
- Move comparison basket into a persistent drawer or page.
- Add editable assumptions for the detail-page cost calculator.

Medium priority:

- Add document/source link fields.
- Add memo and favorite status.
- Add comparable-sales section.
- Add CSV import/export.
- Add sample reset button.

Later:

- Real API integrations.
- PDF/document extraction.
- User accounts and saved workspaces.
- Expert review workflow.
- Alerts for bid date or price changes.

## Open Questions

- Should the first persistence layer be local-only or server-backed?
- Is the primary user browsing casually or actively preparing to bid?
- Do we want mobile-first or desktop-first interaction?
- Which real-data source should be attempted first?
- Should the app support only residential property at first?
- Should addresses be shown fully in the UI, or partially masked on listing pages?

## Next Recommended Step

Build Phase 1 and Phase 2 together in a small slice:

1. Add a "New property" button.
2. Create a manual property form with only essential fields.
3. Store entries locally.
4. Add a simple rights-check questionnaire on the detail page.
5. Recalculate risk from questionnaire answers.

This turns the prototype from a sample-data demo into a tool the user can test with real candidate properties.
