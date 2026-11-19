import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type SubscribeBody = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SubscribeBody;
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
    const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh.trim() : "";
    const authKey = typeof body?.keys?.auth === "string" ? body.keys.auth.trim() : "";

    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json(
        { error: "Invalid push subscription: endpoint, p256dh, and auth are required" },
        { status: 400 }
      );
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth: authKey,
        userId: session.user.id,
      },
      create: {
        endpoint,
        p256dh,
        auth: authKey,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: subscription.id,
        endpoint: subscription.endpoint,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save push subscription" },
      { status: 500 }
    );
  }
}