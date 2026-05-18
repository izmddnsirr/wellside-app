"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type AvatarUploadProps = {
  uid: string;
  url: string | null;
  initials?: string;
  size?: number;
  onUpload: (url: string) => void;
  className?: string;
};

export function AvatarUpload({
  uid,
  url,
  initials = "?",
  size = 64,
  onUpload,
  className = "",
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(url);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) {
      setError("Only JPEG, PNG, WebP or HEIC allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${uid}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", uid);

      if (updateError) throw updateError;

      onUpload(publicUrl);
    } catch (err) {
      console.error("Avatar upload failed", err);
      setError("Upload failed. Please try again.");
      setPreview(url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative shrink-0 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: size, height: size }}
        aria-label="Change profile picture"
      >
        {preview ? (
          <Image
            src={preview}
            alt="Avatar"
            fill
            sizes={`${size}px`}
            className="object-cover"
            unoptimized={preview.startsWith("blob:")}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center bg-primary-foreground/10 text-primary-foreground font-semibold"
            style={{ fontSize: size * 0.35 }}
          >
            {initials}
          </span>
        )}

        {/* Overlay */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          {uploading ? (
            <Loader2 className="animate-spin text-white" style={{ width: size * 0.3, height: size * 0.3 }} />
          ) : (
            <Camera className="text-white" style={{ width: size * 0.3, height: size * 0.3 }} />
          )}
        </span>
      </button>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
