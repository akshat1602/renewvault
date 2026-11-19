import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { generateReminderEmailHtml } from "./email-templates";
import fs from "fs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

export type ReminderNotificationPayload = {
  userId: string;
  title: string;
  body: string;
  url?: string;
};

export async function processDailyReminders() {
  console.log("Starting daily reminder processing...");

  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const activeRenewals = await prisma.renewal.findMany({
    where: {
      reminderEnabled: true,
      status: { in: ["upcoming", "due-soon"] },
      reminderDaysBefore: { not: null },
    },
    include: {
      user: true,
    },
  });

  let emailsSent = 0;
  const notifications: ReminderNotificationPayload[] = [];

  const logoPath = path.join(process.cwd(), "public", "logo.png");
  let logoBuffer: Buffer | null = null;
  try {
    logoBuffer = fs.readFileSync(logoPath);
  } catch {
    console.error("Warning: logo.png not found.");
  }

  for (const renewal of activeRenewals) {
    if (!renewal.userId || !renewal.reminderDaysBefore) continue;

    const rawReminders = String(renewal.reminderDaysBefore);
    const daysArray = rawReminders
      .split(",")
      .map(Number)
      .filter((n: number) => !isNaN(n));

    const matchedDays = daysArray.find((days: number) => {
      const due = new Date(renewal.dueDate);
      const alertDateUtc = new Date(
        Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate() - days)
      );
      return alertDateUtc.getTime() === todayUtc.getTime();
    });

    if (matchedDays !== undefined) {
      const dayLabel = matchedDays === 1 ? "1 day" : `${matchedDays} days`;
      const amountLabel = `${renewal.amount} ${renewal.currency}`;

      notifications.push({
        userId: renewal.userId,
        title: `Renewal Reminder: ${renewal.name}`,
        body: `${renewal.name} (${amountLabel}) renews in ${dayLabel}.`,
        url: "/dashboard",
      });

      if (renewal.user?.email) {
        try {
          const html = generateReminderEmailHtml(
            renewal.user.name || "Vault User",
            renewal.name,
            renewal.amount,
            renewal.currency,
            renewal.dueDate,
            matchedDays
          );

          const attachments = logoBuffer
            ? [
                {
                  filename: "logo.png",
                  content: logoBuffer,
                  contentId: "renewvault-logo",
                },
              ]
            : [];

          await resend.emails.send({
            from: "RenewVault <reminders@renewvault.me>",
            to: renewal.user.email,
            subject: `Reminder: ${renewal.name} renews in ${dayLabel}`,
            html,
            attachments,
          });

          emailsSent++;
          console.log(`Sent reminder to ${renewal.user.email} for ${renewal.name}`);
        } catch (error) {
          console.error(`Failed to send reminder for renewal ID ${renewal.id}:`, error);
        }
      }
    }
  }

  console.log(`Finished processing. Sent ${emailsSent} emails and queued ${notifications.length} push items.`);
  return { success: true, emailsSent, notifications };
}