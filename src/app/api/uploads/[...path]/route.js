/**
 * API Route: Serve Uploaded Files
 * سرو فایل‌های آپلود شده
 */

import { NextResponse } from "next/server";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { readFile, fileExists, getMimeType } from "@/lib/utils/fileUpload";

/**
 * GET /api/uploads/[...path]
 * دریافت فایل آپلود شده
 */
export async function GET(request, { params }) {
  try {
    const { path } = params;
    const relativePath = path.join("/");
    const folder = path[0]; // اولین بخش path (avatars, logos, tickets, etc.)

    // تصاویر آواتار و لوگو public هستند
    const isPublicFile = ["avatars", "logos"].includes(folder);

    // API Protection - فقط RBAC، بدون چک‌های اضافی
    const protection = await protectAPI(request, { 
      isPublic: isPublicFile,
      checkPermission: !isPublicFile, // برای فایل‌های غیر public، permission چک شود
    });
    
    if (!protection.success) {
      console.log(`❌ protectAPI failed for ${relativePath}:`, protection.error);
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    console.log(`✅ protectAPI success for ${relativePath} - User: ${protection.user?.phoneNumber || 'Public'}`);
    
    // اگر RBAC گذشت، دسترسی هست
    // دیگر نیازی به چک creator/assigned نیست

    // بررسی وجود فایل
    const exists = await fileExists(relativePath);
    if (!exists) {
      return NextResponse.json(
        { success: false, error: "فایل یافت نشد" },
        { status: 404 }
      );
    }

    // خواندن فایل
    const fileBuffer = await readFile(relativePath);
    const mimeType = getMimeType(relativePath);

    // ارسال فایل
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/uploads/[...path] error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت فایل" },
      { status: 500 }
    );
  }
}

