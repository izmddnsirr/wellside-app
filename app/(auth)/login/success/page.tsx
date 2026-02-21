import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LoginSuccessPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/wellside-logo.png"
            alt="Wellside"
            width={140}
            height={48}
            className="h-12 w-auto dark:invert"
            priority
          />
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              Verification status
            </p>
            <h1 className="text-2xl font-bold">Verification successful</h1>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border bg-background/80 p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Thank you for choosing Wellside. Your verification is complete and
            you can continue to sign in.
          </p>
          <div className="mt-6">
            <Button asChild className="w-full">
              <a href="/login">Go to customer login</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
