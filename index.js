var http = require('http');

// vendor
var xtend = require('xtend');
var raven = require('raven');

var parse_request = require('raven/lib/parsers').parseRequest;

// level is a numeric value for book from [0, 5]
// panic, error, warning, info, debug, trace
var sentry_levels = ['fatal', 'error', 'warning', 'info', 'debug', 'debug'];

module.exports = function(dsn, opt) {
    opt = opt || {};

    var sentry = new raven.Client(dsn, opt);

    var on_error = opt.on_error;

    // we will ignore anything above this level
    var ignore_levels = opt.ignore_levels || 2;

    if (on_error && typeof on_error === 'function') {
        sentry.on('error', on_error);
    }
    else {
        sentry.on('error', function(err) {
            // throw the error out to the environment
            // process uncaught exception is able to handle this if the user wants to
            // sentry logging errors should not be ignored since you may not
            // otherwise know you are failing
            err._sentry_error = true;
            throw err;
        });
    }

    return function() {
        var self = this;

        // default is error
        var lvl = 'error';

        if (self.level < sentry_levels.length) {
            lvl = sentry_levels[self.level];
        }

        // ignore anything below warning
        if (self.level > ignore_levels) {
            return;
        }

        var extra = xtend({}, self);
        delete extra.level;

        // add our fields to the message
        var packet = {
            message: self.message,
            extra: extra,
            level: lvl
        };

        for (var idx=0 ; idx < arguments.length ; ++idx) {
            var arg = arguments[idx];

            // http interface handling
            if (arg instanceof http.IncomingMessage) {
                // parses arg as an http req into the 'request' keyword argument for packet
                parse_request(arg, packet);
            }
            // error will be handled below
            // only allowed as first argument
            else if (arg instanceof Error) {
                continue;
            }
            // if user passed an object, then capture extra fields
            else if (arg instanceof Object) {
                Object.keys(arg).forEach(function(key) {
                    extra[key] = arg[key];
                });
            }
        }

        // if the first argument is an error, capture it as the error interface
        if (arguments[0] instanceof Error) {
            var err = arguments[0];

            // avoid trying to log a sentry error since this will just lead to
            // likely causing even more errors
            if (err._sentry_error) {
                return;
            }

            if (Object.keys(err).length > 0) {
                extra.error = err;
            }

            // captures the error and stacktrace
            return sentry.captureError(err, packet);
        }

        // no error objects, just send the packet
        sentry.send(packet);
    }
}

var noop = function() {};

