"use server";

import { redirect } from "next/navigation";
import { joinQueue } from "@/utils/queue-entries";

export async function joinQueueAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !phone) {
    redirect("/queue/join?error=missing");
  }

  const result = await joinQueue(name, phone);

  if ("error" in result) {
    redirect("/queue/join?error=failed");
  }

  redirect(
    `/queue/join/confirmed?number=${result.queueNumber}&ahead=${result.waitingAhead}`,
  );
}
