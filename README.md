# book-raven

[raven](https://github.com/shtylman/raven-node) middleware for the [book](https://github.com/shtylman/node-book) logging framework

## use
```javascript
var log = require('book').default();

// add the middleware to your logger
log.use(require('book-raven')('your sentry DSN here'));

log.warn('hello world');
log.info('hello world was logged');
```

## configure levels to send

By default, only PANIC, ERROR, and WARN levels are sent to sentry. If you wish to
By default, all log entries are sent. If you wish to limit logging to specific levels use the `ignore_levels` option.

Below is an example of ignoring all levels above (less critical) than WARN. So PANIC, ERROR, and WARN will be sent to sentry, but INFO, DEBUG, and TRACE will not.

```javascript
log.use(require('book-raven')('DSN', {
    ignore_levels: log.WARN
});
```

## uncaughtException

If you use process uncaughtException to handle the error and wish to exit. Make sure to exit after a short timeout. This will give the raven logger a chance to send the http request.

```javascript
process.once('uncaughtException', function(err) {
    log.panic(err);
    // force exit after 500 ms
    setTimeout(process.exit.bind(process, -1), 500);
})
```

## install

```shell
npm install book
npm install book-raven
```
