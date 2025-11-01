/**
 * Create Initial Admin User
 * ایجاد کاربر مدیر اولیه
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// بارگذاری .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function createAdmin() {
  try {
    console.log("🔄 اتصال به MongoDB...");

    // اتصال به MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ اتصال به MongoDB برقرار شد\n");

    // Load User model
    const User = require("../src/lib/models/User.model.js").default;

    // اطلاعات Admin
    const adminData = {
      phoneNumber: "09123456789",
      password: "Admin@123",
      firstName: "مدیر",
      lastName: "سیستم",
      displayName: "مدیر کل",
      roles: ["user", "admin"],
      state: "active",
      userType: "individual",
    };

    // بررسی وجود کاربر
    const existingAdmin = await User.findOne({
      phoneNumber: adminData.phoneNumber,
    });

    if (existingAdmin) {
      console.log("⚠️  کاربر مدیر قبلاً ایجاد شده است!");
      console.log("\n📋 اطلاعات فعلی:");
      console.log("   شماره تلفن:", existingAdmin.phoneNumber);
      console.log("   نام نمایشی:", existingAdmin.displayName);
      console.log("   نقش‌ها:", existingAdmin.roles);
      console.log("   وضعیت:", existingAdmin.state);

      console.log("\n💡 برای بررسی و تعمیر admin، اسکریپت زیر را اجرا کنید:");
      console.log("   npm run check-admin\n");

      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // ایجاد کاربر جدید
    const admin = new User({
      ...adminData,
      password: hashedPassword,
      lastLoginAt: new Date(),
    });

    await admin.save();

    console.log("✅ کاربر مدیر با موفقیت ایجاد شد!\n");
    console.log("📋 اطلاعات ورود:");
    console.log("   شماره تلفن:", adminData.phoneNumber);
    console.log("   رمز عبور:", adminData.password);
    console.log("   لینک ورود: http://localhost:3000/admin/login");
    console.log("\n⚠️  توجه: حتماً رمز عبور را در محیط production تغییر دهید!");

    process.exit(0);
  } catch (error) {
    console.error("❌ خطا در ایجاد کاربر مدیر:", error);
    process.exit(1);
  }
}

// اجرای اسکریپت
createAdmin();
