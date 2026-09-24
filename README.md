# aws-serverless-telegram-bot-typescript

A simple Telegram bot implemented using TypeScript and provided as an example of implementing a serverless backend on AWS.

The bot replies to **any** message with a random "Did you know?" fact about serverless, picked from a list of hardcoded, richly formatted messages (bold, italic, inline code, emoji lists).

## Stack

- **Node.js 24** and **TypeScript**
- **[grammY](https://grammy.dev)** – Telegram Bot API framework
- **AWS Lambda** (`nodejs24.x`, arm64) – runs the bot
- **Amazon API Gateway (HTTP API)** – receives Telegram webhook calls on `POST /webhook`
- **AWS SAM** – infrastructure as code and deployment
- **pnpm** for package management, **esbuild** for bundling, **Vitest** for tests

## How it works

```
Telegram ──POST /webhook──▶ API Gateway (HTTP API) ──▶ Lambda (grammY) ──sendMessage──▶ Telegram
```

1. Telegram sends each update to the API Gateway endpoint, including the `X-Telegram-Bot-Api-Secret-Token` header.
2. The Lambda handler (`src/handler.ts`) passes the request to grammY's `aws-lambda-async` webhook adapter, which rejects requests with a wrong secret (`401`).
3. The bot (`src/bot.ts`) answers every message with a random entry from `src/messages.json`, sent with Telegram's HTML parse mode.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/messages.json` | The hardcoded replies |
| `src/messages.ts` | Loads the replies and picks one at random |
| `src/bot.ts` | grammY bot definition |
| `src/handler.ts` | Lambda entry point for API Gateway HTTP API (payload v2) events |
| `scripts/set-webhook.ts` | Registers the deployed URL as the bot's webhook |
| `template.yaml` | SAM template (HTTP API, Lambda function, log group) |
| `test/` | Unit tests |

## Editing the messages

`src/messages.json` is a plain JSON array of strings, one per message. Use `\n` for line breaks:

```json
[
  "💡 <b>Did you know?</b>\nSome <i>italic</i> text, <code>inline code</code> and a <a href=\"https://grammy.dev\">link</a>.",
  "🧩 <b>A list</b>\n• First item\n• Second item"
]
```

Messages use Telegram's [HTML formatting](https://core.telegram.org/bots/api#html-style) (`<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<pre>`, `<a href>`, `<blockquote>`, `<tg-spoiler>`). Telegram has no list markup, so write bullets as plain characters such as `•` or `1️⃣`. Escape literal `<`, `>` and `&` as `&lt;`, `&gt;` and `&amp;`. `pnpm test` checks every message for unsupported or unbalanced tags and for Telegram's 4096 character limit.

## Prerequisites

- Node.js 24+ and [pnpm](https://pnpm.io/installation) (the version is pinned in `package.json`; `corepack enable` picks it up)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) and AWS credentials
- A bot token from [@BotFather](https://t.me/BotFather)

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build   # bundles src/handler.ts with esbuild into dist/handler.mjs
```

## Deployment

1. Build and deploy. The first deployment is guided and asks for the stack name, region and the two parameters:
   - `BotToken` – the token from @BotFather
   - `WebhookSecret` – any random string of 1–256 characters from `A-Z`, `a-z`, `0-9`, `_` and `-` (for example `openssl rand -hex 32`)

   ```bash
   pnpm build
   sam deploy --guided
   ```

   Your answers are saved to `samconfig.toml` (git-ignored, since it contains the secrets), so later deployments only need:

   ```bash
   pnpm run deploy   # `pnpm deploy` alone is a built-in pnpm command
   ```

2. Copy the `WebhookUrl` output of the stack and register it with Telegram:

   ```bash
   cp .env.example .env   # then fill in BOT_TOKEN, WEBHOOK_SECRET and WEBHOOK_URL
   pnpm set-webhook
   ```

3. Send your bot a message on Telegram.

### Notes

- **Don't run `sam build`.** SAM's esbuild builder installs dependencies with `npm install`, which ignores `pnpm-lock.yaml`. Instead, `pnpm build` bundles the code from the pnpm-installed dependencies into `dist/`, and `sam deploy` uploads that folder as-is. If a `.aws-sam/` folder exists from an earlier `sam build`, delete it, otherwise `sam deploy` deploys that stale build instead.
- The bot token and webhook secret are passed to the function as environment variables. For production, consider storing them in AWS Secrets Manager or SSM Parameter Store instead.
- To remove everything: `sam delete`.
