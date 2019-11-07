const { App } = require('@slack/bolt');
require('./config');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.message('boo', ({ message, say }) => {
  say(`Hey <@${message.user}>!`);
});
