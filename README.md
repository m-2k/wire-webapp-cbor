# Wire

This repository is part of the source code of Wire. You can find more information at [wire.com](https://wire.com) or by contacting opensource@wire.com.

You can find the published source code at [github.com/wireapp](https://github.com/wireapp).

For licensing information, see the attached LICENSE file and the list of third-party licenses at [wire.com/legal/licenses/](https://wire.com/legal/licenses/).

## Status

[![Build Status](https://travis-ci.org/wireapp/wire-webapp-cbor.svg?branch=master)](https://travis-ci.org/wireapp/wire-webapp-cbor)
[![Release Status](https://badge.fury.io/js/wire-webapp-cbor.svg)](https://www.npmjs.com/package/wire-webapp-cbor)
[![Dependency Status](https://badges.greenkeeper.io/wireapp/wire-webapp-cbor.svg)](https://greenkeeper.io/)
[![Coverage Status](https://coveralls.io/repos/github/wireapp/wire-webapp-cbor/badge.svg?branch=master)](https://coveralls.io/github/wireapp/wire-webapp-cbor?branch=master)

## Installation

### Bower

```bash
bower install wire-webapp-cbor
```

### Yarn

```bash
yarn add wire-webapp-cbor
```

## Usage

### Browser

- [index.html](./dist/index.html)

### TypeScript

```typescript
import * as CBOR from 'wire-webapp-cbor';

const payload: Uint8Array = new Uint8Array([255, 18, 15, 34, 210, 168, 165, 188, 81, 33, 34, 40, 73, 61, 149, 198, 154, 54, 128, 76, 191, 161, 58, 176, 45, 75, 1, 33, 80, 157, 28, 89]);

// Encoding
const encoder: CBOR.Encoder = new CBOR.Encoder();
encoder.object(1);
encoder.u8(0);
encoder.bytes(payload);
const encoded: ArrayBuffer = encoder.get_buffer();

// Decoding
let decoded: Uint8Array;
const decoder: CBOR.Decoder = new CBOR.Decoder(encoded);
const properties: number = decoder.object();
for (let i = 0; i < properties; i++) {
  switch (decoder.u8()) {
    case 0:
      decoded = new Uint8Array(decoder.bytes());
      break;
    default:
      decoder.skip();
  }
}

// Comparison
const isEqual = decoded.every((row, index) => {
  return decoded[index] === payload[index];
});

console.log(isEqual); // true
```
