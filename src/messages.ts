import data from "./messages.json" with { type: "json" };

/** Replies the bot can send, formatted for Telegram's HTML parse mode. */
export const messages: readonly string[] = data;

if (messages.length === 0) {
  throw new Error("messages.json must contain at least one message");
}

/** Picks a message at random. `random` must return a number in [0, 1). */
export function pickRandomMessage(random: () => number = Math.random): string {
  return messages[Math.floor(random() * messages.length)]!;
}
