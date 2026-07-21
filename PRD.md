# Auction Risk Analyzer PRD

## 1. Summary

Auction Risk Analyzer is a friendly web and mobile product for browsing real-estate auction and public-sale opportunities, checking key risk signals, and estimating a conservative bid ceiling.

The product is designed for people who are curious about auctions but feel blocked by legal terms, scattered documents, and unclear cost assumptions.

## 2. Problem

First-time auction/public-sale users struggle with three things:

- Listings feel intimidating and document-heavy.
- Important risks are hard to recognize without legal knowledge.
- The real bidding decision depends on more than the minimum sale price.

As a result, users either avoid the market entirely or over-focus on low prices without understanding takeover amounts, tenant issues, delivery/occupancy risk, and all-in cost.

## 3. Goals

Primary goals:

- Make auction/public-sale exploration feel approachable.
- Help users screen properties before deep document review.
- Convert complex rights-analysis concepts into guided questions.
- Estimate bid ceilings and all-in cost using clear assumptions.
- Support both web launch and app-store distribution.

Non-goals for the first MVP:

- Guarantee that a property is legally safe.
- Replace experts, courts, appraisers, or official documents.
- Fully automate court auction or Onbid data ingestion.
- Provide investment recommendations or guaranteed returns.

## 4. Target Users

Primary user:

- A young or first-time buyer who has heard that auctions can be cheaper, but does not know how to start.

Secondary user:

- A small investor who wants a quick pre-screening board before doing paid or expert due diligence.

User traits:

- Mobile-first browsing behavior.
- Low familiarity with legal terms.
- Wants simple next steps, not dense legal explanations.
- Needs trust and clarity more than raw data volume at first.

## 5. Core User Journey

1. User opens the listing page.
2. User filters by auction/public sale, property type, and check difficulty.
3. User opens a property detail page.
4. User reviews price, address/source summary, checklist status, and caution points.
5. User edits assumptions in the bid calculator.
6. User adds the property to the comparison basket.
7. User compares 2-4 properties by all-in cost, margin, and check difficulty.
8. User saves or exports a summary for further review.

## 6. MVP Scope

### Must Have

- Responsive web app.
- Mobile-friendly listing page.
- Property detail page.
- Manual property creation and edit flow.
- Rights-analysis checklist with beginner-friendly questions.
- Conservative bid calculator.
- Comparison basket.
- Local or server-backed persistence.
- Clear disclaimer that the product is not legal or investment advice.

### Should Have

- Sample properties for onboarding.
- Source/document link fields.
- Comparable-sales section.
- Memo/favorite status.
- Export or share summary.
- PWA metadata and app icon.

### Could Have

- CSV import/export.
- Document upload.
- OCR-assisted field extraction.
- Bid-date reminders.
- Native share sheet in mobile app.

### Out of Scope for MVP

- Full real-time legal/court data automation.
- Payment/subscription.
- Expert marketplace.
- KMP/native rewrite.
- Automated final legal judgment.

## 7. Platform Strategy

### Web

The web app is the canonical product surface for MVP development.

Web requirements:

- Fast iteration.
- Mobile-first responsive UI.
- Deployable with a public URL.
- SEO/share basics.
- Privacy policy, terms, and disclaimer pages.

### Mobile

The first mobile app should use Capacitor to package the web product for iOS and Android.

Mobile requirements:

- App icon and splash screen.
- Safe-area and back-navigation handling.
- Touch-friendly layout.
- Store metadata and screenshots.
- Privacy policy URL.
- Legal/investment disclaimer visible in-app and in store review notes.

KMP/native rewrite is a later option only after workflows stabilize.

## 8. Key Screens

### Listing Page

Purpose:

- Lightweight browsing and filtering.

Must show:

- Sale channel: auction/public sale.
- Property title and district.
- Minimum price and estimated market price.
- Recommended bid ceiling.
- Check difficulty.
- Verdict: review, adjust price, or hold.
- Add to comparison.

### Detail Page

Purpose:

- Pre-bid check room.

Must show:

- Property summary.
- Address/source summary.
- Price overview.
- Bid ceiling and all-in cost.
- Rights-analysis checklist.
- Caution points.
- Notes and document links.

### Manual Property Form

Purpose:

- Let users test real candidates before official integrations.

Must capture:

- Channel/source.
- Case number or listing ID.
- Title/address/district.
- Property type/area/floor.
- Appraised price, minimum price, market estimate.
- Bid date.
- Tenant/occupancy status.
- Takeover amount.
- Notes/source links.

### Comparison Basket

Purpose:

- Compare short-listed properties.

Must show:

- Planned bid.
- Takeover amount.
- All-in cost.
- Margin.
- Check difficulty.
- Verdict.

## 9. Data and Analysis Principles

- Treat unknown information as a caution, not as safe.
- Keep calculation assumptions visible.
- Explain why a checklist answer changes risk.
- Separate source data from inferred analysis.
- Keep user-entered data editable.
- Avoid absolute language such as "safe", "guaranteed", or "must bid".

## 10. Success Metrics

Prototype validation:

- User can add a real property manually in under 3 minutes.
- User can understand why a property is marked caution/risky.
- User can compare at least 2 properties without help.

Product metrics after launch:

- Property creation completion rate.
- Detail-page checklist completion rate.
- Comparison basket usage.
- Return visits to saved properties.
- Export/share summary usage.
- Mobile app retention after first week.

## 11. Risks

Product risks:

- Users may misunderstand the analysis as legal advice.
- Too many inputs can make the product feel heavy.
- Too few inputs can make recommendations feel untrustworthy.

Data risks:

- Official data access may be limited.
- Scraping may create legal or reliability issues.
- Address and document fields may vary by source.

Store risks:

- App review may reject a thin web wrapper.
- Finance/legal-adjacent wording may trigger extra scrutiny.
- Privacy policy and disclaimer must be clear before submission.

## 12. Open Questions

- Should MVP persistence be local-only or account-based?
- Should we require login before saving properties?
- Should the first launch focus only on residential properties?
- How much address detail should appear on listing cards?
- Which source should be integrated first: comparable sales or auction/public-sale listings?
- Should mobile app launch wait until manual entry and checklist are complete?

## 13. Recommended Next Build

Build a small vertical slice:

1. Manual property creation form.
2. Local persistence.
3. Detail-page checklist.
4. Risk recalculation from checklist answers.
5. Editable bid calculator assumptions.

This slice makes the product usable with real candidate properties while still avoiding the complexity of full data integration.
