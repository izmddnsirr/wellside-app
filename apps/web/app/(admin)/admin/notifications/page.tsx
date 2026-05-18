import { Suspense } from "react";
import Image from "next/image";
import { AdminShell } from "../components/admin-shell";
import { NotificationsClient } from "./notifications-client";
import { Skeleton } from "@/components/ui/skeleton";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { Smartphone, Send, Clock } from "lucide-react";

export const metadata = {
  title: "Notifications — Wellside+",
};

function NotificationsSkeleton() {
  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-5 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      {/* Main content */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full lg:max-w-xl space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="w-full lg:flex-1 space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function NotificationsStats() {
  const supabase = createAdminAuthClient();

  const [{ data: logs }, { data: tokens }] = await Promise.all([
    supabase.from("broadcast_logs").select("sent_to, created_at").order("created_at", { ascending: false }),
    supabase.from("device_tokens").select("user_id"),
  ]);

  const totalSent = (logs ?? []).reduce((sum, l) => sum + (l.sent_to ?? 0), 0);
  const totalBroadcasts = (logs ?? []).length;
  const uniqueUsers = new Set((tokens ?? []).map((t) => t.user_id)).size;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <p className="text-sm text-muted-foreground">App Users</p>
        <p className="mt-1.5 text-3xl font-semibold tabular-nums">{uniqueUsers}</p>
        <p className="mt-1 text-xs text-muted-foreground">Users with app installed</p>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <p className="text-sm text-muted-foreground">Total Broadcasts</p>
        <p className="mt-1.5 text-3xl font-semibold tabular-nums">{totalBroadcasts}</p>
        <p className="mt-1 text-xs text-muted-foreground">Notifications sent</p>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <p className="text-sm text-muted-foreground">Total Reached</p>
        <p className="mt-1.5 text-3xl font-semibold tabular-nums">{totalSent}</p>
        <p className="mt-1 text-xs text-muted-foreground">Cumulative users reached</p>
      </div>
    </div>
  );
}

async function BroadcastHistory() {
  const supabase = createAdminAuthClient();

  const { data: logs } = await supabase
    .from("broadcast_logs")
    .select("id, title, body, sent_to, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <p className="text-sm font-semibold">Broadcast History</p>
          <p className="text-sm text-muted-foreground mt-0.5">Recent notifications sent to all users.</p>
        </div>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="px-6 pb-6">
        {!logs || logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-8 text-center">
            <Send className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No broadcasts yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{log.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.body}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-foreground">{log.sent_to} {log.sent_to === 1 ? "user" : "users"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function AppUsersList() {
  const supabase = createAdminAuthClient();

  const { data: tokens } = await supabase.from("device_tokens").select("user_id, created_at, token");
  const uniqueUserIds = [...new Set((tokens ?? []).map((t) => t.user_id).filter(Boolean))];

  const { data: profiles } = uniqueUserIds.length > 0
    ? await supabase.from("profiles").select("id, first_name, last_name, email, avatar_url").in("id", uniqueUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const users = uniqueUserIds.map((uid) => {
    const profile = profileMap.get(uid);
    const userTokens = (tokens ?? []).filter((t) => t.user_id === uid);
    const latestToken = userTokens.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const name = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown" : "Unknown";
    return { uid, name, email: profile?.email ?? "-", avatarUrl: profile?.avatar_url ?? null, tokenCount: userTokens.length, installedAt: latestToken?.created_at ?? null };
  });

  const formatDate = (value: string | null) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <p className="text-sm font-semibold">App Users</p>
          <p className="text-sm text-muted-foreground mt-0.5">Users with the mobile app installed.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-semibold">
            {users.length} {users.length === 1 ? "user" : "users"}
          </span>
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="px-6 pb-6">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-8 text-center">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No users have installed the app yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {users.map((user) => {
              const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
              return (
                <div key={user.uid} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" fill className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                        {initials || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{formatDate(user.installedAt)}</p>
                    <p className="text-xs text-muted-foreground">{user.tokenCount} {user.tokenCount === 1 ? "device" : "devices"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

async function NotificationsPageContent() {
  const supabase = createAdminAuthClient();

  const [{ data: tokens }, { data: templateRows }, { data: scheduledRows }] = await Promise.all([
    supabase.from("device_tokens").select("user_id"),
    supabase.from("notification_templates").select("id, title, body").order("created_at", { ascending: false }),
    supabase.from("scheduled_notifications").select("id, title, body, scheduled_at, status").order("scheduled_at", { ascending: true }),
  ]);

  const uniqueUserIds = [...new Set((tokens ?? []).map((t) => t.user_id).filter(Boolean))];
  const { data: profiles } = uniqueUserIds.length > 0
    ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", uniqueUserIds)
    : { data: [] };

  const appUsers = uniqueUserIds.map((uid) => {
    const p = (profiles ?? []).find((x) => x.id === uid);
    return {
      id: uid,
      name: p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown" : "Unknown",
      email: p?.email ?? "-",
    };
  });

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <NotificationsStats />
      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          <NotificationsClient
            appUsers={appUsers}
            templates={templateRows ?? []}
            scheduled={scheduledRows ?? []}
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <AppUsersList />
        <BroadcastHistory />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell title="Notifications">
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsPageContent />
      </Suspense>
    </AdminShell>
  );
}
