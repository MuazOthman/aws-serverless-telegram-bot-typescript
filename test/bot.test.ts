import { describe, expect, it } from "vitest";
import { createBot } from "../src/bot.js";
import { messages } from "../src/messages.js";
import { botInfo, recordApiCalls, textMessageUpdate } from "./helpers.js";

describe("createBot", () => {
  it("replies to a text message with one of the hardcoded messages as HTML", async () => {
    const bot = createBot("123:TEST", { botInfo });
    const calls = recordApiCalls(bot);

    await bot.handleUpdate(textMessageUpdate("hello"));

    expect(calls).toHaveLength(1);
    const [{ method, payload }] = calls as [(typeof calls)[number]];
    expect(method).toBe("sendMessage");
    expect(payload).toMatchObject({
      chat_id: 7,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_parameters: { message_id: 100 },
    });
    expect(messages).toContain(payload.text);
  });

  it("replies to non-text messages too", async () => {
    const bot = createBot("123:TEST", { botInfo });
    const calls = recordApiCalls(bot);

    const { message } = textMessageUpdate("");
    const { text: _text, ...rest } = message!;
    await bot.handleUpdate({ update_id: 2, message: { ...rest, sticker: { file_id: "x" } } as never });

    expect(calls.map((c) => c.method)).toEqual(["sendMessage"]);
  });
});
