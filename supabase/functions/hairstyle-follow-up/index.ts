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
    const { question, analysis, selectedSuggestion } = await req.json();

    if (typeof question !== "string" || question.trim().length < 2) {
      return jsonResponse({ error: "A question is required" }, 400);
    }

    const payload = {
      modelId,
      messages: [
        {
          role: "user",
          content: [
            {
              text:
                "You are a concise barbershop hairstyle advisor. Answer the user's follow-up using the provided AI analysis context. Keep the answer practical, friendly, and under 90 words. Do not mention that you are an AI.\n\n" +
                `Analysis context:\n${JSON.stringify(analysis)}\n\n` +
                `Selected hairstyle:\n${JSON.stringify(selectedSuggestion)}\n\n` +
                `User question:\n${question.trim()}`,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 260,
        temperature: 0.5,
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
    const answer = result.output?.message?.content?.find(
      (part: { text?: string }) => typeof part.text === "string"
    )?.text;

    if (!answer) {
      return jsonResponse({ error: "Bedrock returned an empty response" }, 502);
    }

    return jsonResponse({ answer });
  } catch (error) {
    console.error("Hairstyle follow-up failed", error);
    return jsonResponse(
      {
        error: "Failed to answer follow-up",
        details: getErrorDetails(error),
      },
      500
    );
  }
});
