# Bit Bot

Bit Bot is a participation points management Slack bot created for Georgia Tech Bits of Good.

## Deploy a New Instance

Create a project and free cluster on MongoDB Atlas.

https://www.mongodb.com/blog/post/build-a-slack-app-in-10-minutes-with-mongodb-stitch

Set your environment variables:

```
export BITS_DB_PASS=<your-db-password>
export SLACK_SIGNING_SECRET=<your-signing-secret>
export SLACK_BOT_TOKEN=<your-bot-token>
```

```
npm run start
```

Edit the Slack app commands description at your [app management dashboard](https://api.slack.com/apps), under Slash Commands. For the request URL, enter "https://<your-heroku-deployment>.herokuapp.com/slack/commands". Here are the commands for the bot, along with suggested parameter hints and descriptions:

- /leaderboard [offset] [limit]: Leaderboard of people with the most bits
- /leaderboard_me: Know your rank and who you gotta beat
- /leaderboard_team: Leaderboard of your team
- /get_bits
- /get_history
- /y_team_bits
- /y_add_team_member
- /y_remove_team_member
- /z_give_bits bits_num event_name @user…: Bit manager command
- /z_cache_all
- /z_add_bit_manager
- /z_remove_bit_manager
- /z_add_team_lead

TODO: more comprehensive setup instructions

## Code Style

Basically, use semicolons, single quotes, and 2-space indents. See .eslintrc.yml and .eslintignore
for details on the style guidelines. Run `npx eslint --fix /path_to/BitBot/` or `npx eslint --ext js
--fix /path_to/BitBot/` to check and fix the style of your code. If eslint is
throwing up an error based on a bad style guideline, you can have it ignore the style guideline by
adding `  name-of-style-error: off` to the bottom of .eslintrc.yml.
