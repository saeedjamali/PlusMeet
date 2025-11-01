/**
 * Script to create initial admin user
 * اسکریپت ایجاد کاربر ادمین اولیه
 */

const mongoose = require("mongoose");
const readline = require("readline");

// بارگذاری .env
require("dotenv").config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    console.log("🚀 ایجاد کاربر ادمین اولیه\n");

    // اتصال به MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      console.error("❌ خطا: MONGODB_URI در .env تعریف نشده است");
      process.exit(1);
    }

    console.log("📡 در حال اتصال به MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ اتصال برقرار شد\n");

    // تعریف Schema
    const UserSchema = new mongoose.Schema({
      phoneNumber: { type: String, required: true, unique: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      displayName: String,
      roles: { type: [String], default: ["user"] },
      state: { type: String, default: "active" },
      userType: { type: String, default: "individual" },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      stats: {
        profileViews: { type: Number, default: 0 },
        eventsCreated: { type: Number, default: 0 },
        eventsJoined: { type: Number, default: 0 },
      },
      settings: {
        language: { type: String, default: "fa" },
        notifications: { type: Boolean, default: true },
        privacy: {
          showPhone: { type: Boolean, default: false },
          showEmail: { type: Boolean, default: true },
        },
      },
    });

    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    // دریافت اطلاعات از کاربر
    const phoneNumber = await question("شماره موبایل (09xxxxxxxxx): ");

    if (!/^09\d{9}$/.test(phoneNumber)) {
      console.error("❌ شماره موبایل نامعتبر است");
      process.exit(1);
    }

    // بررسی وجود کاربر
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      console.log("\n⚠️  کاربری با این شماره موجود است");

      // به‌روزرسانی نقش
      if (!existingUser.roles.includes("admin")) {
        existingUser.roles.push("admin");
        await existingUser.save();
        console.log("✅ نقش admin به کاربر اضافه شد");
      } else {
        console.log("ℹ️  این کاربر قبلاً admin است");
      }

      console.log("\n✅ اطلاعات کاربر:");
      console.log(`   نام: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`   شماره: ${existingUser.phoneNumber}`);
      console.log(`   نقش‌ها: ${existingUser.roles.join(", ")}`);
      process.exit(0);
    }

    const firstName = await question("نام: ");
    const lastName = await question("نام خانوادگی: ");

    // ایجاد کاربر
    const admin = new User({
      phoneNumber,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      roles: ["admin", "user"],
      state: "verified",
      userType: "individual",
    });

    await admin.save();

    console.log("\n✅ کاربر ادمین با موفقیت ایجاد شد!");
    console.log("\n📋 اطلاعات کاربر:");
    console.log(`   نام: ${admin.firstName} ${admin.lastName}`);
    console.log(`   شماره: ${admin.phoneNumber}`);
    console.log(`   نقش‌ها: ${admin.roles.join(", ")}`);
    console.log(`   وضعیت: ${admin.state}`);
    console.log("\n🎉 حالا می‌توانید با این شماره وارد پنل ادمین شوید.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ خطا:", error.message);
    process.exit(1);
  } finally {
    rl.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// اجرای اسکریپت
createAdmin();

