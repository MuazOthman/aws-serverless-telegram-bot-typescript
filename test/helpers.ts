import type { Bot } from "grammy";
import type { Update, UserFromGetMe } from "grammy/types";

export const botInfo: UserFromGetMe = {
  id: 42,
  is_bot: true,
  first_name: "Test Bot",
  username: "test_bot",
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
  can_manage_bots: false,
  supports_join_request_queries: false,
};

export interface ApiCall {
  method: string;
  payload: Record<string, unknown>;
}

/** Intercepts all outgoing Bot API calls so no network requests are made. */
export function recordApiCalls(bot: Bot): ApiCall[] {
  const calls: ApiCall[] = [];
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload: payload as Record<string, unknown> });
    return { ok: true, result: true } as never;
  });
  return calls;
}

export function textMessageUpdate(text: string, updateId = 1): Update {
  return {
    update_id: updateId,
    message: {
      message_id: 100,
      date: 1_700_000_000,
      chat: { id: 7, type: "private", first_name: "Alice" },
      from: { id: 7, is_bot: false, first_name: "Alice" },
      text,
    },
  };
}
