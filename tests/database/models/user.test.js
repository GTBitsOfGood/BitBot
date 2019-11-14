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

test('Should have created a test user.', () => {
  expect(userID).toBeTruthy();
});

test('Should not be able to find an unknown user.', async (done) => {
  expect(await User.findUser('NOID')).toBeFalsy();
  done();
});

test('Should find a user and populate events.', async (done) => {
  const user = await User.findUser(userID);
  expect(user).toBeTruthy();
  expect(user.bitEvents.length).toBe(knownEventIDs.length);
  const usersBitsAccordingToEvents = user.bitEvents.map((bitEvent) => bitEvent.bits).reduce((a, b) => a + b);
  expect(user.totalBits).toEqual(totalBits);
  expect(usersBitsAccordingToEvents).toEqual(totalBits);
  done();
});

test('Should find a user by slack ID and populate events.', async (done) => {
  const user = await User.findUserBySlackID(slackID);
  expect(user).toBeTruthy();
  expect(user.bitEvents.length).toBe(knownEventIDs.length);
  const usersBitsAccordingToEvents = user.bitEvents.map((bitEvent) => bitEvent.bits).reduce((a, b) => a + b);
  expect(user.totalBits).toEqual(totalBits);
  expect(usersBitsAccordingToEvents).toEqual(totalBits);
  done();
});

test('Should automatically calculate the total number of bits.', async (done) => {
  const user = await User.findUser(userID);
  expect(user.totalBits).toEqual(totalBits);
  done();
});

test('Should return the top 10 users.', async (done) => {
  for (var i = 0; i < 20; i++) { // make 20 users
    await createUser(knownEventIDs);
  }
  const users = await User.findTop10Users();
  expect(users.length).toEqual(10);
  done();
});

test('Should return all users.', async (done) => {
  const users = await User.findAllUsersInOrder(); // previous test made 20 users + the user made for the first tests
  expect(users.length).toEqual(21);
  done();
});

test('remove event from users test', async (done) => {
  const eventID = await createBitEvent();
  const secondEvent = await createBitEvent();
  const events = [eventID, secondEvent];
  const totalBits = 200;
  const userIDs = [await createUser(events), await  createUser(events)];
  for (let userID of userIDs) {
    const user = await User.findById(userID);
    expect(user.totalBits).toEqual(totalBits);
    expect(user.bitEvents.length).toEqual(2);
  }
  // remove the second event
  await User.removeEventByID(eventID);
  for (let userID of userIDs) {
    const user = await User.findById(userID);
    expect(user.totalBits).toEqual(100);
    expect(user.bitEvents.length).toEqual(1);
  }
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
