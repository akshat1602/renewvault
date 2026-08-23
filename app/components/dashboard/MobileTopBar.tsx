"use client";

import NotificationBell from "@/app/components/dashboard/NotificationBell";

export default function MobileTopBar() {
  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800/60 bg-[#0b0b0d]/95 backdrop-blur-xl px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="6 4 52 52" fill="none" className="w-full h-full">
            <defs>
              <linearGradient id="mobile-logo-grad" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#F97316"/>
                <stop offset="1" stopColor="#4338CA"/>
              </linearGradient>
            </defs>
            <path d="M32 10L47 17V29.4C47 39.5 40.6 48.1 32 51.5C23.4 48.1 17 39.5 17 29.4V17L32 10Z" fill="#0F0F10" stroke="url(#mobile-logo-grad)" strokeWidth="3" strokeLinejoin="round"/>
            <path d="M25 24.5V21.8C25 18 28 15 32 15C36 15 39 18 39 21.8V24.5" stroke="url(#mobile-logo-grad)" strokeWidth="3" strokeLinecap="round"/>
            <path d="M23.5 26H40.5V37.5H23.5V26Z" fill="#151516"/>
            <path d="M28 35.5V28L36 35.5V28" stroke="url(#mobile-logo-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-sm font-bold tracking-wide text-white">RenewVault</span>
      </div>
      <NotificationBell />
    </header>
  );
}