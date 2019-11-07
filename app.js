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

const donutDateChannelId = 'C12345';
const bitManagerIds = []; // user ids of people allowed to add bits
const disapprovalEmojis = [];

// When message posted in Donut Date Channel, add points to them.
app.event('message.channels', async ({ event, context }) => {
    try {
        if (event.channel === donutDateChannelId) {
            const mentioned = event.text.match(/<@*?>/g);
            for (let i = 0; i < mentioned.length(); i++) {
                mentioned[i] = mentioned[i].substring(2, mentioned[i].length() - 1); // chop off the beginning <@ and ending >
            }
            // TODO: Add bits to those mentioned and the user who posted the message (`event.user`)
        }
    }
    catch (error) {
        console.error(error);
    }
});

// Remove bits if message gets an X emoji from an approved user
app.event('reaction_added', async ({ event, context }) => {
    try {
        if (event.item.channel === donutDateChannelId && disapprovalEmojis.includes(event.reaction) && bitManagerIds.includes(event.user)) {
            const message = await app.client.channels.history({
                token: botToken,
                channel: event.item.channel,
                latest: event.item.ts,
                inclusive: true,
                count: 1
            });
            const posterId = message.messages[0].user; // id of user who posted the message
            const text = message.messages[0].text;
            const mentioned = text.match(/<@*?>/g);
            for (let i = 0; i < mentioned.length(); i++) {
                mentioned[i] = mentioned[i].substring(2, mentioned[i].length() - 1);
            }
            // TODO: Remove bits from those mentioned and the user who posted the message
        }
    }
    catch (error) {
        console.error(error);
    }
});

// Re-add bits if X emoji removed from a message
app.event('reaction_added', async ({ event, context }) => {
    try {
        if (event.item.channel === donutDateChannelId && disapprovalEmojis.includes(event.reaction)) {
            const mentioned = event.text.match(/<@*?>/g);
            for (let i = 0; i < mentioned.length(); i++) {
                mentioned[i] = mentioned[i].substring(2, mentioned[i].length() - 1);
            }
            // TODO: Remove bits from those mentioned and the user who posted the message
        }
    }
    catch (error) {
        console.error(error);
    }
});

// Undo a bit addition event when someone edits a message, then readds the bits of the new message.
app.event('message_changed', async ({ event, context }) => {
    try {
        if (event.channel === donutDateChannelId) {
            // TODO: undo bit event corresponding to `event.message.ts`
            const mentioned = event.message.text.match(/<@*?>/g);
            for (let i = 0; i < mentioned.length(); i++) {
                mentioned[i] = mentioned[i].substring(2, mentioned[i].length() - 1);
            }
            // TODO: Add bits to those mentioned and the user who posted the message (`event.message.user`)
        }
    } catch (error) {
        console.error(error);
    }
});

// Undo a bit addition event when someone deletes a message.
app.event('message_deleted', async ({ event, context }) => {
    try {
        if (event.channel === donutDateChannelId) {
            // TODO: remove bits from `event.message.ts`, the timestamp of the message that was deleted
            // TODO: maybe also DM the bits manager?
        }
        break;
    } catch (error) {
        console.error(error);
    }
});

async function getRealName(userId) {
    try {
        const result = await app.client.users.info({
            token: context.botToken,
            user: userId
        });
        console.log(result);
        return result.user.real_name;
    } catch (error) {
        console.log(error)
    }
}
