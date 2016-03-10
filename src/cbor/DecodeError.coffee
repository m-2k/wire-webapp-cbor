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

BaseError = require './BaseError'

module.exports = class DecodeError extends BaseError
  INVALID_TYPE: 'Invalid type'
  UNEXPECTED_EOF: 'Unexpected end-of-buffer'
  UNEXPECTED_TYPE: 'Unexpected type'
  INT_OVERFLOW: 'Integer overflow'
  TOO_LONG: 'Field too long'
  TOO_NESTED: 'Object nested too deep'

  constructor: (message, @extra) ->
    super message
