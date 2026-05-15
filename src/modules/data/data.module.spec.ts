import { EastmoneyDataProvider } from './providers/eastmoney/eastmoney-data-provider';
import { MockDataProvider } from './providers/mock/mock-data-provider';
import { resolveDataProviderClass } from './data.module';

describe('resolveDataProviderClass', () => {
  const original = process.env.DATA_PROVIDER;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.DATA_PROVIDER;
    } else {
      process.env.DATA_PROVIDER = original;
    }
  });

  it('uses mock provider by default', () => {
    delete process.env.DATA_PROVIDER;

    expect(resolveDataProviderClass()).toBe(MockDataProvider);
  });

  it('uses Eastmoney provider when DATA_PROVIDER=eastmoney', () => {
    process.env.DATA_PROVIDER = 'eastmoney';

    expect(resolveDataProviderClass()).toBe(EastmoneyDataProvider);
  });
});
