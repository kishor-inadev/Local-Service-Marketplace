import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

/**
 * Initialize Sentry for error tracking and performance monitoring
 *
 * SETUP INSTRUCTIONS:
 * 1. Sign up at https://sentry.io
 * 2. Create a new project for "Node.js"
 * 3. Copy your DSN (looks like: https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx)
 * 4. Add to .env: SENTRY_DSN=your-dsn-here
 * 5. Add to .env: SENTRY_ENVIRONMENT=production (or development/staging)
 * 6. Run: npm install @sentry/node @sentry/profiling-node
 */

export function initializeSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment =
    process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";
  const serviceName = process.env.SERVICE_NAME || "api-gateway";

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn("[Sentry] SENTRY_DSN not set - error tracking disabled");
    console.warn(
      "[Sentry] To enable: Sign up at https://sentry.io and add SENTRY_DSN to .env",
    );
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment,

      // Service identification
      serverName: serviceName,

      // Release tracking (for deployment correlation)
      release: process.env.SENTRY_RELEASE || process.env.npm_package_version,

      // Performance monitoring
      tracesSampleRate: environment === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev

      // Profiling (helps identify performance bottlenecks)
      profilesSampleRate: environment === "production" ? 0.1 : 1.0,
      integrations: [new ProfilingIntegration()],

      // Attach breadcrumbs for better debugging context
      attachStacktrace: true,
    });

    console.log(`[Sentry] ✅ Initialized for ${serviceName} (${environment})`);
    return true;
  } catch (error) {
    console.error("[Sentry] ❌ Failed to initialize:", error);
    return false;
  }
}

/**
 * Capture an exception manually
 * Usage: captureException(new Error('Something went wrong'), { userId: '123' })
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("[Error]", error, context);
  }
}

/**
 * Capture a message (for warnings, custom events)
 * Usage: captureMessage('Payment processed', 'info', { amount: 100 })
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>,
) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }
}

/**
 * Set user context for error reporting
 * Usage: setUser({ id: '123', email: 'user@example.com' })
 */
export function setUser(
  user: { id: string; email?: string; username?: string } | null,
) {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

/**
 * Add custom context/tags to errors
 * Usage: setContext('payment', { amount: 100, currency: 'USD' })
 */
export function setContext(name: string, context: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.setContext(name, context);
  }
}

/**
 * Add a breadcrumb (for debugging trail)
 * Usage: addBreadcrumb('User logged in', { userId: '123' })
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      data,
      level: "info",
    });
  }
}

/**
 * Close Sentry and flush events (use on shutdown)
 */
export async function closeSentry() {
  if (process.env.SENTRY_DSN) {
    await Sentry.close(2000); // 2 second timeout
  }
}

export default Sentry;
