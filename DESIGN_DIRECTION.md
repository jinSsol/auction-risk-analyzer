# Design Direction

Last updated: 2026-08-13

## Product Identity

Auction Risk Analyzer should feel like a friendly rights-analysis coach for first-time or early-stage auction/public-sale buyers.

The product is not a heavy expert terminal, a real-estate listing portal, or a decorative finance dashboard. Its job is to help users understand whether a property is worth checking further, what risk must be verified first, and what bid ceiling is reasonable before they spend time or money.

Core positioning:

- Korean: 경매 초보도 이해할 수 있는 권리분석 코치 앱
- English: A rights-analysis coach for approachable auction decisions

## Design Reference Mix

### 1. Toss-Style Easy Finance UI

Primary reference direction.

Use Toss-like product principles rather than copying Toss visuals. The important ideas are simplicity, everyday language, value before effort, clear actions, and one core message per screen.

Relevant reference notes:

- Toss Product Principles emphasize familiar language, simple policy, value first, clear action, context-based flows, easy-to-answer questions, explaining why, one thing per page, reducing loading, and minimum features.
- Toss design writing around Simplicity frames product quality around lowering cognitive, psychological, and labor cost.
- Toss's Value First, Cost Later principle is especially relevant before asking users to enter property details or compare risk data.

Sources:

- https://toss.im/tossfeed/article/tossproductprinciples
- https://toss.tech/article/mydoc
- https://toss.tech/article/value-first-cost-later
- https://developers-apps-in-toss.toss.im/design/components.html

How this applies here:

- Replace legal and auction jargon with plain Korean first.
- Show the expected benefit before asking for manual property input.
- Make the next action obvious without requiring the user to understand auction expertise.
- Keep each major screen centered on one decision.

### 2. Real-Estate Exploration UI

Secondary reference direction.

Real-estate apps are useful for search, filtering, saved items, and comparison patterns. The product should borrow those interaction patterns, but not become a listing-first portal.

Useful patterns:

- Natural search input for district, property name, case number, agency, and sale channel.
- Filters that feel lightweight and recoverable.
- Saved/compare flow that is easy to reach on mobile.
- Cards that expose enough context to decide whether to open detail.

Sources:

- https://zillow.mediaroom.com/2023-01-26-Zillows-new-AI-powered-natural-language-search-is-a-first-in-real-estate?mobile=No
- https://www.uptech.team/blog/ux-review-of-real-estate-apps

How this applies here:

- Search should feel more like asking for a property than filling out a database form.
- Listing cards should prioritize decision summary, risk, bid ceiling, and key unknowns.
- Filters should support exploration without dominating the first screen.

### 3. Trustworthy Fintech Risk UI

Supporting reference direction.

The app handles financial judgment, so the interface must feel calm, conservative, and precise. It should not overuse playful visual decoration, large gradients, or colorful risk styling.

Useful patterns:

- Quiet hierarchy.
- Clear risk states.
- Numbers shown only when they help decision-making.
- Strong distinction between sample analysis and verified official documents.

Sources:

- https://www.kindgeek.com/blog/fintech-ux-design-trends
- https://wandr.studio/blog/fintech-mobile-app-design-trends

How this applies here:

- Use restrained color.
- Treat red as a true danger signal.
- Avoid bright accent colors that feel decorative rather than meaningful.
- Keep warnings short, specific, and actionable.

## First Screen Strategy

The first screen should answer one question:

> What should I check first today?

Recommended home hierarchy:

1. Today's primary risk or checking task
2. Search input
3. Guided quick filters
4. Property cards with decision summary
5. Compare basket access through bottom tab

The first screen should not start with a marketing hero, generic app preview, or dense statistics panel. The user should immediately understand that the app helps them decide what to verify before bidding.

## Core Screen Messages

### Home

Core message:

- 오늘 먼저 확인할 리스크를 알려드려요.

Primary user action:

- Search or open a recommended property to inspect risk.

Avoid:

- Oversized marketing copy.
- Abstract dashboard statistics.
- Generic "best deals" language.

### Detail

Core message:

- 이 물건은 입찰 검토 / 가격 조정 / 전문가 확인 중 어디에 가까운가?

Primary user action:

- Check the highest-risk item first, then review bid ceiling.

Recommended order:

1. Decision summary
2. Top risk reason
3. Bid ceiling and total cost
4. Rights checklist
5. Official document warning
6. Comparable sale evidence

### Registration

Core message:

- 모르는 항목은 비워도 되지만, 모르는 만큼 리스크가 올라가요.

Primary user action:

- Enter only the minimum property facts needed to estimate risk.

Recommended pattern:

- Ask small questions.
- Explain why each sensitive or difficult field matters.
- Make "unknown" a valid answer.

### Compare

Core message:

- 어떤 후보를 먼저 검토하고, 어떤 후보를 피해야 하는가?

Primary user action:

- Compare 2-4 properties by risk, total cost, bid ceiling, and unknown rights items.

Avoid:

- Table-only comparison on mobile.
- Ranking based only on price.

## Visual System Direction

### Palette

Use white and deep green as the main identity.

- App background: white-first, with only a very light green tint when depth is needed
- Primary: deep green
- Secondary: ink green/blue
- Surface: white
- Border: cool gray or pale sage
- Caution: muted sage/olive
- Danger: red only for true danger

Avoid:

- Beige, cream, or lifestyle-style warm backgrounds.
- Decorative apricot or orange accents.
- Heavy purple/blue gradients.
- Neon fintech colors.
- Too many risk colors competing at once.

### Typography

Use rounded, approachable Korean typography when possible. The tone should feel like a calm assistant explaining a difficult topic, not a government notice or expert report.

Text hierarchy:

- Use large type only for the main decision.
- Use compact, scannable labels for metrics.
- Prefer plain Korean over legal shorthand.

### Shape And Layout

Use mobile-first app patterns.

- Bottom tabs for primary mobile navigation.
- Large touch targets.
- Cards for property items and repeated summaries only.
- No nested cards.
- No decorative floating blobs or abstract ornaments.
- Keep sections unframed unless the UI element is a property card, comparison item, modal, or tool.

### Motion And Interaction

Interaction should feel light, not flashy.

Recommended:

- Gentle press/hover states.
- Clear selected states.
- Expand/collapse for filters and card details.
- Bottom-sheet style patterns for mobile filters later.

Avoid:

- Decorative animation that does not help judgment.
- Interactions that hide risk warnings.

## Content Principles

### Say This

- 먼저 확인할 항목
- 입찰 전에 확인 필요
- 이 금액 이상은 보수적으로 봐야 해요
- 모르는 항목이 있어 리스크가 올라갔어요
- 공식 문서 확인 전에는 참고용이에요

### Avoid This

- 고수익
- 특급 매물
- 베스트 딜
- 안전 확정
- 무조건 입찰
- 권리상 하자 없음, unless verified by official source

## Component Priorities

Build and reuse these components before further page redesign:

1. Decision summary banner
2. Risk reason card
3. Bid ceiling card
4. Unknown checklist badge
5. Source/verification badge
6. Property card
7. Bottom tab bar
8. Mobile filter sheet
9. Compare candidate card
10. Official document warning block

## Home Redesign Requirements

The next home redesign should:

- Replace the current hero with a decision-first coach header.
- Show one top checking task rather than three decorative metrics.
- Make search visually important but not heavy.
- Move advanced filters into a lighter, collapsible mobile-first pattern.
- Make property cards explain the first risk reason in plain Korean.
- Keep compare basket as a bottom-tab destination.

Definition of done:

- A first-time user can explain what the app does within five seconds.
- A user can find the next action without reading every label.
- Risk and official-document uncertainty remain visible.
- The screen feels trustworthy without feeling cold or expert-only.

## Open Decisions

- Final product name and brand tone.
- Whether real property photos will be shown before official data integration.
- Whether map view is needed for MVP or should wait until live data.
- Whether "coach mode" should become an explicit user-facing feature.
- How much legal disclaimer copy should be persistent versus contextual.

## Next Work

1. Update `MVP_TASKS.md` with a design strategy phase item if needed.
2. Redesign the home screen using this direction.
3. Extract shared visual components before redesigning detail and registration pages.
4. Re-run mobile QA after each screen-level redesign.
