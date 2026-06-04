# Security Implementation - Multi-Layer Security

This document outlines the multi-layer security implementation for the Todo application.

## Security Layers

### Layer 1: HTTP Security Headers (Helmet.js)

**Protection:** Adds various HTTP headers to prevent common web vulnerabilities

**Implementation:**
- Content Security Policy (CSP) - Prevents XSS attacks by controlling resource loading
- HTTP Strict Transport Security (HSTS) - Forces HTTPS connections
- X-Frame-Options - Prevents clickjacking attacks
- X-Content-Type-Options - Prevents MIME sniffing
- X-XSS-Protection - Enables browser's XSS filter

**Configuration:**
```javascript
app.use(helmet({
  contentSecurityPolicy: { /* Custom CSP rules */ },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```

### Layer 2: Rate Limiting

**Protection:** Prevents brute force attacks, API abuse, and DDoS attempts

**Implementation:**
- General rate limiter: 100 requests per 15 minutes per IP
- Write operations limiter: 20 requests per 15 minutes per IP

**Configuration:**
```javascript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many write requests, please try again later."
});
```

### Layer 3: Input Sanitization & Validation

**Protection:** Prevents NoSQL injection, XSS attacks, and invalid data

**Components:**

#### A. MongoDB Sanitization (express-mongo-sanitize)
Removes or replaces characters that could be used in NoSQL injection attacks
```javascript
app.use(mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ key }) => {
    console.warn(`Sanitized potentially malicious input in ${key}`);
  },
}));
```

#### B. Input Validation (express-validator)
Validates and sanitizes all user inputs on each endpoint:
- Task creation: Length limits (1-100 chars), pattern matching, HTML escaping
- Task editing: Length limits (1-100 chars), pattern matching, HTML escaping
- ID validation: MongoDB ObjectId format validation
- XSS protection: HTML entity escaping on all text inputs

**Example validation:**
```javascript
body("task")
  .trim()
  .notEmpty()
  .isLength({ min: 1, max: 100 })
  .matches(/^[^<>]*$/)
  .escape()
```

#### C. Mongoose Schema Validation
Database-level validation as a final safeguard:
```javascript
task: {
  type: String,
  required: true,
  minlength: 1,
  maxlength: 100,
  match: [/^[^<>]*$/, "Task cannot contain < or > characters."],
}
```

### Layer 4: Request Size Limiting

**Protection:** Prevents payload-based attacks and resource exhaustion

**Implementation:**
```javascript
app.use(bodyParse.urlencoded({ extended: false, limit: "10kb" }));
```

### Layer 5: Git Hooks (Husky)

**Protection:** Ensures code quality and prevents committing vulnerable code

**Implementation:**
- Pre-commit hook runs lint-staged
- Automatically lints and formats code before commits
- Prevents committing improperly formatted or problematic code

**Configuration:**
```json
"lint-staged": {
  "app/**/*.{js,ejs}": [
    "cd app && eslint --fix",
    "cd app && prettier --write"
  ]
}
```

## Security Best Practices Applied

1. **Defense in Depth**: Multiple layers of security ensure that if one layer fails, others provide protection
2. **Fail Securely**: Error handling that doesn't expose sensitive information
3. **Least Privilege**: Limited request sizes and strict rate limiting
4. **Input Validation**: All user inputs are validated and sanitized at multiple levels
5. **Security Headers**: Modern HTTP security headers protect against common attacks
6. **Logging**: Security events are logged for monitoring (sanitization warnings)

## Testing Security Features

To verify security implementation:

1. **Rate Limiting Test**: Send multiple rapid requests to trigger rate limits
2. **Input Validation Test**: Try submitting tasks with special characters like `<script>alert('xss')</script>`
3. **NoSQL Injection Test**: Try submitting MongoDB operators in form fields
4. **Size Limit Test**: Try sending large payloads (>10kb)
5. **Header Inspection**: Check response headers for security headers

## Maintenance

- Regularly update security dependencies (helmet, express-rate-limit, etc.)
- Monitor security advisories for Node.js and npm packages
- Review and adjust rate limits based on legitimate usage patterns
- Keep validation rules in sync with business requirements
- Review security logs for suspicious patterns

## Dependencies

Security-related packages:
- `helmet` - HTTP security headers
- `express-rate-limit` - Rate limiting middleware
- `express-mongo-sanitize` - NoSQL injection protection
- `express-validator` - Input validation and sanitization
- `cookie-parser` - Cookie parsing for session security
- `husky` - Git hooks for code quality
- `lint-staged` - Run linters on staged files
