import { BaseFactor } from './base-factor';
import { FactorRegistryService } from './factor-registry.service';

interface TestFactorInput {
  readonly value: number;
}

class TestFactor extends BaseFactor<TestFactorInput, number> {
  constructor(code = 'test-factor') {
    super({
      code,
      name: 'Test Factor',
      version: '1.0.0',
    });
  }

  validateInput(input: TestFactorInput): void {
    if (input.value <= 0) {
      throw new Error('value must be positive');
    }
  }

  async calculate(input: TestFactorInput): Promise<number> {
    this.validateInput(input);
    return input.value;
  }
}

describe('FactorRegistryService', () => {
  it('registers and gets a factor by code', () => {
    const registry = new FactorRegistryService();
    const factor = new TestFactor();

    registry.register(factor);

    expect(registry.get('test-factor')).toBe(factor);
  });

  it('lists registered factors in registration order', () => {
    const registry = new FactorRegistryService();
    const first = new TestFactor('first-factor');
    const second = new TestFactor('second-factor');

    registry.register(first);
    registry.register(second);

    expect(registry.list()).toEqual([first, second]);
  });

  it('checks whether a factor exists', () => {
    const registry = new FactorRegistryService();
    registry.register(new TestFactor());

    expect(registry.exists('test-factor')).toBe(true);
    expect(registry.exists('missing-factor')).toBe(false);
  });

  it('rejects duplicate factor codes', () => {
    const registry = new FactorRegistryService();
    const factor = new TestFactor();

    registry.register(factor);

    expect(() => registry.register(factor)).toThrow('Factor already registered: test-factor');
  });

  it('throws when getting a missing factor code', () => {
    const registry = new FactorRegistryService();

    expect(() => registry.get('missing-factor')).toThrow('Factor not found: missing-factor');
  });
});
