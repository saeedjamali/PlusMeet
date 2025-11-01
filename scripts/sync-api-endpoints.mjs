/**
 * اسکریپت همگام‌سازی API Endpoints
 * این اسکریپت تمام API route های پروژه رو پیدا می‌کنه و به دیتابیس اضافه می‌کنه
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== Configuration ====================
const API_DIR = path.join(__dirname, "../src/app/api");
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/plusmeet";

// ==================== Helper Functions ====================

/**
 * پیدا کردن تمام فایل‌های route.js
 */
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === "route.js" || file === "route.ts") {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * استخراج متدهای HTTP از محتوای فایل
 */
function extractHttpMethods(content) {
  const methods = [];
  const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  httpMethods.forEach((method) => {
    // بررسی export async function METHOD
    const regex1 = new RegExp(`export\\s+async\\s+function\\s+${method}`, "g");
    // بررسی export function METHOD
    const regex2 = new RegExp(`export\\s+function\\s+${method}`, "g");

    if (regex1.test(content) || regex2.test(content)) {
      methods.push(method);
    }
  });

  return methods;
}

/**
 * تبدیل مسیر فایل به API path
 */
function filePathToApiPath(filePath) {
  const relativePath = path.relative(API_DIR, filePath);
  const dirPath = path.dirname(relativePath);

  // تبدیل backslash به forward slash (برای سیستم‌های ویندوز)
  let apiPath = dirPath.replace(/\\/g, "/");

  // تبدیل [id] به :id
  apiPath = apiPath.replace(/\[([^\]]+)\]/g, ":$1");

  // حذف . اگر در root باشه
  if (apiPath === ".") {
    apiPath = "";
  }

  // اضافه کردن /api در ابتدا
  apiPath = `/api/${apiPath}`.replace(/\/+/g, "/");

  // حذف trailing slash
  if (apiPath.endsWith("/") && apiPath !== "/api/") {
    apiPath = apiPath.slice(0, -1);
  }

  return apiPath;
}

/**
 * تشخیص module و category از path
 */
function categorizeEndpoint(apiPath) {
  const parts = apiPath.split("/").filter(Boolean);

  if (parts.length < 2) {
    return { module: "general", category: "general" };
  }

  // /api/admin/users => module: admin, category: users
  // /api/auth/login => module: auth, category: auth
  // /api/user/profile => module: user, category: profile

  if (parts[1] === "admin") {
    return {
      module: "admin",
      category: parts[2] || "general",
    };
  } else if (parts[1] === "auth") {
    return {
      module: "auth",
      category: "authentication",
    };
  } else if (parts[1] === "user") {
    return {
      module: "user",
      category: parts[2] || "profile",
    };
  } else {
    return {
      module: parts[1] || "general",
      category: parts[2] || parts[1] || "general",
    };
  }
}

/**
 * ساخت عنوان فارسی از path
 */
function generateTitle(apiPath) {
  const titles = {
    "/api/auth/send-otp": "ارسال OTP",
    "/api/auth/verify-otp": "تایید OTP",
    "/api/auth/login": "ورود",
    "/api/auth/logout": "خروج",
    "/api/auth/refresh": "تازه‌سازی توکن",
    "/api/user/profile": "پروفایل کاربر",
    "/api/admin/users": "مدیریت کاربران",
    "/api/admin/users/:id": "عملیات روی کاربر",
    "/api/admin/users/:id/roles": "مدیریت نقش کاربر",
    "/api/admin/rbac/roles": "مدیریت نقش‌ها",
    "/api/admin/rbac/roles/:id": "ویرایش نقش",
    "/api/admin/rbac/menus": "مدیریت منوها",
    "/api/admin/rbac/apis": "مدیریت API ها",
  };

  return titles[apiPath] || apiPath;
}

/**
 * تعیین defaultRoles براساس path
 */
function getDefaultRoles(apiPath) {
  if (apiPath.startsWith("/api/auth")) {
    return []; // عمومی
  } else if (apiPath.startsWith("/api/admin/rbac")) {
    return ["admin"];
  } else if (apiPath.startsWith("/api/admin")) {
    return ["admin", "moderator"];
  } else if (apiPath.startsWith("/api/user")) {
    return ["user", "event_owner", "moderator", "admin"];
  } else {
    return ["user"];
  }
}

/**
 * اسکن تمام API route ها
 */
function scanApiRoutes() {
  console.log("🔍 شروع اسکن API route ها...\n");

  const routeFiles = findRouteFiles(API_DIR);
  const endpoints = [];

  console.log(`📂 ${routeFiles.length} فایل route پیدا شد:\n`);

  routeFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const methods = extractHttpMethods(content);
    const apiPath = filePathToApiPath(filePath);
    const { module, category } = categorizeEndpoint(apiPath);
    const title = generateTitle(apiPath);
    const defaultRoles = getDefaultRoles(apiPath);

    if (methods.length > 0) {
      const endpoint = {
        path: apiPath,
        availableMethods: methods,
        module: module,
        category: category,
        title: title,
        defaultRoles: defaultRoles,
        isPublic:
          apiPath.startsWith("/api/auth") && !apiPath.includes("logout"),
        isActive: true,
      };

      endpoints.push(endpoint);

      console.log(`✅ ${apiPath}`);
      console.log(`   Methods: ${methods.join(", ")}`);
      console.log(`   Module: ${module} | Category: ${category}`);
      console.log(`   Default Roles: ${defaultRoles.join(", ") || "Public"}`);
      console.log();
    }
  });

  console.log(`\n📊 کل: ${endpoints.length} endpoint پیدا شد\n`);

  return endpoints;
}

/**
 * ذخیره endpoint ها در دیتابیس
 */
async function syncToDatabase(endpoints) {
  console.log("🔄 در حال همگام‌سازی با دیتابیس...\n");

  try {
    // Dynamic import برای Mongoose
    const mongoose = (await import("mongoose")).default;

    // اتصال به دیتابیس
    await mongoose.connect(MONGODB_URI);
    console.log("✅ اتصال به دیتابیس برقرار شد\n");

    // Import model
    const ApiEndpoint = (await import("../src/lib/models/ApiEndpoint.model.js"))
      .default;

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const endpoint of endpoints) {
      const existing = await ApiEndpoint.findOne({ path: endpoint.path });

      if (existing) {
        // آپدیت فقط اگر methods تغییر کرده باشه
        const methodsChanged =
          JSON.stringify(existing.availableMethods.sort()) !==
          JSON.stringify(endpoint.availableMethods.sort());

        if (methodsChanged) {
          existing.availableMethods = endpoint.availableMethods;
          existing.updatedAt = new Date();
          await existing.save();
          console.log(`🔄 آپدیت شد: ${endpoint.path}`);
          updatedCount++;
        } else {
          console.log(`⏭️  وجود دارد: ${endpoint.path}`);
          skippedCount++;
        }
      } else {
        // ایجاد endpoint جدید
        await ApiEndpoint.create(endpoint);
        console.log(`✨ اضافه شد: ${endpoint.path}`);
        addedCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 خلاصه:");
    console.log(`   ✨ اضافه شده: ${addedCount}`);
    console.log(`   🔄 آپدیت شده: ${updatedCount}`);
    console.log(`   ⏭️  بدون تغییر: ${skippedCount}`);
    console.log("=".repeat(50) + "\n");

    await mongoose.connection.close();
    console.log("✅ همگام‌سازی با موفقیت انجام شد!\n");
  } catch (error) {
    console.error("❌ خطا در همگام‌سازی:", error.message);
    process.exit(1);
  }
}

/**
 * ذخیره به فایل JSON (برای بررسی)
 */
function saveToJson(endpoints) {
  const outputPath = path.join(__dirname, "api-endpoints.json");
  fs.writeFileSync(outputPath, JSON.stringify(endpoints, null, 2), "utf-8");
  console.log(`💾 ذخیره شد در: ${outputPath}\n`);
}

// ==================== Main ====================

async function main() {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 اسکریپت همگام‌سازی API Endpoints");
  console.log("=".repeat(50) + "\n");

  // 1. اسکن API route ها
  const endpoints = scanApiRoutes();

  // 2. ذخیره به JSON (برای بررسی)
  saveToJson(endpoints);

  // 3. همگام‌سازی با دیتابیس
  await syncToDatabase(endpoints);

  console.log("✅ تمام!\n");
}

// اجرا
main().catch((error) => {
  console.error("❌ خطای کلی:", error);
  process.exit(1);
});
