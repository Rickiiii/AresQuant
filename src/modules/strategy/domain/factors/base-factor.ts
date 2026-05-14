import type { Factor } from './factor.types';

export abstract class BaseFactor<TInput extends object = Readonly<Record<string, unknown>>, TResult = unknown>
  implements Factor<TInput, TResult>
{
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;

  protected constructor(params: {
    readonly code: string;
    readonly name: string;
    readonly version: string;
    readonly description?: string;
  }) {
    this.code = params.code;
    this.name = params.name;
    this.version = params.version;
    if (params.description !== undefined) {
      this.description = params.description;
    }
  }

  abstract validateInput(input: TInput): void;

  abstract calculate(input: TInput): Promise<TResult>;
}
