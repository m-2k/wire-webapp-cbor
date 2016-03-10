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

module.exports = class Types
  ARRAY:      1
  BOOL:       2
  BREAK:      3
  BYTES:      4
  FLOAT16:    5
  FLOAT32:    6
  FLOAT64:    7
  UINT8:      8
  UINT16:     9
  UINT32:     10
  UINT64:     11
  INT8:       12
  INT16:      13
  INT32:      14
  INT64:      15
  NULL:       16
  OBJECT:     17
  TAGGED:     18
  TEXT:       19
  UNDEFINED:  20

  constructor: ->
    raise new Error 'Can\'t create instance of singleton'

  @major: (t) ->
    return switch t
      when Types::ARRAY     then 4
      when Types::BOOL      then 7
      when Types::BREAK     then 7
      when Types::BYTES     then 2
      when Types::FLOAT16   then 7
      when Types::FLOAT32   then 7
      when Types::FLOAT64   then 7
      when Types::UINT8     then 0
      when Types::UINT16    then 0
      when Types::UINT32    then 0
      when Types::UINT64    then 0
      when Types::INT8      then 1
      when Types::INT16     then 1
      when Types::INT32     then 1
      when Types::INT64     then 1
      when Types::NULL      then 7
      when Types::OBJECT    then 5
      when Types::TAGGED    then 6
      when Types::TEXT      then 3
      when Types::UNDEFINED then 7
      else raise TypeError 'Invalid CBOR type'
