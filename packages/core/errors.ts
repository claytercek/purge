/**
 * Custom error types for purge operations.
 * Each error type has a `_tag` property to identify the error type,
 * and extends the base `BasePurgeError` class.
 * @module
 */

/**
 * Base parameters for purge-related errors.
 */
export type BaseErrorParams = {
  message?: string;
  cause?: Error | null;
};

/**
 * Base class for purge-related errors.
 * This class extends the built-in Error class and adds a `_tag` property to identify the error type.
 */
export abstract class BasePurgeError<T extends string> extends Error {
  readonly _tag: T;

  constructor(tag: T, args: BaseErrorParams) {
    super(args.message);
    if (args.cause) {
      this.cause = args.cause;
    }
    this._tag = tag;
    this.name = this._tag;
  }
}

/**
 * Error thrown when there is an issue with a fetch operation during purging.
 */
export class PurgeFetchError extends BasePurgeError<"PurgeFetchError"> {
  url?: string;

  constructor(args: { message: string; url?: string }) {
    super("PurgeFetchError", args);
    this.url = args.url;
  }
}

/**
 * Error thrown when there is an issue decoding a response during purging.
 */
export class PurgeDecodeError extends BasePurgeError<"PurgeDecodeError"> {
  constructor(args: { message: string }) {
    super("PurgeDecodeError", args);
  }
}

/**
 * Error thrown when there is an issue with the arguments provided to a purge operation.
 */
export class PurgeArgumentError extends BasePurgeError<"PurgeArgumentError"> {
  constructor(args: { message: string }) {
    super("PurgeArgumentError", args);
  }
}

/**
 * Error type for all purge-related errors.
 */
export type PurgeError =
  | PurgeFetchError
  | PurgeDecodeError
  | PurgeArgumentError;
