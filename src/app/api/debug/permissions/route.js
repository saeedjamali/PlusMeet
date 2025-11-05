/**
 * Debug API - بررسی دسترسی‌های کاربر
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Role from "@/lib/models/Role.model";
import ApiEndpoint from "@/lib/models/ApiEndpoint.model";
import { authenticate } from "@/lib/middleware/auth";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { checkApiPermission } from "@/lib/middleware/dynamicRbac";

export async function GET(request) {
  try {
    // API Protection
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    await connectDB();

    const user = authResult.user;
    const userRoles = user.roles || [];

    // گرفتن اطلاعات نقش‌ها
    const roles = await Role.find({
      slug: { $in: userRoles },
      isActive: true,
    }).lean();

    // بررسی endpoint خاص
    const testEndpoint = "/api/admin/users/:id/roles";
    const testMethod = "PUT";

    const endpoint = await ApiEndpoint.findOne({
      path: testEndpoint,
      isActive: true,
    }).lean();

    const permissionCheck = await checkApiPermission(
      user,
      testEndpoint,
      testMethod
    );

    // جمع‌آوری تمام apiPermissions
    const allApiPermissions = [];
    roles.forEach((role) => {
      role.apiPermissions.forEach((perm) => {
        allApiPermissions.push({
          role: role.slug,
          path: perm.path,
          methods: perm.methods,
        });
      });
    });

    return NextResponse.json({
      success: true,
      debug: {
        user: {
          phoneNumber: user.phoneNumber,
          roles: userRoles,
          _id: user._id,
        },
        rolesInDatabase: roles.map((r) => ({
          name: r.name,
          slug: r.slug,
          isSystem: r.isSystem,
          apiPermissionsCount: r.apiPermissions?.length || 0,
        })),
        testEndpoint: {
          path: testEndpoint,
          method: testMethod,
          existsInDB: !!endpoint,
          defaultRoles: endpoint?.defaultRoles || [],
          availableMethods: endpoint?.availableMethods || [],
          permissionCheck: permissionCheck,
        },
        allApiPermissions: allApiPermissions,
      },
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


