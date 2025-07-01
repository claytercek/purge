/**
 * Custom error types for purge operations.
 * Each error type has a `_tag` property to identify the error type,
 * and extends the base `BasePurgeError` class.
 * @module
 */

/**
 * Base parameters for purge-related errors.
 */
export type BaseErrorArgs = {
  message?: string;
  cause?: Error | null;
};

/**
 * Base class for purge-related errors.
 * This class extends the built-in Error class and adds a `_tag` property to identify the error type.
 */
export abstract class BasePurgeError<T extends string> extends Error {
  readonly _tag: T;

  constructor(tag: T, args: BaseErrorArgs) {
    super(args.message);
    if (args.cause) {
      this.cause = args.cause;
    }
    this._tag = tag;
    this.name = this._tag;
  }
}

/**
 * Error thrown when there is an issue with the arguments provided to a purge operation.
 */
export class PurgeArgumentError extends BasePurgeError<"PurgeArgumentError"> {
  constructor(args: BaseErrorArgs) {
    super("PurgeArgumentError", args);
  }
}

/**
 * Error thrown when there is an issue with the purge provider.
 * This could be due to a failure in the provider's API or an issue with the provider's configuration.
 */
export class PurgeProviderError extends BasePurgeError<"PurgeProviderError"> {
  constructor(args: BaseErrorArgs) {
    super("PurgeProviderError", args);
  }
}


/**
 * Error type for all purge-related errors.
 */
export type PurgeError =
  | PurgeProviderError
  | PurgeArgumentError;
