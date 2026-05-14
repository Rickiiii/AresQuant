import { BaseFactor } from './base-factor';

interface TestFactorInput {
  readonly value: number;
}

class TestFactor extends BaseFactor<TestFactorInput, number> {
  constructor() {
    super({
      code: 'test-factor',
      name: 'Test Factor',
      version: '1.0.0',
      description: 'A test factor.',
    });
  }

  validateInput(input: TestFactorInput): void {
    if (input.value <= 0) {
      throw new Error('value must be positive');
    }
  }

  async calculate(input: TestFactorInput): Promise<number> {
    this.validateInput(input);
    return input.value * 2;
  }
}

describe('BaseFactor', () => {
  it('exposes factor metadata', () => {
    const factor = new TestFactor();

    expect(factor.code).toBe('test-factor');
    expect(factor.name).toBe('Test Factor');
    expect(factor.version).toBe('1.0.0');
    expect(factor.description).toBe('A test factor.');
  });

  it('delegates input validation and calculation to concrete factors', async () => {
    const factor = new TestFactor();

    await expect(factor.calculate({ value: 3 })).resolves.toBe(6);
    expect(() => factor.validateInput({ value: 0 })).toThrow('value must be positive');
  });
});
