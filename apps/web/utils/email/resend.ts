import { Resend } from "resend";
import type * as React from "react";

const DEFAULT_FROM = "Wellside <no-reply@mail.wellside.xyz>";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
};

export async function sendTransactionalEmail({
  to,
  subject,
  react,
  from = DEFAULT_FROM,
}: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
  });
}
