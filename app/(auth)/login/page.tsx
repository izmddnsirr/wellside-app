import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LoginSubmit } from "./login-submit";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const login = async (formData: FormData) => {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=invalid");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role) {
    redirect("/login?error=profile");
  }

  if (profile.role !== "customer") {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  redirect("/home");
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage =
    params?.error === "missing"
      ? "Email and password are required."
      : params?.error === "invalid"
      ? "Invalid email or password."
      : params?.error === "profile"
      ? "Account profile not found."
      : params?.error === "unauthorized"
      ? "This account is not a customer."
      : null;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <form className="flex flex-col gap-6" action={login}>
                  <FieldGroup>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <img
                        src="/wellside-logo.png"
                        alt="Wellside"
                        className="h-14 w-auto"
                      />
                      <h1 className="text-2xl font-bold">
                        Login to your account
                      </h1>
                      <p className="text-muted-foreground text-sm text-balance">
                        Enter your email below to login to your account
                      </p>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                      />
                    </Field>
                    <Field>
                      <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <a
                          href="#"
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                      />
                    </Field>
                    {errorMessage ? (
                      <FieldDescription className="text-center text-red-600">
                        {errorMessage}
                      </FieldDescription>
                    ) : null}
                    <Field>
                      <LoginSubmit />
                    </Field>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account?{" "}
                      <a href="/register" className="underline underline-offset-4">
                        Sign up
                      </a>
                    </FieldDescription>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
