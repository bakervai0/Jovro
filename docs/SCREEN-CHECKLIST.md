# Jovro frontend — screen checklist

Every screen below is implemented, routed and reachable. `npm test` exercises the
documented demo flows end-to-end in jsdom (23 passing tests).

## A. Onboarding & auth
- [x] Splash `/splash`
- [x] Language select `/lang` (Bangla default, English one tap away)
- [x] How it works / onboarding `/onboard`
- [x] Sign up `/signup` (with delivery-area selector)
- [x] Login `/login` (any mobile + 4-char password)
- [x] OTP verify `/otp` — hint `(ডেমো কোড / Demo code: 1234)`
- [x] Set password `/set-password`
- [x] Forgot password `/forgot-password`
- [x] Area picker `/area` — 114 areas, typo-tolerant search (`gosala` → গোশালা বাজার)

## B. Customer shopping & account
- [x] Home `/` — banner carousel, flash-sale countdown, category rail, custom free-text request, buy-again, sticky cart bar
- [x] Search `/search` — recent searches, popular chips, সব / কাঁচাবাজার / রেস্টুরেন্ট tabs
- [x] Search empty state + custom bazaar request card
- [x] Bazaar catalogue `/bazaar` — 43 products, 6 categories
- [x] Product detail `/product/:id` — pack sizes, shopper note, quality transparency, goes-well-with
- [x] Product detail AI-suggestion variant
- [x] Restaurant list `/food`
- [x] Restaurant menu `/food/:id`
- [x] Cart `/cart` — grouped by shop, AI "did you forget these"
- [x] Cart promo applied / invalid / empty states
- [x] Checkout `/checkout` — name → mobile → area (fee updates) → handwritten address → note → suggestions → slot → itemised bill, no markup, approx-price note
- [x] Order success `/order-success/:id`
- [x] My orders `/orders` — active/history tabs + cancelled + empty
- [x] Order tracking `/orders/:id` — timeline, cancel sheet, refund-in-progress card, order & customer IDs
- [x] Profile `/profile`
- [x] Favourites `/favourites` (+ empty)
- [x] Edit profile `/profile/edit`
- [x] Change password `/profile/password`
- [x] Saved addresses `/addresses`
- [x] Add / edit address `/addresses/new`, `/addresses/:id/edit`
- [x] Notifications `/notifications`
- [x] Report a problem `/report` (+ submitted state)
- [x] Refer & earn `/refer`
- [x] Monthly delivery pass `/subscription` (+ active state)
- [x] Terms `/terms`, Privacy `/privacy`
- [x] No internet `/offline`
- [x] Service closed `/closed`
- [x] Slot full `/slot-full`

## C. AI assistant
- [x] Chat `/ai`
- [x] Typing indicator
- [x] Budget bundle builder
- [x] Busy / human fallback `/ai/busy`
- [x] Rule-based replies only — prices always come from the seeded catalogue

## D. Footer & information
- [x] Footer block (Profile)
- [x] About `/about`
- [x] Contact `/contact`
- [x] Help / FAQ `/faq`
- [x] Privacy `/privacy`
- [x] Terms `/terms`
- [x] Refund policy `/refund-policy`
- [x] Public delivery-fee table `/delivery-fees`
- [x] Earn Money sections `/earn`

## E. Rider
- [x] Application `/apply-rider`
- [x] Application received
- [x] Pending sign-in notice `/rider` (when the application is pending)
- [x] Rider home `/rider`
- [x] Today's deliveries
- [x] History `/rider/history` + history details
- [x] Earnings `/rider/earnings`
- [x] Payout request history
- [x] Order detail `/rider/orders/:id`
- [x] Tracking update panel ("গোশালা থেকে কিনলাম" + custom note)
- [x] Delivered confirmation
- [x] Failed delivery report
- [x] Delivery proof

## F. Admin & operator
- [x] Overview `/admin`
- [x] Orders `/admin/orders` + rider assignment
- [x] Order detail `/admin/orders/:id`
- [x] Rider management `/admin/riders`
- [x] Payouts `/admin/payouts`
- [x] Affiliate management `/admin/affiliates`
- [x] Approvals `/admin/approvals`
- [x] Business controls (service switch + slot switch, persisted)
- [x] Settings `/admin/settings`
- [x] Product list `/admin/products`
- [x] Add product `/admin/products/new`
- [x] Edit product `/admin/products/:id/edit`
- [x] Restaurant form `/admin/restaurants`
- [x] Menu items `/admin/restaurants/:id/menu`
- [x] Promotions `/admin/promotions`
- [x] Areas & fees editor `/admin/areas`
- [x] Fee table
- [x] Customers `/admin/customers` + subscriptions
- [x] Reviews moderation `/admin/reviews`
- [x] Send notification `/admin/notifications`
- [x] Reports & summaries `/admin/reports`
- [x] Problem inbox `/admin/problems`
- [x] Problem detail + refund action with ৩/৫/৭ business-day chips `/admin/problems/:id`
- [x] Refund customer-progress card
- [x] Quick search `/admin/search`
- [x] Customer 360° `/admin/customers/:id`
- [x] Order lookup with complaint
- [x] Staff permissions `/admin/staff`
- [x] Restricted staff dashboard `/staff`
- [x] Team activity log `/admin/activity`
- [x] Today's bazaar buying list `/staff/buying`
- [x] Operator today's orders `/staff`
- [x] Operator order detail `/staff/orders/:id`
- [x] Operator daily summary `/staff/summary`

## G. Affiliate
- [x] Application `/apply-affiliate`
- [x] Application received
- [x] Home `/affiliate`
- [x] Referral tools `/affiliate/tools`
- [x] Earnings & payout `/affiliate/earnings`

## H. Templates
- [x] Delivery confirmation SMS / push templates `/admin/templates`
