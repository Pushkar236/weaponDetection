import { NextRequest, NextResponse } from "next/server";
import { sendDetectionAlertFromPayload } from "../../../mailjetMailer.js";
// Email policy config and in-memory state
const EMAIL_COOLDOWN_MS = 60_000;          // per (to, cameraName)
const NOTIFIED_TTL_MS = 10 * 60_000;       // dedupe window by detection id

type Severity = "low" | "medium" | "high";

const lastEmailAtByKey = new Map<string, number>(); // key: `${to}::${cameraName}`
const notifiedIdTs = new Map<string, number>();     // id -> timestamp sent

const sevRank = (s?: Severity) => (s === "high" ? 3 : s === "medium" ? 2 : 1);

function pruneNotified(now: number) {
  for (const [id, ts] of notifiedIdTs) {
    if (now - ts > NOTIFIED_TTL_MS) notifiedIdTs.delete(id);
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Email service ready",
    message: "Configure MAILJET_API_KEY, MAILJET_API_SECRET, FROM_EMAIL (and optional FROM_NAME)",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      cameraName,
      location,
      timestamp,
      weaponType,
      confidence,
      severity,
      id,
    } = body;

    // Support both `image` and legacy `screenshot`
    const image = body.image || body.screenshot;

    if (!to || !cameraName || !image) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: to, cameraName, image/screenshot" },
        { status: 400 }
      );
    }

    const now = Date.now();
    pruneNotified(now);

    const normalizedId: string = id || `${cameraName}-${timestamp || now}`;
    const key = `${to}::${cameraName}`;
    const lastSentAt = lastEmailAtByKey.get(key) || 0;
    const underCooldown = now - lastSentAt < EMAIL_COOLDOWN_MS;
    const rank = sevRank(severity as Severity);
    const forceBypass = rank === 3; // high severity bypasses cooldown

    // Deduplicate by detection id within TTL
    if (notifiedIdTs.has(normalizedId)) {
      return NextResponse.json({
        success: true,
        suppressed: true,
        reason: "duplicate-id",
        message: "Suppressed duplicate detection id",
      });
    }

    // Skip low severity and low confidence noise
    // const conf = typeof confidence === "number" ? confidence : undefined;
    // const passConfidenceGate = conf === undefined || rank >= 2 || conf >= MIN_CONFIDENCE_LOW;
    // if (!passConfidenceGate) {
    //   return NextResponse.json({
    //     success: true,
    //     suppressed: true,
    //     reason: "low-confidence-low-severity",
    //     message: "Suppressed low severity/low confidence alert",
    //   });
    // }

    // Cooldown unless forced by high severity
    if (underCooldown && !forceBypass) {
      return NextResponse.json({
        success: true,
        suppressed: true,
        reason: "cooldown",
        retryAfterMs: EMAIL_COOLDOWN_MS - (now - lastSentAt),
        message: "Suppressed by cooldown",
      });
    }

    // // Dynamically import the mailer (ESM-safe) and support both named/default exports
    // const mod = await import("../../../mailjetMailer.js");
    // const sendDetectionAlertFromPayload =
    //   (mod as any).sendDetectionAlertFromPayload ||
    //   (mod as any).default?.sendDetectionAlertFromPayload;

    if (typeof sendDetectionAlertFromPayload !== "function") {
      return NextResponse.json(
        { success: false, error: "Mailer not loaded: sendDetectionAlertFromPayload missing" },
        { status: 500 }
      );
    }

    const result = await sendDetectionAlertFromPayload(
      {
        to,
        cameraName,
        location,
        timestamp,
        weaponType,
        confidence,
        severity,
        image,
        id: normalizedId,
      },
      {
        // Optional overrides:
        // bbox: { x, y, width, height },
        // subject: `[${(severity || '').toUpperCase()}] Alert: ${weaponType || 'Weapon'} on ${cameraName}`,
      }
    );

    // Update state
    lastEmailAtByKey.set(key, now);
    notifiedIdTs.set(normalizedId, now);

    return NextResponse.json({
      success: true,
      message: "Email sent via Mailjet",
      result,
    });
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to send security alert email",
      },
      { status: 500 }
    );
  }
}