# Guest Checkout Toggle — Implementation Spec (for Claude Code)

## Read this first
Same caveat as `whatsapp-checkout-spec.md`: this is written from documentation, not the live source. Read the actual current files (models, controllers, routes, `ProtectedRoute`, cart slice/hooks) before changing anything, and match existing naming/patterns rather than the guesses below.

This spec is meant to be read **alongside** `whatsapp-checkout-spec.md` — guest checkout and WhatsApp checkout both terminate in the same order-creation call, and should be built to compose cleanly rather than as two separate pipelines.

## Goal
Right now the site forces account creation before a customer can do anything with the cart, which is hurting conversions. Add a **guest checkout mode** so people can browse, add to cart, and place an order with just name/phone/address — no password, no account. Keep the existing account-required flow fully working too, and make the choice between them an **admin settings toggle**, exactly like the `payment.activeMethod` toggle from the WhatsApp spec. Default going live: guest checkout.

## Business context
- Both modes must be 100% functional at all times — this is a toggle, not "build guest checkout and delete the old flow."
- Future (not building now): if the store later switches back to Razorpay for payments, the owner plans to add Google OAuth to make account creation painless at that point. Nothing to build for that now — just don't hardcode password-only assumptions so deeply into new code that adding OAuth later becomes a rewrite.
- Keep it lightweight. No new heavy dependencies needed for this.

## Hard constraints
1. Both `guest` and `account_required` modes must work simultaneously in the codebase, switched by one Settings field — not a feature flag that only half-works or requires code changes to flip.
2. Do not remove or weaken the existing account flow — register/login, saved addresses, wishlist, order history all keep working exactly as today when the toggle is set to `account_required`.
3. Reuse the shared order-creation logic from `whatsapp-checkout-spec.md` — a guest order and a logged-in-user order should go through the same price recompute / coupon re-validation / atomic stock decrement, just with different identity sources.
4. Server never trusts client-sent prices/stock — same principle as everywhere else in this codebase, guest or not.

## Target behavior
- **`checkoutMode: "account_required"`** (today's behavior): cart/checkout stay behind login, exactly as they work now. No changes to this path at all.
- **`checkoutMode: "guest"`** (new default): cart and checkout are reachable without logging in. At the address step, a guest fills in name, phone, and delivery address directly (no password). Order gets created with no `userId`, tagged with that guest info instead. Everything downstream (stock decrement, coupon logic, WhatsApp redirect from the other spec) behaves the same either way.
- Logged-in users always get the logged-in experience (saved addresses, order tied to their account) regardless of the toggle — the toggle only controls whether a *guest* is allowed through, not what happens to people who are already logged in.

## Backend changes

### 1. Settings model
Add:
- `auth.checkoutMode` — enum `"guest" | "account_required"`, default `"guest"`.

Expose via the public settings endpoint (same one already serving `payment.activeMethod`), and add this toggle next to that one on the existing admin Settings screen — same UI pattern, two independent switches.

### 2. Auth middleware
Add a new "optional auth" middleware alongside the existing `verifyToken`: if a valid token is present it populates `req.user` (same as `verifyToken`); if absent, it lets the request through with `req.user` unset instead of rejecting it. This is what checkout-related routes will use instead of a hard `verifyToken` gate.

Keep `verifyToken`/`authSeller`/`authAdmin` untouched everywhere else — this new middleware is additive, used only where guest access needs to be possible.

### 3. Which routes actually need to change
Keep this change contained — most routes don't need to move:
- `POST /api/order/createOrder` (or equivalent): switch from `verifyToken` to the new optional-auth middleware. The controller enforces the actual rule (see below).
- Cart endpoints, `getOrder`/My Orders, wishlist, saved-address management: **leave these behind `verifyToken` as-is.** Guests don't touch the server cart at all (see frontend section) — they submit their full cart directly at order-creation time instead of building it up server-side first.

### 4. Order controller — the actual gate
Inside order creation, after optional-auth has run:
- If `settings.auth.checkoutMode === "account_required"` and there's no `req.user` → reject with 401, same message style as other auth failures in this codebase.
- If `checkoutMode === "guest"`:
  - `req.user` present → identical to today's behavior (address pulled from `user.addresses`, order tied to `userId`).
  - `req.user` absent → treat as guest: address and `guestInfo: { name, phone }` come straight from the request body, `userId` stays null.
- From this point on — price recompute, coupon re-validation, atomic stock decrement with the race guard, best-effort confirmation email/WhatsApp handoff — is identical for both cases. Don't fork this part; it should be the same shared function referenced in the WhatsApp spec.

### 5. Order model
- Make `userId` optional/nullable.
- Add `guestInfo: { name, phone }`, populated only when there's no `userId`.
- Address stays whatever denormalized-snapshot shape the model already uses — for a guest it's just populated straight from the checkout form instead of copied from `user.addresses`.

## Frontend changes

### 1. Settings fetch
Read `auth.checkoutMode` off the same public-settings call already used for payment settings.

### 2. Route guarding
Update `ProtectedRoute` (or wherever cart/checkout is currently gated) so:
- `account_required` → behaves exactly as today, no change.
- `guest` → cart and checkout pages become reachable without login. My Orders, Wishlist, and saved-address management stay behind login regardless — those genuinely need an account and aren't part of this toggle.

### 3. Cart behavior
- Logged-in users: unchanged, server-backed cart as today.
- Guests under `checkoutMode: "guest"`: cart lives client-side (Redux + localStorage so it survives a refresh), mirroring the same item shape the server cart uses so the rest of the UI (cart page, header item-count badge, etc.) doesn't need to know or care which mode it's in. No cart API calls until the order is actually submitted — at that point the full item list goes straight into the order-creation request.
- Not required for v1, flag as a future nice-to-have: if a guest logs in partway through, merge their local cart into their new server cart.

### 4. Address / checkout step
- Logged-in users: existing saved-address picker, unchanged.
- Guests: a plain inline form — name, phone, address line 1/2, city, state, pincode. No password field. (Optional, skip for now unless asked: a soft "save this for next time?" link that leads to registration — not required for v1.)
- Both paths feed into the same order-creation call, and from there into the WhatsApp-redirect flow already spec'd.

## Explicitly out of scope / do not touch
- Google OAuth — not building now, just don't box it out for later.
- Wishlist — stays account-only no matter what this toggle is set to.
- My Orders / order-tracking page for guests — not building an order-lookup page in this pass. (If ever wanted: order ID + phone lookup is the usual pattern — call it out as future work, don't build it now.)
- Razorpay/WhatsApp payment logic — untouched by this spec; this only changes who can reach checkout and what identity gets attached to the resulting order.

## Edge cases
- Admin flips `checkoutMode` back to `account_required` after guest orders already exist — historical guest orders stay exactly as they are, no backfill needed.
- Guest cart sitting in localStorage across visits — clear it on successful order submission at minimum, so old items don't reappear on a later visit; a simple TTL is a reasonable bonus but not required.

## Testing
- Order creation succeeds with `req.user` present (existing path) and with `req.user` absent + `guestInfo` present (new path).
- Confirm the 401 only fires when `checkoutMode === "account_required"` and there's no token — not in the guest case, not for logged-in users under either setting.
