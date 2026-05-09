import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const region = Deno.env.get("AWS_REGION") ?? "us-east-1";
const bucketName = Deno.env.get("S3_BUCKET_NAME");
const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");

if (!bucketName || !accessKeyId || !secretAccessKey) {
  console.error("Missing AWS S3 environment variables");
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKeyId ?? "",
    secretAccessKey: secretAccessKey ?? "",
  },
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const safeFileName = (fileName: string) =>
  fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "photo.jpg";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    return jsonResponse({ error: "Missing AWS configuration" }, 500);
  }

  try {
    const { fileName, fileType } = await req.json();

    if (typeof fileName !== "string" || typeof fileType !== "string") {
      return jsonResponse({ error: "fileName and fileType are required" }, 400);
    }

    if (!fileType.startsWith("image/")) {
      return jsonResponse({ error: "Only image uploads are supported" }, 400);
    }

    const key = `uploads/${crypto.randomUUID()}/${safeFileName(fileName)}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return jsonResponse({ presignedUrl, key });
  } catch (error) {
    console.error("Failed to generate presigned URL", error);
    return jsonResponse({ error: "Failed to generate upload URL" }, 500);
  }
});
