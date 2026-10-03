// Admin: one page, three sections, the same on the website, phone and app.
//   Today   what happened and what needs Lucas      (AdminToday)
//   People  everyone, with one user card for fixes  (AdminPeople)
//   Numbers money, plans, signups, engagement       (AdminNumbers)
// Every number comes from server/adminStats.ts so screens can't disagree.

import { useState } from "react";
import { Shield, Users, BarChart2, Zap } from "lucide-react";
import AdminToday from "@/components/admin/AdminToday";
import AdminPeople from "@/components/admin/AdminPeople";
import AdminNumbers from "@/components/admin/AdminNumbers";

type AdminTab = "today" | "people" | "numbers";

const TABS = [
  { key: "today", label: "Today", icon: Zap },
  { key: "people", label: "People", icon: Users },
  { key: "numbers", label: "Numbers", icon: BarChart2 },
] as const;

export default function AdminPage({ initialTab = "today" }: { initialTab?: AdminTab }) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="admin-page">
      {/* Header (phones already show "Admin" in the top bar) */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">Today, people and numbers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 max-sm:!mt-0 [scrollbar-width:none]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`admin-tab-${key}`}
          >
            <span className="flex items-center justify-center gap-1.5"><Icon className="w-4 h-4" />{label}</span>
          </button>
        ))}
      </div>

      {activeTab === "today" && <AdminToday />}
      {activeTab === "people" && <AdminPeople />}
      {activeTab === "numbers" && <AdminNumbers />}
    </div>
  );
}
