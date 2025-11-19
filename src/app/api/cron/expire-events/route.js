import { NextResponse } from "next/server";
import { expireOldEvents } from "@/lib/helpers/eventExpiry";

/**
 * GET /api/cron/expire-events
 * 
 * این API برای cron job است که باید به صورت دوره‌ای (مثلاً هر 6 ساعت یا 12 ساعت) فراخوانی شود
 * تا رویدادهایی که 72 ساعت از پایانشان گذشته به صورت خودکار expired شوند
 * 
 * برای امنیت، می‌توانید یک token یا API key اضافه کنید
 */
export async function GET(request) {
  try {
    // اختیاری: چک کردن authorization header برای امنیت
    // const authHeader = request.headers.get("authorization");
    // const expectedToken = process.env.CRON_SECRET_TOKEN;
    // 
    // if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    console.log("🕐 Running event expiry cron job...");

    const result = await expireOldEvents();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully processed. ${result.expiredCount} events expired.`,
        expiredCount: result.expiredCount,
        events: result.events,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error in cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * نحوه راه‌اندازی Cron Job:
 * 
 * 1. استفاده از سرویس‌های مثل Vercel Cron یا Netlify Functions
 * 2. استفاده از سرویس‌های خارجی مثل cron-job.org یا EasyCron
 * 3. استفاده از node-cron در صورت استفاده از سرور اختصاصی
 * 
 * مثال Vercel Cron (در vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-events",
 *     "schedule": "0 *\/6 * * *"
 *   }]
 * }
 * 
 * این cron هر 6 ساعت یک بار اجرا می‌شود
 */

