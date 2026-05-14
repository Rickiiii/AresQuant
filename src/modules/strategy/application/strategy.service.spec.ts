import { EqualWeightStrategy } from '../domain/strategies/equal-weight.strategy';
import { MomentumTopNStrategy } from '../domain/strategies/momentum-top-n.strategy';
import { StrategyService } from './strategy.service';

describe('StrategyService', () => {
  it('initializes with registered strategies', () => {
    const equalWeight = new EqualWeightStrategy();
    const momentumTopN = new MomentumTopNStrategy();
    const service = new StrategyService([equalWeight, momentumTopN]);

    expect(service.get('equal-weight')).toBe(equalWeight);
    expect(service.get('momentum-top-n')).toBe(momentumTopN);
  });

  it('registers a strategy', () => {
    const service = new StrategyService();
    const strategy = new EqualWeightStrategy();

    service.register(strategy);

    expect(service.list()).toEqual([strategy]);
  });

  it('rejects duplicate strategy code', () => {
    const service = new StrategyService();
    const strategy = new EqualWeightStrategy();

    service.register(strategy);

    expect(() => service.register(strategy)).toThrow('Strategy already registered: equal-weight');
  });

  it('gets an existing strategy by code', () => {
    const service = new StrategyService();
    const strategy = new MomentumTopNStrategy();

    service.register(strategy);

    expect(service.get('momentum-top-n')).toBe(strategy);
  });

  it('throws when getting a missing strategy code', () => {
    const service = new StrategyService();

    expect(() => service.get('missing')).toThrow('Strategy not found: missing');
  });

  it('lists registered strategies as a readonly array', () => {
    const service = new StrategyService();
    const equalWeight = new EqualWeightStrategy();
    const momentumTopN = new MomentumTopNStrategy();

    service.register(equalWeight);
    service.register(momentumTopN);

    const strategies = service.list();

    expect(strategies).toEqual([equalWeight, momentumTopN]);
  });
});
