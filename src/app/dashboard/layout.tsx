import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
