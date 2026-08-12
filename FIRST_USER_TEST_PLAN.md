# First-User Test Plan

This checklist is for testing whether a first-time user can understand the auction/public-sale MVP before live data integration.

## Tester Profile

- Target tester: a beginner or early-intermediate real estate auction/public-sale learner.
- Device: mobile phone first, then desktop only if time remains.
- Data expectation: explain that all bundled items are sample data and user-created items are stored in the local browser only.
- Session length: 20-30 minutes.
- Moderator role: observe confusion, wording concerns, and hesitation without teaching the app too early.

## Setup

- Open the deployed site or local dev URL.
- Start from the listing page with no explanation beyond: "이 앱으로 경매/공매 후보를 보고, 하나를 등록하고, 비교해보세요."
- Ask the tester to think aloud when something feels unclear, risky, or useful.
- Do not ask for real private addresses or personal investment details during this test.

## Scenario 1: Listing Scan

Task:

- Find one item that looks easier to review and one item that looks risky.
- Use search and filters at least once.
- Explain why you picked each item.

Observe:

- Does the tester understand `경매`, `공매`, `샘플`, `확인 필요` labels?
- Do filter chips and sliders feel tappable on mobile?
- Does `검토 쉬움`, `주의`, `위험` feel understandable without legal knowledge?
- Does the user notice that this is sample data, not live data?

Pass signals:

- Tester can find a candidate within 2 minutes.
- Tester can describe at least one price reason and one rights/risk reason.
- Tester does not mistake sample data for real-time listings.

## Scenario 2: Detail Review

Task:

- Open a listing detail page.
- Read the top summary and decide whether you would keep reviewing it.
- Find price, rights, cost, and memo/source sections.

Observe:

- Can the tester make a first-pass decision within 1 minute?
- Is `검토 상한가` understood as a cautious calculation, not a guaranteed bid recommendation?
- Are unknown rights fields understood as caution?
- Does the mobile section navigation help or distract?

Pass signals:

- Tester can explain the app's decision-support role.
- Tester can find what must be verified outside the app.
- Tester does not interpret the app as legal or investment advice.

## Scenario 3: Manual Property Registration

Task:

- Add a new candidate item with only minimal information.
- Required fields: property title and estimated market price.
- Skip legal fields you do not know.
- Save the item and open its detail page.

Observe:

- Does the tester understand that incomplete information is allowed?
- Do `만원` helper texts reduce price-entry confusion?
- Are optional advanced sections easy to skip?
- Does the save flow feel complete without signup?

Pass signals:

- Tester can save an incomplete property without moderator help.
- Tester understands saved data is local to the current browser.
- Tester can edit the saved item later.

## Scenario 4: Comparison Basket

Task:

- Add 2-4 items to the comparison basket.
- Open the comparison tab.
- Pick which item deserves review first and explain why.
- Remove one item and clear the basket.

Observe:

- Does the bottom tab make comparison easy to find?
- Do comparison cards fit on mobile without horizontal scrolling?
- Are ranking reasons understandable?
- Are remove and clear actions easy but not too visually alarming?

Pass signals:

- Tester can compare at least two items without losing their place.
- Tester can name why one item ranks above another.
- Tester can recover from adding the wrong item.

## Scenario 5: Trust And Safety Check

Task:

- Tell us what information you would verify before making any real bid decision.
- Point to where the app says data must be checked externally.

Observe:

- Does the tester notice source/status labels?
- Does the app feel careful without feeling scary?
- Are public-sale and court-auction risks distinguishable enough?
- Which terms feel too legal, too vague, or too confident?

Pass signals:

- Tester mentions address, occupancy, senior rights, unpaid fees, and official source verification.
- Tester understands the app helps organize review but does not replace expert/legal checks.

## Feedback Capture

Record after each scenario:

- What did the tester try to do?
- Where did they pause or ask a question?
- What phrase or UI element caused confusion?
- What felt trustworthy?
- What felt risky, missing, or too confident?
- Did the tester complete the task without help?

Final questions:

- What would make you trust this more?
- What data would you expect to be live?
- Would you use this before looking at official auction/public-sale pages?
- Which feature should come next: live listings, market prices, alerts, or expert checklist?

## Known Limitations To Explain

- Current bundled listings are sample data, not live auction/public-sale data.
- User-created items are stored in the local browser only.
- Market price and transaction evidence are manually entered or sample-based for now.
- The app is a review aid, not legal advice, valuation advice, or a bid recommendation.
- Official documents and source pages must be checked before real decisions.

## MVP Readiness Decision

Consider Phase 6 successful when:

- At least 3 testers complete listing, detail, registration, and comparison flows.
- At least 2 testers can explain the app's risk language correctly.
- No tester mistakes sample data for live real-time data after the first screen.
- The top 5 confusion points are documented and turned into Phase 6.2-6.5 tasks.
