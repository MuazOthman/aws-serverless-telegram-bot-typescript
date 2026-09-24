import data from "./messages.json" with { type: "json" };

/** A reply the bot can send, formatted for Telegram's HTML parse mode. */
export interface Message {
  id: string;
  text: string;
}

export const messages: readonly Message[] = data.messages.map(({ id, lines }) => ({
  id,
  text: lines.join("\n"),
}));

if (messages.length === 0) {
  throw new Error("messages.json must contain at least one message");
}

/** Picks a message at random. `random` must return a number in [0, 1). */
export function pickRandomMessage(random: () => number = Math.random): Message {
  return messages[Math.floor(random() * messages.length)]!;
}
