# book-raven

[raven](https://github.com/mattrobenolt/raven-node) middleware for the [book](https://github.com/shtylman/node-book) logging framework

## use
```javascript
var log = require('book');

// add the middleware to your logger
log.use(require('book-raven')('your sentry DSN here');

// by default only warn and higher log levels are sent
log.warn('hello world');
```

## install

```shell
npm install book-raven
```
