import { FundamentalFieldFactor } from './fundamental-field.factor';

export class TurnoverFactor extends FundamentalFieldFactor {
  constructor() {
    super('turnoverRate', {
      code: 'turnover',
      name: 'Turnover Factor',
      version: '1.0.0',
      description: 'Turnover-rate liquidity factor.',
    });
  }
}
