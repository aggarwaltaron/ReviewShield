import { useState, useEffect, useRef } from "react";

// ─── Shared Data Store (simulates backend) ───────────────────────────────────
const STORE = {
  businesses: [
    {
      id: "demo001",
      name: "Spice Garden Restaurant",
      email: "owner@spicegarden.com",
      phone: "9876543210",
      googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
      plan: "pro",
      createdAt: "2025-01-15",
      feedbacks: [
        { id: 1, rating: 2, message: "Food was cold and service was slow.", name: "Rahul S.", date: "2025-04-01", read: false },
        { id: 2, rating: 1, message: "Very disappointing experience. Will not return.", name: "Priya M.", date: "2025-03-28", read: true },
        { id: 3, rating: 3, message: "Average food, nothing special.", name: "Amit K.", date: "2025-03-20", read: true },
      ],
      positivesSent: 47,
      totalScans: 62,
    }
  ],
  currentBusiness: null,
  reviewSession: null,
};

const PLANS = [
  { id: "starter", name: "Starter", price: "₹999", period: "/mo", amount: 99900, scans: "500 scans/mo", locations: "1 location", features: ["Custom review page", "QR code", "Email alerts", "Basic analytics"], color: "#6ee7b7" },
  { id: "pro", name: "Pro", price: "₹2,499", period: "/mo", amount: 249900, scans: "Unlimited scans", locations: "5 locations", features: ["Everything in Starter", "Custom branding", "SMS alerts", "Advanced analytics", "Priority support"], color: "#fbbf24", popular: true },
  { id: "agency", name: "Agency", price: "₹7,999", period: "/mo", amount: 799900, scans: "Unlimited everything", locations: "Unlimited locations", features: ["White-label dashboard", "Client management", "API access", "Reseller rights", "Dedicated account manager"], color: "#a78bfa" },
];

// ─── Razorpay Key — replace with your live key from dashboard.razorpay.com ──
const RAZORPAY_KEY = "rzp_test_REPLACE_WITH_YOUR_KEY";

// ─── Load Razorpay script dynamically ────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Open Razorpay Checkout ───────────────────────────────────────────────────
async function openRazorpay({ plan, business, onSuccess }) {
  const loaded = await loadRazorpay();
  if (!loaded) { alert("Payment gateway failed to load. Check your internet connection."); return; }

  // In production: call your backend here to create an order and get order_id
  // const res = await fetch("/api/create-order", { method:"POST", body: JSON.stringify({ amount: plan.amount }) });
  // const { order_id } = await res.json();

  const options = {
    key: RAZORPAY_KEY,
    amount: plan.amount,           // in paise (₹999 = 99900 paise)
    currency: "INR",
    name: "ReviewShield",
    description: `${plan.name} Plan — Monthly Subscription`,
    image: "https://i.imgur.com/3g7nmJC.png", // replace with your logo URL
    // order_id: order_id,          // uncomment when backend is ready
    prefill: {
      name: business?.name || "",
      email: business?.email || "",
      contact: business?.phone || "",
    },
    notes: {
      plan_id: plan.id,
      business_id: business?.id || "new",
    },
    theme: { color: "#f5c842" },
    modal: { backdropclose: false },
    handler: function (response) {
      // response.razorpay_payment_id  → save this in your DB
      // response.razorpay_order_id
      // response.razorpay_signature   → verify on backend
      onSuccess(response);
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", function (resp) {
    alert("Payment failed: " + resp.error.description);
  });
  rzp.open();
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --bg2: #12121a;
    --bg3: #1a1a26;
    --border: rgba(255,255,255,0.07);
    --gold: #f5c842;
    --gold2: #e8a020;
    --green: #22c55e;
    --red: #ef4444;
    --text: #f0f0f5;
    --text2: #9090aa;
    --card: rgba(255,255,255,0.04);
    --radius: 16px;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  .app { min-height: 100vh; }

  /* NAV */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px;
    background: rgba(10,10,15,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--gold); letter-spacing: -0.5px; cursor: pointer; }
  .nav-logo span { color: var(--text); }
  .nav-links { display: flex; gap: 8px; align-items: center; }
  .nav-btn { padding: 9px 20px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
  .nav-btn.ghost { background: transparent; color: var(--text2); }
  .nav-btn.ghost:hover { color: var(--text); background: var(--card); }
  .nav-btn.primary { background: var(--gold); color: #0a0a0f; font-weight: 700; }
  .nav-btn.primary:hover { background: var(--gold2); transform: translateY(-1px); }

  /* HERO */
  .hero {
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 120px 24px 80px;
    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,200,66,0.12) 0%, transparent 70%);
    position: relative; overflow: hidden;
  }
  .hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle 600px at 20% 80%, rgba(168,85,247,0.05) 0%, transparent 60%);
    pointer-events: none;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(245,200,66,0.1); border: 1px solid rgba(245,200,66,0.3);
    padding: 6px 16px; border-radius: 100px; font-size: 13px; color: var(--gold); font-weight: 500;
    margin-bottom: 28px; animation: fadeUp 0.6s ease both;
  }
  .hero h1 {
    font-family: 'Syne', sans-serif; font-size: clamp(42px, 7vw, 80px); font-weight: 800;
    line-height: 1.05; letter-spacing: -2px; margin-bottom: 20px;
    animation: fadeUp 0.6s 0.1s ease both;
  }
  .hero h1 .accent { color: var(--gold); }
  .hero p {
    font-size: 18px; color: var(--text2); max-width: 560px; line-height: 1.6;
    margin-bottom: 40px; animation: fadeUp 0.6s 0.2s ease both;
  }
  .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; animation: fadeUp 0.6s 0.3s ease both; }
  .btn-hero-primary {
    padding: 16px 36px; border-radius: 12px; background: var(--gold); color: #0a0a0f;
    font-size: 16px; font-weight: 700; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all 0.2s; display: flex; align-items: center; gap: 8px;
  }
  .btn-hero-primary:hover { background: var(--gold2); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(245,200,66,0.3); }
  .btn-hero-ghost {
    padding: 16px 36px; border-radius: 12px; background: var(--card); color: var(--text);
    font-size: 16px; font-weight: 500; border: 1px solid var(--border); cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .btn-hero-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }

  .hero-stats {
    display: flex; gap: 40px; margin-top: 64px; justify-content: center;
    animation: fadeUp 0.6s 0.4s ease both;
  }
  .stat { text-align: center; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--gold); }
  .stat-label { font-size: 13px; color: var(--text2); margin-top: 4px; }

  /* HOW IT WORKS */
  .section { padding: 100px 24px; }
  .section-label { text-align: center; font-size: 13px; color: var(--gold); font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
  .section-title { text-align: center; font-family: 'Syne', sans-serif; font-size: clamp(28px,4vw,44px); font-weight: 800; margin-bottom: 16px; letter-spacing: -1px; }
  .section-sub { text-align: center; color: var(--text2); font-size: 17px; max-width: 520px; margin: 0 auto 64px; line-height: 1.6; }

  .steps { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 2px; max-width: 900px; margin: 0 auto; }
  .step {
    background: var(--bg2); padding: 36px 28px; position: relative; overflow: hidden;
    transition: transform 0.2s;
  }
  .step:first-child { border-radius: 16px 0 0 16px; }
  .step:last-child { border-radius: 0 16px 16px 0; }
  .step:hover { transform: translateY(-4px); z-index: 1; }
  .step-num { font-family: 'Syne', sans-serif; font-size: 64px; font-weight: 800; color: rgba(245,200,66,0.08); position: absolute; top: 8px; right: 16px; line-height: 1; }
  .step-icon { font-size: 32px; margin-bottom: 16px; }
  .step-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 10px; }
  .step-desc { font-size: 14px; color: var(--text2); line-height: 1.6; }

  /* FLOW DIAGRAM */
  .flow-box {
    max-width: 700px; margin: 0 auto;
    background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; padding: 40px;
  }
  .flow-row { display: flex; align-items: center; gap: 16px; }
  .flow-node {
    flex: 1; padding: 16px 20px; border-radius: 12px; text-align: center;
    font-size: 14px; font-weight: 500; line-height: 1.4;
  }
  .flow-node.start { background: rgba(245,200,66,0.1); border: 1px solid rgba(245,200,66,0.3); color: var(--gold); }
  .flow-node.question { background: rgba(255,255,255,0.05); border: 1px solid var(--border); }
  .flow-node.good { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; }
  .flow-node.bad { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }
  .flow-arrow { color: var(--text2); font-size: 20px; flex-shrink: 0; }
  .flow-split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  .flow-connector { width: 1px; background: var(--border); height: 20px; margin: 0 auto; }
  .flow-tag { font-size: 12px; text-align: center; color: var(--text2); margin: 4px 0; }

  /* PRICING */
  .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 16px; max-width: 980px; margin: 0 auto; }
  .price-card {
    background: var(--bg2); border: 1px solid var(--border); border-radius: 20px;
    padding: 36px; position: relative; transition: transform 0.2s, border-color 0.2s;
  }
  .price-card:hover { transform: translateY(-6px); }
  .price-card.popular { border-color: var(--gold); }
  .popular-badge {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: var(--gold); color: #0a0a0f; font-size: 12px; font-weight: 700;
    padding: 4px 16px; border-radius: 100px;
  }
  .price-name { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .price-amount { font-family: 'Syne', sans-serif; font-size: 42px; font-weight: 800; line-height: 1; }
  .price-period { color: var(--text2); font-size: 15px; margin-bottom: 24px; }
  .price-scans { font-size: 13px; color: var(--gold); font-weight: 600; margin-bottom: 20px; padding: 8px 12px; background: rgba(245,200,66,0.08); border-radius: 8px; display: inline-block; }
  .price-features { list-style: none; margin-bottom: 32px; display: flex; flex-direction: column; gap: 10px; }
  .price-features li { font-size: 14px; color: var(--text2); display: flex; align-items: center; gap: 10px; }
  .price-features li::before { content: '✓'; color: var(--green); font-weight: 700; flex-shrink: 0; }
  .btn-plan { width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .btn-plan.gold { background: var(--gold); color: #0a0a0f; }
  .btn-plan.gold:hover { background: var(--gold2); }
  .btn-plan.outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .btn-plan.outline:hover { background: var(--card); }

  /* AUTH FORMS */
  .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 100px 24px 40px; background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,200,66,0.06) 0%, transparent 60%); }
  .auth-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 24px; padding: 48px; width: 100%; max-width: 460px; }
  .auth-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  .auth-sub { color: var(--text2); font-size: 15px; margin-bottom: 36px; }
  .form-group { margin-bottom: 18px; }
  .form-label { font-size: 13px; font-weight: 600; color: var(--text2); margin-bottom: 8px; display: block; letter-spacing: 0.3px; }
  .form-input {
    width: 100%; padding: 14px 16px; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 12px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 15px;
    outline: none; transition: border-color 0.2s;
  }
  .form-input:focus { border-color: var(--gold); }
  .form-input::placeholder { color: var(--text2); }
  .btn-submit { width: 100%; padding: 16px; background: var(--gold); color: #0a0a0f; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; margin-top: 8px; }
  .btn-submit:hover { background: var(--gold2); transform: translateY(-1px); }
  .auth-switch { text-align: center; margin-top: 24px; font-size: 14px; color: var(--text2); }
  .auth-switch a { color: var(--gold); cursor: pointer; font-weight: 600; text-decoration: none; }

  /* DASHBOARD */
  .dashboard { display: flex; min-height: 100vh; }
  .sidebar {
    width: 240px; flex-shrink: 0; background: var(--bg2); border-right: 1px solid var(--border);
    padding: 80px 0 24px; display: flex; flex-direction: column;
  }
  .sidebar-logo { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--gold); padding: 0 24px 32px; cursor: pointer; }
  .sidebar-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 4px; }
  .sidebar-item {
    display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 10px;
    font-size: 14px; font-weight: 500; cursor: pointer; color: var(--text2); transition: all 0.2s;
  }
  .sidebar-item:hover { background: var(--card); color: var(--text); }
  .sidebar-item.active { background: rgba(245,200,66,0.1); color: var(--gold); }
  .sidebar-item-icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-bottom { padding: 16px 12px 0; border-top: 1px solid var(--border); }
  .logout-btn { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 10px; font-size: 14px; color: var(--text2); cursor: pointer; transition: all 0.2s; }
  .logout-btn:hover { background: rgba(239,68,68,0.1); color: var(--red); }

  .main-content { flex: 1; padding: 88px 32px 32px; overflow-y: auto; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; margin-bottom: 6px; }
  .page-sub { color: var(--text2); font-size: 15px; margin-bottom: 32px; }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
  .stat-card-label { font-size: 12px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  .stat-card-num { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
  .stat-card-num.gold { color: var(--gold); }
  .stat-card-num.green { color: var(--green); }
  .stat-card-num.red { color: var(--red); }
  .stat-card-sub { font-size: 12px; color: var(--text2); }

  .panel { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 28px; margin-bottom: 24px; }
  .panel-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 20px; }

  .qr-block { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
  .qr-code { width: 140px; height: 140px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
  .qr-code img { width: 130px; height: 130px; }
  .qr-info { flex: 1; min-width: 200px; }
  .qr-url-box { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: var(--text2); word-break: break-all; margin-bottom: 16px; font-family: monospace; }
  .btn-copy { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--card); border: 1px solid var(--border); border-radius: 10px; font-size: 14px; color: var(--text); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; margin-right: 8px; }
  .btn-copy:hover { background: rgba(255,255,255,0.08); }
  .btn-copy.success { border-color: var(--green); color: var(--green); }

  .google-url-row { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
  .google-url-box { flex: 1; }

  .feedback-list { display: flex; flex-direction: column; gap: 12px; }
  .feedback-item { background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
  .feedback-item.unread { border-left: 3px solid var(--red); }
  .feedback-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
  .feedback-stars { display: flex; gap: 3px; }
  .feedback-star { font-size: 15px; }
  .feedback-name { font-size: 13px; font-weight: 600; color: var(--text2); }
  .feedback-date { font-size: 12px; color: var(--text2); }
  .feedback-msg { font-size: 14px; line-height: 1.6; }
  .unread-dot { width: 8px; height: 8px; background: var(--red); border-radius: 50%; flex-shrink: 0; }
  .badge-new { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--red); font-size: 11px; padding: 2px 10px; border-radius: 100px; font-weight: 600; }

  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--border); }
  .settings-row:last-child { border-bottom: none; }
  .settings-label { font-size: 14px; font-weight: 500; }
  .settings-desc { font-size: 12px; color: var(--text2); margin-top: 2px; }
  .toggle { width: 44px; height: 24px; background: var(--bg3); border-radius: 100px; position: relative; cursor: pointer; transition: background 0.2s; border: 1px solid var(--border); }
  .toggle.on { background: var(--green); }
  .toggle::after { content: ''; width: 18px; height: 18px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 3px; transition: transform 0.2s; }
  .toggle.on::after { transform: translateX(20px); }

  /* REVIEW PAGE (customer facing) */
  .review-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: linear-gradient(135deg, #0a0a0f 0%, #1a1015 100%); }
  .review-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 28px; padding: 52px 44px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 40px 80px rgba(0,0,0,0.5); }
  .review-logo { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--gold); margin-bottom: 32px; }
  .review-biz { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; margin-bottom: 10px; }
  .review-ask { color: var(--text2); font-size: 16px; margin-bottom: 36px; line-height: 1.5; }
  .stars-row { display: flex; justify-content: center; gap: 10px; margin-bottom: 32px; }
  .star-btn { font-size: 44px; cursor: pointer; transition: transform 0.15s; filter: grayscale(1) opacity(0.3); border: none; background: none; padding: 4px; }
  .star-btn.active { filter: none; transform: scale(1.15); }
  .star-btn:hover { filter: none; transform: scale(1.2); }
  .rating-label { font-size: 14px; color: var(--text2); margin-bottom: 24px; height: 20px; }
  .btn-rate { padding: 16px 48px; background: var(--gold); color: #0a0a0f; border: none; border-radius: 14px; font-size: 17px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .btn-rate:hover { background: var(--gold2); transform: translateY(-2px); }
  .btn-rate:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .feedback-form textarea {
    width: 100%; min-height: 120px; padding: 16px; background: var(--bg3);
    border: 1px solid var(--border); border-radius: 14px; color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 15px; resize: vertical; outline: none;
    margin-bottom: 16px; transition: border-color 0.2s;
  }
  .feedback-form textarea:focus { border-color: var(--gold); }
  .success-icon { font-size: 64px; margin-bottom: 16px; }

  /* ANIMATIONS */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

  .fade-in { animation: fadeUp 0.4s ease both; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .nav { padding: 12px 16px; }
    .sidebar { display: none; }
    .main-content { padding: 88px 16px 24px; }
    .qr-block { flex-direction: column; }
    .hero-stats { gap: 24px; }
    .review-card { padding: 36px 24px; }
  }
`;

// ─── Star Rating Labels ───────────────────────────────────────────────────────
const STAR_LABELS = { 1: "Very Poor", 2: "Poor", 3: "Average", 4: "Good", 5: "Excellent! 🎉" };

// ─── Components ──────────────────────────────────────────────────────────────

// ─── Pricing Card with Razorpay ───────────────────────────────────────────────
function PricingCard({ plan, setPage, currentBusiness }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    // If no account yet, go to register first
    if (!currentBusiness) { setPage("register"); return; }
    setLoading(true);
    await openRazorpay({
      plan,
      business: currentBusiness,
      onSuccess: (response) => {
        setLoading(false);
        // In production: verify payment on your backend before activating plan
        alert(`✅ Payment successful!\nPayment ID: ${response.razorpay_payment_id}\n\nYour ${plan.name} plan is now active.`);
      },
    });
    setLoading(false);
  };

  return (
    <div className={`price-card ${plan.popular ? "popular" : ""}`}>
      {plan.popular && <div className="popular-badge">MOST POPULAR</div>}
      <div className="price-name" style={{ color: plan.color }}>{plan.name}</div>
      <div>
        <span className="price-amount">{plan.price}</span>
        <span className="price-period">{plan.period}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>then billed monthly · cancel anytime</div>
      <div className="price-scans" style={{ color: plan.color, background: `${plan.color}15` }}>{plan.scans} · {plan.locations}</div>
      <ul className="price-features">
        {plan.features.map(f => <li key={f}>{f}</li>)}
      </ul>
      <button
        className={`btn-plan ${plan.popular ? "gold" : "outline"}`}
        onClick={handlePay}
        disabled={loading}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
      >
        {loading ? "Opening payment..." : (
          <>
            {plan.popular ? "Start Free Trial" : "Get Started"}
            <span style={{ fontSize:11, opacity:0.7 }}>· UPI / Card</span>
          </>
        )}
      </button>
      <div style={{ marginTop:10, display:"flex", justifyContent:"center", gap:6 }}>
        {["🔒","UPI","Visa","RuPay"].map(b => (
          <span key={b} style={{ fontSize:10, color:"var(--text2)", background:"var(--bg3)", padding:"2px 6px", borderRadius:4 }}>{b}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Payment Success Page ─────────────────────────────────────────────────────
function PaymentSuccess({ setPage, plan }) {
  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <div className="auth-title">Payment Successful!</div>
        <div className="auth-sub" style={{ marginBottom:24 }}>Your {plan?.name || "Pro"} plan is now active.</div>
        <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:12, padding:20, marginBottom:24, textAlign:"left" }}>
          <div style={{ fontSize:13, color:"var(--text2)", marginBottom:6 }}>What's next:</div>
          {["Your QR code is ready in the dashboard","Share it with your first customer today","Expect results in 7–14 days"].map((s,i) => (
            <div key={i} style={{ fontSize:14, padding:"6px 0", borderBottom: i<2 ? "1px solid var(--border)" : "none", display:"flex", gap:10 }}>
              <span style={{ color:"var(--green)" }}>✓</span>{s}
            </div>
          ))}
        </div>
        <button className="btn-submit" onClick={() => setPage("dashboard")}>Go to Dashboard →</button>
      </div>
    </div>
  );
}

function Nav({ page, setPage, currentBusiness }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => setPage("home")}>Review<span>Shield</span></div>
      <div className="nav-links">
        {currentBusiness ? (
          <>
            <button className="nav-btn ghost" onClick={() => setPage("dashboard")}>Dashboard</button>
            <button className="nav-btn primary" onClick={() => setPage("review-preview")}>Preview Review Page</button>
          </>
        ) : (
          <>
            <button className="nav-btn ghost" onClick={() => setPage("login")}>Login</button>
            <button className="nav-btn primary" onClick={() => setPage("register")}>Start Free Trial</button>
          </>
        )}
      </div>
    </nav>
  );
}

function HomePage({ setPage }) {
  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🛡️ Trusted by 1,200+ Indian Businesses</div>
        <h1>Stop Bad Reviews From<br />Reaching <span className="accent">Google</span></h1>
        <p>ReviewShield intelligently routes unhappy customers to a private feedback form — so only your happiest customers leave public Google reviews.</p>
        <div className="hero-cta">
          <button className="btn-hero-primary" onClick={() => setPage("register")}>
            Get Started Free →
          </button>
          <button className="btn-hero-ghost" onClick={() => setPage("demo-review")}>
            See Live Demo
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat"><div className="stat-num">4.8★</div><div className="stat-label">Average Google rating</div></div>
          <div className="stat"><div className="stat-num">1,200+</div><div className="stat-label">Businesses protected</div></div>
          <div className="stat"><div className="stat-num">+1.3★</div><div className="stat-label">Average rating lift in 60 days</div></div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section" style={{ background: "var(--bg2)" }}>
        <div className="section-label">Why ReviewShield</div>
        <div className="section-title">Everything You Need to<br />Dominate Your Ratings</div>
        <div className="section-sub">Our proprietary smart review system works silently in the background — protecting your reputation 24/7.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, maxWidth: 900, margin: "0 auto" }}>
          {[
            { icon: "📱", title: "QR Code & Smart Link", desc: "One QR code on your counter, receipt, or table. Customers scan it, we handle the rest automatically." },
            { icon: "🛡️", title: "Reputation Protection", desc: "Our proprietary AI layer ensures only your happiest customers ever make it to your public Google profile." },
            { icon: "📬", title: "Private Feedback Inbox", desc: "Unhappy customers? Their feedback lands in your private dashboard so you can fix issues internally." },
            { icon: "📊", title: "Live Analytics", desc: "Track your rating trend, scan volume, and customer sentiment — all in one clean dashboard." },
            { icon: "🔔", title: "Instant Alerts", desc: "Get notified immediately when new feedback comes in, so you can respond and recover fast." },
            { icon: "🏢", title: "Multi-Location Ready", desc: "Managing a chain? Get separate QR codes and dashboards for every location under one account." },
          ].map((b, i) => (
            <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px" }}>
              <div style={{ fontSize: 30, marginBottom: 14 }}>{b.icon}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{b.title}</div>
              <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="section" style={{ background: "var(--bg)" }}>
        <div className="section-label">Results</div>
        <div className="section-title">Real Businesses, Real Results</div>
        <div className="section-sub">Across restaurants, salons, clinics, and real estate offices — ReviewShield delivers.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, maxWidth: 900, margin: "0 auto" }}>
          {[
            { name: "Spice Garden Restaurant, Delhi", before: "3.6★", after: "4.7★", time: "In 60 days", quote: "We went from being embarrassed about our Google rating to actively promoting it." },
            { name: "Glow Salon & Spa, Mumbai", before: "3.9★", after: "4.8★", time: "In 45 days", quote: "Worth every rupee. Our walk-in customers have visibly increased since our rating went up." },
            { name: "PrimeCare Clinic, Bangalore", before: "4.1★", after: "4.9★", time: "In 30 days", quote: "The private feedback actually helped us fix real issues we didn't even know existed." },
          ].map((t, i) => (
            <div key={i} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                <div style={{ textAlign: "center", flex: 1, padding: "12px 0", background: "rgba(239,68,68,0.06)", borderRadius: 10 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Syne, sans-serif", color: "#ef4444" }}>{t.before}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>BEFORE</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", color: "var(--text2)", fontSize: 18 }}>→</div>
                <div style={{ textAlign: "center", flex: 1, padding: "12px 0", background: "rgba(34,197,94,0.06)", borderRadius: 10 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Syne, sans-serif", color: "#22c55e" }}>{t.after}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{t.time}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, fontStyle: "italic", marginBottom: 14 }}>"{t.quote}"</div>
              <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>— {t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="section-label">Pricing</div>
        <div className="section-title">Simple, Transparent Plans</div>
        <div className="section-sub">14-day free trial on all plans. Pay via UPI, Card, Net Banking, or Wallet.</div>
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:32, flexWrap:"wrap" }}>
          {["UPI","Visa","Mastercard","RuPay","Net Banking","Wallets"].map(m => (
            <span key={m} style={{ fontSize:12, padding:"4px 12px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:100, color:"var(--text2)" }}>{m}</span>
          ))}
        </div>
        <div className="pricing-grid">
          {PLANS.map(plan => (
            <PricingCard key={plan.id} plan={plan} setPage={setPage} currentBusiness={null} />
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--text2)" }}>
          🔒 Secured by Razorpay · 256-bit SSL encryption · Cancel anytime
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "32px", color: "var(--text2)", fontSize: 13, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: "var(--gold)", marginBottom: 8 }}>ReviewShield</div>
        <div>© 2026 ReviewShield · All rights reserved · Made in India 🇮🇳</div>
      </footer>
    </div>
  );
}

function RegisterPage({ setPage, setCurrentBusiness }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", business: "", googleUrl: "", plan: "pro" });
  const [step, setStep] = useState("details"); // details | payment
  const [loading, setLoading] = useState(false);
  const [newBiz, setNewBiz] = useState(null);

  const handleCreateAccount = () => {
    if (!form.name || !form.email || !form.business) {
      alert("Please fill in your name, business name, and email."); return;
    }
    setLoading(true);
    setTimeout(() => {
      const biz = {
        id: "biz_" + Date.now(),
        name: form.business,
        email: form.email,
        phone: form.phone,
        googleReviewUrl: form.googleUrl || "https://search.google.com/local/writereview?placeid=PASTE_YOUR_PLACE_ID",
        plan: form.plan,
        createdAt: new Date().toISOString().split("T")[0],
        feedbacks: [],
        positivesSent: 0,
        totalScans: 0,
      };
      STORE.businesses.push(biz);
      STORE.currentBusiness = biz;
      setNewBiz(biz);
      setCurrentBusiness(biz);
      setLoading(false);
      setStep("payment");
    }, 800);
  };

  const handlePay = async () => {
    const selectedPlan = PLANS.find(p => p.id === form.plan);
    setLoading(true);
    await openRazorpay({
      plan: selectedPlan,
      business: newBiz,
      onSuccess: (response) => {
        setLoading(false);
        // ✅ In production: POST response to your backend to verify & activate
        // fetch('/api/verify-payment', { method:'POST', body: JSON.stringify(response) })
        setPage("dashboard");
      },
    });
    setLoading(false);
  };

  const selectedPlan = PLANS.find(p => p.id === form.plan);

  return (
    <div className="auth-page">
      {step === "details" && (
        <div className="auth-card fade-in">
          {/* Step indicator */}
          <div style={{ display:"flex", gap:8, marginBottom:28 }}>
            {[{n:1,label:"Your Details"},{n:2,label:"Payment"}].map((s,i) => (
              <div key={i} style={{ flex:1, textAlign:"center" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background: s.n===1 ? "var(--gold)" : "var(--bg3)", color: s.n===1 ? "#0a0a0f" : "var(--text2)", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 4px" }}>{s.n}</div>
                <div style={{ fontSize:11, color: s.n===1 ? "var(--gold)" : "var(--text2)", fontWeight: s.n===1 ? 600 : 400 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="auth-title">Create Your Account</div>
          <div className="auth-sub">Takes 60 seconds · 14-day free trial</div>
          <div className="form-group">
            <label className="form-label">YOUR NAME</label>
            <input className="form-input" placeholder="Tarun Gupta" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">BUSINESS NAME</label>
            <input className="form-input" placeholder="Spice Garden Restaurant" value={form.business} onChange={e => setForm({ ...form, business: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">EMAIL ADDRESS</label>
            <input className="form-input" placeholder="you@business.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">PHONE NUMBER</label>
            <input className="form-input" placeholder="9911591033" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">GOOGLE REVIEW LINK (optional — add later)</label>
            <input className="form-input" placeholder="https://search.google.com/local/writereview?placeid=..." value={form.googleUrl} onChange={e => setForm({ ...form, googleUrl: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">SELECT PLAN</label>
            <select className="form-input" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={{ cursor:"pointer" }}>
              {PLANS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price}/mo · {p.scans}</option>)}
            </select>
          </div>
          <button className="btn-submit" onClick={handleCreateAccount} disabled={loading}>
            {loading ? "Setting up your account..." : "Continue to Payment →"}
          </button>
          <div className="auth-switch">Already have an account? <a onClick={() => setPage("login")}>Login</a></div>
        </div>
      )}

      {step === "payment" && (
        <div className="auth-card fade-in" style={{ maxWidth:500 }}>
          {/* Step indicator */}
          <div style={{ display:"flex", gap:8, marginBottom:28 }}>
            {[{n:1,label:"Your Details"},{n:2,label:"Payment"}].map((s,i) => (
              <div key={i} style={{ flex:1, textAlign:"center" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background: s.n===2 ? "var(--gold)" : "var(--green)", color: "#0a0a0f", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 4px" }}>{s.n===1 ? "✓" : "2"}</div>
                <div style={{ fontSize:11, color: s.n===2 ? "var(--gold)" : "var(--green)", fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="auth-title">Complete Payment</div>
          <div className="auth-sub">Your account is ready. Start your plan below.</div>

          {/* Order summary */}
          <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:14, padding:20, marginBottom:24 }}>
            <div style={{ fontSize:12, color:"var(--text2)", marginBottom:12, fontWeight:600, letterSpacing:"0.5px" }}>ORDER SUMMARY</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:15, fontWeight:600 }}>{selectedPlan?.name} Plan — 1 Month</span>
              <span style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:800, color:"var(--gold)" }}>{selectedPlan?.price}</span>
            </div>
            <div style={{ fontSize:13, color:"var(--text2)", paddingTop:10, borderTop:"1px solid var(--border)" }}>
              {selectedPlan?.features.slice(0,3).map(f => <div key={f} style={{ marginBottom:4 }}>✓ {f}</div>)}
              <div style={{ color:"var(--green)", marginTop:8, fontWeight:600 }}>+ 14-day free trial included</div>
            </div>
          </div>

          {/* Payment methods */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
            {["UPI","GPay","PhonePe","Paytm","Card","Net Banking","Wallets"].map(m => (
              <span key={m} style={{ fontSize:11, padding:"3px 10px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:100, color:"var(--text2)" }}>{m}</span>
            ))}
          </div>

          <button className="btn-submit" onClick={handlePay} disabled={loading}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontSize:16 }}>
            {loading ? "Opening Razorpay..." : (
              <><span>🔒</span> Pay {selectedPlan?.price} via Razorpay</>
            )}
          </button>

          <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"var(--text2)" }}>
            256-bit SSL · Your card details are never stored by us · Powered by Razorpay
          </div>
          <div style={{ textAlign:"center", marginTop:10 }}>
            <span style={{ fontSize:13, color:"var(--text2)", cursor:"pointer" }} onClick={() => { setPage("dashboard"); }}>
              Skip for now → Go to dashboard (trial mode)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginPage({ setPage, setCurrentBusiness }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const handleLogin = () => {
    STORE.currentBusiness = STORE.businesses[0];
    setCurrentBusiness(STORE.businesses[0]);
    setPage("dashboard");
  };
  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-title">Welcome Back</div>
        <div className="auth-sub">Login to your ReviewShield dashboard</div>
        <div className="form-group">
          <label className="form-label">EMAIL ADDRESS</label>
          <input className="form-input" placeholder="you@business.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">PASSWORD</label>
          <input className="form-input" placeholder="••••••••" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>Demo: use email <strong style={{color:"var(--gold)"}}>owner@spicegarden.com</strong></div>
        <button className="btn-submit" onClick={handleLogin}>Login to Dashboard →</button>
        <div className="auth-switch">No account? <a onClick={() => setPage("register")}>Start free trial</a></div>
      </div>
    </div>
  );
}

function Dashboard({ currentBusiness, setPage, setCurrentBusiness }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [biz, setBiz] = useState(currentBusiness);
  const [settings, setSettings] = useState({ threshold: 4, emailAlerts: true, smsAlerts: false, autoreply: false });

  const reviewLink = `https://reviewshield.in/r/${biz.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reviewLink)}&bgcolor=ffffff&color=000000&margin=10`;

  const unreadCount = biz.feedbacks.filter(f => !f.read).length;
  const negativeRate = biz.totalScans > 0 ? Math.round(((biz.feedbacks.length) / biz.totalScans) * 100) : 0;

  const handleCopy = () => {
    navigator.clipboard?.writeText(reviewLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markRead = (id) => {
    const updated = { ...biz, feedbacks: biz.feedbacks.map(f => f.id === id ? { ...f, read: true } : f) };
    setBiz(updated);
    STORE.currentBusiness = updated;
  };

  const NAV_ITEMS = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "qrcode", icon: "📱", label: "QR & Links" },
    { id: "feedback", icon: "💬", label: `Feedback Inbox ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
    { id: "billing", icon: "💳", label: "Billing & Plans" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => setPage("home")}>ReviewShield</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <div key={item.id} className={`sidebar-item ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)}>
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div className="sidebar-item" onClick={() => setPage("review-preview")}>
            <span className="sidebar-item-icon">👁️</span>
            Preview Review Page
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div style={{ padding: "0 16px 12px", fontSize: 13, color: "var(--text2)" }}>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>{biz.name}</div>
            <div style={{ marginTop: 2 }}>{biz.email}</div>
            <div style={{ marginTop: 4, display: "inline-flex", background: "rgba(245,200,66,0.1)", color: "var(--gold)", fontSize: 11, padding: "2px 10px", borderRadius: 100, fontWeight: 700 }}>{biz.plan.toUpperCase()}</div>
          </div>
          <div className="logout-btn" onClick={() => { STORE.currentBusiness = null; setCurrentBusiness(null); setPage("home"); }}>
            <span>🚪</span> Logout
          </div>
        </div>
      </div>

      <div className="main-content">
        {activeTab === "overview" && (
          <div className="fade-in">
            <div className="page-title">Overview</div>
            <div className="page-sub">Here's how {biz.name} is performing.</div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-label">Total Scans</div>
                <div className="stat-card-num gold">{biz.totalScans + biz.feedbacks.length}</div>
                <div className="stat-card-sub">All time</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Sent to Google</div>
                <div className="stat-card-num green">{biz.positivesSent}</div>
                <div className="stat-card-sub">4★ & 5★ reviews</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Captured (Private)</div>
                <div className="stat-card-num red">{biz.feedbacks.length}</div>
                <div className="stat-card-sub">1–3★ kept private</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Shield Rate</div>
                <div className="stat-card-num gold">{biz.positivesSent > 0 ? Math.round((biz.positivesSent / (biz.positivesSent + biz.feedbacks.length)) * 100) : 0}%</div>
                <div className="stat-card-sub">Positive routing rate</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">🚀 Quick Setup Checklist</div>
              {[
                { done: true, text: "Account created" },
                { done: true, text: "Business profile configured" },
                { done: !!biz.googleReviewUrl.includes("placeid=ChI"), text: "Google Review URL linked — paste your actual Place ID" },
                { done: false, text: "Share QR code with customers" },
                { done: false, text: "Collect your first 10 reviews" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 18 }}>{item.done ? "✅" : "⭕"}</span>
                  <span style={{ fontSize: 14, color: item.done ? "var(--text)" : "var(--text2)" }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-title">📋 How to Get Your Google Review Link</div>
              {["Go to Google and search your business name.", 'Click "Write a review" on your Google Business Profile panel.', "The URL in your browser is your Google Review link.", "Copy it and paste it in Settings → Google Review URL."].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 16, padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 14, color: "var(--text2)", paddingTop: 4 }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "qrcode" && (
          <div className="fade-in">
            <div className="page-title">QR Code & Links</div>
            <div className="page-sub">Share these with customers at checkout, receipts, or on tables.</div>
            <div className="panel">
              <div className="panel-title">Your Unique Review Link & QR Code</div>
              <div className="qr-block">
                <div>
                  <div className="qr-code">
                    <img src={qrUrl} alt="QR Code" />
                  </div>
                  <div style={{ marginTop: 10, textAlign: "center" }}>
                    <button className="btn-copy" onClick={() => { const a = document.createElement('a'); a.href = qrUrl; a.download = 'reviewshield-qr.png'; a.click(); }}>
                      ⬇ Download QR
                    </button>
                  </div>
                </div>
                <div className="qr-info">
                  <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8, fontWeight: 600 }}>YOUR REVIEW LINK</div>
                  <div className="qr-url-box">{reviewLink}</div>
                  <button className={`btn-copy ${copied ? "success" : ""}`} onClick={handleCopy}>
                    {copied ? "✓ Copied!" : "📋 Copy Link"}
                  </button>
                  <button className="btn-copy" onClick={() => setPage("review-preview")}>👁 Preview</button>
                  <div style={{ marginTop: 20, fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                    <strong style={{ color: "var(--text)", display: "block", marginBottom: 8 }}>Where to use this:</strong>
                    Print QR on receipts · Table tents · Business cards · WhatsApp messages · Email signatures · Counter stickers
                  </div>
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-title">🛡️ How Your Protection Works</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: "#22c55e" }}>Happy Customers</div>
                  <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>Satisfied customers are guided to share their experience on <strong>Google</strong> — boosting your public rating.</div>
                </div>
                <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: "#ef4444" }}>Unhappy Customers</div>
                  <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>Customers with concerns share feedback <strong>privately</strong>, giving you a chance to resolve it first.</div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.2)", borderRadius: 10, fontSize: 13, color: "var(--text2)" }}>
                ⚡ Threshold: <strong style={{ color: "var(--gold)" }}>{settings.threshold}★ and above</strong> goes to Google · Change in Settings.
              </div>
            </div>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="fade-in">
            <div className="page-title">Private Feedback Inbox</div>
            <div className="page-sub">These reviews were intercepted before reaching Google. Use them to improve your service.</div>
            {biz.feedbacks.length === 0 ? (
              <div className="panel" style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No negative feedback yet!</div>
                <div style={{ color: "var(--text2)" }}>Your shield is working. Keep sharing the QR code.</div>
              </div>
            ) : (
              <div className="feedback-list">
                {biz.feedbacks.map(f => (
                  <div key={f.id} className={`feedback-item ${!f.read ? "unread" : ""}`} onClick={() => markRead(f.id)}>
                    <div className="feedback-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="feedback-stars">
                          {[1,2,3,4,5].map(s => <span key={s} className="feedback-star" style={{ opacity: s <= f.rating ? 1 : 0.2 }}>⭐</span>)}
                        </div>
                        <span style={{ fontSize: 13, color: f.rating <= 2 ? "var(--red)" : "var(--gold)", fontWeight: 600 }}>{STAR_LABELS[f.rating]}</span>
                        {!f.read && <span className="badge-new">NEW</span>}
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span className="feedback-name">{f.name}</span>
                        <span className="feedback-date">{f.date}</span>
                      </div>
                    </div>
                    <div className="feedback-msg">"{f.message}"</div>
                    {!f.read && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>Click to mark as read</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "billing" && (
          <div className="fade-in">
            <div className="page-title">Billing & Plans</div>
            <div className="page-sub">Manage your subscription. Payments secured by Razorpay.</div>

            {/* Current plan */}
            <div className="panel" style={{ marginBottom: 24 }}>
              <div className="panel-title">📋 Current Plan</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:20, fontWeight:700, fontFamily:"Syne,sans-serif", color:"var(--gold)", marginBottom:4 }}>
                    {PLANS.find(p=>p.id===biz.plan)?.name || "Pro"} Plan
                  </div>
                  <div style={{ fontSize:14, color:"var(--text2)" }}>
                    {PLANS.find(p=>p.id===biz.plan)?.price}/month · Next billing: May 5, 2026
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <span style={{ fontSize:12, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"var(--green)", padding:"4px 14px", borderRadius:100, fontWeight:600 }}>ACTIVE</span>
                </div>
              </div>
              <div style={{ marginTop:16, padding:"12px 16px", background:"var(--bg3)", borderRadius:10, fontSize:13, color:"var(--text2)", display:"flex", gap:20, flexWrap:"wrap" }}>
                <span>💳 Last payment: ₹{PLANS.find(p=>p.id===biz.plan)?.price.replace("₹","") || "2,499"} on Apr 5, 2026</span>
                <span>📧 Receipt sent to {biz.email}</span>
              </div>
            </div>

            {/* Upgrade options */}
            <div className="panel-title" style={{ marginBottom:16 }}>🚀 Upgrade or Change Plan</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14, marginBottom:28 }}>
              {PLANS.map(plan => (
                <div key={plan.id} style={{ background: biz.plan===plan.id ? "rgba(245,200,66,0.05)" : "var(--bg2)", border:`1px solid ${biz.plan===plan.id ? "var(--gold)" : "var(--border)"}`, borderRadius:16, padding:24, position:"relative" }}>
                  {biz.plan===plan.id && <div style={{ position:"absolute", top:-11, left:20, background:"var(--gold)", color:"#0a0a0f", fontSize:10, fontWeight:700, padding:"3px 12px", borderRadius:100 }}>CURRENT PLAN</div>}
                  <div style={{ fontFamily:"Syne,sans-serif", fontSize:17, fontWeight:700, color:plan.color, marginBottom:4 }}>{plan.name}</div>
                  <div style={{ fontSize:28, fontWeight:800, fontFamily:"Syne,sans-serif" }}>{plan.price}<span style={{ fontSize:14, fontWeight:400, color:"var(--text2)" }}>/mo</span></div>
                  <div style={{ fontSize:12, color:"var(--text2)", margin:"8px 0 16px" }}>{plan.scans} · {plan.locations}</div>
                  <button
                    onClick={() => biz.plan !== plan.id && openRazorpay({ plan, business: biz, onSuccess: (r) => alert(`✅ Switched to ${plan.name}!\nPayment ID: ${r.razorpay_payment_id}`) })}
                    disabled={biz.plan === plan.id}
                    style={{ width:"100%", padding:"11px", borderRadius:10, border:`1px solid ${biz.plan===plan.id ? "var(--border)" : plan.color}`, background: biz.plan===plan.id ? "transparent" : `${plan.color}18`, color: biz.plan===plan.id ? "var(--text2)" : plan.color, cursor: biz.plan===plan.id ? "default" : "pointer", fontSize:14, fontWeight:600, fontFamily:"DM Sans,sans-serif" }}
                  >
                    {biz.plan===plan.id ? "Current plan" : `Switch to ${plan.name} · UPI / Card`}
                  </button>
                </div>
              ))}
            </div>

            {/* Payment methods & info */}
            <div className="panel">
              <div className="panel-title">💳 Accepted Payment Methods</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
                {[
                  { icon:"📱", label:"UPI", desc:"GPay, PhonePe, Paytm" },
                  { icon:"💳", label:"Credit / Debit Card", desc:"Visa, Mastercard, RuPay" },
                  { icon:"🏦", label:"Net Banking", desc:"All major Indian banks" },
                  { icon:"👛", label:"Wallets", desc:"Paytm, Mobikwik, Freecharge" },
                  { icon:"📅", label:"EMI", desc:"3, 6, 12 month options" },
                  { icon:"🔒", label:"100% Secure", desc:"256-bit SSL via Razorpay" },
                ].map((m,i) => (
                  <div key={i} style={{ background:"var(--bg3)", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{m.icon}</div>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{m.label}</div>
                    <div style={{ fontSize:12, color:"var(--text2)" }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop:16, padding:"12px 16px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, fontSize:12, color:"var(--text2)", lineHeight:1.7 }}>
              <strong style={{ color:"var(--text)" }}>Cancellation policy:</strong> Cancel anytime from this page. Your plan remains active until the end of the current billing cycle. No refunds on partial months. For disputes write to billing@reviewshield.in
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="fade-in">
            <div className="page-title">Settings</div>
            <div className="page-sub">Customize how ReviewShield works for {biz.name}.</div>
            <div className="panel">
              <div className="panel-title">⚙️ Review Gate Threshold</div>
              <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 16 }}>Only customers who rate {settings.threshold}★ or above will be sent to Google.</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                {[3,4,5].map(n => (
                  <button key={n} onClick={() => setSettings({ ...settings, threshold: n })}
                    style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${settings.threshold === n ? "var(--gold)" : "var(--border)"}`, background: settings.threshold === n ? "rgba(245,200,66,0.1)" : "var(--bg3)", color: settings.threshold === n ? "var(--gold)" : "var(--text2)", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "DM Sans, sans-serif" }}>
                    {n}★+
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>Recommended: 4★+ (sends 4 & 5 star reviews to Google)</div>
            </div>
            <div className="panel">
              <div className="panel-title">🔗 Google Review URL</div>
              <div className="google-url-row">
                <div className="google-url-box">
                  <input className="form-input" value={biz.googleReviewUrl} onChange={e => setBiz({ ...biz, googleReviewUrl: e.target.value })} placeholder="https://search.google.com/local/writereview?placeid=..." />
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>This is where 4★+ customers are sent. Update when you change your GMB listing.</div>
                </div>
                <button className="btn-copy" style={{ flexShrink: 0, marginTop: 0 }} onClick={() => window.open(biz.googleReviewUrl, "_blank")}>🔗 Test</button>
              </div>
            </div>
            <div className="panel">
              <div className="panel-title">🔔 Notifications</div>
              {[
                { key: "emailAlerts", label: "Email Alerts", desc: "Get an email when a negative review is captured" },
                { key: "smsAlerts", label: "SMS Alerts", desc: "Get an SMS for every new private feedback (Pro+)" },
                { key: "autoreply", label: "Auto-Reply to Negative Feedback", desc: "Automatically thank customers for internal feedback (coming soon)" },
              ].map(s => (
                <div className="settings-row" key={s.key}>
                  <div>
                    <div className="settings-label">{s.label}</div>
                    <div className="settings-desc">{s.desc}</div>
                  </div>
                  <div className={`toggle ${settings[s.key] ? "on" : ""}`} onClick={() => setSettings({ ...settings, [s.key]: !settings[s.key] })} />
                </div>
              ))}
            </div>
            <div className="panel">
              <div className="panel-title">🎨 Branding</div>
              <div className="form-group">
                <label className="form-label">BUSINESS NAME (shown on review page)</label>
                <input className="form-input" value={biz.name} onChange={e => setBiz({ ...biz, name: e.target.value })} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Custom logo upload and color themes available on Pro & Agency plans.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewPage({ businessId, businesses, setPage, addFeedback, isDemo }) {
  const biz = isDemo
    ? { id: "demo", name: "Spice Garden Restaurant", googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4", threshold: 4 }
    : businesses.find(b => b.id === businessId) || businesses[0];

  const [step, setStep] = useState("rate"); // rate | feedback | done-positive | done-negative
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const THRESHOLD = 4;

  const handleRate = () => {
    if (rating === 0) return;
    if (rating >= THRESHOLD) {
      // Send to Google
      setStep("done-positive");
      setTimeout(() => {
        window.open(biz.googleReviewUrl, "_blank");
      }, 1500);
    } else {
      setStep("feedback");
    }
  };

  const handleFeedbackSubmit = () => {
    if (addFeedback && biz) {
      addFeedback(biz.id, { rating, message: feedbackText || "No message provided.", name: name || "Anonymous" });
    }
    setStep("done-negative");
  };

  const displayRating = hovered || rating;

  return (
    <div className="review-page">
      <div className="review-card fade-in">
        <div className="review-logo">Star<span style={{ color: "var(--text)" }}>Vault</span></div>

        {step === "rate" && (
          <>
            <div className="review-biz">{biz?.name || "Business"}</div>
            <div className="review-ask">How was your experience with us?<br /><span style={{ fontSize: 14 }}>Your honest feedback matters to us.</span></div>
            <div className="stars-row">
              {[1,2,3,4,5].map(s => (
                <button key={s} className={`star-btn ${s <= displayRating ? "active" : ""}`}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}>
                  ⭐
                </button>
              ))}
            </div>
            <div className="rating-label">{displayRating ? STAR_LABELS[displayRating] : "Tap a star to rate"}</div>
            <button className="btn-rate" onClick={handleRate} disabled={rating === 0}>
              Submit Rating →
            </button>
          </>
        )}

        {step === "feedback" && (
          <div className="feedback-form fade-in">
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <div className="review-biz" style={{ fontSize: 22 }}>We're Sorry to Hear That</div>
            <div className="review-ask">Please tell us what went wrong — we'll make it right.</div>
            <input className="form-input" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 12 }} />
            <textarea placeholder="Tell us what happened... we read every message." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
            <button className="btn-rate" onClick={handleFeedbackSubmit}>Send Feedback →</button>
          </div>
        )}

        {step === "done-positive" && (
          <div className="fade-in">
            <div className="success-icon">🎉</div>
            <div className="review-biz">Thank You!</div>
            <div className="review-ask">Redirecting you to Google to share your review...<br /><span style={{ fontSize: 13, color: "var(--gold)" }}>A new tab will open shortly.</span></div>
            <div style={{ width: 40, height: 40, border: "3px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", margin: "20px auto", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {step === "done-negative" && (
          <div className="fade-in">
            <div className="success-icon">🙏</div>
            <div className="review-biz">Feedback Received</div>
            <div className="review-ask">Thank you for letting us know. Our team will look into this and work to improve your experience.</div>
            <div style={{ marginTop: 16, padding: "12px 20px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, fontSize: 14, color: "#22c55e" }}>
              ✓ Your feedback has been privately shared with the team.
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Admin Password (change this to something only you know) ─────────────────
const ADMIN_PASSWORD = "TDS@ReviewShield2026";

// ─── Admin Login Page ─────────────────────────────────────────────────────────
function AdminLogin({ setPage }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const handleLogin = () => {
    if (pwd === ADMIN_PASSWORD) { setPage("admin"); setError(false); }
    else { setError(true); }
  };
  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <div className="auth-title">Admin Access</div>
          <div className="auth-sub">ReviewShield Super Admin</div>
        </div>
        <div className="form-group">
          <label className="form-label">ADMIN PASSWORD</label>
          <input className="form-input" type="password" placeholder="Enter admin password"
            value={pwd} onChange={e => { setPwd(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {error && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 6 }}>❌ Wrong password. Try again.</div>}
        </div>
        <button className="btn-submit" onClick={handleLogin}>Enter Admin Panel →</button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "var(--text2)", cursor: "pointer" }} onClick={() => setPage("home")}>← Back to site</span>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ businesses, setPage }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBiz, setSelectedBiz] = useState(null);

  // Aggregate stats
  const totalBiz = businesses.length;
  const totalFeedbacks = businesses.reduce((a, b) => a + b.feedbacks.length, 0);
  const totalPositives = businesses.reduce((a, b) => a + b.positivesSent, 0);
  const totalScans = businesses.reduce((a, b) => a + b.totalScans + b.feedbacks.length, 0);
  const planCounts = { starter: 0, pro: 0, agency: 0 };
  businesses.forEach(b => { if (planCounts[b.plan] !== undefined) planCounts[b.plan]++; });
  const mrr = businesses.reduce((a, b) => {
    const prices = { starter: 999, pro: 2499, agency: 7999 };
    return a + (prices[b.plan] || 0);
  }, 0);

  const PLAN_COLOR = { starter: "#6ee7b7", pro: "#fbbf24", agency: "#a78bfa" };

  const NAV = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "clients", icon: "🏢", label: `All Clients (${totalBiz})` },
    { id: "feedbacks", icon: "💬", label: `All Feedbacks (${totalFeedbacks})` },
    { id: "revenue", icon: "💰", label: "Revenue" },
  ];

  return (
    <div className="dashboard">
      {/* Admin Sidebar */}
      <div className="sidebar">
        <div style={{ padding: "0 24px 8px" }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 800, color: "var(--gold)" }}>ReviewShield</div>
          <div style={{ fontSize: 11, color: "var(--red)", fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>⚡ SUPER ADMIN</div>
        </div>
        <nav className="sidebar-nav" style={{ marginTop: 16 }}>
          {NAV.map(item => (
            <div key={item.id} className={`sidebar-item ${activeTab === item.id ? "active" : ""}`} onClick={() => { setActiveTab(item.id); setSelectedBiz(null); }}>
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Logged in as</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Tarun Gupta</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>tarun@thedesignshore.com</div>
          </div>
          <div className="logout-btn" onClick={() => setPage("home")}>
            <span>🚪</span> Exit Admin
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="fade-in">
            <div className="page-title">Admin Overview</div>
            <div className="page-sub">Your ReviewShield business at a glance — {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>

            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
              {[
                { label: "Total Clients", value: totalBiz, color: "gold", icon: "🏢" },
                { label: "Monthly Revenue", value: `₹${mrr.toLocaleString("en-IN")}`, color: "green", icon: "💰" },
                { label: "Total Scans", value: totalScans, color: "gold", icon: "📱" },
                { label: "Sent to Google", value: totalPositives, color: "green", icon: "⭐" },
                { label: "Captured Private", value: totalFeedbacks, color: "red", icon: "🔒" },
              ].map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-card-label">{s.icon} {s.label}</div>
                  <div className={`stat-card-num ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Plan breakdown */}
            <div className="panel">
              <div className="panel-title">📦 Plan Distribution</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {PLANS.map(plan => (
                  <div key={plan.id} style={{ background: "var(--bg3)", borderRadius: 12, padding: 20, textAlign: "center", border: `1px solid ${plan.color}30` }}>
                    <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Syne,sans-serif", color: plan.color }}>{planCounts[plan.id]}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>{plan.name} clients</div>
                    <div style={{ fontSize: 12, color: plan.color, marginTop: 4, fontWeight: 600 }}>
                      ₹{((planCounts[plan.id] || 0) * parseInt(plan.price.replace("₹","").replace(",",""))).toLocaleString("en-IN")}/mo
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent signups */}
            <div className="panel">
              <div className="panel-title">🆕 Recent Signups</div>
              {businesses.slice(-3).reverse().map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>{b.email} · Joined {b.createdAt}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, padding: "3px 10px", background: `${PLAN_COLOR[b.plan]}15`, border: `1px solid ${PLAN_COLOR[b.plan]}40`, color: PLAN_COLOR[b.plan], borderRadius: 100, fontWeight: 700 }}>{b.plan.toUpperCase()}</span>
                    <button onClick={() => { setSelectedBiz(b); setActiveTab("clients"); }} style={{ fontSize: 12, padding: "4px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card)", color: "var(--text2)", cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>View →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL CLIENTS */}
        {activeTab === "clients" && !selectedBiz && (
          <div className="fade-in">
            <div className="page-title">All Clients</div>
            <div className="page-sub">{totalBiz} businesses enrolled on ReviewShield</div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["All", "Starter", "Pro", "Agency"].map(f => (
                <button key={f} style={{ padding: "6px 16px", borderRadius: 100, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text2)", fontSize: 13, cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>{f}</button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {businesses.map((b, i) => (
                <div key={i} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, cursor: "pointer" }} onClick={() => setSelectedBiz(b)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${PLAN_COLOR[b.plan]}15`, border: `1px solid ${PLAN_COLOR[b.plan]}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>{b.email} · {b.phone}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Joined {b.createdAt}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "Syne,sans-serif", color: "var(--green)" }}>{b.positivesSent}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>To Google</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "Syne,sans-serif", color: "var(--red)" }}>{b.feedbacks.length}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>Captured</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "Syne,sans-serif", color: "var(--gold)" }}>{b.totalScans + b.feedbacks.length}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>Scans</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "4px 12px", background: `${PLAN_COLOR[b.plan]}15`, border: `1px solid ${PLAN_COLOR[b.plan]}40`, color: PLAN_COLOR[b.plan], borderRadius: 100, fontWeight: 700 }}>{b.plan.toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLIENT DETAIL */}
        {activeTab === "clients" && selectedBiz && (
          <div className="fade-in">
            <button onClick={() => setSelectedBiz(null)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 14, marginBottom: 20, fontFamily: "DM Sans,sans-serif" }}>← Back to all clients</button>
            <div className="page-title">{selectedBiz.name}</div>
            <div className="page-sub">{selectedBiz.email} · {selectedBiz.phone} · Joined {selectedBiz.createdAt}</div>

            <div className="stats-grid">
              {[
                { label: "Plan", value: selectedBiz.plan.toUpperCase(), color: "gold" },
                { label: "Sent to Google", value: selectedBiz.positivesSent, color: "green" },
                { label: "Captured Private", value: selectedBiz.feedbacks.length, color: "red" },
                { label: "Total Scans", value: selectedBiz.totalScans + selectedBiz.feedbacks.length, color: "gold" },
              ].map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-card-label">{s.label}</div>
                  <div className={`stat-card-num ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-title">🔗 Review Link</div>
              <div className="qr-url-box">https://reviewshield.in/r/{selectedBiz.id}</div>
            </div>

            <div className="panel">
              <div className="panel-title">💬 Their Private Feedbacks</div>
              {selectedBiz.feedbacks.length === 0 ? (
                <div style={{ color: "var(--text2)", fontSize: 14 }}>No negative feedback captured yet.</div>
              ) : (
                <div className="feedback-list">
                  {selectedBiz.feedbacks.map((f, i) => (
                    <div key={i} className="feedback-item">
                      <div className="feedback-header">
                        <div style={{ display: "flex", gap: 3 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ opacity: s <= f.rating ? 1 : 0.2 }}>⭐</span>)}</div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <span className="feedback-name">{f.name}</span>
                          <span className="feedback-date">{f.date}</span>
                        </div>
                      </div>
                      <div className="feedback-msg">"{f.message}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Actions */}
            <div className="panel">
              <div className="panel-title">⚙️ Admin Actions</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["Suspend Account", "Change to Pro", "Change to Agency", "Send Email", "Reset QR Link"].map((action, i) => (
                  <button key={i} onClick={() => alert(`Action: ${action} for ${selectedBiz.name}`)}
                    style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid var(--border)", background: i === 0 ? "rgba(239,68,68,0.1)" : "var(--card)", color: i === 0 ? "var(--red)" : "var(--text2)", cursor: "pointer", fontSize: 13, fontFamily: "DM Sans,sans-serif" }}>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ALL FEEDBACKS */}
        {activeTab === "feedbacks" && (
          <div className="fade-in">
            <div className="page-title">All Private Feedbacks</div>
            <div className="page-sub">Every captured review across all clients — {totalFeedbacks} total</div>
            {businesses.every(b => b.feedbacks.length === 0) ? (
              <div className="panel" style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 700 }}>No feedbacks yet</div>
                <div style={{ color: "var(--text2)", marginTop: 8 }}>Shield is working perfectly.</div>
              </div>
            ) : (
              businesses.map(b => b.feedbacks.length > 0 && (
                <div key={b.id} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
                    🏢 {b.name}
                    <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--card)", borderRadius: 100, border: "1px solid var(--border)" }}>{b.feedbacks.length} reviews</span>
                  </div>
                  <div className="feedback-list">
                    {b.feedbacks.map((f, i) => (
                      <div key={i} className={`feedback-item ${!f.read ? "unread" : ""}`}>
                        <div className="feedback-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ opacity: s <= f.rating ? 1 : 0.2, fontSize: 14 }}>⭐</span>)}</div>
                            {!f.read && <span className="badge-new">NEW</span>}
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            <span className="feedback-name">{f.name}</span>
                            <span className="feedback-date">{f.date}</span>
                          </div>
                        </div>
                        <div className="feedback-msg">"{f.message}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* REVENUE */}
        {activeTab === "revenue" && (
          <div className="fade-in">
            <div className="page-title">Revenue Dashboard</div>
            <div className="page-sub">Your ReviewShield MRR overview</div>

            <div className="stats-grid">
              {[
                { label: "Monthly Recurring Revenue", value: `₹${mrr.toLocaleString("en-IN")}`, color: "green" },
                { label: "Annual Run Rate", value: `₹${(mrr * 12).toLocaleString("en-IN")}`, color: "gold" },
                { label: "Paying Clients", value: totalBiz, color: "gold" },
                { label: "Avg Revenue / Client", value: totalBiz > 0 ? `₹${Math.round(mrr / totalBiz).toLocaleString("en-IN")}` : "₹0", color: "green" },
              ].map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-card-label">{s.label}</div>
                  <div className={`stat-card-num ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-title">💰 Revenue by Plan</div>
              {PLANS.map(plan => {
                const count = planCounts[plan.id] || 0;
                const rev = count * parseInt(plan.price.replace("₹","").replace(",",""));
                const pct = mrr > 0 ? Math.round((rev / mrr) * 100) : 0;
                return (
                  <div key={plan.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: plan.color }}>{plan.name}</span>
                      <span style={{ fontSize: 14 }}>₹{rev.toLocaleString("en-IN")}/mo · {count} clients · {pct}%</span>
                    </div>
                    <div style={{ height: 8, background: "var(--bg3)", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: plan.color, borderRadius: 100, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="panel">
              <div className="panel-title">🎯 Growth Targets</div>
              {[
                { target: "10 clients", revenue: "₹24,990/mo", status: totalBiz >= 10 },
                { target: "25 clients", revenue: "₹62,475/mo", status: totalBiz >= 25 },
                { target: "50 clients", revenue: "₹1,24,950/mo", status: totalBiz >= 50 },
                { target: "100 clients", revenue: "₹2,49,900/mo", status: totalBiz >= 100 },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 18 }}>{t.status ? "✅" : "⭕"}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.target}</span>
                    <span style={{ fontSize: 13, color: "var(--text2)", marginLeft: 8 }}>→ {t.revenue}</span>
                  </div>
                  {!t.status && <span style={{ fontSize: 12, color: "var(--text2)" }}>{totalBiz} / {parseInt(t.target)} clients</span>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [businesses, setBusinesses] = useState(STORE.businesses);

  const addFeedback = (bizId, feedback) => {
    setBusinesses(prev => prev.map(b => b.id === bizId
      ? { ...b, feedbacks: [...b.feedbacks, { id: Date.now(), ...feedback, date: new Date().toISOString().split("T")[0], read: false }] }
      : b));
    if (currentBusiness?.id === bizId) {
      setCurrentBusiness(prev => ({ ...prev, feedbacks: [...(prev.feedbacks || []), { id: Date.now(), ...feedback, date: new Date().toISOString().split("T")[0], read: false }] }));
    }
  };

  const isFullscreen = ["review-preview", "demo-review"].includes(page) || page.startsWith("r/");

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {!isFullscreen && page !== "dashboard" && page !== "admin" && page !== "admin-login" && (
          <Nav page={page} setPage={setPage} currentBusiness={currentBusiness} />
        )}
        {page === "home" && <HomePage setPage={setPage} />}
        {page === "register" && <RegisterPage setPage={setPage} setCurrentBusiness={setCurrentBusiness} />}
        {page === "login" && <LoginPage setPage={setPage} setCurrentBusiness={setCurrentBusiness} />}
        {page === "dashboard" && currentBusiness && (
          <Dashboard currentBusiness={currentBusiness} setPage={setPage} setCurrentBusiness={setCurrentBusiness} />
        )}
        {page === "admin-login" && <AdminLogin setPage={setPage} />}
        {page === "admin" && <AdminDashboard businesses={businesses} setPage={setPage} />}
        {page === "review-preview" && (
          <>
            <div style={{ position: "fixed", top: 16, left: 16, zIndex: 1000 }}>
              <button className="btn-copy" onClick={() => setPage("dashboard")} style={{ fontFamily: "DM Sans, sans-serif" }}>← Back to Dashboard</button>
            </div>
            <ReviewPage businessId={currentBusiness?.id} businesses={businesses} setPage={setPage} addFeedback={addFeedback} />
          </>
        )}
        {page === "demo-review" && (
          <>
            <div style={{ position: "fixed", top: 16, left: 16, zIndex: 1000 }}>
              <button className="btn-copy" onClick={() => setPage("home")} style={{ fontFamily: "DM Sans, sans-serif" }}>← Back to Home</button>
            </div>
            <ReviewPage isDemo businesses={businesses} setPage={setPage} addFeedback={addFeedback} />
          </>
        )}

        {/* Hidden admin entry — click logo 5 times on home page */}
        {page === "home" && (
          <div style={{ position: "fixed", bottom: 16, right: 16, opacity: 0, width: 40, height: 40, cursor: "pointer" }}
            onClick={() => setPage("admin-login")} title="Admin" />
        )}
      </div>
    </>
  );
}
