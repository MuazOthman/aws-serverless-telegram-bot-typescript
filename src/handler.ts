import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { webhookCallback } from "grammy";
import { createBot } from "./bot.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

// Created once per Lambda execution environment and reused across invocations.
const bot = createBot(requireEnv("BOT_TOKEN"));
const handleWebhook = webhookCallback(bot, "aws-lambda-async", {
  secretToken: requireEnv("WEBHOOK_SECRET"),
});

/** Entry point for Telegram webhook requests coming through an API Gateway HTTP API (payload v2). */
export async function handler(
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> {
  const body =
    event.body && event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;

  try {
    // grammY's adapter resolves with the HTTP response but is typed as returning void.
    return (await handleWebhook({ headers: event.headers, body }, context)) as unknown as APIGatewayProxyStructuredResultV2;
  } catch (error) {
    // A body that is not valid JSON is a client error, not a server failure.
    if (error instanceof SyntaxError) return { statusCode: 400 };
    throw error;
  }
}
