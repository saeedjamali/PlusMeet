/**
 * API Route: Assign Ticket
 * ارجاع تیکت
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/models/Ticket.model";
import User from "@/lib/models/User.model";
import Role from "@/lib/models/Role.model";
import { protectAPI } from "@/lib/middleware/apiProtection";
import { logActivity } from "@/lib/models/ActivityLog.model";

/**
 * POST /api/tickets/:id/assign
 * ارجاع تیکت به کارشناس/نقش دیگر
 */
export async function POST(request, { params }) {
  try {
    const protection = await protectAPI(request);
    if (!protection.success) {
      return NextResponse.json(
        { error: protection.error },
        { status: protection.status }
      );
    }

    await connectDB();

    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی (فقط کارشناسان می‌توانند ارجاع دهند)
    const userRoles = protection.user.roles || [];
    const isStaff = userRoles.some((r) =>
      ["admin", "moderator", "support"].includes(r)
    );

    if (!isStaff) {
      return NextResponse.json(
        { error: "شما دسترسی به ارجاع تیکت ندارید" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { toRole, toUser, reason } = body;

    // Validation
    if (!toRole) {
      return NextResponse.json(
        { error: "نقش مقصد الزامی است" },
        { status: 400 }
      );
    }

    // بررسی وجود نقش
    const role = await Role.findById(toRole);
    if (!role) {
      return NextResponse.json({ error: "نقش یافت نشد" }, { status: 404 });
    }

    // بررسی وجود کاربر (اگر مشخص شده باشد)
    if (toUser) {
      const user = await User.findById(toUser);
      if (!user) {
        return NextResponse.json(
          { error: "کاربر یافت نشد" },
          { status: 404 }
        );
      }

      // بررسی اینکه کاربر این نقش را دارد
      if (!user.roles.includes(toRole.toString())) {
        return NextResponse.json(
          { error: "کاربر مورد نظر این نقش را ندارد" },
          { status: 400 }
        );
      }
    }

    // ارجاع تیکت
    await ticket.assignTo(
      toUser || null,
      toRole,
      protection.user.id,
      reason || "ارجاع توسط کارشناس"
    );

    await ticket.populate("assignedTo", "displayName phoneNumber avatar");
    await ticket.populate("assignedRole", "name slug");

    // Log activity
    await logActivity(protection.user.phoneNumber, "ticket.assign", {
      targetType: "Ticket",
      targetId: ticket._id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        toRole: role.name,
        toUser: toUser || "نامشخص",
        reason: reason || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "تیکت با موفقیت ارجاع داده شد",
      data: { ticket },
    });
  } catch (error) {
    console.error(`POST /api/tickets/${params.id}/assign error:`, error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}




