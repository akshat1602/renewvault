import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data = await response.json();
    const rates: Record<string, number> = {
      ...(data?.rates ?? {}),
      USD: 1.0,
    };

    const entries = Object.entries(rates).filter(
      ([currency, rate]) => Boolean(currency) && typeof rate === "number" && Number.isFinite(rate)
    );

    if (entries.length === 0) {
      throw new Error("No valid exchange rates returned");
    }

    await Promise.all(
      entries.map(([currency, rate]) =>
        prisma.exchangeRate.upsert({
          where: { currency },
          update: { rate: Number(rate) },
          create: { currency, rate: Number(rate) },
        })
      )
    );

    revalidatePath("/dashboard/rates");

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${entries.length} exchange rates.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron Job Error - Exchange Rates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update rates" },
      { status: 500 }
    );
  }
}