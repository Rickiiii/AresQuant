export interface Factor<TInput extends object = Readonly<Record<string, unknown>>, TResult = unknown> {
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  validateInput(input: TInput): void;
  calculate(input: TInput): Promise<TResult>;
}
