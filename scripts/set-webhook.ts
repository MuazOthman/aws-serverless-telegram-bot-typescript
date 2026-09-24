/**
 * Registers the deployed API Gateway endpoint as the bot's webhook.
 *
 * Usage: BOT_TOKEN=... WEBHOOK_SECRET=... WEBHOOK_URL=... pnpm set-webhook
 * (the variables can also be placed in a `.env` file)
 */
import { Api } from "grammy";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable ${name}`);
    process.exit(1);
  }
  return value;
}

const api = new Api(requireEnv("BOT_TOKEN"));
const url = requireEnv("WEBHOOK_URL");

await api.setWebhook(url, {
  secret_token: requireEnv("WEBHOOK_SECRET"),
  allowed_updates: ["message"],
  drop_pending_updates: true,
});

const info = await api.getWebhookInfo();
console.log(`Webhook set to ${info.url}`);
console.log(`Pending updates: ${info.pending_update_count}`);
if (info.last_error_message) console.log(`Last error: ${info.last_error_message}`);
