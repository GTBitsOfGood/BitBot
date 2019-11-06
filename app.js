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

// app.message('/addbits ([@\w*])*/g', async ({ message, say}) => {
// 	const event = new bitEvent({
//         name: 'Example Bit',
//         bits: 1,
//         active: true,
//         type: 'user'
//     });
// 	await event.save()

// 	const mentioned = text.match(/<@*?>/g);
//     for (let i = 0; i < mentioned.length(); i++) {
//     	mentioned[i] = mentioned[i].substring(2, mentioned[i].length() - 1);
//     }

//     mentioned.forEach(username => {
// 		user.update({username}, {
// 		    totalBits: newUser.totalBits + 1
// 		    bitEvents: newUser.bitEvents.append(event)
// 		}
// 	}
// 	say(`Added bits to mentioned users`);
// });

app.event('app_mention', async ({ event, context }) => {
   try {
    	const result = await app.client.chat.postMessage({
	      token: context.botToken,
	      channel: "CPT5Q10UW",
	      text: `Welcome to the team`
	    }); 
   }
   catch (error) {
       console.error(error);
   }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log(' BitBot! 🎉 ');
})();
