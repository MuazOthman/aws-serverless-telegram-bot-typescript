import { describe, expect, it } from "vitest";
import { messages, pickRandomMessage } from "../src/messages.js";

// Tags accepted by Telegram's HTML parse mode: https://core.telegram.org/bots/api#html-style
const ALLOWED_TAGS = new Set([
  "b", "strong", "i", "em", "u", "ins", "s", "strike", "del",
  "span", "tg-spoiler", "a", "tg-emoji", "code", "pre", "blockquote",
]);

function assertValidTelegramHtml(text: string): void {
  const stack: string[] = [];
  for (const [, closing, name] of text.matchAll(/<(\/?)([a-z-]+)[^>]*>/g)) {
    expect(ALLOWED_TAGS, `unsupported tag <${name}>`).toContain(name);
    if (closing) expect(stack.pop(), `unbalanced </${name}>`).toBe(name);
    else stack.push(name!);
  }
  expect(stack, "unclosed tags").toEqual([]);
  // Bare '&' must be an entity; bare '<'/'>' would have been caught as unknown tags or break parsing.
  expect(text.replace(/<[^>]*>/g, "")).not.toMatch(/&(?!(lt|gt|amp|quot);)|[<>]/);
}

describe("messages", () => {
  it("contains several unique messages", () => {
    expect(messages.length).toBeGreaterThan(1);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it.each(messages.map((text, i) => [i, text] as const))("message %i is valid Telegram HTML", (_i, text) => {
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThanOrEqual(4096);
    assertValidTelegramHtml(text);
  });
});

describe("pickRandomMessage", () => {
  it("maps the random range onto every message", () => {
    expect(pickRandomMessage(() => 0)).toBe(messages[0]);
    expect(pickRandomMessage(() => 0.999999)).toBe(messages.at(-1));
    const picked = new Set(messages.map((_, i) => pickRandomMessage(() => i / messages.length)));
    expect(picked.size).toBe(messages.length);
  });
});
