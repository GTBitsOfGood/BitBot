const { User, BitEvent } = require('../../../database/database');
const crypto = require("crypto");


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
    const uniqueID = crypto.randomBytes(20).toString('hex');

    const user = new User({
        slackID: uniqueID,
        email: uniqueID + '@gmail.com',
        name: 'Test User',
        bitEvents: bitEventIDs,
    });
    return (await user.save()).id;
}

const knownEventIDs = []; // events created just for these tests
let userID = null;
let totalBits = 0;
beforeAll(async (done) => {
    knownEventIDs.push(await createBitEvent());
    knownEventIDs.push(await createBitEvent());
    knownEventIDs.push(await createBitEvent());

    userID = await createUser(knownEventIDs);
    done();
});

test('Test events should have been created', () => {
   expect(knownEventIDs.length).toBe(3);
});


test('Test user should have been created', () => {
    expect(userID).toBeTruthy();
});


test('Should not be able to find unknown user', async (done) => {
    expect(await User.findUser('NOID')).toBeFalsy();
    done();
});



test('Should find user and populate events', async (done) => {
    const user = await User.findUser(userID);
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
    for(let eventId of knownEventIDs) {
        await BitEvent.findByIdAndRemove(eventId);
    }
    // delete old user
    await User.findByIdAndRemove(userID);
    done();
});
