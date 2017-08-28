# amv-trafficsoft-rest-js
[![Build Status][travis-image]][travis-url]
[![Coveralls Status][coveralls-image]][coveralls-url]
[![Dependency Status][depstat-image]][depstat-url]

> Description

## Installation

```
$ npm install --save amv-trafficsoft-rest-js
```

## Usage
```js
var amvTrafficsoftRestJs = require('amv-trafficsoft-rest-js');
```

## API

### `amvTrafficsoftRestJs(data, [options])`
Description

#### Parameters
- **String** `baseUrl`: The base api endpoint
- **Object** `options`: An options object containing the following fields:
-- **Integer** `contractId`
-- **String** `username`
-- **String** `password`

#### Return
- **Array** - Result

## Development
- `npm run build` - Build task that generates both minified and non-minified scripts;
- `npm run test-server` - Run Mocha tests once;
- `npm run test-browser` - Run Mocha tests in the browser using Karma once;
- `npm run test` - Shortcut for `npm run test-server && npm run test-browser`;
- `npm run tdd` - Run Mocha tests & watch files for changes;
- `npm run tdd-browser` - Run Karma (w/ Mocha) tests & watch files for changes;
- `npm run coverage` - Run Isparta, a code coverage tool;

[travis-url]: https://travis-ci.org/amvnetworks/amv-trafficsoft-rest-js
[travis-image]: https://img.shields.io/travis/amvnetworks/amv-trafficsoft-rest-js.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/amvnetworks/amv-trafficsoft-rest-js
[coveralls-image]: https://img.shields.io/coveralls/amvnetworks/amv-trafficsoft-rest-js.svg?style=flat-square

[depstat-url]: https://david-dm.org/amvnetworks/amv-trafficsoft-rest-js
[depstat-image]: https://david-dm.org/amvnetworks/amv-trafficsoft-rest-js.svg?style=flat-square
