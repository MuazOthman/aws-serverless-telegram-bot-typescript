import { Bot, type BotConfig, type Context } from "grammy";
import { pickRandomMessage } from "./messages.js";

/** Creates a bot that answers every incoming message with a random hardcoded reply. */
export function createBot(token: string, config?: BotConfig<Context>): Bot {
  const bot = new Bot(token, config);

  bot.on("message", (ctx) =>
    ctx.reply(pickRandomMessage().text, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_parameters: { message_id: ctx.msg.message_id, allow_sending_without_reply: true },
    }),
  );

  // No bot.catch(): with webhookCallback, errors propagate to the Lambda handler and fail
  // the invocation, so Telegram retries the update instead of it being silently dropped.

  return bot;
}
