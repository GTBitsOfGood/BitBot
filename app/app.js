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

// TODO: make donut date channel ID configurable
let donutDateChannelId = 'CQHDH1GP3'; // Slack URLs are formatted like app.slack.com/client/<team_id>/<channel_id>/details/…
// TODO: make bit manager IDs configurable
let bitManagerIds = []; // user ids of people allowed to add bits
const disapprovalEmojis = [':x:'];
const donutDateBits = 2;
const donutTriggers = ['donut date', 'doughnut date', 'coffee date']


app.event('app_mention', async({ event, context }) => {
  try {
    await app.client.chat.postEphemeral({
      token: context.botToken,
      channel: event.event.channel,
      text: 'TODO' // TODO: replace with help text
    });
  } catch (error) {
    console.error(error);
  }
});

/**
 * Return mentioned users in a message as a list of user IDs.
 *
 * @param {String|Array<String>} text of a Slack message with some mentions, or an array consisting only of mentions
 * @returns {Array<String>} a list of user IDs that were mentioned
 */
function getMentions(text) {
  const mentioned = Array.isArray(text) ? text : text.match(/<@*?>/g);
  for (let i = 0; i < mentioned.length; i++) {
    const pipe = mentioned[i].indexOf('|');
    if (pipe === -1) {
      mentioned[i] = mentioned[i].substring(2, mentioned[i].length - 1); // e.g., <@U012ABCDEF> → U012ABCDEF
    } else {
      mentioned[i] = mentioned[i].substring(2, pipe - 1); // e.g., <@U012ABCDEF|worf> → U012ABCDEF
    }
  }
  return mentioned;
}

// When message posted in #gt-bits, add points to them under certain conditions.
app.event('message.channels', async({ event, context }) => {
  try {
    if (event.event.channel === donutDateChannelId && donutTriggers.some(trigger => event.event.text.lowercase().includes(trigger))) {
      let participants = getMentions(event.event.text);
      participants.push(event.event.user);
      User.addBitEvent(donutDateBits, participants, event.event.ts, 'donut', 'Donut date');
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
app.event('reaction_removed', async({ event, context }) => {
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
      if (donutTriggers.some(trigger => event.event.text.lowercase().includes(trigger))) {
        let participants = getMentions(event.ts);
        participants.push(event.message.user);
        User.addBitEvent(donutDateBits, participants, event.event.ts, 'donut', 'Donut date');
      }
    }
  } catch (error) {
    console.error(error);
  }
});

/**
 * Return JSON for a one-section block, to be passed into `say`.
 * 
 * @param {string} text
 * @returns {object}
 */
function mrkdwnBlock(text) {
  return {
    blocks: [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": text
      }
    }]
  }
}

/**
 * Return JSON for ephemeral help.
 * 
 * @param {string} commandName 
 * @param {string} helpText 
 * @returns {object}
 */
function ephemeralHelp(commandName, helpText) {
  return {
    "response_type": "ephemeral",
    "text": `How to use ${commandName}`,
    "attachments": [
      {
        "text": helpText
      }
    ]
  }
}

/**
 * Return JSON for a leaderboard, to be passed into `say`.
 * 
 * @param {int} [offset] 
 * @param {int} [limit] 
 * @param {string} [team] 
 * @return {object}
 */
async function leaderboardBlock(offset, limit, team) {
  return await mrkdwnBlock(User.leaderboard(offset, limit, team));
}

/**
 * Command formats:
 * /leaderboard: list top 10 users (users with the most bits)
 * /leaderboard <offset: int>: list top users, starting from the given offset
 * /leaderboard <offset: int> <limit: int>: list top users, starting from the given offset, with the number of returned users according to the given limit
 * /leaderboard me
 * /leaderboard team
 */
app.command('/leaderboard', async ({ command, ack, say }) => {
  ack();
  const args = command.text.split(" ");
  if (args.length === 0) {
    say(await leaderboardBlock());
  } else if (args.includes('help')) {
    say(ephemeralHelp('/leaderboard', '/leaderboard [offset: Optional<int>] [limit: Optional<int>] - Get a leaderboard of Bits of Good members with the most bits for this semester.'))
  } else if (Number.isInteger(args[0])) {
    if (args.length > 1 && Number.isInteger(args[1])) {
      say(await leaderboardBlock(args[0], args[1]));
    } else {
      say(await leaderboardBlock(0, args[0]));
    }
  } else if (args[0].toLowerCase() === 'me') {
    say(mrkdwnBlock(await User.leaderboardMe(command.user_id)));
  } else if (args[0].toLowerCase() === 'team') {
    say(await leaderboardBlock(null, null, command.user_id, true));
  } else {
    say(await leaderboardBlock());
  }
});

app.command('/echo', async ({ command, ack, say }) => {
  ack();
  say(`${command.text}`);
});

app.command('/bits', async ({ command, ack, say }) => {
  ack();
  // TODO
});

app.command('/history', async ({ command, ack, say }) => {
  ack();
  // TODO
});

app.command('/team_meeting', async ({ command, ack, say }) => {
  ack();
  // TODO
});

app.command('/team_add', async ({ command, ack, say }) => {
  ack();
  // TODO
});

app.command('/team_remove', async ({ command, ack, say }) => {
  ack();
  // TODO
});

/**
 * /sudo_give [# of bits] (event name) (event type) @user…: (Bit manager command)
 */
app.command('/sudo_give', async ({ command, ack, say }) => {
  ack();
  const args = command.text.split(" ");
  if (args.length < 2 || !Number.isInteger(args[0])) {
    say(ephemeralHelp('/sudo_give', '/sudo_give [# of bits] (event name) (event type) @user…: (Bit manager command)'))
  }
  let bits = args[0];
  let users = getMentions(command.text);
  let event_name, event_type = '';
  for (let i = 1; i < args.length && i < 3; i++) {
    if (args[i].substr(0, 2) !== '<@' || args[i][args[i].length] !== '>') {
      if (i === 1) {
        event_name = args[i];
      } else if (i === 2) {
        event_type = args[i];
      }
    }
  }
  User.addBitEvent(bits, users, null, event_type, event_name);
});

app.command('/sudo_cache', async ({ command, ack, say }) => {
  ack();
  // TODO
});

app.command('/sudo_add_bit_manager', async ({ command, ack, say }) => {
  ack();
  // TODO
});

app.command('/sudo_remove_bit_manager', async ({ command, ack, say }) => {
  ack();
  // TODO
});

app.command('/sudo_add_team_lead', async ({ command, ack, say }) => {
  ack();
  // TODO
});

app.command('/sudo_teams', async ({ command, ack, say }) => {
  ack();
  // TODO
});


// This is for testing getting list of users from a channel
// TODO: consider turning into a command later
app.message('get users', async ({ message, context, say }) => {
  try {
    // Call the chat.scheduleMessage method with a token
    const result = await app.client.channels.info({
      // The token you used to initialize your app is stored in the `context` object
      token: context.botToken,
      channel: message.channel,
    });
    console.log(result);
    say(`${result.channel.members[0]}`);
    say(`${result.channel.members[1]}`);
    say(`${result.channel.members[2]}`);
  }
  catch (error) {
    console.error(error);
  }
});

(async() => {
  await app.start(process.env.PORT || 3000);
  console.log('BitBot! 🎉');
})();
