/**
 * File Upload Utilities
 * ابزارهای مدیریت آپلود فایل
 */

import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// مسیر پوشه uploads (خارج از src)
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// تضمین وجود پوشه‌های مورد نیاز
export async function ensureUploadDirectories() {
  const dirs = [
    UPLOADS_DIR,
    path.join(UPLOADS_DIR, "avatars"),
    path.join(UPLOADS_DIR, "logos"),
    path.join(UPLOADS_DIR, "tickets"),
    path.join(UPLOADS_DIR, "events"),
    path.join(UPLOADS_DIR, "reports"),
    path.join(UPLOADS_DIR, "temp"),
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  }
}

/**
 * ذخیره base64 به عنوان فایل
 */
export async function saveBase64Image(base64String, folder = "avatars") {
  try {
    // استخراج اطلاعات فایل
    const matches = base64String.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error("فرمت base64 نامعتبر است");
    }

    const imageType = matches[1]; // png, jpg, etc
    const imageData = matches[2];

    // تولید نام یونیک
    const fileName = `${uuidv4()}.${imageType}`;
    const folderPath = path.join(UPLOADS_DIR, folder);
    const filePath = path.join(folderPath, fileName);

    // تضمین وجود پوشه
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
    }

    // ذخیره فایل
    const buffer = Buffer.from(imageData, "base64");
    await fs.writeFile(filePath, buffer);

    console.log(`✅ Image saved: ${fileName}`);

    // برگرداندن URL نسبی
    return `/api/uploads/${folder}/${fileName}`;
  } catch (error) {
    console.error("Error saving base64 image:", error);
    throw error;
  }
}

/**
 * حذف فایل قدیمی
 */
export async function deleteOldFile(fileUrl) {
  try {
    if (!fileUrl || !fileUrl.startsWith("/api/uploads/")) {
      return; // فایل قدیمی نیست یا base64 است
    }

    // استخراج مسیر فایل
    const urlParts = fileUrl.split("/api/uploads/")[1];
    if (!urlParts) return;

    const filePath = path.join(UPLOADS_DIR, urlParts);

    // حذف فایل
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`🗑️ Deleted old file: ${urlParts}`);
    } catch {
      // فایل وجود ندارد
    }
  } catch (error) {
    console.error("Error deleting old file:", error);
    // عدم حذف فایل نباید مانع ادامه فرآیند شود
  }
}

/**
 * دریافت مسیر فیزیکی فایل
 */
export function getFilePath(relativePath) {
  // relativePath: avatars/uuid.png
  return path.join(UPLOADS_DIR, relativePath);
}

/**
 * بررسی وجود فایل
 */
export async function fileExists(relativePath) {
  const filePath = getFilePath(relativePath);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * خواندن فایل
 */
export async function readFile(relativePath) {
  const filePath = getFilePath(relativePath);
  return await fs.readFile(filePath);
}

/**
 * دریافت MIME type بر اساس پسوند
 */
export function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * اعتبارسنجی فایل تصویر
 */
export function validateImageFile(base64String, maxSizeMB = 2) {
  // بررسی فرمت
  if (!base64String.startsWith("data:image/")) {
    throw new Error("فرمت تصویر نامعتبر است");
  }

  // بررسی حجم
  const base64Size = base64String.length * (3 / 4) - 2; // تقریبی
  const maxSize = maxSizeMB * 1024 * 1024;
  
  if (base64Size > maxSize) {
    throw new Error(`حجم تصویر نباید بیشتر از ${maxSizeMB} مگابایت باشد`);
  }

  return true;
}

/**
 * ذخیره فایل از FormData
 * @param {File} file - فایل از FormData
 * @param {string} folder - نام پوشه (events, reports, etc)
 * @param {number} maxSizeMB - حداکثر حجم به مگابایت
 * @returns {Promise<string>} URL نسبی فایل
 */
export async function saveFormDataFile(file, folder = "temp", maxSizeMB = 5) {
  try {
    // اعتبارسنجی نوع فایل
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("فرمت فایل مجاز نیست. فقط JPG, PNG, GIF و WebP مجاز است");
    }

    // اعتبارسنجی حجم
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`حجم فایل نباید بیشتر از ${maxSizeMB} مگابایت باشد`);
    }

    // تولید نام یکتا
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.name);
    const fileName = `${folder}_${timestamp}_${randomString}${fileExtension}`;
    
    // مسیر ذخیره
    const folderPath = path.join(UPLOADS_DIR, folder);
    const filePath = path.join(folderPath, fileName);

    // تضمین وجود پوشه
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
    }

    // ذخیره فایل
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    console.log(`✅ File saved: ${folder}/${fileName}`);

    // برگرداندن URL نسبی
    return `/api/uploads/${folder}/${fileName}`;
  } catch (error) {
    console.error("Error saving FormData file:", error);
    throw error;
  }
}

