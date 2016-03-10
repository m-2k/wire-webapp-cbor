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

module.exports = class Decoder
  DEFAULT_CONFIG: {
    max_array_length: 1000
    max_bytes_length: 5242880
    max_text_length:  5242880
    max_object_size:  1000
    max_nesting:      16
  }

  constructor: (@buffer, @config = Decoder::DEFAULT_CONFIG) ->
    # buffer *must* be an ArrayBuffer

    @view = new DataView @buffer
    return @

  @_check_overflow: (x, overflow) ->
    if x > overflow
      throw new DecodeError DecodeError::INT_OVERFLOW
    return x

  _advance: (bytes) ->
    @view = new DataView @buffer, (@view.byteOffset + bytes)

  _available: ->
    return @view.byteLength

  _read: (bytes, closure) ->
    if @_available < bytes
      throw new DecodeError DecodeError::UNEXPECTED_EOF

    value = closure()
    @_advance bytes
    return value

  ###
  # reader-like interface for @buffer
  ###

  _u8:  -> return @_read 1, => return @view.getUint8 0
  _u16: -> return @_read 2, => return @view.getUint16 0
  _u32: -> return @_read 4, => return @view.getUint32 0
  _u64: ->
    r64 = (x) =>
      return (@view.getUint32(0) * Math.pow(2, 32)) + @view.getUint32(4)
    return @_read 8, r64

  _f32: -> @_read 4, => @view.getFloat32 0
  _f64: -> @_read 8, => @view.getFloat64 0

  _read_length: (minor) ->
    if 0 <= minor and minor <= 23
      return minor

    switch minor
      when 24 then return @_u8()
      when 25 then return @_u16()
      when 26 then return @_u32()
      when 27 then return Decoder._check_overflow @_u64(), Number.MAX_SAFE_INTEGER

    throw new DecodeError DecodeError::UNEXPECTED_TYPE

  _bytes: (minor, max_len) ->
    len = @_read_length minor
    if len > max_len
      throw new DecodeError DecodeError::TOO_LONG

    return @_read len, => @buffer.slice @view.byteOffset, (@view.byteOffset + len)

  _read_type_info: ->
    type = @_u8()

    major = (type & 0xE0) >> 5
    minor = type & 0x1F

    switch major
      when 0
        type = if 0 <= minor and minor <= 24
          Types::UINT8
        else switch minor
          when 25 then Types::UINT16
          when 26 then Types::UINT32
          when 27 then Types::UINT64
          else
            throw new DecodeError DecodeError::INVALID_TYPE

        return [type, minor]

      when 1
        type = if 0 <= minor and minor <= 24
          Types::INT8
        else switch minor
          when 25 then Types::INT16
          when 26 then Types::INT32
          when 27 then Types::INT64
          else
            throw new DecodeError DecodeError::INVALID_TYPE

        return [type, minor]

      when 2 then return [Types::BYTES, minor]
      when 3 then return [Types::TEXT, minor]
      when 4 then return [Types::ARRAY, minor]
      when 5 then return [Types::OBJECT, minor]

      when 7
        switch minor
          when 20, 21 then return [Types::BOOL, minor]
          when 22 then return [Types::NULL, minor]
          when 25 then return [Types::FLOAT16, minor]
          when 26 then return [Types::FLOAT32, minor]
          when 27 then return [Types::FLOAT64, minor]
          when 31 then return [Types::BREAK, minor]

    throw new DecodeError DecodeError::INVALID_TYPE

  _type_info_with_assert: (expected) ->
    [type, minor] = @_read_type_info()

    if not Array.isArray expected
      expected = [expected]

    if not expected.some((e) -> type is e)
      throw new DecodeError DecodeError::UNEXPECTED_TYPE, [type, minor]

    return [type, minor]

  _read_unsigned: (type, minor) ->
    switch type
      when Types::UINT8
        if minor <= 23
          return minor
        return @_u8()

      when Types::UINT16
        return @_u16()

      when Types::UINT32
        return @_u32()

      when Types::UINT64
        return @_u64()

    throw new DecodeError DecodeError::UNEXPECTED_TYPE, [type, minor]

  _read_signed: (overflow, type, minor) ->
    switch type
      when Types::INT8
        if minor <= 23
          return (-1 - minor)
        return (-1 - Decoder._check_overflow @_u8(), overflow)

      when Types::INT16
        return (-1 - Decoder._check_overflow @_u16(), overflow)

      when Types::INT32
        return (-1 - Decoder._check_overflow @_u32(), overflow)

      when Types::INT64
        return (-1 - Decoder._check_overflow @_u64(), overflow)

      when Types::UINT8, Types::UINT16, Types::UINT32, Types::UINT64
        return Decoder._check_overflow @_read_unsigned(type, minor), overflow

    throw new DecodeError DecodeError::UNEXPECTED_TYPE, [type, minor]


  ###
  # public API
  ###

  u8: ->
    return @_read_unsigned @_type_info_with_assert([
      Types::UINT8
    ])...

  u16: ->
    return @_read_unsigned @_type_info_with_assert([
      Types::UINT8
      Types::UINT16
    ])...

  u32: ->
    return @_read_unsigned @_type_info_with_assert([
      Types::UINT8
      Types::UINT16
      Types::UINT32
    ])...

  u64: ->
    return @_read_unsigned @_type_info_with_assert([
      Types::UINT8
      Types::UINT16
      Types::UINT32
      Types::UINT64
    ])...

  i8: ->
    return @_read_signed 127, @_type_info_with_assert([
      Types::INT8
      Types::UINT8
    ])...

  i16: ->
    return @_read_signed 32767, @_type_info_with_assert([
      Types::INT8
      Types::INT16

      Types::UINT8
      Types::UINT16
    ])...

  i32: ->
    return @_read_signed 2147483647, @_type_info_with_assert([
      Types::INT8
      Types::INT16
      Types::INT32

      Types::UINT8
      Types::UINT16
      Types::UINT32
    ])...

  i64: ->
    return @_read_signed Number.MAX_SAFE_INTEGER, @_type_info_with_assert([
      Types::INT8
      Types::INT16
      Types::INT32
      Types::INT64

      Types::UINT8
      Types::UINT16
      Types::UINT32
      Types::UINT64
    ])...

  unsigned: ->
    return @u64()

  int: ->
    return @i64()

  f16: ->
    @_type_info_with_assert Types::FLOAT16

    half = @_u16()
    exp  = half >> 10 & 0x1F
    mant = half & 0x3FF

    ldexp = (x, exp) ->
      return x * Math.pow(2, exp)

    val = switch exp
      when 0  then ldexp mant, -24
      when 31
        if mant is 0
          Number.POSITIVE_INFINITY
        else
          Number.NaN
      else ldexp mant + 1024, exp - 25

    if half & 0x8000
      return -val
    return val

  f32: ->
    @_type_info_with_assert Types::FLOAT32
    return @_f32()

  f64: ->
    @_type_info_with_assert Types::FLOAT64
    return @_f64()

  bool: ->
    [_, minor] = @_type_info_with_assert Types::BOOL

    return switch minor
      when 20 then false
      when 21 then true
      else
        throw new DecodeError DecodeError::UNEXPECTED_TYPE

  bytes: ->
    [_, minor] = @_type_info_with_assert Types::BYTES

    if minor is 31
      # XXX: handle indefinite encoding
      throw new DecodeError DecodeError::UNEXPECTED_TYPE

    return @_bytes minor, @config['max_bytes_length']

  text: ->
    [_, minor] = @_type_info_with_assert Types::TEXT

    if minor is 31
      # XXX: handle indefinite encoding
      throw new DecodeError DecodeError::UNEXPECTED_TYPE

    buf = @_bytes minor, @config['max_text_length']
    utf8 = String.fromCharCode (new Uint8Array buf)...

    # http://ecmanaut.blogspot.de/2006/07/encoding-decoding-utf8-in-javascript.html
    return decodeURIComponent escape utf8

  optional: (closure) ->
    try
      return closure()
    catch error
      if error instanceof DecodeError and error.extra[0] is Types::NULL
        return null
      throw error

  array: ->
    [_, minor] = @_type_info_with_assert Types::ARRAY

    if minor is 31
      # XXX: handle indefinite encoding
      throw new DecodeError DecodeError::UNEXPECTED_TYPE

    len = @_read_length minor
    if len > @config['max_array_length']
      throw new DecodeError DecodeError::TOO_LONG

    return len

  object: ->
    [_, minor] = @_type_info_with_assert Types::OBJECT

    if minor is 31
      # XXX: handle indefinite encoding
      throw new DecodeError DecodeError::UNEXPECTED_TYPE

    len = @_read_length minor
    if len > @config['max_object_size']
      throw new DecodeError DecodeError::TOO_LONG

    return len

  _skip_until_break: (type) ->
    loop
      [t, minor] = @_read_type_info()
      if t is Types::BREAK
        return

      if t isnt type or minor is 31
        throw new DecodeError DecodeError::UNEXPECTED_TYPE

      len = @_read_length minor
      @_advance len

  _skip_value: (level) ->
    if level is 0
      throw new DecodeError DecodeError::TOO_NESTED

    [type, minor] = @_read_type_info()
    switch type
      when Types::UINT8, Types::UINT16, Types::UINT32, Types::UINT64, \
           Types::INT8, Types::INT16, Types::INT32, Types::INT64
        @_read_length minor
        return true

      when Types::BOOL, Types::NULL
        return true

      when Types::BREAK
        return false

      when Types::FLOAT16
        @_advance 2
        return true

      when Types::FLOAT32
        @_advance 4
        return true

      when Types::FLOAT64
        @_advance 8
        return true

      when Types::BYTES, Types::TEXT
        if minor is 31
          @_skip_until_break type
          return true

        len = @_read_length minor
        @_advance len
        return true

      when Types::ARRAY, Types::OBJECT
        if minor is 31
          while @_skip_value (level - 1) then
          return true

        len = @_read_length minor
        while len--
          @_skip_value (level - 1)

        return true

  skip: ->
    @_skip_value @config['max_nesting']
