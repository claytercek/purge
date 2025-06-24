type BaseErrorParams = {
  message?: string;
  cause?: Error | null;
}

abstract class BasePurgeError<T extends string> extends Error {
  readonly _tag: T;

  constructor(tag: T, args: BaseErrorParams) {
    super(args.message);
    if (args.cause) {
      this.cause = args.cause;
    }
    this._tag = tag;
    this.name = this._tag;
  }
};

export class PurgeFetchError extends BasePurgeError<"PurgeFetchError"> {
  url?: string;

  constructor(args: { message: string; url?: string }) {
    super("PurgeFetchError", args);
    this.url = args.url;
  }
}

export class PurgeDecodeError extends BasePurgeError<"PurgeDecodeError"> {
  constructor(args: { message: string }) {
    super("PurgeDecodeError", args);
  }
}

export class PurgeArgumentError extends BasePurgeError<"PurgeArgumentError"> {
  constructor(args: { message: string }) {
    super("PurgeArgumentError", args);
  }
}


export type PurgeError = PurgeFetchError | PurgeDecodeError | PurgeArgumentError;