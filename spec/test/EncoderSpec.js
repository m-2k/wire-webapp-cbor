/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

/* eslint no-undef: "off" */

'use strict';

const CBOR = require('../../src/cbor');

describe('CBOR.Encoder', () => {
  const to_hex = (bytes) => {
    let str = '';

    for (const byte of Array.from(bytes)) {
      const c = byte & 0xF;
      const b = byte >>> 4;
      const x = (((87 + c + (((c - 10) >> 8) & ~38)) << 8) | (87 + b + (((b - 10) >> 8) & ~38)));

      str += String.fromCharCode(x & 0xFF) + String.fromCharCode(x >>> 8);
    }

    return str;
  };

  const encoded = (expected, closure) => {
    const e = new CBOR.Encoder();
    closure(e);
    return (to_hex(new Uint8Array(e.get_buffer())) === expected);
  };

  it('encodes unsigned integers', () => {
    expect(encoded('00', (e) => e.u8(0))).toBe(true);
    expect(encoded('00', (e) => e.u8(0))).toBe(true);
    expect(encoded('01', (e) => e.u8(1))).toBe(true);
    expect(encoded('0a', (e) => e.u8(10))).toBe(true);
    expect(encoded('17', (e) => e.u8(23))).toBe(true);
    expect(encoded('1818', (e) => e.u8(24))).toBe(true);
    expect(encoded('1819', (e) => e.u8(25))).toBe(true);
    expect(encoded('1864', (e) => e.u8(100))).toBe(true);
    expect(encoded('1903e8', (e) => e.u16(1000))).toBe(true);
    expect(encoded('1a000f4240', (e) => e.u32(1000000))).toBe(true);
    expect(encoded('1b000000e8d4a51000', (e) => e.u64(1000000000000))).toBe(true);
    expect(encoded('1b001fffffffffffff', (e) => e.u64(Number.MAX_SAFE_INTEGER))).toBe(true);
    expect(() => encoded('1bffffffffffffffff')).toThrow();
    expect((e) => e.u64(18446744073709551615)).toThrow();
  });

  it('encodes signed integers', () => {
    expect(encoded('20', (e) => e.i8(-1))).toBe(true);
    expect(encoded('29', (e) => e.i8(-10))).toBe(true);
    expect(encoded('3863', (e) => e.i8(-100))).toBe(true);
    expect(encoded('3901f3', (e) => e.i16(-500))).toBe(true);
    expect(encoded('3903e7', (e) => e.i16(-1000))).toBe(true);
    expect(encoded('3a00053d89', (e) => e.i32(-343434))).toBe(true);
    expect(encoded('3b000000058879da85', (e) => e.i64(-23764523654))).toBe(true);
  });

  it('encodes booleans', () => {
    expect(encoded('f4', (e) => e.bool(false))).toBe(true);
    expect(encoded('f5', (e) => e.bool(true))).toBe(true);
  });

  it('encodes floats', () => {
    expect(encoded('fa47c35000', (e) => e.f32(100000.0))).toBe(true);
    expect(encoded('fa7f7fffff', (e) => e.f32(3.4028234663852886e+38))).toBe(true);
    expect(encoded('fbc010666666666666', (e) => e.f64(-4.1))).toBe(true);

    expect(encoded('fa7f800000', (e) => e.f32(Number.POSITIVE_INFINITY))).toBe(true);
    expect(encoded('faff800000', (e) => e.f32(Number.NEGATIVE_INFINITY))).toBe(true);
    expect(encoded('fa7fc00000', (e) => e.f32(Number.NaN))).toBe(true);

    expect(encoded('fb7ff0000000000000', (e) => e.f64(Number.POSITIVE_INFINITY))).toBe(true);
    expect(encoded('fbfff0000000000000', (e) => e.f64(Number.NEGATIVE_INFINITY))).toBe(true);
    expect(encoded('fb7ff8000000000000', (e) => e.f64(Number.NaN))).toBe(true);
  });

  it('encodes bytes', () => {
    expect(encoded('4401020304', (e) => e.bytes(new Uint8Array([1, 2, 3, 4])))).toBe(true);
  });

  it('encodes text', () => {
    expect(encoded('62c3bc', (e) => e.text('\u00fc'))).toBe(true);
    expect(encoded('781f64667364667364660d0a7364660d0a68656c6c6f0d0a736466736673646673', (e) => e.text('dfsdfsdf\r\nsdf\r\nhello\r\nsdfsfsdfs'))).toBe(true);
  });

  it('handles null values', () => {
    expect(encoded('f6', (e) => e.null())).toBe(true);
  });

  it('encodes arrays', () => {
    expect(encoded('83010203', (e) => {
      e.array(3);
      e.u32(1);
      e.u32(2);
      e.u32(3);
    })).toBe(true);

    expect(encoded('8301820203820405', (e) => {
      e.array(3);
      e.u8(1);
      e.array(2);
      e.u8(2);
      e.u8(3);
      e.array(2);
      e.u8(4);
      e.u8(5);
    })).toBe(true);
  });

  it('handles indefinite arrays', () => {
    expect(encoded('9f018202039f0405ffff', (e) => {
      e.array_begin();
      e.u8(1);
      e.array(2);
      e.u8(2);
      e.u8(3);
      e.array_begin();
      e.u8(4);
      e.u8(5);
      e.array_end();
      e.array_end();
    })).toBe(true);

    expect(encoded('9f01820203820405ff', (e) => {
      e.array_begin();
      e.u8(1);
      e.array(2);
      e.u8(2);
      e.u8(3);
      e.array(2);
      e.u8(4);
      e.u8(5);
      e.array_end();
    })).toBe(true);

    expect(encoded('83018202039f0405ff', (e) => {
      e.array(3);
      e.u8(1);
      e.array(2);
      e.u8(2);
      e.u8(3);
      e.array_begin();
      e.u8(4);
      e.u8(5);
      e.array_end();
    })).toBe(true);

    expect(encoded('83019f0203ff820405', (e) => {
      e.array(3);
      e.u8(1);
      e.array_begin();
      e.u8(2);
      e.u8(3);
      e.array_end();
      e.array(2);
      e.u8(4);
      e.u8(5);
    })).toBe(true);
  });

  it('encodes objects', () => {
    expect(encoded('a26161016162820203', (e) => {
      e.object(2);
      e.text('a');
      e.u8(1);
      e.text('b');
      e.array(2);
      e.u8(2);
      e.u8(3);
    })).toBe(true);
  });

  it('handles indefinite objects', () => {
    expect(encoded('bf6346756ef563416d7421ff', (e) => {
      e.object_begin();
      e.text('Fun');
      e.bool(true);
      e.text('Amt');
      e.i8(-2);
      e.object_end();
    })).toBe(true);
  });

  it('handles indefinite objects', () => {
    expect(encoded('bf6346756ef563416d7421ff', (e) => {
      e.object_begin();
      e.text('Fun');
      e.bool(true);
      e.text('Amt');
      e.i8(-2);
      e.object_end();
    })).toBe(true);
  });
});
