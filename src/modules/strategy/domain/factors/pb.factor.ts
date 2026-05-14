import { FundamentalFieldFactor } from './fundamental-field.factor';

export class PbFactor extends FundamentalFieldFactor {
  constructor() {
    super('pb', {
      code: 'pb',
      name: 'PB Factor',
      version: '1.0.0',
      description: 'Price-to-book valuation factor.',
    });
  }
}
