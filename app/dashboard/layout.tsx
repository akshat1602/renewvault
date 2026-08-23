import Sidebar from "@/app/components/dashboard/Sidebar";
import MobileTopBar from "@/app/components/dashboard/MobileTopBar";
import MobileBottomNav from "@/app/components/dashboard/MobileBottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileTopBar />
               <main className="min-w-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
