import { NextResponse } from "next/server";
import * as webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { processDailyReminders } from "@/lib/reminders";

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@renewvault.me";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized: Invalid CRON_SECRET", { status: 401 });
  }

  try {
    const result = await processDailyReminders();

    let pushSent = 0;
    let pushCleaned = 0;

    const vapidReady = configureVapid();
    const resultObj = result as Record<string, unknown> | null;
    const notifications = Array.isArray(resultObj?.notifications)
      ? (resultObj.notifications as Array<{
          userId?: string;
          title?: string;
          body?: string;
          url?: string;
        }>)
      : [];

    if (vapidReady && notifications.length > 0) {
      const userIds = Array.from(
        new Set(notifications.map((n) => n.userId).filter((id): id is string => Boolean(id)))
      );

      if (userIds.length > 0) {
        const subscriptions = await prisma.pushSubscription.findMany({
          where: { userId: { in: userIds } },
        });

        const subsByUser = new Map<string, typeof subscriptions>();
        for (const sub of subscriptions) {
          const list = subsByUser.get(sub.userId) ?? [];
          list.push(sub);
          subsByUser.set(sub.userId, list);
        }

        for (const item of notifications) {
          if (!item.userId) continue;
          const userSubs = subsByUser.get(item.userId) ?? [];
          const payload = JSON.stringify({
            title: item.title || "RenewVault Renewal Reminder",
            body: item.body || "You have an upcoming subscription renewal.",
            url: item.url || "/dashboard",
          });

          for (const sub of userSubs) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                  },
                },
                payload
              );
              pushSent += 1;
            } catch (err: unknown) {
              const statusCode =
                typeof err === "object" && err !== null && "statusCode" in err
                  ? Number((err as { statusCode?: number }).statusCode)
                  : undefined;

              if (statusCode === 410 || statusCode === 404) {
                await prisma.pushSubscription
                  .delete({ where: { id: sub.id } })
                  .catch(() => {});
                pushCleaned += 1;
              } else {
                console.error("Push send error for subscription:", sub.id, err);
              }
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        ...resultObj,
        pushSent,
        pushCleaned,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cron processing failed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}