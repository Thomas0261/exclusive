// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(express.json());

/* =========================
   Tenant config + templates
   ========================= */
const TENANTS = {
  exclusive: {
    brandName: "Exclusive Town Car Services",
    hostnames: new Set([
      "www.exclusivetowncarservice.com",
      "exclusivetowncarservice.com",
    ]),
    refererIncludes: [], // Exclusive preview uses default routing
    // Back-compat: will read any of these env keys (first one found)
    envAdminKeys: ["ADMIN_PHONES_EXCLUSIVE", "ADMIN_PHONES", "ADMIN_PHONE"],
    // Professional, sleek
    tplDriver: (p) =>
`━━━━━━━━━━━━━━━━━━
🚘 RESERVATION ALERT
━━━━━━━━━━━━━━━━━━
Service: ${p.service}
Name: ${p.firstName} ${p.lastName || ""}
Phone: ${p.phone}
Date: ${p.date}   Time: ${p.time}
Passengers: ${p.passengers || "N/A"}
Car Seats: ${p.carSeats || 0} ($${p.csCost || 0})
Notes: ${p.notes || "N/A"}
━━━━━━━━━━━━━━━━━━
${p.brand}
`,
    tplCustomer: (p) =>
`✅ Dear ${p.firstName},

Your reservation for "${p.service}" is confirmed:
📅 ${p.date} at ${p.time}
${p.carSeats > 0 ? `Car Seats: ${p.carSeats} ($${p.csCost})\n` : ""}We will contact you shortly for final details.

Thank you for choosing ${p.brand}.
Reply STOP to opt out.`,
  },

  allSeasons: {
    brandName: "All Seasons Town Car Services",
    hostnames: new Set([
      "www.allseasontowncarservice.com",
      "allseasontowncarservice.com",
    ]),
    // Your Wix test site path cue:
    // https://thomast43002.wixsite.com/website-4
    refererIncludes: ["/website-4"],
    envAdminKeys: ["ADMIN_PHONES_ALLSEASONS"],
    // Friendly & service-focused
    tplDriver: (p) =>
`🚗 New Ride Request!
────────────────────
Service: ${p.service}
Client: ${p.firstName} ${p.lastName || ""}
Phone: ${p.phone}
When: ${p.date} @ ${p.time}
Pax: ${p.passengers || "N/A"} | Car Seats: ${p.carSeats || 0}
Notes: ${p.notes || "N/A"}
────────────────────
${p.brand} Dispatch
`,
    tplCustomer: (p) =>
`Hi ${p.firstName}, 👋

Your ${p.service} booking for ${p.date} at ${p.time} is confirmed.
${p.carSeats > 0 ? `Car Seats: ${p.carSeats} ($${p.csCost})\n` : ""}We look forward to serving you!

– ${p.brand}
Reply STOP to opt out.`,
  },
};

/* =========
   Helpers
   ========= */
const getHostname = (urlish) => {
  try {
    if (!urlish) return null;
    return new URL(urlish).hostname;
  } catch {
    return null;
  }
};

const normalizePhones = (csv) =>
  String(csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const phonesFromFirstEnv = (keys) => {
  for (const k of keys) {
    if (process.env[k]) return normalizePhones(process.env[k]);
  }
  return [];
};

const formatUSPhone = (raw) => {
  if (!raw) return "";
  return raw.startsWith("+") ? raw : "+1" + String(raw).replace(/\D/g, "");
};

const resolveTenant = (req) => {
  const originHost = getHostname(req.headers.origin);
  const referer = req.headers.referer || "";

  // 1) Exact custom domain
  for (const key of Object.keys(TENANTS)) {
    const t = TENANTS[key];
    if (originHost && t.hostnames.has(originHost)) return { key, ...t };
  }
  // 2) Wix preview path cue
  for (const key of Object.keys(TENANTS)) {
    const t = TENANTS[key];
    if (t.refererIncludes.some((frag) => referer.includes(frag))) return { key, ...t };
  }
  // 3) Default (keeps your current behavior for previews)
  return { key: "exclusive", ...TENANTS.exclusive };
};

/* =====
   CORS
   ===== */
const ALWAYS_ALLOW_HOSTS = new Set([
  "editor.wix.com",
  "manage.wix.com",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Postman/curl
  const host = getHostname(origin);
  if (!host) return false;

  // Allow all tenant custom domains
  for (const key of Object.keys(TENANTS)) {
    if (TENANTS[key].hostnames.has(host)) return true;
  }
  // Wix preview & assets
  if (
    host.endsWith(".wixsite.com") ||
    host.endsWith(".filesusr.com") ||
    ALWAYS_ALLOW_HOSTS.has(host)
  ) {
    return true;
  }
  return false;
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

/* ==========
   Twilio
   ========== */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/* ==========
   Routes
   ========== */
app.get("/", (req, res) => res.send("🚗 SMS API is live"));

app.post("/api/send", async (req, res) => {
  try {
    const tenant = resolveTenant(req);

    // helpful logs for testing
    console.log("Tenant:", tenant.key, "| Origin:", req.headers.origin || "-", "| Referer:", req.headers.referer || "-");

    const {
      firstName,
      lastName,
      phone,
      date,
      time,
      passengers,
      carSeats,
      service,
      notes,
    } = req.body || {};

    if (!firstName || !phone || !date || !time || !service) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const formattedPhone = formatUSPhone(phone);
    const csCount = Number(carSeats) || 0;
    const csCost = csCount * 15;

    const payload = {
      brand: tenant.brandName,
      firstName,
      lastName,
      phone: formattedPhone,
      date,
      time,
      passengers,
      carSeats: csCount,
      csCost,
      service,
      notes,
    };

    const driverMsg = tenant.tplDriver(payload);
    const customerMsg = tenant.tplCustomer(payload);

    // Fan out to admins/drivers for this tenant
    const adminPhones = phonesFromFirstEnv(tenant.envAdminKeys);
    if (!adminPhones.length) {
      console.warn(
        `⚠️ No admin phones configured for ${tenant.brandName}. Tried env keys: ${tenant.envAdminKeys.join(
          ", "
        )}`
      );
    } else {
      await Promise.all(
        adminPhones.map((to) =>
          twilioClient.messages.create({
            body: driverMsg,
            from: FROM_NUMBER,
            to,
          })
        )
      );
    }

    // Customer confirmation
    await twilioClient.messages.create({
      body: customerMsg,
      from: FROM_NUMBER,
      to: formattedPhone,
    });

    res
      .status(200)
      .json({ success: true, message: "SMS sent to admin and client" });
  } catch (err) {
    console.error("❌ /api/send error:", err?.message || err);
    res.status(500).json({ success: false, error: "Failed to send SMS" });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const tenant = resolveTenant(req);
    console.log("Tenant(contact):", tenant.key, "| Origin:", req.headers.origin || "-", "| Referer:", req.headers.referer || "-");

    const { name, phone, email, message, service } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const contactMsg =
`📨 New Contact Inquiry
Name: ${name}
Phone: ${phone || "N/A"}
Email: ${email}
Service: ${service || "General"}
Message: ${message}
[${tenant.brandName}]`;

    const adminPhones = phonesFromFirstEnv(tenant.envAdminKeys);
    if (!adminPhones.length) {
      console.warn(
        `⚠️ No admin phones configured for ${tenant.brandName}. Tried env keys: ${tenant.envAdminKeys.join(
          ", "
        )}`
      );
    } else {
      await Promise.all(
        adminPhones.map((to) =>
          twilioClient.messages.create({
            body: contactMsg,
            from: FROM_NUMBER,
            to,
          })
        )
      );
    }

    res.status(200).json({ success: true, message: "Contact message sent" });
  } catch (err) {
    console.error("❌ /api/contact error:", err?.message || err);
    res.status(500).json({ success: false, error: "Failed to send contact message" });
  }
});

/* ==========
   Server
   ========== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 SMS backend running on port ${PORT}`));