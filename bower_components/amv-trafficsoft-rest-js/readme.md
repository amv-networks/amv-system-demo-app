# amv-trafficsoft-rest-js
[![Build Status][travis-image]][travis-url]
[![Coveralls Status][coveralls-image]][coveralls-url]
[![Dependency Status][depstat-image]][depstat-url]
[![License](https://img.shields.io/github/license/amvnetworks/amv-trafficsoft-rest-js.svg?maxAge=2592000)](https://github.com/amvnetworks/amv-trafficsoft-rest-js/blob/master/LICENSE)

amv-trafficsoft-rest-js is a JavaScript client library for accessing the AMV TrafficSoft® API.
Please note that this software is considered experimental until v1.0.0 is reached.

## Installation
```
$ bower install amvnetworks/amv-trafficsoft-rest-js#${version} --save 
```

## Usage
```js
var amvTrafficsoftRestJs = require('amv-trafficsoft-rest-js');
```

## API

### `amvTrafficsoftRestJs(baseUrl, options)`
Get a factory for creating trafficsoft rest clients

#### Parameters
- **String** `baseUrl` The base api endpoint
- **Object** `options` An options object containing the following fields:
  - **Integer** `contractId` The id of the contract in which's context to execute the request
  - **Object** `auth`
    - **String** `username` Basic auth username
    - **String** `password` Basic auth password

#### Return
- **Object** - A factory for creating trafficsoft rest clients

#### Example
```js
var baseUrl = ...
var options = {
  contractId: ...
  auth: {
    username: ...
    password: ...
  }
};
var amvTrafficsoftRestJs = require('amv-trafficsoft-rest-js');
var amvTrafficsoftClientFactory = amvTrafficsoftRestJs(baseUrl, options);

var xfcdClient = amvTrafficsoftClientFactory.xfcd();
var contractClient = amvTrafficsoftClientFactory.contract();
// ...
```

## Development
- `npm run build` - Build task that generates both minified and non-minified scripts;
- `npm run test-server` - Run Mocha tests once;
- `npm run test-browser` - Run Mocha tests in the browser using Karma once;
- `npm run test` - Shortcut for `npm run test-server && npm run test-browser`;
- `npm run tdd` - Run Mocha tests & watch files for changes;
- `npm run tdd-browser` - Run Karma (w/ Mocha) tests & watch files for changes;
- `npm run coverage` - Run Isparta, a code coverage tool;


# license
The project is licensed under the Apache License. See [LICENSE](LICENSE) for details.

[travis-url]: https://travis-ci.org/amvnetworks/amv-trafficsoft-rest-js
[travis-image]: https://img.shields.io/travis/amvnetworks/amv-trafficsoft-rest-js.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/amvnetworks/amv-trafficsoft-rest-js
[coveralls-image]: https://img.shields.io/coveralls/amvnetworks/amv-trafficsoft-rest-js.svg?style=flat-square

[depstat-url]: https://david-dm.org/amvnetworks/amv-trafficsoft-rest-js
[depstat-image]: https://david-dm.org/amvnetworks/amv-trafficsoft-rest-js.svg?style=flat-square
