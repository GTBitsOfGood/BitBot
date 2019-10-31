const { App } = require('@slack/bolt');
require('./config'); // sets config global variable and connects to the database

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.message('hello', ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  say(`Hey there <@${message.user}>!`);
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log(' BitBot! 🎉 ');
})();
