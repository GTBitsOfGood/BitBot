const { App } = require('@slack/bolt');
require('./config');

app.message('boo', ({ message, say }) => {
  say(`Hey there <@${message.user}>!`);
});
