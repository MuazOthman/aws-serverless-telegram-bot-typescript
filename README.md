# aws-serverless-telegram-bot-typescript

A simple Telegram bot implemented using TypeScript and provided as an example of implementing a serverless backend on AWS.

The bot replies to **any** message with one of a list of hardcoded, richly formatted messages (bold, italic, underline, strikethrough, spoilers, code blocks, quotes, bullet points and hyperlinks).

## Stack

- **Node.js 24** and **TypeScript**
- **[grammY](https://grammy.dev)** – Telegram Bot API framework
- **AWS Lambda** (`nodejs24.x`, arm64) – runs the bot
- **Amazon API Gateway (HTTP API)** – receives Telegram webhook calls on `POST /webhook`
- **AWS SAM** – infrastructure as code, bundling (via esbuild) and deployment
- **Vitest** for tests

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

Each message in `src/messages.json` has an `id` and a list of `lines`, which are joined with newlines:

```json
{
  "id": "example",
  "lines": [
    "<b>Bold</b>, <i>italic</i>, <u>underline</u>, <s>strike</s>, <tg-spoiler>spoiler</tg-spoiler>",
    "• A bullet point with a <a href=\"https://grammy.dev\">link</a>"
  ]
}
```

Messages use Telegram's [HTML formatting](https://core.telegram.org/bots/api#html-style). Telegram has no list markup, so bullet points are plain `•` characters. Escape literal `<`, `>` and `&` as `&lt;`, `&gt;` and `&amp;`. `npm test` checks every message for unsupported or unbalanced tags and for the 4096 character limit.

## Prerequisites

- Node.js 24+
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) and AWS credentials
- A bot token from [@BotFather](https://t.me/BotFather)

## Development

```bash
npm install
npm run typecheck
npm test
npm run build   # sam build: bundles src/handler.ts with esbuild into .aws-sam/build
```

## Deployment

1. Build and deploy. The first deployment is guided and asks for the stack name, region and the two parameters:
   - `BotToken` – the token from @BotFather
   - `WebhookSecret` – any random string of 1–256 characters from `A-Z`, `a-z`, `0-9`, `_` and `-` (for example `openssl rand -hex 32`)

   ```bash
   npm run build   # or `sam build` if esbuild is installed globally
   sam deploy --guided
   ```

   Your answers are saved to `samconfig.toml` (git-ignored, since it contains the secrets), so later deployments only need:

   ```bash
   npm run deploy
   ```

2. Copy the `WebhookUrl` output of the stack and register it with Telegram:

   ```bash
   cp .env.example .env   # then fill in BOT_TOKEN, WEBHOOK_SECRET and WEBHOOK_URL
   npm run set-webhook
   ```

3. Send your bot a message on Telegram.

### Notes

- `npm run build` runs `sam build` through npm so that SAM finds the project's local `esbuild` (npm puts `node_modules/.bin` on the `PATH`). Running `sam build` directly requires esbuild to be installed globally (`npm i -g esbuild`).
- The bot token and webhook secret are passed to the function as environment variables. For production, consider storing them in AWS Secrets Manager or SSM Parameter Store instead.
- To remove everything: `sam delete`.
