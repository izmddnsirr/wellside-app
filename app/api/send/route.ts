import { Resend } from "resend";
import { WelcomeEmail } from "@/components/emails/welcome-email";

export async function POST() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return Response.json(
        { ok: false, error: "Missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Wellside <no-reply@mail.wellside.xyz>",
      to: ["delivered@resend.dev"], // test inbox Resend
      subject: "Wellside Email Test ✅",
      react: WelcomeEmail({ name: "Izamuddin" }),
    });

    if (error) {
      return Response.json({ ok: false, error }, { status: 400 });
    }

    return Response.json({ ok: true, data });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}
