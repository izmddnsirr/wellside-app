"use client";

import { AvatarUpload } from "@/components/ui/avatar-upload";

type ProfileAvatarSectionProps = {
  uid: string;
  url: string | null;
  initials: string;
  fullName: string;
  email: string;
};

export function ProfileAvatarSection({
  uid,
  url,
  initials,
  fullName,
  email,
}: ProfileAvatarSectionProps) {
  return (
    <section className="rounded-3xl bg-primary p-5 text-primary-foreground">
      <div className="flex items-center gap-5">
        <AvatarUpload
          uid={uid}
          url={url}
          initials={initials}
          size={64}
          onUpload={() => {}}
        />
        <div className="flex-1">
          <p className="text-xl font-semibold">{fullName || "Your Profile"}</p>
          <p className="mt-1 text-base text-primary-foreground/70">
            {email || "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
