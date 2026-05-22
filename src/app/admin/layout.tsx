import Navbar from "@/components/layout/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7" }}>
      <Navbar />
      <div className="flex pt-[48px]">
        <AdminSidebar />
        <main className="flex-1 min-w-0 pt-[44px] lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
