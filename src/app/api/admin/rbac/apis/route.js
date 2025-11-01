/**
 * API Route: API Endpoints Management
 * مدیریت API Endpoints (دریافت لیست)
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import ApiEndpoint from "@/lib/models/ApiEndpoint.model";
import { authenticate } from "@/lib/middleware/auth";

/**
 * GET - دریافت لیست API Endpoints
 */
export async function GET(request) {
  try {
    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Authorization - فقط admin
    if (!authResult.user.roles?.includes("admin")) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    await connectDB();

    // گرفتن query params
    const { searchParams } = new URL(request.url);
    const shouldGroup = searchParams.get("grouped") === "true";
    const format =
      searchParams.get("format") || (shouldGroup ? "grouped" : "grouped"); // grouped | flat
    const module = searchParams.get("module"); // فیلتر بر اساس ماژول

    // Build query
    const query = { isActive: true };
    if (module) {
      query.module = module;
    }

    if (format === "flat") {
      // لیست صاف
      const endpoints = await ApiEndpoint.find(query).sort({
        module: 1,
        path: 1,
      });

      return NextResponse.json({
        success: true,
        data: {
          endpoints: endpoints.map((e) => e.toPublicJSON()),
          total: endpoints.length,
        },
      });
    }

    // Grouped by module (default)
    const endpoints = await ApiEndpoint.find(query).sort({
      module: 1,
      path: 1,
    });

    // گروه‌بندی بر اساس ماژول
    const grouped = {};
    endpoints.forEach((endpoint) => {
      if (!grouped[endpoint.module]) {
        grouped[endpoint.module] = [];
      }
      grouped[endpoint.module].push(endpoint.toPublicJSON());
    });

    return NextResponse.json({
      success: true,
      data: {
        apis: grouped,
        total: endpoints.length,
        modules: Object.keys(grouped),
      },
    });
  } catch (error) {
    console.error("Error fetching API endpoints:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

/**
 * POST - ایجاد endpoint جدید (آینده)
 * فعلاً endpoints از طریق seed script اضافه می‌شن
 */
export async function POST(request) {
  try {
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

    const body = await request.json();
    const {
      path,
      availableMethods,
      module,
      category,
      title,
      description,
      queryParams,
      pathParams,
      defaultRoles,
      isPublic,
      tags,
    } = body;

    // Validation
    if (!path || !module || !title) {
      return NextResponse.json(
        { success: false, error: "مسیر، ماژول و عنوان الزامی است" },
        { status: 400 }
      );
    }

    await connectDB();

    // بررسی تکراری بودن path
    const existingEndpoint = await ApiEndpoint.findOne({ path });
    if (existingEndpoint) {
      return NextResponse.json(
        { success: false, error: "این endpoint قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    const endpoint = new ApiEndpoint({
      path,
      availableMethods: availableMethods || ["GET"],
      module,
      category,
      title,
      description,
      queryParams: queryParams || [],
      pathParams: pathParams || [],
      defaultRoles: defaultRoles || [],
      isPublic: isPublic || false,
      tags: tags || [],
    });

    await endpoint.save();

    return NextResponse.json(
      {
        success: true,
        message: "Endpoint با موفقیت ایجاد شد",
        data: { endpoint: endpoint.toPublicJSON() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating endpoint:", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
