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

/** @module CBOR */

const staticVariables = {
  ARRAY: 1,
  BOOL: 2,
  BREAK: 3,
  BYTES: 4,
  FLOAT16: 5,
  FLOAT32: 6,
  FLOAT64: 7,
  UINT8: 8,
  UINT16: 9,
  UINT32: 10,
  UINT64: 11,
  INT8: 12,
  INT16: 13,
  INT32: 14,
  INT64: 15,
  NULL: 16,
  OBJECT: 17,
  TAGGED: 18,
  TEXT: 19,
  UNDEFINED: 20,
};

/** @class Types */
class Types {
  constructor() {
    throw new Error(`Can't create instance of singleton`);
  }

  /** @type {number} */
  static get ARRAY() {
    return staticVariables.ARRAY;
  }

  /** @type {number} */
  static get BOOL() {
    return staticVariables.BOOL;
  }

  /** @type {number} */
  static get BREAK() {
    return staticVariables.BREAK;
  }

  /** @type {number} */
  static get BYTES() {
    return staticVariables.BYTES;
  }

  /** @type {number} */
  static get FLOAT16() {
    return staticVariables.FLOAT16;
  }

  /** @type {number} */
  static get FLOAT32() {
    return staticVariables.FLOAT32;
  }

  /** @type {number} */
  static get FLOAT64() {
    return staticVariables.FLOAT64;
  }

  /** @type {number} */
  static get UINT8() {
    return staticVariables.UINT8;
  }

  /** @type {number} */
  static get UINT16() {
    return staticVariables.UINT16;
  }

  /** @type {number} */
  static get UINT32() {
    return staticVariables.UINT32;
  }

  /** @type {number} */
  static get UINT64() {
    return staticVariables.UINT64;
  }

  /** @type {number} */
  static get INT8() {
    return staticVariables.INT8;
  }

  /** @type {number} */
  static get INT16() {
    return staticVariables.INT16;
  }

  /** @type {number} */
  static get INT32() {
    return staticVariables.INT32;
  }

  /** @type {number} */
  static get INT64() {
    return staticVariables.INT64;
  }

  /** @type {number} */
  static get NULL() {
    return staticVariables.NULL;
  }

  /** @type {number} */
  static get OBJECT() {
    return staticVariables.OBJECT;
  }

  /** @type {number} */
  static get TAGGED() {
    return staticVariables.TAGGED;
  }

  /** @type {number} */
  static get TEXT() {
    return staticVariables.TEXT;
  }

  /** @type {number} */
  static get UNDEFINED() {
    return staticVariables.UNDEFINED;
  }

  /**
   * @param {Types} t
   * @returns {number}
   */
  static major(t) {
    switch (t) {
      case this.ARRAY: return 4;
      case this.BOOL: return 7;
      case this.BREAK: return 7;
      case this.BYTES: return 2;
      case this.FLOAT16: return 7;
      case this.FLOAT32: return 7;
      case this.FLOAT64: return 7;
      case this.UINT8: return 0;
      case this.UINT16: return 0;
      case this.UINT32: return 0;
      case this.UINT64: return 0;
      case this.INT8: return 1;
      case this.INT16: return 1;
      case this.INT32: return 1;
      case this.INT64: return 1;
      case this.NULL: return 7;
      case this.OBJECT: return 5;
      case this.TAGGED: return 6;
      case this.TEXT: return 3;
      case this.UNDEFINED: return 7;
      default: throw new TypeError('Invalid CBOR type');
    }
  }
}

module.exports = Types;
