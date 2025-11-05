/**
 * Debug API: Check User Roles Storage
 * بررسی نحوه ذخیره roles در User collection
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User.model";
import Role from "@/lib/models/Role.model";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    const result = {
      timestamp: new Date().toISOString(),
      allRoles: [],
      sampleUsers: [],
      testResults: {},
    };

    // 1. Get all roles
    const allRoles = await Role.find().select("_id name slug icon").lean();
    result.allRoles = allRoles.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      slug: r.slug,
      icon: r.icon,
    }));

    // 2. Get sample users with roles
    const users = await User.find({ roles: { $exists: true, $ne: [] } })
      .limit(5)
      .select("displayName phoneNumber state roles")
      .lean();

    result.sampleUsers = users.map((u) => ({
      name: u.displayName || u.phoneNumber,
      state: u.state,
      rolesCount: u.roles?.length || 0,
      roles: u.roles,
      rolesType: Array.isArray(u.roles) && u.roles.length > 0 ? typeof u.roles[0] : "empty",
      rolesIsObjectId: Array.isArray(u.roles) && u.roles.length > 0 
        ? mongoose.Types.ObjectId.isValid(u.roles[0])
        : false,
    }));

    // 3. If roleId provided, test queries
    if (roleId) {
      console.log(`\n🔍 Testing queries for role: ${roleId}`);

      // Test 1: String $in
      const test1 = await User.find({
        roles: { $in: [roleId] },
        state: "active",
      }).lean();
      result.testResults.stringIn = {
        query: { roles: { $in: [roleId] }, state: "active" },
        count: test1.length,
        users: test1.map(u => ({ name: u.displayName || u.phoneNumber, roles: u.roles }))
      };

      // Test 2: ObjectId $in
      try {
        const test2 = await User.find({
          roles: { $in: [new mongoose.Types.ObjectId(roleId)] },
          state: "active",
        }).lean();
        result.testResults.objectIdIn = {
          query: { roles: { $in: ["ObjectId(" + roleId + ")"] }, state: "active" },
          count: test2.length,
          users: test2.map(u => ({ name: u.displayName || u.phoneNumber, roles: u.roles }))
        };
      } catch (e) {
        result.testResults.objectIdIn = { error: e.message };
      }

      // Test 3: Both
      try {
        const test3 = await User.find({
          roles: {
            $in: [roleId, new mongoose.Types.ObjectId(roleId)],
          },
          state: "active",
        }).lean();
        result.testResults.both = {
          query: "Both string and ObjectId",
          count: test3.length,
          users: test3.map(u => ({ name: u.displayName || u.phoneNumber, roles: u.roles }))
        };
      } catch (e) {
        result.testResults.both = { error: e.message };
      }

      // Test 4: Check role exists
      const roleExists = await Role.findById(roleId).lean();
      result.testResults.roleExists = !!roleExists;
      if (roleExists) {
        result.testResults.roleInfo = {
          name: roleExists.name,
          slug: roleExists.slug,
        };
      }

      // Test 5: All users with this role (any way)
      const allWithRole = await User.find({
        $or: [
          { roles: roleId },
          { roles: new mongoose.Types.ObjectId(roleId) },
        ],
      })
        .select("displayName phoneNumber state roles")
        .lean();
      
      result.testResults.allUsersWithRole = {
        count: allWithRole.length,
        users: allWithRole.map(u => ({
          name: u.displayName || u.phoneNumber,
          state: u.state,
          roles: u.roles,
        })),
      };
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

