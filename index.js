var raven = require('raven');

module.exports = function(dsn, opt) {

    var client = new raven.Client(dsn, opt);

    return function() {
        var self = this;

        // ignore anything below warning
        if (self.level > 2) {
            return;
        }

        // add our fields to the message
        var packet = {
            extra: self
        };

        // if the first argument is an error, just capture that
        if (arguments[0] instanceof Error) {
            var err = arguments[0];
            return client.captureError(err, packet, noop);
        }

        sentry.captureMessage(self.message, {
            extra: self
        }, noop);
    }
}

var noop = function() {};

