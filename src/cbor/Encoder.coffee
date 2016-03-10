# Wire
# Copyright (C) 2016 Wire Swiss GmbH
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

DecodeError = require './DecodeError'
Types = require './Types'

module.exports = class Encoder
  constructor: ->
    @buffer = new ArrayBuffer 4
    @view = new DataView @buffer
    return @

  get_buffer: ->
    return @buffer.slice 0, @view.byteOffset

  _grow_buffer: (need_nbytes) ->
    new_len = Math.max((@buffer.byteLength * 1.5), (@buffer.byteLength + need_nbytes))
    new_buf = new ArrayBuffer new_len
    new Uint8Array(new_buf).set new Uint8Array @buffer

    @buffer = new_buf
    @view = new DataView @buffer, @view.byteOffset

  _ensure: (bytes) ->
    return unless @view.byteLength < bytes
    @_grow_buffer bytes

  _advance: (bytes) ->
    @view = new DataView @buffer, (@view.byteOffset + bytes)

  _write: (bytes, closure) ->
    @_ensure bytes
    closure()
    @_advance bytes

  _write_type_and_len: (type, len) ->
    major = (Types.major type) << 5

    if 0 <= len and len <= 23
      @_u8 major | len
    else if 24 <= len and len <= 255
      @_u8 major | 24
      @_u8 len
    else if 0x100 <= len and len <= 0xFFFF
      @_u8 major | 25
      @_u16 len
    else if 0x10000 <= len and len <= 0xFFFFFFFF
      @_u8 major | 26
      @_u32 len
    else if len <= Number.MAX_SAFE_INTEGER
      @_u8 major | 27
      @_u64 len
    else
      throw new RangeError 'Invalid size for CBOR object'

  ###
  # writer-like interface over our ArrayBuffer
  ###

  _u8: (x) ->  @_write 1, => @view.setUint8 0, x
  _u16: (x) -> @_write 2, => @view.setUint16 0, x
  _u32: (x) -> @_write 4, => @view.setUint32 0, x
  _u64: (x) ->
    low  = x % Math.pow(2, 32)
    high = (x - low) / Math.pow(2, 32)
    w64 = (x) =>
      @view.setUint32 0, high
      @view.setUint32 4, low
    @_write 8, w64, x

  _f32: (x) -> @_write 4, => @view.setFloat32 0, x
  _f64: (x) -> @_write 8, => @view.setFloat64 0, x

  _bytes: (x) ->
    nbytes = x.byteLength

    @_ensure nbytes
    new Uint8Array(@buffer, @view.byteOffset).set x
    @_advance nbytes

  ###
  # public API
  ###

  u8: (x) ->
    if 0 <= x and x <= 23
      @_u8 x
    else if 24 <= x and x <= 255
      @_u8 24
      @_u8 x
    else
      throw new RangeError 'Invalid u8'

  u16: (x) ->
    if 0 <= x and x <= 23
      @_u8 x
    else if 24 <= x and x <= 255
      @_u8 24
      @_u8 x
    else if 0x100 <= x and x <= 0xFFFF
      @_u8 25
      @_u16 x
    else
      throw new RangeError 'Invalid u16'

  u32: (x) ->
    if 0 <= x and x <= 23
      @_u8 x
    else if 24 <= x and x <= 255
      @_u8 24
      @_u8 x
    else if 0x100 <= x and x <= 0xFFFF
      @_u8 25
      @_u16 x
    else if 0x10000 <= x and x <= 0xFFFFFFFF
      @_u8 26
      @_u32 x
    else
      throw new RangeError 'Invalid u32'

  u64: (x) ->
    if 0 <= x and x <= 23
      @_u8 x
    else if 24 <= x and x <= 255
      @_u8 24
      @_u8 x
    else if 0x100 <= x and x <= 0xFFFF
      @_u8 25
      @_u16 x
    else if 0x10000 <= x and x <= 0xFFFFFFFF
      @_u8 26
      @_u32 x
    else if x <= Number.MAX_SAFE_INTEGER
      @_u8 27
      @_u64 x
    else
      throw new RangeError 'Invalid unsigned integer'

  i8: (x) ->
    if x >= 0
      return @_u8 x

    x = -1 - x
    if 0 <= x and x <= 23
      @_u8 0x20 | x
    else if 24 <= x and x <= 255
      @_u8 0x20 | 24
      @_u8 x
    else
      throw new RangeError 'Invalid i8'

  i16: (x) ->
    if x >= 0
      return @_u16 x

    x = -1 - x
    if 0 <= x and x <= 23
      @_u8 0x20 | x
    else if 24 <= x and x <= 255
      @_u8 0x20 | 24
      @_u8 x
    else if 0x100 <= x and x <= 0xFFFF
      @_u8 0x20 | 25
      @_u16 x
    else
      throw new RangeError 'Invalid i16'

  i32: (x) ->
    if x >= 0
      return @_u32 x

    x = -1 - x
    if 0 <= x and x <= 23
      @_u8 0x20 | x
    else if 24 <= x and x <= 255
      @_u8 0x20 | 24
      @_u8 x
    else if 0x100 <= x and x <= 0xFFFF
      @_u8 0x20 | 25
      @_u16 x
    else if 0x10000 <= x and x <= 0xFFFFFFFF
      @_u8 0x20 | 26
      @_u32 x
    else
      throw new RangeError 'Invalid i32'

  i64: (x) ->
    if x >= 0
      return @_u64 x

    x = -1 - x
    if 0 <= x and x <= 23
      @_u8 0x20 | x
    else if 24 <= x and x <= 255
      @_u8 0x20 | 24
      @_u8 x
    else if 0x100 <= x and x <= 0xFFFF
      @_u8 0x20 | 25
      @_u16 x
    else if 0x10000 <= x and x <= 0xFFFFFFFF
      @_u8 0x20 | 26
      @_u32 x
    else if x <= Number.MAX_SAFE_INTEGER
      @_u8 0x20 | 27
      @_u64 x
    else
      throw new RangeError 'Invalid i64'

  f32: (x) ->
    @_u8 0xE0 | 26
    @_f32 x

  f64: (x) ->
    @_u8 0xE0 | 27
    @_f64 x

  bool: (x) ->
    @_u8 0xE0 | (if x then 21 else 20)

  bytes: (x) ->
    @_write_type_and_len Types::BYTES, x.byteLength
    @_bytes x

  text: (x) ->
    # http://ecmanaut.blogspot.de/2006/07/encoding-decoding-utf8-in-javascript.html
    utf8 = unescape encodeURIComponent x

    @_write_type_and_len Types::TEXT, utf8.length
    @_bytes new Uint8Array utf8.split('').map((c) -> c.charCodeAt 0)

  null: ->
    @_u8 0xE0 | 22

  undefined: ->
    @_u8 0xE0 | 23

  array: (len) ->
    @_write_type_and_len Types::ARRAY, len

  array_begin: ->
    @_u8 0x9F

  array_end: ->
    @_u8 0xFF

  object: (len) ->
    @_write_type_and_len Types::OBJECT, len

  object_begin: ->
    @_u8 0xBF

  object_end: ->
    @_u8 0xFF
