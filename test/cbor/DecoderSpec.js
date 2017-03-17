/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

'use strict';

describe('CBOR Decoder', () => {
  const is_hex = (str) =>
    (typeof str === 'string') && /^[0-9a-f]+$/i.test(str) && ((str.length % 2) === 0);

  const from_hex = (str) => {
    // transliterated from libsodium.js source
    if (!is_hex(str)) {
      throw new TypeError('The provided string doesn\'t look like hex data');
    }

    const result = new Uint8Array(str.length / 2);

    let i = 0;
    while (i < str.length) {
      result[i >>> 1] = parseInt(str.substr(i, 2), 16);
      i += 2;
    }

    return result;
  };

  const decoder = (hex_str) =>
    new CBOR.Decoder(from_hex(hex_str).buffer);

  it('unsigned', () => {
    assert(0 === decoder('00').u8());
    assert(1 === decoder('01').u8());
    assert(10 === decoder('0a').u8());
    assert(23 === decoder('17').u8());
    assert(24 === decoder('1818').u8());
    assert(25 === decoder('1819').u8());
    assert(100 === decoder('1864').u8());
    assert(1000 === decoder('1903e8').u16());
    assert(1000000 === decoder('1a000f4240').u32());
    assert(1000000000000 === decoder('1b000000e8d4a51000').u64());
    return assert(Number.MAX_SAFE_INTEGER === decoder('1b001fffffffffffff').u64());

    // XXX: how do we handle numbers greater than MAX_SAFE_INTEGER?
    //assert.throws(() -> encoded '1bffffffffffffffff', (e) -> e.u64 18446744073709551615)
  });

  it('signed', () => {
    assert(-1 === decoder('20').i8());
    assert(-10 === decoder('29').i8());
    assert(-100 === decoder('3863').i8());
    assert(-500 === decoder('3901f3').i16());
    assert(-1000 === decoder('3903e7').i16());
    assert(-343434 === decoder('3a00053d89').i32());
    return assert(-23764523654 === decoder('3b000000058879da85').i64());
  });

  it('mixed', () => {
    assert(0 === decoder('00').i8());
    assert(1 === decoder('01').i8());
    assert(10 === decoder('0a').i8());
    assert(23 === decoder('17').i8());
    assert(24 === decoder('1818').i8());
    assert(25 === decoder('1819').i8());
    assert(100 === decoder('1864').i8());
    assert(1000 === decoder('1903e8').i16());
    return assert(1000000 === decoder('1a000f4240').i32());
  });

  it('integers', () => {
    assert(0 === decoder('00').int());
    assert(1 === decoder('01').int());
    assert(10 === decoder('0a').int());
    assert(23 === decoder('17').int());
    assert(24 === decoder('1818').int());
    assert(25 === decoder('1819').int());
    assert(100 === decoder('1864').int());
    assert(1000 === decoder('1903e8').int());
    assert(1000000 === decoder('1a000f4240').int());
    assert(1000000000000 === decoder('1b000000e8d4a51000').int());
    assert(-1 === decoder('20').int());
    assert(-10 === decoder('29').int());
    assert(-100 === decoder('3863').int());
    assert(-500 === decoder('3901f3').int());
    assert(-1000 === decoder('3903e7').int());
    assert(-343434 === decoder('3a00053d89').int());
    return assert(-23764523654 === decoder('3b000000058879da85').int());
  });

  it('float', () => {
    assert(0.0 === decoder('f90000').f16());
    assert(-0.0 === decoder('f98000').f16());
    assert(1.0 === decoder('f93c00').f16());
    assert(1.5 === decoder('f93e00').f16());
    assert(65504.0 === decoder('f97bff').f16());
    assert(Number.POSITIVE_INFINITY === decoder('f97c00').f16());
    assert(Number.NEGATIVE_INFINITY === decoder('f9fc00').f16());
    assert(Number.isNaN(decoder('f97e00').f16()));

    assert(100000.0 === decoder('fa47c35000').f32());
    assert(3.4028234663852886e+38 === decoder('fa7f7fffff').f32());
    assert(-4.1 === decoder('fbc010666666666666').f64());

    assert(Number.POSITIVE_INFINITY === decoder('fa7f800000').f32());
    assert(Number.NEGATIVE_INFINITY === decoder('faff800000').f32());
    assert(Number.isNaN(decoder('fa7fc00000').f32()));

    assert(1.0e+300 === decoder('fb7e37e43c8800759c').f64());
    assert(Number.POSITIVE_INFINITY === decoder('fb7ff0000000000000').f64());
    assert(Number.NEGATIVE_INFINITY === decoder('fbfff0000000000000').f64());
    return assert(Number.isNaN(decoder('fb7ff8000000000000').f64()));
  });

  it('bool', () => {
    assert(false === decoder('f4').bool());
    return assert(true === decoder('f5').bool());
  });

  it('bytes', () => {
    const d = decoder('4401020304');
    const expected = new Uint8Array([1, 2, 3, 4]).buffer;
    return assert.deepEqual(expected, d.bytes());
  });

  it('text', () => {
    assert('dfsdfsdf\r\nsdf\r\nhello\r\nsdfsfsdfs' === decoder('781f64667364667364660d0a7364660d0a68656c6c6f0d0a736466736673646673').text());
    return assert('\u00fc' === decoder('62c3bc').text());
  });

  it('optional', () => {
    assert.throws((() => decoder('f6').u8()), CBOR.DecodeError, CBOR.DecodeError.prototype.UNEXPECTED_TYPE);

    let d = decoder('f6');
    assert(null === d.optional(() => d.u8()));

    d = decoder('01');
    return assert(1 === d.optional(() => d.u8()));
  });

  it('array', () => {
    const d = decoder('83010203');
    assert(3 === d.array());
    assert(1 === d.u32());
    assert(2 === d.u32());
    return assert(3 === d.u32());
  });

  it('object', () => {
    const d = decoder('a3616101616202616303');
    assert(3 === d.object());

    const obj = {};
    for (let i = 0; i <= 2; i++) {
      obj[d.text()] = d.u8();
    }

    assert(obj['a'] === 1);
    assert(obj['b'] === 2);
    return assert(obj['c'] === 3);
  });

  it('skip', () => {
    const d = decoder('a66161016162820203616382040561647f657374726561646d696e67ff61659f070405ff61666568656c6c6f');
    assert(6 === d.object());

    return [0, 1, 2, 3, 4, 5].map(() => {
      switch (d.text()) {
        case 'a':
          return assert(1 === d.u8());

        case 'b':
          assert(2 === d.array());
          assert(2 === d.u8());
          return assert(3 === d.u8());

        case 'c':
        case 'd':
        case 'e':
          return d.skip();

        case 'f':
          return assert('hello' === d.text());
      }
    });
  });

  return it('array of array', () => {
    const d = decoder('828301020383010203');

    assert(2 === d.array());
    return [0, 1].map(() => {
      assert(3 === d.array());
      assert(1 === d.u32());
      assert(2 === d.u32());
      assert(3 === d.u32());
    });
  });
});
