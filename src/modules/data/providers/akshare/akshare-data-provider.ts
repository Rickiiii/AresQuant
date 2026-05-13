import { Injectable } from '@nestjs/common';
import { MockDataProvider } from '../mock/mock-data-provider';

@Injectable()
export class AkShareDataProvider extends MockDataProvider {}
