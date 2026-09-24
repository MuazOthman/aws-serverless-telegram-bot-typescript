import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { botInfo, textMessageUpdate, type ApiCall } from "./helpers.js";

const SECRET = "test-secret";
const { calls } = vi.hoisted(() => ({ calls: [] as ApiCall[] }));

// Use the real bot, but with static bot info and all Bot API calls intercepted.
vi.mock("../src/bot.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/bot.js")>();
  return {
    createBot: (token: string) => {
      const bot = original.createBot(token, { botInfo });
      bot.api.config.use(async (_prev, method, payload) => {
        calls.push({ method, payload: payload as Record<string, unknown> });
        return { ok: true, result: true } as never;
      });
      return bot;
    },
  };
});

let handler: typeof import("../src/handler.js").handler;

beforeAll(async () => {
  process.env.BOT_TOKEN = "123:TEST";
  process.env.WEBHOOK_SECRET = SECRET;
  ({ handler } = await import("../src/handler.js"));
});

function event(body: string, overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "POST /webhook",
    rawPath: "/webhook",
    rawQueryString: "",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": SECRET },
    requestContext: {} as APIGatewayProxyEventV2["requestContext"],
    body,
    isBase64Encoded: false,
    ...overrides,
  };
}

const context = {} as Context;

describe("handler", () => {
  it("handles a Telegram update and replies", async () => {
    const before = calls.length;
    const res = await handler(event(JSON.stringify(textMessageUpdate("hi", 10))), context);

    expect(res.statusCode).toBe(200);
    expect(calls.slice(before).map((c) => c.method)).toEqual(["sendMessage"]);
  });

  it("decodes base64-encoded bodies", async () => {
    const before = calls.length;
    const body = Buffer.from(JSON.stringify(textMessageUpdate("hi", 11))).toString("base64");
    const res = await handler(event(body, { isBase64Encoded: true }), context);

    expect(res.statusCode).toBe(200);
    expect(calls.length).toBe(before + 1);
  });

  it("rejects requests with a wrong secret token", async () => {
    const before = calls.length;
    const res = await handler(
      event(JSON.stringify(textMessageUpdate("hi", 12)), {
        headers: { "x-telegram-bot-api-secret-token": "wrong" },
      }),
      context,
    );

    expect(res.statusCode).toBe(401);
    expect(calls.length).toBe(before);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await handler(event("{not json"), context);
    expect(res.statusCode).toBe(400);
  });
});
