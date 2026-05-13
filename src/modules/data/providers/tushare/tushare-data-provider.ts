import { Injectable } from '@nestjs/common';
import { MockDataProvider } from '../mock/mock-data-provider';

@Injectable()
export class TushareDataProvider extends MockDataProvider {}
