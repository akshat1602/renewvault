'use client';

import { useMemo } from 'react';
import { Renewal } from '@/lib/types';

// --- ICONS ---
function CalendarIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function ActivityIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>; }
function RupeeIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>; }
function TrendingUpIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }

const EXCHANGE_RATES: Record<string, number> = {
  USD: 83.0,
  EUR: 90.0,
  GBP: 105.0,
  INR: 1.0,
};

interface SpendingSummaryProps {
  renewals: Renewal[];
  isLoading: boolean;
}

export default function SpendingSummary({ renewals, isLoading }: SpendingSummaryProps) {
  const { totalMonthlyINR, totalYearlyINR, totalActive, monthlyTrendINR } = useMemo(() => {
    let monthlyINR = 0;
    let yearlyINR = 0;
    let active = 0;
    let previousMonthINR = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    renewals.forEach((renewal) => {
      if (renewal.status !== 'cancelled') {
        active += 1;
        const currency = renewal.currency || 'USD';
        const rate = EXCHANGE_RATES[currency] || 1.0;
        const amountInINR = renewal.amount * rate;

        const monthlyContribution = renewal.billingCycle === 'yearly' ? amountInINR / 12 : amountInINR;
        const yearlyContribution = renewal.billingCycle === 'yearly' ? amountInINR : amountInINR * 12;

        monthlyINR += monthlyContribution;
        yearlyINR += yearlyContribution;

        // Calculate trend: Check if renewal was created before this month
        const createdDate = renewal.createdAt ? new Date(renewal.createdAt) : new Date();
        if (createdDate.getMonth() < currentMonth || createdDate.getFullYear() < currentYear) {
          previousMonthINR += monthlyContribution;
        }
      }
    });

    const trend = monthlyINR - previousMonthINR;

    return { 
      totalMonthlyINR: monthlyINR, 
      totalYearlyINR: yearlyINR, 
      totalActive: active,
      monthlyTrendINR: trend
    };
  }, [renewals]);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8 animate-fade-in-up delay-100">
        {[1, 2, 3].map((i) => (
           <div key={i} className="rounded-2xl border border-zinc-800 bg-[#121214]/80 backdrop-blur-md p-5 h-[120px] animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8 animate-fade-in-up delay-100">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        
        {/* Monthly Spend Card */}
        <div className="min-w-0 rounded-2xl border border-zinc-800 bg-[#121214]/80 backdrop-blur-md p-5 shadow-sm hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 min-w-0">
              <p className="text-xs font-medium text-zinc-400 tracking-wider uppercase leading-snug min-w-0 break-words">
                Monthly Spend (INR)
              </p>
              <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-[var(--secondary-text)]">
                <RupeeIcon />
              </span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-3 truncate" title={formatINR(totalMonthlyINR)}>
              {formatINR(totalMonthlyINR)}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
            <span className={`inline-flex items-center gap-0.5 font-semibold ${monthlyTrendINR >= 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
              <TrendingUpIcon />
              {monthlyTrendINR >= 0 ? `+${formatINR(monthlyTrendINR)}` : formatINR(monthlyTrendINR)}
            </span>
            <span>vs last month</span>
          </div>
        </div>

        {/* Yearly Spend Card */}
        <div className="min-w-0 rounded-2xl border border-zinc-800 bg-[#121214]/80 backdrop-blur-md p-5 shadow-sm hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 min-w-0">
              <p className="text-xs font-medium text-zinc-400 tracking-wider uppercase leading-snug min-w-0 break-words">
                Yearly Spend (INR)
              </p>
              <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-amber-400">
                <CalendarIcon />
              </span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-400 mt-3 truncate" title={formatINR(totalYearlyINR)}>
              {formatINR(totalYearlyINR)}
            </p>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            Estimated annual commitment
          </div>
        </div>

        {/* Active Renewals Card */}
        <div className="min-w-0 rounded-2xl border border-zinc-800 bg-[#121214]/80 backdrop-blur-md p-5 shadow-sm hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 min-w-0">
              <p className="text-xs font-medium text-zinc-400 tracking-wider uppercase leading-snug min-w-0 break-words">
                Active Renewals
              </p>
              <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-[#4338ca]">
                <ActivityIcon />
              </span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-3 truncate">
              {totalActive}
            </p>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            Currently tracked services
          </div>
        </div>

      </div>
    </div>
  );
}