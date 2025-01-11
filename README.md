# Ratelimit Bot

Limit how often users can post/comment in your subreddit in a given timeframe.

Some variables are available to use in the reply message:
* `{comment_id}`  
The ID of the current comment.
* `{limit}`  
The number of posts/comments allowed in the window.
* `{post_id}`  
The ID of the current post.
* `{subreddit}`  
The name of this subreddit.
* `{window}`  
The posting/commenting window duration string, exactly as entered in the settings.

## Settings Example

![Example](https://i.imgur.com/MgpvWYI.png)
