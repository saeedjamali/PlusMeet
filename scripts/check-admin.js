/**
 * چک کردن و آپدیت کاربر Admin
 * Check and Update Admin User
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// بارگذاری .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function checkAdmin() {
  try {
    console.log("🔄 اتصال به MongoDB...");

    // اتصال به MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ اتصال به MongoDB برقرار شد\n");

    // Load User model
    const User = require("../src/lib/models/User.model.js").default;

    // جستجوی کاربر admin
    const adminPhone = "09123456789";
    let admin = await User.findOne({ phoneNumber: adminPhone });

    if (!admin) {
      console.log("❌ کاربر admin یافت نشد!");
      console.log("\n💡 لطفاً ابتدا اسکریپت create-admin.js را اجرا کنید:");
      console.log("   node scripts/create-admin.js\n");
      process.exit(1);
    }

    console.log("📋 اطلاعات کاربر Admin:");
    console.log("   شماره تلفن:", admin.phoneNumber);
    console.log("   نام نمایشی:", admin.displayName);
    console.log("   نقش‌ها:", admin.roles);
    console.log("   وضعیت:", admin.state);
    console.log("   نوع کاربر:", admin.userType);

    // چک کردن نقش admin
    if (!admin.roles || !admin.roles.includes("admin")) {
      console.log("\n⚠️  نقش admin یافت نشد! در حال اضافه کردن...");

      if (!admin.roles) {
        admin.roles = ["user", "admin"];
      } else if (!admin.roles.includes("admin")) {
        admin.roles.push("admin");
      }

      await admin.save();
      console.log("✅ نقش admin اضافه شد");
    } else {
      console.log("\n✅ نقش admin موجود است");
    }

    // چک کردن وضعیت
    if (admin.state !== "active" && admin.state !== "verified") {
      console.log("\n⚠️  وضعیت کاربر:", admin.state);
      console.log("   در حال تغییر به active...");
      admin.state = "active";
      await admin.save();
      console.log("✅ وضعیت به active تغییر یافت");
    }

    console.log("\n✅ همه چیز آماده است!");
    console.log("\n📌 اطلاعات ورود:");
    console.log("   شماره: 09123456789");
    console.log("   رمز: Admin@123");
    console.log("   لینک: http://localhost:3000/admin/login");

    process.exit(0);
  } catch (error) {
    console.error("❌ خطا:", error.message);
    process.exit(1);
  }
}

// اجرای اسکریپت
checkAdmin();
