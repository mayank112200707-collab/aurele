# AURÈLE — Launch Checklist

Your site now has real checkout, a content manager, and legal pages. A few things only *you* can finish (they need your actual accounts/keys):

## 1. Connect Stripe (required to accept payments)
1. Create a Stripe account at https://dashboard.stripe.com if you don't have one.
2. In Stripe, go to **Developers → API keys** and copy your **Secret key** (starts with `sk_live_...` for real payments, or `sk_test_...` while testing).
3. In Netlify: **Site settings → Environment variables → Add a variable**
   - Key: `STRIPE_SECRET_KEY`
   - Value: your Stripe secret key
4. Redeploy the site after adding the variable.
5. Test with Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC — while using a `sk_test_...` key.

## 2. Finish connecting the CMS (admin/config.yml)
Open `admin/config.yml` and replace:
- `YOUR-GITHUB-USERNAME/YOUR-REPO-NAME` → your actual GitHub repo, e.g. `janedoe/aurele-site`
- `YOUR-SITE-ID` → the site ID from your decapbridge.com dashboard

Then commit and push. You'll manage products and photos at `yourdomain.com/admin`.

## 3. Replace the placeholder email
Search the project for `concierge@aurele.luxury` (it's in `index.html`, `shipping.html`, `returns.html`, `privacy.html`, `terms.html`) and swap in your real order/contact email.

## 4. Update robots.txt
Replace `YOUR-SITE-DOMAIN` in `robots.txt` with your real Netlify domain.

## 5. Add real product photos
Once the CMS is connected, upload photos through `/admin` — no code changes needed. Until then, the site uses tasteful gradient placeholders.

## 6. Review legal pages
`shipping.html`, `returns.html`, `privacy.html`, and `terms.html` contain solid starter policies, but they are not legal advice — have a lawyer review them before taking real orders, especially if you ship internationally or operate in the EU/UK (GDPR).

## 7. Deploy
Push everything to your GitHub repo connected to Netlify. Netlify will run `npm install` (installs the Stripe library) and deploy the `create-checkout-session` function automatically — no extra build steps needed.

---

### What's already done for you
- ✅ Real Stripe Checkout — prices are verified server-side from `products.json`, never trusted from the browser
- ✅ Success and cancel pages after payment
- ✅ Shipping, Returns, Privacy, and Terms pages, linked in the footer
- ✅ Decap CMS admin panel wired up at `/admin`
- ✅ Security headers and `robots.txt`
