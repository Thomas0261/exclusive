// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const crypto = require("crypto");

const app = express();
app.use(express.json());

/* =========================
   Helpers
   ========================= */
const getHostname = (urlish) => {
  try { return urlish ? new URL(urlish).hostname : null; } catch { return null; }
};
const normalizePhones = (csv) =>
  String(csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const phonesFromFirstEnv = (keys) => {
  for (const k of keys) if (process.env[k]) return normalizePhones(process.env[k]);
  return [];
};
const formatUSPhone = (raw) => (raw?.startsWith("+") ? raw : "+1" + String(raw || "").replace(/\D/g, ""));
const stablePick = (variants, keyString) => {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  if (variants.length === 1) return variants[0];
  const h = crypto.createHash("md5").update(keyString || String(Math.random())).digest();
  const n = h[0]; // 0..255
  return variants[n % variants.length];
};

/* =========================
   Template Packs per tenant
   ========================= */
const TENANTS = {
  exclusive: {
    brandName: "Exclusive Town Car Services",
    hostnames: new Set(["www.exclusivetowncarservice.com","exclusivetowncarservice.com"]),
    refererIncludes: [],
    envAdminKeys: ["ADMIN_PHONES_EXCLUSIVE","ADMIN_PHONES","ADMIN_PHONE"],

    // DRIVER variants (formal/premium)
    driverTpls: [
      (p) =>
`━━━━━━━━━━━━━━━━
RESERVATION ALERT
━━━━━━━━━━━━━━━━
Service     : ${p.service}
Passenger   : ${p.firstName} ${p.lastName || ""}
Phone       : ${p.phone}
Pickup      : ${p.date} ${p.time}
Passengers  : ${p.passengers || "N/A"}
Car Seats   : ${p.carSeats || 0}${p.csCost ? ` ($${p.csCost})` : ""}
Notes       : ${p.notes || "N/A"}
━━━━━━━━━━━━━━━━
${p.brand}`,
      (p) =>
`— RESERVATION —
Service : ${p.service}
Name    : ${p.firstName} ${p.lastName || ""}
Phone   : ${p.phone}
When    : ${p.date} ${p.time}
Pax     : ${p.passengers || "N/A"}   Seats: ${p.carSeats || 0}${p.csCost ? ` ($${p.csCost})` : ""}
Notes   : ${p.notes || "N/A"}
— ${p.brand} —`
    ],

    // CUSTOMER variants (formal, no emoji)
    customerTpls: [
      (p) =>
`Dear ${p.firstName},

Your "${p.service}" reservation is confirmed.
• Date/Time: ${p.date} at ${p.time}
${p.carSeats > 0 ? `• Car Seats: ${p.carSeats} ($${p.csCost})\n` : ""}We will follow up shortly with final details.

Thank you for choosing ${p.brand}.
Reply STOP to opt out.`,
      (p) =>
`${p.firstName}, your reservation is confirmed.

Service: ${p.service}
Date/Time: ${p.date} at ${p.time}
${p.carSeats > 0 ? `Car Seats: ${p.carSeats} ($${p.csCost})\n` : ""}We will be in touch if any additional information is needed.

— ${p.brand}
Reply STOP to opt out.`
    ],

    contactTpl: (c) =>
`CONTACT INQUIRY
Name    : ${c.name}
Phone   : ${c.phone || "N/A"}
Email   : ${c.email}
Service : ${c.service || "General"}
Message : ${c.message}
[${c.brand}]`,
  },

  allSeasons: {
    brandName: "All Seasons Town Car Services",
    hostnames: new Set(["www.allseasontowncarservice.com","allseasontowncarservice.com"]),
    // Wix preview: https://thomast43002.wixsite.com/website-4
    refererIncludes: ["/website-4"],
    envAdminKeys: ["ADMIN_PHONES_ALLSEASONS","ADMIN_PHONES","ADMIN_PHONE"],

    // DRIVER variants (friendly/efficient)
    driverTpls: [
      (p) =>
`🚗 New Ride
────────────────
${p.service}
Client   : ${p.firstName} ${p.lastName || ""}
Phone    : ${p.phone}
When     : ${p.date} @ ${p.time}
Pax/Seat : ${p.passengers || "N/A"} / ${p.carSeats || 0}${p.csCost ? ` ($${p.csCost})` : ""}
Notes    : ${p.notes || "N/A"}
────────────────
${p.brand} Dispatch`,
      (p) =>
`Ride Request
Service : ${p.service}
Name    : ${p.firstName} ${p.lastName || ""}
Phone   : ${p.phone}
Time    : ${p.date} @ ${p.time}
Pax     : ${p.passengers || "N/A"}, Seats: ${p.carSeats || 0}${p.csCost ? ` ($${p.csCost})` : ""}
Notes   : ${p.notes || "N/A"}
${p.brand}`
    ],

    // CUSTOMER variants (warm tone)
    customerTpls: [
      (p) =>
`Hi ${p.firstName}! 👋

Your ${p.service} on ${p.date} at ${p.time} is confirmed.
${p.carSeats > 0 ? `Car Seats: ${p.carSeats} ($${p.csCost})\n` : ""}We’re excited to drive you soon.

– ${p.brand}
Reply STOP to opt out.`,
      (p) =>
`Booking confirmed, ${p.firstName}! ✅

• Service: ${p.service}
• When: ${p.date} at ${p.time}
${p.carSeats > 0 ? `• Car Seats: ${p.carSeats} ($${p.csCost})\n` : ""}Thanks for choosing ${p.brand}. See you soon!
Reply STOP to opt out.`
    ],

    contactTpl: (c) =>
`📨 New Inquiry
Name   : ${c.name}
Phone  : ${c.phone || "N/A"}
Email  : ${c.email}
Topic  : ${c.service || "General"}
Message: ${c.message}
[${c.brand}]`,
  },
};

/* =========================
   Tenant resolver (with Wix preview override)
   ========================= */
const resolveTenant = (req) => {
  const originHost = getHostname(req.headers.origin);
  const referer = req.headers.referer || "";
  const isWixPreview = originHost && originHost.endsWith(".wixsite.com");

  // Preview override via query or header (does NOT affect live domains)
  if (isWixPreview) {
    const forced = (req.query.tenant || req.headers["x-tenant"] || "")
      .toString()
      .toLowerCase();
    if (forced === "allseasons" || forced === "all_seasons") return { key: "allSeasons", ...TENANTS.allSeasons };
    if (forced === "exclusive") return { key: "exclusive", ...TENANTS.exclusive };
  }

  // 1) Live domains (Origin)
  for (const key of Object.keys(TENANTS)) {
    const t = TENANTS[key];
    if (originHost && t.hostnames.has(originHost)) return { key, ...t };
  }

  // 2) Preview path cue (Referer, if present)
  for (const key of Object.keys(TENANTS)) {
    const t = TENANTS[key];
    if ((t.refererIncludes || []).some((frag) => referer.includes(frag))) return { key, ...t };
  }

  // 3) Default → Exclusive
  return { key: "exclusive", ...TENANTS.exclusive };
};

/* =====
   CORS
   ===== */
const ALWAYS_ALLOW_HOSTS = new Set(["editor.wix.com","manage.wix.com","localhost","127.0.0.1","0.0.0.0"]);
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const host = getHostname(origin);
  if (!host) return false;
  for (const key of Object.keys(TENANTS)) if (TENANTS[key].hostnames.has(host)) return true;
  if (host.endsWith(".wixsite.com") || host.endsWith(".filesusr.com") || ALWAYS_ALLOW_HOSTS.has(host)) return true;
  return false;
};
app.use(cors({
  origin: (origin, cb) => (isAllowedOrigin(origin) ? cb(null, true) : (console.warn("❌ Blocked by CORS:", origin), cb(new Error("Not allowed by CORS")))),
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","X-Tenant"],
  credentials: true,
}));

/* ==========
   Twilio
   ========== */
const FROM_NUMBER = (process.env.TWILIO_PHONE_NUMBER || "").trim();
if (!FROM_NUMBER) {
  console.warn("⚠️ TWILIO_PHONE_NUMBER is not set. Sends will fail.");
}
const twilioClient = twilio(
  (process.env.TWILIO_ACCOUNT_SID || "").trim(),
  (process.env.TWILIO_AUTH_TOKEN || "").trim()
);

/* ==========
   Routes
   ========== */
app.get("/", (_, res) => res.send("🚗 SMS API is live"));
// quick k8s-style probe
app.get("/healthz", (_, res) => res.json({ ok: true }));

// Diagnostics (no SMS)
app.get("/whoami", (req, res) => {
  const t = resolveTenant(req);
  res.json({
    tenant: t.key,
    brand: t.brandName,
    origin: req.headers.origin || null,
    referer: req.headers.referer || null,
    note: "In Wix preview, use ?tenant=allSeasons or header X-Tenant: allSeasons to force.",
  });
});

// Reservation → driver/admin + customer
app.post("/api/send", async (req, res) => {
  try {
    const tenant = resolveTenant(req);
    const {
      firstName, lastName, phone, date, time,
      passengers, carSeats, service, notes,
    } = req.body || {};

    if (!firstName || !phone || !date || !time || !service) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!FROM_NUMBER) {
      return res.status(500).json({ error: "Missing TWILIO_PHONE_NUMBER" });
    }

    const formattedPhone = formatUSPhone(phone);
    const csCount = Number(carSeats) || 0;
    const csCost = csCount * 15;

    const payload = {
      brand: tenant.brandName,
      firstName, lastName,
      phone: formattedPhone,
      date, time,
      passengers,
      carSeats: csCount,
      csCost,
      service, notes,
    };

    // Choose variant deterministically
    const key = `${tenant.key}|${formattedPhone}|${date}|${time}|${service}|${csCount}|${passengers || ""}`;
    const driverTpl = stablePick(tenant.driverTpls, key);
    const customerTpl = stablePick(tenant.customerTpls, key);

    if (!driverTpl || !customerTpl) {
      console.error("❌ Template selection failed");
      return res.status(500).json({ error: "Template selection failed" });
    }

    const driverMsg = driverTpl(payload);
    const customerMsg = customerTpl(payload);

    // Admin fan-out (fault-tolerant)
    const adminPhones = phonesFromFirstEnv(tenant.envAdminKeys);
    let adminResults = [];
    if (!adminPhones.length) {
      console.warn(`⚠️ No admin phones configured for ${tenant.brandName}. Tried: ${tenant.envAdminKeys.join(", ")}`);
    } else {
      adminResults = await Promise.allSettled(
        adminPhones.map((to) => twilioClient.messages.create({ body: driverMsg, from: FROM_NUMBER, to }))
      );
    }

    // Customer confirmation
    let customerResult;
    try {
      customerResult = await twilioClient.messages.create({ body: customerMsg, from: FROM_NUMBER, to: formattedPhone });
    } catch (err) {
      console.error("❌ Customer SMS failed:", err?.message || err, err?.code || "", err?.moreInfo || "");
      return res.status(500).json({
        success: false,
        error: "Failed to send customer SMS",
        detail: err?.message || null,
        code: err?.code || null,
      });
    }

    // If some admin sends failed, surface that but still return 200 (since customer got confirmation)
    const failedAdmins = adminResults.filter(r => r.status === "rejected");
    if (failedAdmins.length) {
      console.warn(`⚠️ Some admin sends failed: ${failedAdmins.length}`);
      return res.status(200).json({
        success: true,
        message: "Customer SMS sent; some admin sends failed",
        adminErrors: failedAdmins.map(f => f.reason?.message || String(f.reason)),
        sid: customerResult.sid || null,
      });
    }

    return res.status(200).json({ success: true, message: "SMS sent to admin and client", sid: customerResult.sid || null });
  } catch (err) {
    console.error("❌ /api/send error:", err?.message || err, err?.code || "", err?.moreInfo || "");
    return res.status(500).json({ success: false, error: "Failed to send SMS", detail: err?.message || null, code: err?.code || null });
  }
});

// Contact → driver/admin
app.post("/api/contact", async (req, res) => {
  try {
    const tenant = resolveTenant(req);
    const { name, phone, email, message, service } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: "Missing required fields" });
    if (!FROM_NUMBER) return res.status(500).json({ error: "Missing TWILIO_PHONE_NUMBER" });

    const cPayload = { brand: tenant.brandName, name, phone, email, service, message };
    const contactMsg = tenant.contactTpl ? tenant.contactTpl(cPayload) :
`📨 New Contact Inquiry
Name: ${name}
Phone: ${phone || "N/A"}
Email: ${email}
Service: ${service || "General"}
Message: ${message}
[${tenant.brandName}]`;

    const adminPhones = phonesFromFirstEnv(tenant.envAdminKeys);
    if (!adminPhones.length) {
      console.warn(`⚠️ No admin phones configured for ${tenant.brandName}. Tried: ${tenant.envAdminKeys.join(", ")}`);
    } else {
      const results = await Promise.allSettled(
        adminPhones.map((to) => twilioClient.messages.create({ body: contactMsg, from: FROM_NUMBER, to }))
      );
      const failed = results.filter(r => r.status === "rejected");
      if (failed.length) {
        console.warn(`⚠️ Some contact admin sends failed: ${failed.length}`);
        return res.status(200).json({
          success: true,
          message: "Contact delivered to some admins; some failed",
          adminErrors: failed.map(f => f.reason?.message || String(f.reason)),
        });
      }
    }

    return res.status(200).json({ success: true, message: "Contact message sent" });
  } catch (err) {
    console.error("❌ /api/contact error:", err?.message || err, err?.code || "", err?.moreInfo || "");
    return res.status(500).json({ success: false, error: "Failed to send contact message", detail: err?.message || null, code: err?.code || null });
  }
});

/* ==========
   Server
   ========== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 SMS backend running on port ${PORT}`));