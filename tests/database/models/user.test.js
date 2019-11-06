const { User, BitEvent } = require('../../../database/database');
const crypto = require("crypto");

const knownEventIDs = []; // events created just for these tests
let userID = null;
let totalBits = 0;
let slackID = null;

async function createBitEvent() {
  const bitCount = 100;
  totalBits += bitCount;
  const event = new BitEvent({
    name: 'Test event',
    bits: bitCount,
    active: true,
    type: 'user'
  });
  return (await event.save()).id;
}

async function createUser(bitEventIDs) {
  slackID = crypto.randomBytes(20).toString('hex');
  const user = new User({
    slackID: slackID,
    email: slackID + '@gmail.com',
    name: 'Test User',
    bitEvents: bitEventIDs
  });
  return (await user.save()).id;
}

beforeAll(async (done) => {
  knownEventIDs.push(await createBitEvent());
  knownEventIDs.push(await createBitEvent());
  knownEventIDs.push(await createBitEvent());
  userID = await createUser(knownEventIDs);
  done();
});

test('Should have created test events.', () => {
  expect(knownEventIDs.length).toBe(3);
});

test('Should have created test user.', () => {
  expect(userID).toBeTruthy();
});

test('Should not be able to find an unknown user.', async (done) => {
  expect(await User.findUser('NOID')).toBeFalsy();
  done();
});

test('Should find the user and populate events.', async (done) => {
  const user = await User.findUser(userID);
  expect(user).toBeTruthy();
  expect(user.bitEvents.length).toBe(knownEventIDs.length);
  const usersBitsAccordingToEvents = user.bitEvents.map((bitEvent) => bitEvent.bits).reduce((a, b) => a + b);
  expect(user.totalBits).toEqual(totalBits);
  expect(usersBitsAccordingToEvents).toEqual(totalBits);
  done();
});

test('Should find the user by slack ID and populate events.', async (done) => {
  const user = await User.findUserBySlackID(slackID);
  expect(user).toBeTruthy();
  expect(user.bitEvents.length).toBe(knownEventIDs.length);
  const usersBitsAccordingToEvents = user.bitEvents.map((bitEvent) => bitEvent.bits).reduce((a, b) => a + b);
  expect(user.totalBits).toEqual(totalBits);
  expect(usersBitsAccordingToEvents).toEqual(totalBits);
  done();
});

test('Should automatically calculate total bits', async (done) => {
  const user = await User.findUser(userID);
  expect(user.totalBits).toEqual(totalBits);
  done();
});

afterAll(async (done) => {
  // delete the old test events
  for (let eventId of knownEventIDs) {
    await BitEvent.findByIdAndRemove(eventId);
  }
  // delete old user
  await User.findByIdAndRemove(userID);
  done();
});
