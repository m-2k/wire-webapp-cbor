/** @module CBOR */
module CBOR {
   /**
    * @class BaseError
    * @extends Error
    */
   class BaseError extends Error {
       /**
        * @class BaseError
        * @extends Error
        */
       constructor();

   }

   /** @type string */
   var INVALID_TYPE: string;

   /** @type string */
   var UNEXPECTED_EOF: string;

   /** @type string */
   var UNEXPECTED_TYPE: string;

   /** @type string */
   var INT_OVERFLOW: string;

   /** @type string */
   var TOO_LONG: string;

   /** @type string */
   var TOO_NESTED: string;

   /**
    * @class Decoder
    * @param {ArrayBuffer} buffer
    * @param {Object} config
    * @returns {Decoder}
    */
   class Decoder {
       /**
        * @class Decoder
        * @param {ArrayBuffer} buffer
        * @param {Object} config
        * @returns {Decoder}
        */
       constructor(buffer: ArrayBuffer, config: Object);

       /**
        * @param {number} x
        * @param {number} overflow
        * @returns {number}
        * @private
        */
       private static _check_overflow(x: number, overflow: number): number;

       /**
        * @param {number} bytes
        * @returns {void}
        * @private
        */
       private _advance(bytes: number): void;

       /**
        * @returns {number}
        * @private
        */
       private _available(): number;

       /**
        * @param {number} bytes
        * @param {closureCallback} closure
        * @returns {number}
        * @private
        */
       private _read(bytes: number, closure: closureCallback): number;

       /**
        * @returns {number}
        * @private
        */
       private _u8(): number;

       /**
        * @returns {number}
        * @private
        */
       private _u16(): number;

       /**
        * @returns {number}
        * @private
        */
       private _u32(): number;

       /**
        * @returns {number}
        * @private
        */
       private _u64(): number;

       /**
        * @returns {number}
        * @private
        */
       private _f32(): number;

       /**
        * @returns {number}
        * @private
        */
       private _f64(): number;

       /**
        * @param {number} minor
        * @returns {number}
        * @private
        */
       private _read_length(minor: number): number;

       /**
        * @param {number} minor
        * @param {number} max_len
        * @returns {number}
        * @private
        */
       private _bytes(minor: number, max_len: number): number;

       /**
        * @returns {Array}
        * @private
        */
       private _read_type_info(): Array;

       /**
        * @param {number|Array<number>} expected
        * @returns {Array}
        * @private
        */
       private _type_info_with_assert(expected: (number|number[])): Array;

       /**
        * @param {Types.UINT8|Types.UINT16|Types.UINT32|Types.UINT64} type
        * @param {number} minor
        * @returns {number}
        * @private
        */
       private _read_unsigned(type: (Types.UINT8|Types.UINT16|Types.UINT32|Types.UINT64), minor: number): number;

       /**
        * @param {number} overflow
        * @param {*} type
        * @param {*} minor
        * @returns {number}
        * @private
        */
       private _read_signed(overflow: number, type: any, minor: any): number;

       /** @returns {number} */
       u8(): number;

       /** @returns {number} */
       u16(): number;

       /** @returns {number} */
       u32(): number;

       /** @returns {number} */
       u64(): number;

       /** @returns {number} */
       i8(): number;

       /** @returns {number} */
       i16(): number;

       /** @returns {number} */
       i32(): number;

       /** @returns {number} */
       i64(): number;

       /** @returns {number} */
       unsigned(): number;

       /** @returns {number} */
       int(): number;

       /** @returns {number} */
       f16(): number;

       /** @returns {number} */
       f32(): number;

       /** @returns {number} */
       f64(): number;

       /** @returns {boolean} */
       bool(): boolean;

       /** @returns {number} */
       bytes(): number;

       /** @returns {string} */
       text(): string;

       /**
        * @param {closureCallback} closure
        * @returns {closureCallback}
        */
       optional(closure: closureCallback): closureCallback;

       /** @returns {number} */
       array(): number;

       /** @returns {number} */
       object(): number;

       /**
        * @param {*} type
        * @private
        * @returns {void}
        */
       private _skip_until_break(type: any): void;

       /**
        * @param level {number}
        * @returns {boolean}
        * @private
        * @returns {void}
        */
       private _skip_value(level: number): boolean;

       /** @returns {boolean} */
       skip(): boolean;

   }

   /**
    * @callback closureCallback
    */
   type closureCallback = () => void;

   /** @class Encoder */
   class Encoder {
       /** @class Encoder */
       constructor();

   }

   /** @class Types */
   class Types {
       /** @class Types */
       constructor();

       /** @type {number} */
       static ARRAY: number;

       /** @type {number} */
       static BOOL: number;

       /** @type {number} */
       static BREAK: number;

       /** @type {number} */
       static BYTES: number;

       /** @type {number} */
       static FLOAT16: number;

       /** @type {number} */
       static FLOAT32: number;

       /** @type {number} */
       static FLOAT64: number;

       /** @type {number} */
       static UINT8: number;

       /** @type {number} */
       static UINT16: number;

       /** @type {number} */
       static UINT32: number;

       /** @type {number} */
       static UINT64: number;

       /** @type {number} */
       static INT8: number;

       /** @type {number} */
       static INT16: number;

       /** @type {number} */
       static INT32: number;

       /** @type {number} */
       static INT64: number;

       /** @type {number} */
       static NULL: number;

       /** @type {number} */
       static OBJECT: number;

       /** @type {number} */
       static TAGGED: number;

       /** @type {number} */
       static TEXT: number;

       /** @type {number} */
       static UNDEFINED: number;

       /**
        * @param {Types} t
        * @returns {number}
        */
       static major(t: Types): number;

   }

}

