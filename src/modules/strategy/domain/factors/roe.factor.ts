import { FundamentalFieldFactor } from './fundamental-field.factor';

export class RoeFactor extends FundamentalFieldFactor {
  constructor() {
    super('roe', {
      code: 'roe',
      name: 'ROE Factor',
      version: '1.0.0',
      description: 'Return-on-equity quality factor.',
    });
  }
}
