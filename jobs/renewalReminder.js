const cron = require("node-cron");
const Admin = require("../models/CoreUser/Admin");
const {sendEmail} = require("../utils/email");
const dayjs = require("dayjs");

// ⏰ Run daily at 8:00 AM
cron.schedule("0 8 * * *", async () => {
  try {
    const today = new Date();
    const nextWeek = dayjs(today).add(7, "day").toDate();

    // 1️⃣ Send renewal reminders
    const adminsToNotify = await Admin.find({
      status: "Active",
      renewal_date: { $gte: today, $lte: nextWeek },
    });

    for (const admin of adminsToNotify) {
      await sendEmail(
        admin.email,
        "📅 Renewal Reminder",
        `<p>Dear ${admin.school_name},</p>
         <p>Your subscription will expire on <b>${dayjs(admin.renewal_date).format("DD MMM YYYY")}</b>.</p>
         <p>Please renew to continue using the platform.</p>`
      );
    }

    // 2️⃣ Expire overdue accounts
    const expiredAdmins = await Admin.find({
      status: "Active",
      renewal_date: { $lt: today },
    });

    for (const admin of expiredAdmins) {
      admin.status = "Inactive";
      await admin.save();

      await sendEmail(
        admin.email,
        "❌ Account Deactivated",
        `<p>Dear ${admin.school_name},</p>
         <p>Your subscription has expired on <b>${dayjs(admin.renewal_date).format("DD MMM YYYY")}</b>.</p>
         <p>Your account is now inactive. Please contact support or renew your plan to reactivate.</p>`
      );

      console.log(`Auto-deactivated: ${admin.email}`);
    }

  } catch (err) {
    console.error("⏳ Auto-expire cron error:", err.message);
  }
});
