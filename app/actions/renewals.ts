"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Renewal as UIRenewal } from "@/lib/types";
import { Renewal as DatabaseRenewal } from "@prisma/client";

function normalizeCategoryKey(category: string): string {
  return category.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatCategoryLabel(category: string): string {
  const cleaned = category.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Uncategorized";
  if (cleaned.toLowerCase() === "ai") return "AI";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

async function resolveCanonicalCategory(userId: string, rawCategory: string): Promise<string> {
  const cleaned = rawCategory.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Uncategorized";

  const targetKey = normalizeCategoryKey(cleaned);
  const existingRenewals = await prisma.renewal.findMany({
    where: { userId },
    select: { category: true },
  });

  const matchedExisting = existingRenewals.find(
    (r) => r.category && normalizeCategoryKey(r.category) === targetKey
  );

  if (matchedExisting?.category) {
    return matchedExisting.category.trim().replace(/\s+/g, " ");
  }

  return formatCategoryLabel(cleaned);
}

function mapRenewalFromDB(prismaRenewal: DatabaseRenewal): UIRenewal {
  const dbRecord = prismaRenewal as DatabaseRenewal & { splitCount?: number | null };

  return {
    id: prismaRenewal.id,
    name: prismaRenewal.name,
    category: prismaRenewal.category,
    dueDate: prismaRenewal.dueDate.toISOString().split("T")[0],
    amount: prismaRenewal.amount,
    currency: prismaRenewal.currency,
    billingCycle: prismaRenewal.billingCycle || "monthly",
    status: prismaRenewal.status as UIRenewal["status"],
    reminderEnabled: prismaRenewal.reminderEnabled,

    // Safely bypass TS cache and parse string back to number array
    reminderDaysBefore: (prismaRenewal.reminderDaysBefore as any)
      ? String(prismaRenewal.reminderDaysBefore)
          .split(",")
          .map(Number)
          .filter((n) => !isNaN(n))
      : [],

    websiteDomain: prismaRenewal.websiteDomain,
    splitCount: dbRecord.splitCount ?? 1,
  };
}

export async function getRenewals(): Promise<UIRenewal[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const renewals = await prisma.renewal.findMany({
    where: { userId: session.user.id },
    orderBy: { dueDate: "asc" },
  });

  return renewals.map(mapRenewalFromDB);
}

export async function createRenewal(data: Omit<UIRenewal, "id">): Promise<UIRenewal> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const normalizedCategory = await resolveCanonicalCategory(session.user.id, data.category);
  const splitCount = Math.max(1, Math.min(10, data.splitCount ?? 1));

  const newRenewal = await prisma.renewal.create({
    data: {
      name: data.name,
      category: normalizedCategory,
      dueDate: new Date(data.dueDate),
      amount: data.amount,
      currency: data.currency,
      billingCycle: data.billingCycle || "monthly",
      status: data.status,
      reminderEnabled: data.reminderDaysBefore.length > 0,

      // Bypass TS cache and convert array [1,7] to string "1,7"
      reminderDaysBefore: (data.reminderDaysBefore.length > 0
        ? data.reminderDaysBefore.join(",")
        : null) as any,

      websiteDomain: data.websiteDomain || null,
      splitCount,
      userId: session.user.id,
    } as any,
  });

  return mapRenewalFromDB(newRenewal);
}

export async function updateRenewal(id: string, data: UIRenewal): Promise<UIRenewal> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.renewal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Unauthorized or not found");
  }

  const normalizedCategory = await resolveCanonicalCategory(session.user.id, data.category);
  const splitCount = Math.max(1, Math.min(10, data.splitCount ?? 1));

  const updated = await prisma.renewal.update({
    where: { id },
    data: {
      name: data.name,
      category: normalizedCategory,
      dueDate: new Date(data.dueDate),
      amount: data.amount,
      currency: data.currency,
      billingCycle: data.billingCycle,
      status: data.status,
      reminderEnabled: data.reminderDaysBefore.length > 0,

      // Bypass TS cache and convert array [1,7] to string "1,7"
      reminderDaysBefore: (data.reminderDaysBefore.length > 0
        ? data.reminderDaysBefore.join(",")
        : null) as any,

      websiteDomain: data.websiteDomain || null,
      splitCount,
    } as any,
  });

  return mapRenewalFromDB(updated);
}

export async function deleteRenewal(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.renewal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Unauthorized or not found");
  }

  await prisma.renewal.delete({ where: { id } });
}

export async function markRenewalAsRenewed(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.renewal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Unauthorized or not found");
  }

  await prisma.renewal.update({
    where: { id },
    data: { status: "renewed" },
  });
}