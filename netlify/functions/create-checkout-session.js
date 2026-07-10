const Stripe = require('stripe');
const products = require('../../products.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe is not configured on this site yet.' }) };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { items } = JSON.parse(event.body || '{}');

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items provided.' }) };
    }

    // Always price from products.json on the server — never trust amounts sent by the browser.
    const line_items = items.map((item) => {
      const product = products.products.find((p) => p.id === item.id);
      if (!product) throw new Error(`Invalid product id: ${item.id}`);
      const qty = Math.max(1, Math.min(10, parseInt(item.qty, 10) || 1));
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            metadata: { product_id: String(product.id), category: product.cat },
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: qty,
      };
    });

    const siteUrl = process.env.URL || `https://${event.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel.html`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'FR', 'IT', 'DE', 'ES', 'JP', 'AU', 'CH'],
      },
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Checkout session error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Checkout failed.' }) };
  }
};
