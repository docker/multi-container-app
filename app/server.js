const mongoose = require("mongoose");
const bodyParse = require("body-parser");
const app = require("express")();
const moment = require("moment");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

// Live Reload configuration
// Make livereload optional/configurable via environment variables so local dev
// and containerized runs don't conflict on the same host ports.
// Enable livereload only when LIVERELOAD is explicitly set to 'true' and
// NODE_ENV is not 'production'. This avoids attempting to require dev-only
// modules in production images unless the env explicitly enables them.
const ENABLE_LIVERELOAD =
  String(process.env.LIVERELOAD).toLowerCase() === "true" &&
  process.env.NODE_ENV !== "production";
const LIVERELOAD_PORT = process.env.LIVERELOAD_PORT
  ? Number(process.env.LIVERELOAD_PORT)
  : 35729;

let liveReloadServer;
let connectLiveReload;
if (ENABLE_LIVERELOAD) {
  // require live reload modules only when enabled so production images that
  // omit devDependencies won't fail at module resolution time.
  const livereload = require("livereload");
  connectLiveReload = require("connect-livereload");

  liveReloadServer = livereload.createServer({ port: LIVERELOAD_PORT });
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });
}

// Fontend route
const FrontRouter = require("./routes/front");

// Set ejs template engine
app.set("view engine", "ejs");

// ============================================
// SECURITY LAYER 1: HTTP Security Headers with Helmet
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://stackpath.bootstrapcdn.com",
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://stackpath.bootstrapcdn.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket for livereload
      },
    },
    // Enable other helmet protections
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
  })
);

// ============================================
// SECURITY LAYER 2: Rate Limiting
// ============================================
// General rate limiter - 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for write operations - 20 requests per 15 minutes
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many write requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ============================================
// SECURITY LAYER 3: Input Sanitization
// ============================================
// Protect against NoSQL injection attacks
app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ key }) => {
      console.warn(`Sanitized potentially malicious input in ${key}`);
    },
  })
);

// ============================================
// SECURITY LAYER 4: Cookie Parser & Body Parser
// ============================================
app.use(cookieParser());
app.use(bodyParse.urlencoded({ extended: false, limit: "10kb" })); // Limit body size

app.locals.moment = moment;

// Only use the connect-livereload middleware when live reload is enabled.
if (ENABLE_LIVERELOAD && connectLiveReload) {
  app.use(connectLiveReload({ port: LIVERELOAD_PORT }));
}

// Export the Express app for testing/runtime control
// Apply write rate limiter to POST routes
app.use("/todo", writeLimiter);
app.use(FrontRouter);

// Only connect to the database and start the server when this file is
// executed directly (not when required by tests).
if (require.main === module) {
  // Database connection
  const db = require("./config/keys").mongoProdURI;
  mongoose
    .connect(db, { useNewUrlParser: true })
    .then(() => console.log(`Mongodb Connected`))
    .catch((error) => console.log(error));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
