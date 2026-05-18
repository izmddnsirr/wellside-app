"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  broadcastNotification,
  sendToUser,
  saveTemplate,
  deleteTemplate,
  scheduleNotification,
  cancelScheduled,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, BookTemplate, Clock, Send, User, Radio } from "lucide-react";

type ActionResult = { ok: boolean; sent?: number; error?: string } | null;

type AppUser = { id: string; name: string; email: string };
type Template = { id: string; title: string; body: string };
type Scheduled = { id: string; title: string; body: string; scheduled_at: string; status: string };

type Props = {
  appUsers: AppUser[];
  templates: Template[];
  scheduled: Scheduled[];
};

function TextareaField({
  id,
  name,
  placeholder,
  disabled,
  value,
  onChange,
}: {
  id: string;
  name: string;
  placeholder: string;
  disabled?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <textarea
      id={id}
      name={name}
      placeholder={placeholder}
      rows={4}
      maxLength={300}
      required
      disabled={disabled}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

const formatScheduledAt = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export function NotificationsClient({ appUsers, templates, scheduled }: Props) {
  const router = useRouter();
  const broadcastRef = useRef<HTMLFormElement>(null);
  const userRef = useRef<HTMLFormElement>(null);
  const scheduleRef = useRef<HTMLFormElement>(null);
  const templateRef = useRef<HTMLFormElement>(null);

  const [titleValue, setTitleValue] = useState("");
  const [bodyValue, setBodyValue] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const refresh = () => router.refresh();

  // Broadcast
  const [, broadcastAction, broadcastPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const result = await broadcastNotification(formData);
      if (result.ok) { broadcastRef.current?.reset(); toast.success(`Sent to ${result.sent ?? 0} ${result.sent === 1 ? "user" : "users"}.`); refresh(); }
      else if (result.error) toast.error(result.error);
      return result;
    }, null,
  );

  // Send to user
  const [, sendUserAction, sendUserPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const result = await sendToUser(formData);
      if (result.ok) { userRef.current?.reset(); setSelectedUserId(""); toast.success("Notification sent."); refresh(); }
      else if (result.error) toast.error(result.error);
      return result;
    }, null,
  );

  // Schedule
  const [, scheduleAction, schedulePending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const result = await scheduleNotification(formData);
      if (result.ok) { scheduleRef.current?.reset(); toast.success("Notification scheduled."); refresh(); }
      else if (result.error) toast.error(result.error);
      return result;
    }, null,
  );

  // Save template
  const [, saveTemplateAction, saveTemplatePending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const result = await saveTemplate(formData);
      if (result.ok) { templateRef.current?.reset(); toast.success("Template saved."); refresh(); }
      else if (result.error) toast.error(result.error);
      return result;
    }, null,
  );

  // Delete template
  const [, deleteTemplateAction] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const result = await deleteTemplate(formData);
      if (result.ok) { toast.success("Template deleted."); refresh(); }
      else if (result.error) toast.error(result.error);
      return result;
    }, null,
  );

  // Cancel scheduled
  const [, cancelAction] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const result = await cancelScheduled(formData);
      if (result.ok) { toast.success("Scheduled notification cancelled."); refresh(); }
      else if (result.error) toast.error(result.error);
      return result;
    }, null,
  );

  const applyTemplate = (t: Template) => {
    setTitleValue(t.title);
    setBodyValue(t.body);
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Send notification</CardTitle>
        <CardDescription>Push messages to your app users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="broadcast">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="broadcast" className="gap-1.5"><Radio className="h-3.5 w-3.5" />Broadcast</TabsTrigger>
            <TabsTrigger value="user" className="gap-1.5"><User className="h-3.5 w-3.5" />Specific</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Schedule</TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5"><BookTemplate className="h-3.5 w-3.5" />Templates</TabsTrigger>
          </TabsList>

          {/* ── Broadcast ── */}
          <TabsContent value="broadcast">
            <form ref={broadcastRef} action={broadcastAction} className="flex flex-col gap-4">
              {templates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-title">Title</Label>
                <Input id="b-title" name="title" placeholder="e.g. Special offer this weekend" maxLength={100} required disabled={broadcastPending} value={titleValue} onChange={(e) => setTitleValue(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-body">Message</Label>
                <TextareaField id="b-body" name="body" placeholder="e.g. Book before Sunday and get 10% off." disabled={broadcastPending} value={bodyValue} onChange={setBodyValue} />
              </div>
              <Button type="submit" disabled={broadcastPending} className="w-full">
                <Send className="h-4 w-4" />
                {broadcastPending ? "Sending…" : "Send to all users"}
              </Button>
            </form>
          </TabsContent>

          {/* ── Specific User ── */}
          <TabsContent value="user">
            <form ref={userRef} action={sendUserAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>User</Label>
                <Select name="userId" value={selectedUserId} onValueChange={setSelectedUserId} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {appUsers.length === 0 ? (
                      <SelectItem value="none" disabled>No app users yet</SelectItem>
                    ) : (
                      appUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} — {u.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="u-title">Title</Label>
                <Input id="u-title" name="title" placeholder="e.g. Your appointment is tomorrow" maxLength={100} required disabled={sendUserPending} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="u-body">Message</Label>
                <TextareaField id="u-body" name="body" placeholder="e.g. Don't forget your 2pm appointment with Haziq." disabled={sendUserPending} />
              </div>
              <Button type="submit" disabled={sendUserPending || !selectedUserId} className="w-full">
                <Send className="h-4 w-4" />
                {sendUserPending ? "Sending…" : "Send to user"}
              </Button>
            </form>
          </TabsContent>

          {/* ── Schedule ── */}
          <TabsContent value="schedule">
            <form ref={scheduleRef} action={scheduleAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-title">Title</Label>
                <Input id="s-title" name="title" placeholder="e.g. Weekend promotion" maxLength={100} required disabled={schedulePending} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-body">Message</Label>
                <TextareaField id="s-body" name="body" placeholder="e.g. Book this weekend and save 15%." disabled={schedulePending} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-at">Send at</Label>
                <Input id="s-at" name="scheduledAt" type="datetime-local" required disabled={schedulePending} min={new Date().toISOString().slice(0, 16)} />
              </div>
              <Button type="submit" disabled={schedulePending} className="w-full">
                <Clock className="h-4 w-4" />
                {schedulePending ? "Scheduling…" : "Schedule notification"}
              </Button>
            </form>

            {/* Pending scheduled */}
            {scheduled.filter((s) => s.status === "pending").length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Pending</p>
                {scheduled.filter((s) => s.status === "pending").map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatScheduledAt(s.scheduled_at)}</p>
                    </div>
                    <form action={cancelAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Templates ── */}
          <TabsContent value="templates">
            <form ref={templateRef} action={saveTemplateAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-title">Title</Label>
                <Input id="t-title" name="title" placeholder="e.g. Weekend promo" maxLength={100} required disabled={saveTemplatePending} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-body">Message</Label>
                <TextareaField id="t-body" name="body" placeholder="e.g. Book this weekend and save 15%." disabled={saveTemplatePending} />
              </div>
              <Button type="submit" disabled={saveTemplatePending} variant="outline" className="w-full">
                {saveTemplatePending ? "Saving…" : "Save as template"}
              </Button>
            </form>

            {templates.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Saved templates</p>
                {templates.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.body}</p>
                    </div>
                    <form action={deleteTemplateAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
