if (!global.testing) {
  require('../config/production-environment-config')(); // if not testing, configure production environment
}
const { App } = require('@slack/bolt');
const { User, BitEvent, Team } = require('../database');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const donutDateChannelId = 'C12345'; // TODO: update this
const bitManagerIds = []; // user ids of people allowed to add bits
const disapprovalEmojis = [':x:'];

app.message('hello', ({ message, say }) => {
  say(`Hey there <@${message.user}>!`);
});

app.event('app_mention', async({ event, context }) => {
  try {
    const result = await app.client.chat.postMessage({
      token: context.botToken,
      channel: 'CPT5Q10UW',
      text: 'Welcome to the team'
    });
  } catch (error) {
    console.error(error);
  }
});

(async() => {
  await app.start(process.env.PORT || 3000);
  console.log('BitBot! 🎉');
})();

/**
 * Return mentioned users in a message as a list of user IDs.
 *
 * @param {String} text of a Slack message with some mentions
 * @returns {List<String>} a list of user IDs that were mentioned
 */
function getMentions(text) {
  const mentioned = text.match(/<@*?>/g);
  for (let i = 0; i < mentioned.length(); i++) {
    mentioned[i] = mentioned[i].substring(2, mentioned[i].length() - 1); // chop off the beginning <@ and ending >
  }
  return mentioned;
}

// When message posted in Donut Date Channel, add points to them.
app.event('message.channels', async({ event, context }) => {
  try {
    if (event.channel === donutDateChannelId) {
      let participants = getMentions(event.text);
      participants.push(event.user);
      let bitEvent = new BitEvent({
        name: 'Donut date', // maybe add date?
        bits: 2,
        active: true,
        type: 'donut',
        ts: event.ts,
      });
      bitEvent.save();
      for (let p of participants) {
        let user = await User.findUserBySlackID(p);
        user.bitEvents.push(bitEvent);
        await user.save();
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// Remove bits if message gets an X emoji from an approved user
app.event('reaction_added', async({ event, context }) => {
  try {
    if (event.item.channel === donutDateChannelId && disapprovalEmojis.includes(event.reaction) && bitManagerIds.includes(event.user)) {
      const message = await app.client.channels.history({
        token: context.botToken,
        channel: event.item.channel,
        latest: event.item.ts,
        inclusive: true,
        count: 1
      });
      // let participants = getMentions(message.messages[0].text);
      // participants.push(message.messages[0].user); // id of user who posted the message
      // for (let p of participants) {
      //   let user = await User.findUserBySlackID(p);
      //   user.bitEvents = user.bitEvents.filter(bitEvent => bitEvent.ts !== event.ts);
      //   await user.save();
      // }
    }
  } catch (error) {
    console.error(error);
  }
});

// Re-add bits if X emoji removed from a message
app.event('reaction_added', async({ event, context }) => {
  try {
    if (event.item.channel === donutDateChannelId && disapprovalEmojis.includes(event.reaction)) {
      const mentioned = getMentions(event.text);
      // TODO: Remove bits from those mentioned and the user who posted the message
    }
  } catch (error) {
    console.error(error);
  }
});

// Undo a bit addition event when someone edits a message, then readds the bits of the new message.
app.event('message_changed', async({ event, context }) => {
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
app.event('message_deleted', async({ event, context }) => {
  try {
    if (event.channel === donutDateChannelId) {
      // TODO: remove bits from `event.message.ts`, the timestamp of the message that was deleted
      // TODO: maybe also DM the bits manager?
    }
  } catch (error) {
    console.error(error);
  }
});

async function getRealName(userId, botToken) {
  try {
    const result = await app.client.users.info({
      token: botToken,
      user: userId
    });
    console.log(result);
    return result.user.real_name;
  } catch (error) {
    console.log(error);
  }
}
