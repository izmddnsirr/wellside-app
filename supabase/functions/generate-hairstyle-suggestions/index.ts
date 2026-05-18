import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const region = Deno.env.get("AWS_REGION") ?? "us-east-1";
const modelId =
  Deno.env.get("BEDROCK_MODEL_ID") ??
  "us.anthropic.claude-sonnet-4-5-20250929-v1:0";
const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");

const bedrock = new AwsClient({
  accessKeyId: accessKeyId ?? "",
  secretAccessKey: secretAccessKey ?? "",
  region,
  service: "bedrock",
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!accessKeyId || !secretAccessKey) {
    return jsonResponse({ error: "Missing AWS configuration" }, 500);
  }

  try {
    const { faceShape, hairType, gender } = await req.json();

    if (typeof faceShape !== "string" || typeof hairType !== "string") {
      return jsonResponse({ error: "faceShape and hairType are required" }, 400);
    }

    const detectedGender = typeof gender === "string" ? gender : "unknown";
    const isMale = detectedGender === "male";

    const maleStyles =
      "Two-Block, Edgar Cut, Undercut Fade, Crop Taper, Textured Fringe, High Fade, Burst Fade, Slick Back, or Pompadour Fade popular at Malaysian barbershops. For bald hair type, suggest clean shave maintenance, buzz cut, or beard styling grooming tips.";

    const femaleStyles =
      "Korean Bob, Curtain Bangs, Rebonding Straight, Layer Cut, Wolf Cut, Butterfly Cut, C-Curl Blowdry, or Wispy Fringe popular at Malaysian salons. Suggest styles that are practical for Malaysia's hot and humid weather and suit daily wear.";

    const payload = {
      modelId,
      messages: [
        {
          role: "user",
          content: [
            {
              text:
                "Return ONLY valid JSON for hairstyle suggestions. " +
                "Use this exact shape: " +
                '{"suggestions":[{"name":"","description":"","suits_because":"","example_search_query":""}]}. ' +
                `The user appears to be ${isMale ? "male" : "female"} with a ${faceShape} face shape and ${hairType} hair. ` +
                `Give exactly 3 hairstyle or grooming suggestions that are popular in Malaysia — specifically: ${isMale ? maleStyles : femaleStyles} ` +
                "Consider Malaysia's hot and humid climate and recommend styles that are practical and easy to maintain. Make each example_search_query a short Google Images search phrase for that hairstyle popular in Malaysia.",
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 900,
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
    console.error("Generate hairstyle suggestions failed", error);
    return jsonResponse(
      {
        error: "Failed to generate hairstyle suggestions",
        details: getErrorDetails(error),
      },
      500
    );
  }
});
