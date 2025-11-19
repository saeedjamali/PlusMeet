/**
 * چک کردن نقش‌های کاربر
 * Check User Roles
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// بارگذاری .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function checkUserRoles() {
  try {
    console.log("🔄 اتصال به MongoDB...");

    // اتصال به MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ اتصال به MongoDB برقرار شد\n");

    // Load User model
    const User = require("../src/lib/models/User.model.js").default;

    // دریافت شماره تلفن از command line
    const phoneNumber = process.argv[2];

    if (!phoneNumber) {
      console.log("❌ لطفاً شماره تلفن را وارد کنید:");
      console.log("   node scripts/check-user-roles.js 09123456789\n");
      process.exit(1);
    }

    // جستجوی کاربر
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      console.log(`❌ کاربر با شماره ${phoneNumber} یافت نشد!\n`);

      // نمایش تعداد کل کاربران
      const totalUsers = await User.countDocuments();
      console.log(`📊 تعداد کل کاربران در سیستم: ${totalUsers}`);

      // نمایش 5 کاربر اخیر
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("phoneNumber displayName roles createdAt");

      if (recentUsers.length > 0) {
        console.log("\n📋 5 کاربر اخیر:");
        recentUsers.forEach((u, index) => {
          console.log(
            `   ${index + 1}. ${u.phoneNumber} - ${
              u.displayName
            } - [${u.roles.join(", ")}]`
          );
        });
      }

      process.exit(1);
    }

    console.log("✅ کاربر یافت شد!\n");
    console.log("📋 اطلاعات کاربر:");
    console.log("─────────────────────────────────────");
    console.log(`   شماره تلفن: ${user.phoneNumber}`);
    console.log(`   نام نمایشی: ${user.displayName}`);
    console.log(`   نام: ${user.firstName} ${user.lastName}`);
    console.log(`   نقش‌ها: [${user.roles.join(", ")}]`);
    console.log(`   تعداد نقش‌ها: ${user.roles.length}`);
    console.log(`   وضعیت: ${user.state}`);
    console.log(`   نوع کاربر: ${user.userType}`);
    console.log(`   تاریخ ثبت‌نام: ${user.createdAt}`);
    console.log(`   آخرین ورود: ${user.lastLoginAt || "هرگز"}`);
    console.log("─────────────────────────────────────\n");

    // بررسی نقش‌ها
    console.log("🎭 تحلیل نقش‌ها:");
    console.log("─────────────────────────────────────");

    const hasUser = user.roles.includes("user");
    const hasEventOwner = user.roles.includes("event_owner");
    const hasModerator = user.roles.includes("moderator");
    const hasAdmin = user.roles.includes("admin");

    console.log(`   ✓ User (کاربر عادی): ${hasUser ? "✅ دارد" : "❌ ندارد"}`);
    console.log(
      `   ✓ Event Owner (مالک رویداد): ${
        hasEventOwner ? "✅ دارد" : "❌ ندارد"
      }`
    );
    console.log(
      `   ✓ Moderator (ناظر): ${hasModerator ? "✅ دارد" : "❌ ندارد"}`
    );
    console.log(`   ✓ Admin (مدیر): ${hasAdmin ? "✅ دارد" : "❌ ندارد"}`);
    console.log("─────────────────────────────────────\n");

    // پیشنهادات
    if (!hasUser && user.roles.length > 0) {
      console.log("⚠️  توجه: این کاربر نقش 'user' ندارد!");
      console.log("   معمولاً همه کاربران باید نقش 'user' داشته باشند.\n");
    }

    if (hasEventOwner && !hasUser) {
      console.log("⚠️  توجه: Event Owner بدون نقش User!");
      console.log("   بهتر است هر event_owner نقش user هم داشته باشد.\n");
    }

    // آمار کلی
    console.log("📊 آمار کلی سیستم:");
    console.log("─────────────────────────────────────");
    const totalUsers = await User.countDocuments();
    const usersWithEventOwner = await User.countDocuments({
      roles: "event_owner",
    });
    const admins = await User.countDocuments({ roles: "admin" });
    const moderators = await User.countDocuments({ roles: "moderator" });

    console.log(`   کل کاربران: ${totalUsers}`);
    console.log(`   Event Owners: ${usersWithEventOwner}`);
    console.log(`   Moderators: ${moderators}`);
    console.log(`   Admins: ${admins}`);
    console.log("─────────────────────────────────────\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ خطا:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// اجرای اسکریپت
checkUserRoles();






