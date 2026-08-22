import Sidebar from "@/app/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}