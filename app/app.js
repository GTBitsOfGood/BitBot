if (!global.testing) {
  require('../config/production-environment-config')(); // if not testing, configure production environment and connects to database
}
const { App } = require('@slack/bolt');
const { User, BitEvent, Team } = require('../database/database');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    commands: '/slack/commands'
  }
});

const donutDateChannelId = 'CQHDH1GP3'; // Slack URLs are formatted like app.slack.com/client/<team_id>/<channel_id>/details/…
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
    if (event.event.channel === donutDateChannelId) {
      let participants = getMentions(event.event.text);
      participants.push(event.event.user);
      let bitEvent = new BitEvent({
        name: 'Donut date', // maybe add date?
        bits: 2,
        active: true,
        type: 'donut',
        ts: event.event.ts,
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

// Remove bits (by invalidating corresponding bitEvent) if message gets an X emoji from an approved user
app.event('reaction_added', async({ event, context }) => {
  try {
    if (event.item.channel === donutDateChannelId && disapprovalEmojis.includes(event.reaction) && bitManagerIds.includes(event.user)) {
      let bitEvent = await BitEvent.findEventByTs(event.item.ts);
      bitEvent.valid = false;
      await bitEvent.save();
    }
  } catch (error) {
    console.error(error);
  }
});

// Re-add bits if X emoji removed from a message
app.event('reaction_added', async({ event, context }) => {
  try {
    if (event.item.channel === donutDateChannelId && disapprovalEmojis.includes(event.reaction)) {
      let bitEvent = await BitEvent.findEventByTs(event.item.ts);
      bitEvent.valid = true;
      await bitEvent.save();
    }
  } catch (error) {
    console.error(error);
  }
});

// Undo a bit addition event when someone deletes a message.
app.event('message_deleted', async({ event, context }) => {
  try {
    if (event.channel === donutDateChannelId) {
      let bitEvent = await BitEvent.findEventByTs(event.ts);
      bitEvent.valid = false;
      await bitEvent.save();
      // TODO: maybe also DM the bits manager?
    }
  } catch (error) {
    console.error(error);
  }
});

// Undo a bit addition event when someone edits a message, then readds the bits of the new message.
app.event('message_changed', async({ event, context }) => {
  try {
    if (event.channel === donutDateChannelId) {
      await User.removeEvent({ ts: event.message.ts });
      let participants = getMentions(event.ts);
      participants.push(event.message.user);
      let bitEvent = new BitEvent({
        name: 'Donut date',
        bits: 2,
        active: true,
        type: 'donut',
        ts: event.event.ts,
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

// Regex to determine if this is a valid email
// This uses a constraint object to listen for dialog submissions with a callback_id of ticket_submit
app.command('/leaderboard', async ({ command, ack, say }) => {
  // Acknowledge command request
  ack();

  say(`${command.text}`);
});

app.command('/echo', async ({ command, ack, say }) => {
  // Acknowledge command request
  ack();

  say(`${command.text}`);
});

//This is for testing getting list of users from a channel
//Will maybe turn this into a command later
app.message('get users', async ({ message, context }) => {
  try {
    // Call the chat.scheduleMessage method with a token
    const result = await app.client.channels.info({
      // The token you used to initialize your app is stored in the `context` object
      token: context.botToken,
      channel: message.channel.id,
    });
    say(`${result}`);
  }
  catch (error) {
    console.error(error);
  }
});

(async() => {
  await app.start(process.env.PORT || 3000);
  console.log('BitBot! 🎉');
})();
