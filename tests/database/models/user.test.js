const { user } = require('../../../database/database');

test('Should not be able to find unknown user', async (done) => {
    expect(await user.findUser('NOID')).toBeFalsy();
    done();
});
