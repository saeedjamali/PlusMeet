/**
 * API Route: Get Users by Role
 * دریافت کاربران یک نقش خاص
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { protectAPI } from "@/lib/middleware/apiProtection";

/**
 * GET /api/admin/roles/:id/users
 * دریافت کاربران که این نقش را دارند
 */
export async function GET(request, { params }) {
  try {
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 100;
    const activeOnly = searchParams.get("activeOnly") !== "false"; // default true

    // Import Role model
    const Role = (await import("@/lib/models/Role.model")).default;
    const mongoose = (await import("mongoose")).default;

    // ابتدا role را پیدا کنیم تا slug آن را داشته باشیم
    const role = await Role.findById(params.id).lean();
    if (!role) {
      return NextResponse.json(
        { error: "نقش یافت نشد" },
        { status: 404 }
      );
    }

    console.log(`🔍 Found role: ${role.name} (${role.slug})`);

    // Query - جستجو با هر دو slug (string) و _id (ObjectId)
    // زیرا برخی دیتابیس‌ها roles را به صورت slug و برخی به صورت ObjectId ذخیره می‌کنند
    const query = {
      $and: [
        {
          $or: [
            { roles: { $in: [role.slug] } }, // جستجو با slug (متداول‌تر)
            { roles: { $in: [params.id] } }, // جستجو با string ID
            { roles: { $in: [new mongoose.Types.ObjectId(params.id)] } }, // جستجو با ObjectId
          ],
        },
      ],
    };

    // فقط کاربران فعال
    if (activeOnly) {
      query.$and.push({ state: "active" });
    }

    console.log(`🔍 Searching for users with role: ${role.slug} (${params.id})`);
    console.log(`📋 Query:`, JSON.stringify(query, null, 2));

    const users = await User.find(query)
      .select("displayName phoneNumber avatar email state roles")
      .populate("roles", "name slug icon")
      .limit(limit)
      .sort({ displayName: 1 })
      .lean();

    console.log(`✅ Found ${users.length} users with this role`);
    
    if (users.length > 0) {
      console.log(`📋 Sample user roles type:`, typeof users[0].roles?.[0]);
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        total: users.length,
      },
    });
  } catch (error) {
    console.error(`GET /api/admin/roles/${params.id}/users error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

