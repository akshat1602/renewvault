"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "unsupported" | "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationPrompt() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  async function syncPushSubscription(registration: ServiceWorkerRegistration) {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey || !("pushManager" in registration)) return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error("Incomplete push subscription keys");
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to save push subscription: ${res.status}`);
    }
  }

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as Status);

    if (Notification.permission === "granted") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => navigator.serviceWorker.ready.then(() => syncPushSubscription(reg)))
        .catch(console.error);
    }
  }, []);

  async function handleEnable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as Status);

      if (permission === "granted") {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        await syncPushSubscription(registration);
        console.log("[PWA] Push subscription synced:", registration.scope);
      }
    } catch (error) {
      console.error("[PWA] Notification setup failed:", error);
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || status === "unsupported") return null;

  return (
    <div className="w-full max-w-md rounded-2xl border border-(--border) bg-(--surface) p-5 shadow-lg shadow-black/40">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            Renewal reminders
          </h3>

          {status === "default" && (
            <>
              <p className="mt-1 text-sm text-zinc-400">
                Get notified before your subscriptions renew, right on your
                device.
              </p>
              <button
                onClick={handleEnable}
                disabled={busy}
                className="mt-4 inline-flex items-center rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Enabling…" : "Enable Notifications"}
              </button>
            </>
          )}

          {status === "granted" && (
            <p className="mt-1 text-sm text-emerald-400">
              Notifications are on. You&apos;re all set.
            </p>
          )}

          {status === "denied" && (
            <p className="mt-1 text-sm text-zinc-400">
              Notifications are blocked. Enable them from your browser&apos;s site
              settings to get renewal alerts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}