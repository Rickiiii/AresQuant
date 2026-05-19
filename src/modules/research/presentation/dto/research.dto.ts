export type ResearchAction = 'hold' | 'add' | 'build' | 'watch' | 'take_profit' | 'risk_control';
export type ResearchSuggestedAction = 'add' | 'build' | 'watch' | 'take_profit' | 'risk_control';
export type ResearchImpactLevel = 'low' | 'medium' | 'high';

export class ResearchPlaybookDto {
  readonly code!: string;
  readonly name!: string;
  readonly description!: string;
  readonly output!: readonly string[];
}

export class ResearchNoteSectionDto {
  readonly code!: string;
  readonly title!: string;
  readonly bullets!: readonly string[];
}

export class ResearchActionBucketsDto {
  readonly add!: readonly string[];
  readonly build!: readonly string[];
  readonly watch!: readonly string[];
  readonly takeProfit!: readonly string[];
  readonly riskControl!: readonly string[];
}

export class ResearchDailyNoteDto {
  readonly title!: string;
  readonly marketState!: 'fallback';
  readonly topConclusion!: string;
  readonly sections!: readonly ResearchNoteSectionDto[];
  readonly actionBuckets!: ResearchActionBucketsDto;
  readonly disconfirmingEvidence!: readonly string[];
  readonly nextFocus!: readonly string[];
}

export class ResearchPositioningDto {
  readonly stockExposure!: string;
  readonly fundExposure!: string;
  readonly cashLevel!: string;
  readonly overallRisk!: 'low' | 'medium' | 'high';
}

export class ResearchThemeExposureDto {
  readonly theme!: string;
  readonly status!: string;
  readonly suggestion!: string;
}

export class ResearchPortfolioReviewDto {
  readonly positioning!: ResearchPositioningDto;
  readonly themeExposures!: readonly ResearchThemeExposureDto[];
  readonly priorities!: readonly string[];
  readonly riskNotes!: readonly string[];
}

export class ResearchStockPositionDto {
  readonly symbol!: string;
  readonly name!: string;
  readonly quantity!: number;
  readonly costPrice!: number;
  readonly theme!: string;
  readonly thesis!: string;
  readonly actionBias!: ResearchAction;
}

export class ResearchFundExposureDto {
  readonly name!: string;
  readonly theme!: string;
  readonly amount!: number;
  readonly weightPercent!: number;
  readonly actionBias!: ResearchAction;
}

export class ResearchStockAccountDto {
  readonly positionLevel!: string;
  readonly positions!: readonly ResearchStockPositionDto[];
}

export class ResearchFundAccountDto {
  readonly totalAssetValue!: number;
  readonly visibleAssetValue!: number;
  readonly exposures!: readonly ResearchFundExposureDto[];
}

export class ResearchActionPolicyDto {
  readonly allowedActions!: readonly ResearchAction[];
  readonly defaultBias!: ResearchAction;
  readonly rules!: readonly string[];
}

export class ResearchPortfolioContextDto {
  readonly owner!: string;
  readonly accountScope!: string;
  readonly stockAccount!: ResearchStockAccountDto;
  readonly fundAccount!: ResearchFundAccountDto;
  readonly watchThemes!: readonly string[];
  readonly riskFlags!: readonly string[];
  readonly actionPolicy!: ResearchActionPolicyDto;
}

export class ResearchFactorBreakdownDto {
  readonly factor!: string;
  readonly signal!: string;
  readonly explanation!: string;
}

export class ResearchIdeaDto {
  readonly symbol!: string;
  readonly name!: string;
  readonly suggestedAction!: ResearchSuggestedAction;
  readonly oneLineThesis!: string;
  readonly factorBreakdown!: readonly ResearchFactorBreakdownDto[];
  readonly risks!: readonly string[];
  readonly triggers!: readonly string[];
}

export class ResearchThesisDto {
  readonly target!: string;
  readonly status!: 'active' | 'watching' | 'closed';
  readonly currentAction!: ResearchAction;
  readonly pillars!: readonly string[];
  readonly risks!: readonly string[];
  readonly disconfirmingEvidence!: readonly string[];
}

export class ResearchCatalystDto {
  readonly date!: string;
  readonly category!: 'earnings' | 'policy' | 'industry' | 'macro' | 'corporate';
  readonly title!: string;
  readonly relatedThemes!: readonly string[];
  readonly impactLevel!: ResearchImpactLevel;
  readonly currentResponse!: string;
}
