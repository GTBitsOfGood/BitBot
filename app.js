const { App } = require('@slack/bolt');
require('./config'); // sets config global variable and connects to the database

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.message('hello', ({ message, say }) => {
  say(`Hey there <@${message.user}>!`);
});

app.event('app_mention', async ({ event, context }) => {
  try {
    const result = await app.client.chat.postMessage({
      token: context.botToken,
      channel: "CPT5Q10UW",
      text: `Welcome to the team`
    });
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('BitBot! 🎉');
})();
