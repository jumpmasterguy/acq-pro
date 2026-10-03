// Admin: one page, four sections, the same on the website, phone and app.
//   Today   what happened and what needs Lucas      (AdminToday)
//   People  everyone, with one user card for fixes  (AdminPeople)
//   Numbers money, plans, signups, engagement       (AdminNumbers)
//   Send    the newsletter
// Every number comes from server/adminStats.ts so screens can't disagree.

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Shield, Users, BarChart2, Zap, Send, Eye } from "lucide-react";
import AdminToday from "@/components/admin/AdminToday";
import AdminPeople from "@/components/admin/AdminPeople";
import AdminNumbers from "@/components/admin/AdminNumbers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type AdminTab = "today" | "people" | "numbers" | "send";

const TABS = [
  { key: "today", label: "Today", icon: Zap },
  { key: "people", label: "People", icon: Users },
  { key: "numbers", label: "Numbers", icon: BarChart2 },
  { key: "send", label: "Send", icon: Send },
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
          <p className="text-sm text-muted-foreground">Today, people, numbers and email</p>
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
      {activeTab === "send" && <SendNewsletter />}
    </div>
  );
}

// ─── Send ────────────────────────────────────────────────────────────────────

function SendNewsletter() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [html, setHtml] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  const send = useMutation({
    mutationFn: async (testOnly: boolean) => {
      const res = await apiRequest("POST", "/api/admin/newsletter", { subject, previewText: preview, html, testOnly });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Send failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data, testOnly) => {
      setArmed(false);
      if (testOnly) {
        setResult("Test email sent to lucas.l.cruz.es@gmail.com. Check your inbox.");
        toast({ title: "Test sent", description: "Check your inbox for the preview." });
      } else {
        setResult(`Sent to ${data.sent} of ${data.total} users.`);
        toast({ title: "Newsletter sent", description: `Sent to ${data.sent} of ${data.total} users.` });
      }
    },
    onError: (err: Error) => {
      setArmed(false);
      setResult(null);
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  const ready = !!subject && !!html && !send.isPending;
  const field = "w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-[16px] sm:text-sm";

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4" data-testid="admin-send">
      <div>
        <label className="text-sm font-medium block mb-1.5">Subject line</label>
        <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="New: real example documents inside your lessons" className={field} />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5">Preview text</label>
        <input type="text" value={preview} onChange={e => setPreview(e.target.value)}
          placeholder="The snippet people see in their inbox" className={field} />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5">HTML body</label>
        <textarea value={html} onChange={e => setHtml(e.target.value)} rows={12}
          placeholder="Paste the email HTML body here" className={`${field} font-mono !text-xs`} />
        <p className="text-xs text-muted-foreground mt-1">
          Goes to each user separately (nobody sees other addresses), wrapped in the Acqlerate email design. Replies go to hello@acqlerate.com.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant="outline" disabled={!ready} onClick={() => send.mutate(true)}>
          <Eye className="w-4 h-4 mr-1.5" />
          {send.isPending ? "Sending…" : "Send test to me"}
        </Button>
        {/* Two taps instead of a browser pop-up, same as the user card. */}
        <Button
          disabled={!ready}
          variant={armed ? "destructive" : "default"}
          onClick={() => (armed ? send.mutate(false) : setArmed(true))}
          data-testid="send-all"
        >
          <Send className="w-4 h-4 mr-1.5" />
          {send.isPending ? "Sending…" : armed ? "Tap again: send to every user" : "Send to all users"}
        </Button>
        {armed && !send.isPending && (
          <button onClick={() => setArmed(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground px-2">Cancel</button>
        )}
      </div>
      {result && <div className="text-sm bg-muted rounded-lg px-3 py-2">{result}</div>}
    </div>
  );
}
