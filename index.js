var http = require('http');

// vendor
var xtend = require('xtend');
var raven = require('raven');

var interfaces = raven.interfaces;

// level is a numeric value for book from [0, 5]
// panic, error, warning, info, debug, trace
var sentry_levels = ['fatal', 'error', 'warning', 'info', 'debug', 'debug'];

module.exports = function(dsn, opt) {
    opt = opt || {};

    var sentry = new raven.Client(dsn, opt);

    // we will ignore anything above this level
    var ignore_levels = opt.ignore_levels || 2;

    // throw the error out to the environment
    // process uncaught exception is able to handle this if the user wants to
    // sentry logging errors should not be ignored since you may not
    // otherwise know you are failing
    sentry.on('error', function(err) {
        throw err;
    });

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
                packet[interfaces.http.key] = interfaces.http(arg);
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
            return sentry.captureError(arguments[0], packet);
        }

        // no error objects, just send the packet
        sentry.send(packet);
    }
}

var noop = function() {};

