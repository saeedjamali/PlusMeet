/**
 * Script برای به‌روزرسانی PaymentCode موجود
 * اجرا کنید: node update-payment-code.js
 */

const mongoose = require('mongoose');

// اتصال به دیتابیس (آدرس خودتون رو بذارید)
const MONGODB_URI = 'mongodb://localhost:27017/plusmeet'; // یا آدرس MongoDB شما

async function updatePaymentCode() {
  try {
    console.log('🔄 در حال اتصال به MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ اتصال موفق!');

    const PaymentCode = mongoose.model('PaymentCode', new mongoose.Schema({}, { strict: false }));

    // پیدا کردن و به‌روزرسانی کد JTE
    const result = await PaymentCode.updateOne(
      { code: 'JTE' },
      { 
        $set: { 
          'settings.allowEventJoin': true,
          'settings.allowTicketPurchase': false,
          'settings.allowCourseEnrollment': false,
        }
      }
    );

    if (result.matchedCount > 0) {
      console.log('✅ کد پرداخت JTE با موفقیت به‌روزرسانی شد!');
      console.log(`   📋 تعداد: ${result.modifiedCount} رکورد`);
    } else {
      console.log('⚠️  کد پرداخت JTE یافت نشد');
    }

    // نمایش دیتای به‌روزرسانی شده
    const updatedCode = await PaymentCode.findOne({ code: 'JTE' });
    console.log('\n📊 دیتای به‌روزرسانی شده:');
    console.log(JSON.stringify(updatedCode, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ عملیات با موفقیت انجام شد!');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
}

updatePaymentCode();

