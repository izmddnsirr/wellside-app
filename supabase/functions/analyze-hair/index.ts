import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ImageFormat = "jpeg" | "png" | "gif" | "webp";

const region = Deno.env.get("AWS_REGION") ?? "us-east-1";
const bucketName = Deno.env.get("S3_BUCKET_NAME");
const modelId =
  Deno.env.get("BEDROCK_MODEL_ID") ??
  "us.anthropic.claude-sonnet-4-5-20250929-v1:0";
const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");

if (!bucketName || !accessKeyId || !secretAccessKey) {
  console.error("Missing AWS Bedrock environment variables");
}

const bedrock = new AwsClient({
  accessKeyId: accessKeyId ?? "",
  secretAccessKey: secretAccessKey ?? "",
  region,
  service: "bedrock",
});

const s3 = new AwsClient({
  accessKeyId: accessKeyId ?? "",
  secretAccessKey: secretAccessKey ?? "",
  region,
  service: "s3",
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toImageFormat = (value: unknown): ImageFormat => {
  if (value === "png" || value === "gif" || value === "webp") {
    return value;
  }
  return "jpeg";
};

const parseJsonObject = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Model response did not contain JSON");
    }
    return JSON.parse(match[0]);
  }
};

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
};

const encodeS3Key = (key: string) =>
  key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
};

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
    const { s3Key, imageFormat } = await req.json();

    if (typeof s3Key !== "string" || !s3Key.startsWith("uploads/")) {
      return jsonResponse({ error: "A valid upload s3Key is required" }, 400);
    }

    const imageResponse = await s3.fetch(
      `https://${bucketName}.s3.${region}.amazonaws.com/${encodeS3Key(s3Key)}`
    );

    if (!imageResponse.ok) {
      const responseBody = await imageResponse.text();
      throw new Error(
        `S3 image fetch failed (${imageResponse.status}): ${responseBody}`
      );
    }

    const imageBytes = arrayBufferToBase64(await imageResponse.arrayBuffer());

    const payload = {
      modelId,
      messages: [
        {
          role: "user",
          content: [
            {
              image: {
                format: toImageFormat(imageFormat),
                source: {
                  bytes: imageBytes,
                },
              },
            },
            {
              text:
                "You are a Malaysian hairstyle advisor. Analyze this person's face shape, visible hair type, and apparent gender from the photo.\n\n" +
                "GENDER DETECTION: Determine if the person appears to be male or female based on visual cues. This affects which hairstyle suggestions to give.\n\n" +
                "SPECIAL CASES:\n" +
                "- If the person is bald, clean-shaven scalp, or has a fully shaved head with no visible hair texture: return hair_type as \"bald\" and suggest grooming styles suitable for bald/shaved-head looks.\n" +
                "- If hair is covered by a hijab, tudung, cap, hat, scarf, or any head covering: detect face shape if possible, return hair_type as \"covered\", and return an empty suggestions array.\n" +
                "- If no person, face, or hair is visible: return face_shape and hair_type as \"unable to determine\" with an empty suggestions array.\n\n" +
                "Return ONLY valid JSON with this exact shape: " +
                '{"face_shape":"oval|round|square|heart|oblong|unable to determine","hair_type":"straight|wavy|curly|coily|bald|covered|unable to determine","gender":"male|female|unknown","suggestions":[{"name":"","description":"","suits_because":"","example_search_query":""}]}. ' +
                "If both face shape and visible hair type are available, give exactly 3 hairstyle suggestions tailored to the detected gender and popular at Malaysian salons or barbershops:\n\n" +
                "FOR MALES: Suggest styles popular at Malaysian barbershops — e.g. Two-Block, Edgar Cut, Undercut Fade, Crop Taper, Textured Fringe, High Fade, Burst Fade, Slick Back, or Pompadour Fade. For bald men, suggest grooming options like clean shave maintenance, buzz cut, or beard styling.\n\n" +
                "FOR FEMALES: Suggest styles popular at Malaysian salons — e.g. Korean Bob, Curtain Bangs, Rebonding Straight, Layer Cut, Wolf Cut, Butterfly Cut, C-Curl Blowdry, or Wispy Fringe. Consider styles that suit Malaysia's hot and humid weather and are practical for daily wear.\n\n" +
                "For ALL suggestions: consider Malaysia's hot and humid climate, recommend styles that are easy to maintain, and make each example_search_query a short Google Images search phrase for that hairstyle popular in Malaysia.",
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 1024,
        temperature: 0.4,
      },
    };

    const response = await bedrock.fetch(
      `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(
        modelId
      )}/converse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseBody = await response.text();

    if (!response.ok) {
      throw new Error(
        `Bedrock request failed (${response.status}): ${responseBody}`
      );
    }

    const result = JSON.parse(responseBody);
    const text = result.output?.message?.content?.find(
      (part: { text?: string }) => typeof part.text === "string"
    )?.text;

    if (!text) {
      return jsonResponse({ error: "Bedrock returned an empty response" }, 502);
    }

    return jsonResponse(parseJsonObject(text));
  } catch (error) {
    console.error("Hair analysis failed", error);
    return jsonResponse(
      {
        error: "Failed to analyze hairstyle",
        details: getErrorDetails(error),
      },
      500
    );
  }
});
