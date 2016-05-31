const book = require('book');
const nock = require('nock');
const assert = require('assert');
const bookRaven = require('../');
const zlib = require('zlib');

const dsn = 'https://public:private@app.getsentry.com/269';

describe('index', () => {
    it('should log an error', (done) => {
        var scope = nock('https://app.getsentry.com')
        .filteringRequestBody(/.*/, '*')
        .post('/api/269/store/', '*')
        .reply(200, (uri, body) => {

            zlib.inflate(new Buffer(body, 'base64'), function(err, dec) {
                if (err) {
                    return done(err);
                }

                var msg = JSON.parse(dec.toString());
                assert.equal(msg.level, 'error');
                done();
            });
        });

        var log = book.default();
        log.use(bookRaven(dsn));
        log.error(new Error('foobar'));
    });
});
