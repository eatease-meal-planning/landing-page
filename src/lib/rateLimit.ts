import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { sql } from "drizzle-orm";

const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;

/**
 * Sliding-window IP rate limit, 5 requests per 10 minutes.
 *
 * `key` is the primary key of the rate_limits row, not necessarily a bare IP:
 * callers prefix it per endpoint (e.g. `del:${ip}`) so that hammering one
 * endpoint doesn't consume another's budget for the same visitor.
 *
 * Returns true when the caller is over the limit.
 */
export async function checkRateLimit(key: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);

  const [row] = await db
    .insert(rateLimits)
    .values({ ip: key, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: rateLimits.ip,
      set: {
        count: sql`CASE
          WHEN rate_limits.window_start > ${windowStart.toISOString()}
          THEN rate_limits.count + 1
          ELSE 1
        END`,
        windowStart: sql`CASE
          WHEN rate_limits.window_start > ${windowStart.toISOString()}
          THEN rate_limits.window_start
          ELSE now()
        END`,
      },
    })
    .returning();

  return (row?.count ?? 0) > RATE_LIMIT_MAX;
}
