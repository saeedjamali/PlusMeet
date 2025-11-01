/**
 * API Route: همگام‌سازی خودکار API Endpoints
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import connectDB from "@/lib/db/mongodb";
import ApiEndpoint from "@/lib/models/ApiEndpoint.model";
import { authenticate } from "@/lib/middleware/auth";

/**
 * پیدا کردن تمام فایل‌های route
 */
function findRouteFiles(dir, fileList = []) {
  try {
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
  } catch (error) {
    // Skip directories that can't be read
  }

  return fileList;
}

/**
 * استخراج متدهای HTTP
 */
function extractHttpMethods(content) {
  const methods = [];
  const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  httpMethods.forEach((method) => {
    const regex1 = new RegExp(`export\\s+async\\s+function\\s+${method}`, "g");
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
function filePathToApiPath(filePath, apiDir) {
  const relativePath = path.relative(apiDir, filePath);
  const dirPath = path.dirname(relativePath);

  // تبدیل backslash به forward slash (برای سیستم‌های ویندوز)
  let apiPath = dirPath.replace(/\\/g, "/");

  // تبدیل [id] به :id
  apiPath = apiPath.replace(/\[([^\]]+)\]/g, ":$1");

  if (apiPath === ".") {
    apiPath = "";
  }

  apiPath = `/api/${apiPath}`.replace(/\/+/g, "/");

  if (apiPath.endsWith("/") && apiPath !== "/api/") {
    apiPath = apiPath.slice(0, -1);
  }

  return apiPath;
}

/**
 * تشخیص module و category
 */
function categorizeEndpoint(apiPath) {
  const parts = apiPath.split("/").filter(Boolean);

  if (parts.length < 2) {
    return { module: "general", category: "general" };
  }

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
 * تعیین defaultRoles
 */
function getDefaultRoles(apiPath) {
  if (apiPath.startsWith("/api/auth")) {
    return [];
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
 * POST - همگام‌سازی API Endpoints
 */
export async function POST(request) {
  try {
    // فقط admin
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    if (!authResult.user.roles?.includes("admin")) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    await connectDB();

    // مسیر API directory
    const apiDir = path.join(process.cwd(), "src/app/api");

    // اسکن فایل‌ها
    const routeFiles = findRouteFiles(apiDir);
    const endpoints = [];

    routeFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8");
      const methods = extractHttpMethods(content);
      const apiPath = filePathToApiPath(filePath, apiDir);
      const { module, category } = categorizeEndpoint(apiPath);
      const defaultRoles = getDefaultRoles(apiPath);

      if (methods.length > 0) {
        endpoints.push({
          path: apiPath,
          availableMethods: methods,
          module,
          category,
          title: apiPath,
          defaultRoles,
          isPublic:
            apiPath.startsWith("/api/auth") && !apiPath.includes("logout"),
          isActive: true,
        });
      }
    });

    // همگام‌سازی با دیتابیس
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const endpoint of endpoints) {
      const existing = await ApiEndpoint.findOne({ path: endpoint.path });

      if (existing) {
        const methodsChanged =
          JSON.stringify(existing.availableMethods.sort()) !==
          JSON.stringify(endpoint.availableMethods.sort());

        if (methodsChanged) {
          existing.availableMethods = endpoint.availableMethods;
          existing.updatedAt = new Date();
          await existing.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        await ApiEndpoint.create(endpoint);
        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "همگام‌سازی با موفقیت انجام شد",
      stats: {
        total: endpoints.length,
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
      },
      endpoints: endpoints.map((e) => ({
        path: e.path,
        methods: e.availableMethods,
      })),
    });
  } catch (error) {
    console.error("Error syncing APIs:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}
