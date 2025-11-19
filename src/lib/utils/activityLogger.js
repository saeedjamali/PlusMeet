/**
 * Activity Logger Utility
 * ابزار لاگ فعالیت‌ها
 */

import { logActivity as logActivityModel } from "@/lib/models/ActivityLog.model";

/**
 * لاگ کردن یک فعالیت
 * @param {object} data - اطلاعات فعالیت
 * @param {string} data.user - شناسه کاربر
 * @param {string} data.action - عمل انجام شده
 * @param {string} data.category - دسته‌بندی فعالیت
 * @param {string} data.targetModel - مدل هدف (اختیاری)
 * @param {string} data.targetId - شناسه هدف (اختیاری)
 * @param {object} data.details - جزئیات اضافی (اختیاری)
 * @param {string} data.ipAddress - آدرس IP (اختیاری)
 * @param {string} data.userAgent - User Agent (اختیاری)
 */
export async function logActivity(data) {
  try {
    await logActivityModel(data);
  } catch (error) {
    console.error("❌ Error logging activity:", error);
    // در صورت خطا، فقط لاگ می‌کنیم و ادامه می‌دهیم
  }
}



