/**
 * API Route: User Management
 * مسیر API: مدیریت کاربران
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import { logActivity } from "@/lib/models/ActivityLog.model";
import { protectApi } from "@/lib/middleware/apiProtection";
import bcrypt from "bcryptjs";

/**
 * GET /api/admin/users
 * دریافت لیست کاربران با فیلتر و جستجو
 */
export async function GET(request) {
  try {
    // محافظت API با RBAC دینامیک
    const protection = await protectApi(request, {
      allowedRoles: ["admin", "moderator"], // fallback اگر در دیتابیس نباشد
      checkPermission: true, // چک از apiPermissions نقش‌ها در دیتابیس
    });

    if (!protection.success) {
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    const user = protection.user;

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const state = searchParams.get("state") || "";
    const userType = searchParams.get("userType") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query = {};

    // Search by phone or name
    if (search) {
      query.$or = [
        { phoneNumber: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      query.roles = role;
    }

    // Filter by state
    if (state) {
      query.state = state;
    }

    // Filter by user type (support for grouped filtering)
    if (userType) {
      if (userType === "individual") {
        // Individual includes: individual, individual_freelancer
        query.userType = { $in: ["individual", "individual_freelancer"] };
      } else if (userType === "organization") {
        // Organization includes all organization_* subtypes
        query.userType = {
          $in: [
            "organization",
            "organization_team",
            "organization_private",
            "organization_public",
            "organization_ngo",
            "organization_edu",
            "organization_media",
          ],
        };
      } else if (userType === "government") {
        // Government remains as is
        query.userType = "government";
      } else {
        // For direct subtype filtering (if needed)
        query.userType = userType;
      }
    }

    // Count total documents
    const total = await User.countDocuments(query);

    // Fetch users with pagination
    const users = await User.find(query)
      .select("-password") // Exclude password
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Log activity
    await logActivity(user.phoneNumber, "users.list", {
      metadata: { page, limit, search, role, state, userType },
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست کاربران" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * ایجاد کاربر جدید
 */
export async function POST(request) {
  try {
    // محافظت API
    const protection = await protectApi(request, {
      allowedRoles: ["admin"],
      checkPermission: true,
    });

    if (!protection.success) {
      return NextResponse.json(
        { success: false, error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      phoneNumber,
      password,
      firstName,
      lastName,
      displayName,
      email,
      roles,
      state,
      userType,
      // Individual fields
      dateOfBirth,
      gender,
      city,
      personalAddress,
      nationalId,
      // Organization fields
      organizationName,
      registrationNumber,
      taxId,
      website,
      organizationEmail,
      description,
      address,
      contactPerson,
      // Common
      socialLinks,
      bio,
    } = body;

    // Validation
    if (!phoneNumber || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          error: "شماره موبایل، نام و نام خانوادگی الزامی است",
        },
        { status: 400 }
      );
    }

    // Check phone number format
    if (!/^09\d{9}$/.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: "فرمت شماره موبایل نامعتبر است" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "کاربری با این شماره موبایل وجود دارد" },
        { status: 400 }
      );
    }

    // Validate email
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "فرمت ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    // Validate national ID
    if (nationalId && !/^\d{10}$/.test(nationalId)) {
      return NextResponse.json(
        { success: false, error: "کد ملی باید 10 رقم باشد" },
        { status: 400 }
      );
    }

    // Create user data
    const userData = {
      phoneNumber,
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`,
      roles: roles || ["user"],
      state: state || "active",
      userType: userType || "individual",
    };

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    }

    // Add optional fields
    if (email) userData.email = email;
    if (nationalId) userData.nationalId = nationalId;
    if (bio) userData.bio = bio;

    // Individual fields
    if (userType?.startsWith("individual")) {
      if (dateOfBirth) userData.dateOfBirth = dateOfBirth;
      if (gender) userData.gender = gender;
      if (city) userData.city = city;
      if (personalAddress) userData.personalAddress = personalAddress;
    }

    // Organization fields
    if (userType?.startsWith("organization") || userType === "government") {
      if (organizationName) userData.organizationName = organizationName;
      if (registrationNumber) userData.registrationNumber = registrationNumber;
      if (taxId) userData.taxId = taxId;
      if (website) userData.website = website;
      if (organizationEmail) userData.organizationEmail = organizationEmail;
      if (description) userData.description = description;
      if (address) userData.address = address;
      if (contactPerson) userData.contactPerson = contactPerson;
    }

    // Social links
    if (socialLinks) userData.socialLinks = socialLinks;

    // Create user
    const newUser = await User.create(userData);

    // Log activity
    await logActivity(protection.user.phoneNumber, "user.create", {
      targetId: newUser._id,
      targetType: "User",
      metadata: {
        createdUser: newUser.phoneNumber,
        createdUserName: `${newUser.firstName} ${newUser.lastName}`,
        roles: newUser.roles,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "کاربر با موفقیت ایجاد شد",
      data: { user: await newUser.toPublicJSON() }, // 👈 async method
    });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, error: messages.join(", ") },
        { status: 400 }
      );
    }

    // Duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "کاربری با این شماره موبایل وجود دارد" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}
