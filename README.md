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

Edit the Slack app commands description at your [app management dashboard](https://api.slack.com/apps), under Slash Commands.

TODO: more comprehensive setup instructions

## Code Style

Basically, use semicolons, single quotes, and 2-space indents. See .eslintrc.yml and .eslintignore
for details on the style guidelines. Run `npx eslint --fix /path_to/BitBot/` or `npx eslint --ext js
--fix /path_to/BitBot/` to check and fix the style of your code. If eslint is
throwing up an error based on a bad style guideline, you can have it ignore the style guideline by
adding `  name-of-style-error: off` to the bottom of .eslintrc.yml.
