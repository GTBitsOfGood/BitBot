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



test('Should not be able to find unknown user', async (done) => {
    expect(await user.findUser('NOID')).toBeFalsy();
    done();
});
