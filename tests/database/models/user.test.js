const { user, bitEvent } = require('../../../database/database');


async function createBitEvent() {
    const event = new bitEvent({
        name: 'Test event',
        bits: 100,
        active: true,
        type: 'user'
    });
    return (await event.save()).id;
}

const knownEventIDs = []; // events created just for these tests

beforeAll(async (done) => {
    knownEventIDs.push(await createBitEvent());
    knownEventIDs.push(await createBitEvent());
    knownEventIDs.push(await createBitEvent());
    done();
});

test('Test events should have been created', () => {
   expect(knownEventIDs.length).toBe(3);
});

test('Should not be able to find unknown user', async (done) => {
    expect(await user.findUser('NOID')).toBeFalsy();
    done();
});

afterAll(async (done) => {
   // delete the old test events
    console.log(knownEventIDs);
    for(let eventId of knownEventIDs) {
        await bitEvent.findByIdAndRemove(eventId, {useFindAndModify: false});
    }
    done();
});
