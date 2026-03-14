"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Coffee,
  LayoutDashboard,
  PenSquare,
  MessageSquare,
  Clock,
  CalendarDays,
  Store,
  LogOut,
  Menu,
  X,
  Shield,
  CreditCard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/dashboard/post", label: "投稿作成", icon: PenSquare },
  { href: "/dashboard/review", label: "レビュー返信", icon: MessageSquare },
  { href: "/dashboard/history", label: "履歴", icon: Clock },
  { href: "/dashboard/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/dashboard/team", label: "チーム", icon: Users },
  { href: "/dashboard/shop", label: "店舗設定", icon: Store },
  { href: "/dashboard/plan", label: "プラン", icon: CreditCard },
];

const adminItem = { href: "/dashboard/admin", label: "管理者", icon: Shield };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("shops")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();
      setIsAdmin(!!data?.is_admin);
    }
    checkAdmin();
  }, [supabase]);

  const allNavItems = isAdmin ? [...navItems, adminItem] : navItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("ログアウトしました");
    router.push("/login");
    router.refresh();
  };

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-6">
        <Coffee className="w-6 h-6 text-brand-600" />
        <span className="text-lg font-bold text-brand-800">カフェSNS投稿AI</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {allNavItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-100 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          ログアウト
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4"
        >
          <X className="w-5 h-5" />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col">
        {navContent}
      </aside>
    </>
  );
}
