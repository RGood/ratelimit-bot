import { Devvit, TriggerContext } from '@devvit/public-api';
import { parseDurationStr } from './lib/duration.js';

Devvit.configure({
  redis: true,
  redditAPI: true,
});

Devvit.addSettings([
  {
    type: "group",
    label: "Limit Posting",
    fields: [
      {
        name: "post-limit",
        type: "number",
        label: "Post Limit (0 = unlimited)",
        defaultValue: 0,
      },
      {
        name: "post-window",
        type: "string",
        label: "Posting Window (default 1d)",
        helpText: "Duration string; e.g. 1d, 3h, 1h30m, 30m, 90s, etc",
        defaultValue: "1d",
        onValidate: (setting) => {
          try {
            const window = parseDurationStr(setting.value);
            if (window === 0) {
              return "Duration cannot resolve to 0s";
            }
          } catch (e) {
            if (e instanceof Error) {
              return e.message;
            } else {
              return "Unknown validation error";
            }
          }
        }
      },
      {
        name: "post-reply",
        type: "paragraph",
        label: "Bot Reply on Post Removal",
        helpText: "Empty for no comment",
        defaultValue: "",
      },
    ]
  },
  {
    type: "group",
    label: "Limit Commenting",
    fields: [
      {
        name: "comment-limit",
        type: "number",
        label: "Comment Limit (0 = unlimited)",
        defaultValue: 0,
      },
      {
        name: "comment-window",
        type: "string",
        label: "Commenting Window (default 1d)",
        helpText: "Duration string; e.g. 1d, 3h, 1h30m, 30m, 90s, etc",
        defaultValue: "1d",
        onValidate: (setting) => {
          try {
            const window = parseDurationStr(setting.value);
            if(window === 0) {
              return "Duration cannot resolve to 0s";
            }
          } catch(e) {
            if(e instanceof Error) {
              return e.message;
            } else {
              return "Unknown validation error";
            }
          }
        }
      },
      {
        name: "comment-reply",
        type: "paragraph",
        label: "Bot Reply on Comment Removal",
        helpText: "Empty for no comment",
        defaultValue: "",
      },
    ]
  },
]);

async function userIsMod({ reddit }: TriggerContext, userId: string, subredditName: string) {
  const user = await reddit.getUserById(userId);

  if (!user) {
    return false;
  }

  const modlist = await reddit.getModerators({
    subredditName,
    limit: 1,
    username: user.username,
  }).all();

  return modlist.length > 0;
}

Devvit.addTrigger({
  events: ["PostCreate", "CommentCreate"],
  async onEvent(event, context) {
    const { redis, reddit, settings } = context;

    console.log("Handling event:", JSON.stringify(event));

    const type = event.type === "PostCreate" ? "post" : "comment";

    const authorId = event.author?.id;
    if (!authorId) {
      console.error("author ID missing");
      return;
    }

    const contentId = event.type === "PostCreate" ? event.post?.id : event.comment?.id;
    if (!contentId) {
      console.error(`${type} ID missing`);
      return;
    }

    if (!event.subreddit?.name) {
      console.error("subreddit name not present");
      return;
    }

    if (await userIsMod(context, authorId, event.subreddit.name)) {
      console.log(`Ignoring moderator ${type}: ${contentId}`);
      return;
    }

    const appSettings = await settings.getAll();

    console.log("Settings:", JSON.stringify(appSettings));

    const contentLimit: number = appSettings[`${type}-limit`] as number;
    if (contentLimit <= 0) {
      return;
    }

    const key = `${type}:${authorId}`;

    const windowStr = appSettings[`${type}-window`] as string;

    // window string to ms
    const windowMs = parseDurationStr(windowStr, "ms");

    const expiredBefore = new Date().getTime() - windowMs;

    await redis.zRemRangeByScore(key, 0, expiredBefore);
    const count = await redis.zCard(key);

    if (count < contentLimit) {
      await redis.zAdd(key, {
        member: contentId,
        score: new Date().getTime(),
      });
      return;
    }

    const response = (appSettings[`${type}-reply`] as string).trim();
    if (!!response) {
      try {
        const comment = await reddit.submitComment({
          id: contentId,
          text: response,
        });
        comment.distinguish();
      } catch (e) {
        if (e instanceof Error) {
          console.error(e.message);
        } else {
          console.error("unknown error submitting comment:", JSON.stringify(e));
        }
      }
    }

    await reddit.remove(contentId, false);
  },
});

export default Devvit;
