import { FundamentalFieldFactor } from './fundamental-field.factor';

export class PeFactor extends FundamentalFieldFactor {
  constructor() {
    super('pe', {
      code: 'pe',
      name: 'PE Factor',
      version: '1.0.0',
      description: 'Price-to-earnings valuation factor.',
    });
  }
}
