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

const Types = require('./Types');

/**
 * @class Encoder
 * @returns {Encoder} `this`
 */
class Encoder {
  constructor() {
    this.buffer = new ArrayBuffer(4);
    this.view = new DataView(this.buffer);
    return this;
  }

  /** @returns {ArrayBuffer} */
  get_buffer() {
    return this.buffer.slice(0, this.view.byteOffset);
  }

  /**
   * @param {!number} need_nbytes
   * @returns {void}
   * @private
   */
  _grow_buffer(need_nbytes) {
    const new_len = Math.max((this.buffer.byteLength * 1.5), (this.buffer.byteLength + need_nbytes));
    const new_buf = new ArrayBuffer(new_len);
    new Uint8Array(new_buf).set(new Uint8Array(this.buffer));

    this.buffer = new_buf;
    this.view = new DataView(this.buffer, this.view.byteOffset);
  }

  /**
   * @param {!number} bytes
   * @returns {void}
   * @private
   */
  _ensure(bytes) {
    if (!(this.view.byteLength < bytes)) { return; }
    return this._grow_buffer(bytes);
  }

  /**
   * @param {!number} bytes
   * @returns {void}
   * @private
   */
  _advance(bytes) {
    this.view = new DataView(this.buffer, (this.view.byteOffset + bytes));
  }

  /**
   * @callback closureCallback
   */

  /**
   * @param {!number} bytes
   * @param {!closureCallback} closure
   * @returns {void}
   * @private
   */
  _write(bytes, closure) {
    this._ensure(bytes);
    closure();
    return this._advance(bytes);
  }

  /**
   * @param {Types} type
   * @param {!number} len
   * @returns {void}
   * @private
   * @throws RangeError
   */
  _write_type_and_len(type, len) {
    const major = (Types.major(type)) << 5;

    if ((0 <= len) && (len <= 23)) {
      return this._u8(major | len);
    } else if ((24 <= len) && (len <= 255)) {
      this._u8(major | 24);
      return this._u8(len);
    } else if ((0x100 <= len) && (len <= 0xFFFF)) {
      this._u8(major | 25);
      return this._u16(len);
    } else if ((0x10000 <= len) && (len <= 0xFFFFFFFF)) {
      this._u8(major | 26);
      return this._u32(len);
    } else if (len <= Number.MAX_SAFE_INTEGER) {
      this._u8(major | 27);
      return this._u64(len);
    } else {
      throw new RangeError('Invalid size for CBOR object');
    }
  }

  /*
   * writer-like interface over our ArrayBuffer
   */

  /**
   * @param {!number} x
   * @returns {void}
   * @private
   */
  _u8(x) {
    return this._write(1, () => this.view.setUint8(0, x));
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @private
   */
  _u16(x) {
    return this._write(2, () => this.view.setUint16(0, x));
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @private
   */
  _u32(x) {
    return this._write(4, () => this.view.setUint32(0, x));
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @private
   */
  _u64(x) {
    const low = x % Math.pow(2, 32);
    const high = (x - low) / Math.pow(2, 32);
    const w64 = () => {
      this.view.setUint32(0, high);
      return this.view.setUint32(4, low);
    };
    return this._write(8, w64);
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @private
   */
  _f32(x) {
    return this._write(4, () => this.view.setFloat32(0, x));
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @private
   */
  _f64(x) {
    return this._write(8, () => this.view.setFloat64(0, x));
  }

  /**
   * @param {!Uint8Array} x
   * @returns {void}
   * @private
   */
  _bytes(x) {
    const nbytes = x.byteLength;

    this._ensure(nbytes);
    new Uint8Array(this.buffer, this.view.byteOffset).set(x);
    return this._advance(nbytes);
  }

  /*
   * public API
   */

  /**
   * @param {!number} x
   * @returns {void}
   * @throws RangeError
   */
  u8(x) {
    if ((0 <= x) && (x <= 23)) {
      return this._u8(x);
    } else if ((24 <= x) && (x <= 255)) {
      this._u8(24);
      return this._u8(x);
    } else {
      throw new RangeError('Invalid u8');
    }
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @throws RangeError
   */
  u16(x) {
    if ((0 <= x) && (x <= 23)) {
      return this._u8(x);
    } else if ((24 <= x) && (x <= 255)) {
      this._u8(24);
      return this._u8(x);
    } else if ((0x100 <= x) && (x <= 0xFFFF)) {
      this._u8(25);
      return this._u16(x);
    } else {
      throw new RangeError('Invalid u16');
    }
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @throws RangeError
   */
  u32(x) {
    if ((0 <= x) && (x <= 23)) {
      return this._u8(x);
    } else if ((24 <= x) && (x <= 255)) {
      this._u8(24);
      return this._u8(x);
    } else if ((0x100 <= x) && (x <= 0xFFFF)) {
      this._u8(25);
      return this._u16(x);
    } else if ((0x10000 <= x) && (x <= 0xFFFFFFFF)) {
      this._u8(26);
      return this._u32(x);
    } else {
      throw new RangeError('Invalid u32');
    }
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @throws RangeError
   */
  u64(x) {
    if ((0 <= x) && (x <= 23)) {
      return this._u8(x);
    } else if ((24 <= x) && (x <= 255)) {
      this._u8(24);
      return this._u8(x);
    } else if ((0x100 <= x) && (x <= 0xFFFF)) {
      this._u8(25);
      return this._u16(x);
    } else if ((0x10000 <= x) && (x <= 0xFFFFFFFF)) {
      this._u8(26);
      return this._u32(x);
    } else if (x <= Number.MAX_SAFE_INTEGER) {
      this._u8(27);
      return this._u64(x);
    } else {
      throw new RangeError('Invalid unsigned integer');
    }
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @throws RangeError
   */
  i8(x) {
    if (x >= 0) {
      return this._u8(x);
    }

    x = -1 - x;
    if ((0 <= x) && (x <= 23)) {
      return this._u8(0x20 | x);
    } else if ((24 <= x) && (x <= 255)) {
      this._u8(0x20 | 24);
      return this._u8(x);
    } else {
      throw new RangeError('Invalid i8');
    }
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @throws RangeError
   */
  i16(x) {
    if (x >= 0) {
      return this._u16(x);
    }

    x = -1 - x;
    if ((0 <= x) && (x <= 23)) {
      return this._u8(0x20 | x);
    } else if ((24 <= x) && (x <= 255)) {
      this._u8(0x20 | 24);
      return this._u8(x);
    } else if ((0x100 <= x) && (x <= 0xFFFF)) {
      this._u8(0x20 | 25);
      return this._u16(x);
    } else {
      throw new RangeError('Invalid i16');
    }
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @throws RangeError
   */
  i32(x) {
    if (x >= 0) {
      return this._u32(x);
    }

    x = -1 - x;
    if ((0 <= x) && (x <= 23)) {
      return this._u8(0x20 | x);
    } else if ((24 <= x) && (x <= 255)) {
      this._u8(0x20 | 24);
      return this._u8(x);
    } else if ((0x100 <= x) && (x <= 0xFFFF)) {
      this._u8(0x20 | 25);
      return this._u16(x);
    } else if ((0x10000 <= x) && (x <= 0xFFFFFFFF)) {
      this._u8(0x20 | 26);
      return this._u32(x);
    } else {
      throw new RangeError('Invalid i32');
    }
  }

  /**
   * @param {!number} x
   * @returns {void}
   * @throws RangeError
   */
  i64(x) {
    if (x >= 0) {
      return this._u64(x);
    }

    x = -1 - x;
    if ((0 <= x) && (x <= 23)) {
      return this._u8(0x20 | x);
    } else if ((24 <= x) && (x <= 255)) {
      this._u8(0x20 | 24);
      return this._u8(x);
    } else if ((0x100 <= x) && (x <= 0xFFFF)) {
      this._u8(0x20 | 25);
      return this._u16(x);
    } else if ((0x10000 <= x) && (x <= 0xFFFFFFFF)) {
      this._u8(0x20 | 26);
      return this._u32(x);
    } else if (x <= Number.MAX_SAFE_INTEGER) {
      this._u8(0x20 | 27);
      return this._u64(x);
    } else {
      throw new RangeError('Invalid i64');
    }
  }

  /**
   * @param {!number} x
   * @returns {void}
   */
  f32(x) {
    this._u8(0xE0 | 26);
    return this._f32(x);
  }

  /**
   * @param {!number} x
   * @returns {void}
   */
  f64(x) {
    this._u8(0xE0 | 27);
    return this._f64(x);
  }

  /**
   * @param {!number} x
   * @returns {void}
   */
  bool(x) {
    return this._u8(0xE0 | (x ? 21 : 20));
  }

  /**
   * @param {!(ArrayBuffer|Uint8Array)} x
   * @returns {void}
   */
  bytes(x) {
    this._write_type_and_len(Types.BYTES, x.byteLength);
    return this._bytes(x);
  }

  /**
   * @param {!number} x
   * @returns {void}
   */
  text(x) {
    // http://ecmanaut.blogspot.de/2006/07/encoding-decoding-utf8-in-javascript.html
    const utf8 = unescape(encodeURIComponent(x));

    this._write_type_and_len(Types.TEXT, utf8.length);
    return this._bytes(new Uint8Array(utf8.split('').map((c) => c.charCodeAt(0))));
  }

  /** @returns {void} */
  null() {
    return this._u8(0xE0 | 22);
  }

  /** @returns {void} */
  undefined() {
    return this._u8(0xE0 | 23);
  }

  /**
   * @param {!number} len
   * @returns {void}
   */
  array(len) {
    return this._write_type_and_len(Types.ARRAY, len);
  }

  /** @returns {void} */
  array_begin() {
    return this._u8(0x9F);
  }

  /** @returns {void} */
  array_end() {
    return this._u8(0xFF);
  }

  /**
   * @param {!number} len
   * @returns {void}
   */
  object(len) {
    return this._write_type_and_len(Types.OBJECT, len);
  }

  /** @returns {void} */
  object_begin() {
    return this._u8(0xBF);
  }

  /** @returns {void} */
  object_end() {
    return this._u8(0xFF);
  }
}

module.exports = Encoder;
