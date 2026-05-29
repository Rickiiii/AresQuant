import { Inject, Injectable } from '@nestjs/common';
import {
  PORTFOLIO_CONTEXT_REPOSITORY,
  type PortfolioContextRepository,
} from '../domain/portfolio.repositories';
import type { PortfolioContextRecord, PortfolioThemeExposureRecord } from '../domain/portfolio.types';
import type { PortfolioContextDto, UpsertPortfolioFundHoldingDto, UpsertPortfolioStockHoldingDto } from '../presentation/dto/portfolio-context.dto';

const ALLOWED_ACTIONS = ['hold', 'add', 'build', 'watch', 'take_profit', 'risk_control'] as const;

@Injectable()
export class PortfolioContextService {
  constructor(
    @Inject(PORTFOLIO_CONTEXT_REPOSITORY)
    private readonly repository: PortfolioContextRepository,
  ) {}

  async getContext(owner = 'Ricki'): Promise<PortfolioContextDto | null> {
    const record = await this.repository.findPrimaryContext(owner);
    if (record === null) {
      return null;
    }

    return toPortfolioContext(record);
  }

  async seedRickiContext(): Promise<PortfolioContextDto> {
    const record = await this.repository.upsertPrimaryContext(RICKI_PORTFOLIO_SEED);
    return toPortfolioContext(record);
  }

  async upsertStockHolding(input: UpsertPortfolioStockHoldingDto, owner = 'Ricki'): Promise<PortfolioContextDto> {
    const current = await this.loadEditableContext(owner);
    const holding = {
      accountId: current.account.id,
      symbol: input.symbol,
      name: input.name,
      quantity: input.quantity,
      costPrice: input.costPrice,
      latestPrice: input.latestPrice ?? null,
      marketValue: roundMoney(input.quantity * (input.latestPrice ?? input.costPrice)),
      unrealizedPnl: input.latestPrice === undefined || input.latestPrice === null ? null : roundMoney((input.latestPrice - input.costPrice) * input.quantity),
      themeTags: input.themeTags?.length === undefined || input.themeTags.length === 0 ? splitTheme(input.theme) : input.themeTags,
      riskLevel: 'medium' as const,
      actionBias: input.actionBias ?? 'watch',
      thesis: input.thesis ?? `${input.theme} 方向持仓，等待后续投研复盘补充核心逻辑。`,
    };
    const next = replaceBy(current.stockHoldings, holding, (item) => item.symbol === holding.symbol);
    const record = await this.repository.upsertPrimaryContext({
      ...current,
      stockHoldings: next,
      themeExposures: upsertThemeExposure(current.themeExposures, {
        accountId: current.account.id,
        theme: input.theme,
        source: 'stock',
        amount: holding.marketValue,
        weightPercent: null,
        actionBias: holding.actionBias,
        riskNote: '股票持仓暴露来自组合维护入口，需结合行情趋势和反证条件复核。',
        nextStep: '在投研中心补充持仓 thesis，并观察主题强弱是否延续。',
      }),
    });
    return toPortfolioContext(record);
  }

  async upsertFundHolding(input: UpsertPortfolioFundHoldingDto, owner = 'Ricki'): Promise<PortfolioContextDto> {
    const current = await this.loadEditableContext(owner);
    const existingFundHoldings = current.fundHoldings.filter((holding) => !(holding.name === input.name && holding.theme === input.theme));
    const visibleAssetValue = current.account.visibleAssetValue ?? current.fundHoldings.reduce((sum, holding) => sum + holding.amount, 0);
    const inferredWeight = visibleAssetValue > 0 ? roundMoney((input.amount / visibleAssetValue) * 100) : 0;
    const holding = {
      accountId: current.account.id,
      fundCode: input.fundCode ?? null,
      name: input.name,
      theme: input.theme,
      amount: input.amount,
      weightPercent: input.weightPercent ?? inferredWeight,
      riskLevel: 'medium' as const,
      actionBias: input.actionBias ?? 'watch',
    };
    const record = await this.repository.upsertPrimaryContext({
      ...current,
      fundHoldings: [...existingFundHoldings, holding],
      themeExposures: upsertThemeExposure(current.themeExposures, {
        accountId: current.account.id,
        theme: input.theme,
        source: 'fund',
        amount: input.amount,
        weightPercent: holding.weightPercent,
        actionBias: holding.actionBias,
        riskNote: '基金暴露来自组合维护入口，需关注是否和已有科技、主题仓位形成同向集中。',
        nextStep: '结合主题强弱和组合集中度决定持有、分批或风控。',
      }),
    });
    return toPortfolioContext(record);
  }

  private async loadEditableContext(owner: string): Promise<PortfolioContextRecord> {
    const current = await this.repository.findPrimaryContext(owner);
    if (current !== null) {
      return current;
    }
    return {
      ...RICKI_PORTFOLIO_SEED,
      account: {
        ...RICKI_PORTFOLIO_SEED.account,
        owner,
      },
    };
  }
}

function toPortfolioContext(record: PortfolioContextRecord): PortfolioContextDto {
  const stockCostValue = roundMoney(record.stockHoldings.reduce((sum, holding) => sum + holding.quantity * holding.costPrice, 0));
  const stockMarketValue = roundMoney(record.stockHoldings.reduce((sum, holding) => sum + (holding.marketValue ?? holding.quantity * (holding.latestPrice ?? holding.costPrice)), 0));
  const fundVisibleValue = record.account.visibleAssetValue ?? roundMoney(record.fundHoldings.reduce((sum, holding) => sum + holding.amount, 0));
  const cashAmount = record.account.cashAmount ?? 0;
  const topThemeWeightPercent = maxThemeWeight(record.themeExposures);

  return {
    owner: record.account.owner,
    accountScope: record.account.name,
    stockAccount: {
      positionLevel: record.account.positionLevel ?? '待确认',
      positions: record.stockHoldings.map((holding) => ({
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        costPrice: holding.costPrice,
        latestPrice: holding.latestPrice,
        marketValue: holding.marketValue,
        unrealizedPnl: holding.unrealizedPnl,
        theme: holding.themeTags.join(' / '),
        themeTags: holding.themeTags,
        thesis: holding.thesis,
        actionBias: holding.actionBias,
      })),
    },
    fundAccount: {
      totalAssetValue: record.account.totalAssetValue ?? fundVisibleValue + cashAmount,
      visibleAssetValue: fundVisibleValue,
      exposures: record.fundHoldings.map((holding) => ({
        fundCode: holding.fundCode,
        name: holding.name,
        theme: holding.theme,
        amount: holding.amount,
        weightPercent: holding.weightPercent,
        actionBias: holding.actionBias,
      })),
    },
    themeExposures: record.themeExposures.map((exposure) => ({
      theme: exposure.theme,
      source: exposure.source,
      amount: exposure.amount,
      weightPercent: exposure.weightPercent,
      actionBias: exposure.actionBias,
      riskNote: exposure.riskNote,
      nextStep: exposure.nextStep,
    })),
    allocation: {
      stockCostValue,
      stockMarketValue,
      fundVisibleValue,
      estimatedTotalValue: roundMoney(stockMarketValue + fundVisibleValue),
      cashAmount,
      topThemeWeightPercent,
    },
    watchThemes: unique([
      ...record.fundHoldings.map((item) => item.theme),
      ...record.themeExposures.map((item) => item.theme),
      ...record.watchlistItems.map((item) => item.theme),
    ]),
    riskFlags: buildRiskFlags(record.themeExposures),
    actionPolicy: {
      allowedActions: ALLOWED_ACTIONS,
      defaultBias: 'watch',
      rules: [
        '没有真实行情和主题强弱确认前，默认观察，不主动追高。',
        '加仓动作必须同时检查主题集中度、现金缓冲和反证条件。',
        '高风险主题连续走弱时优先进入 risk_control。',
      ],
    },
  };
}

function maxThemeWeight(exposures: readonly PortfolioThemeExposureRecord[]): number | null {
  const weights = exposures
    .map((exposure) => exposure.weightPercent)
    .filter((value): value is number => value !== null);
  return weights.length === 0 ? null : Math.max(...weights);
}

function buildRiskFlags(exposures: readonly PortfolioThemeExposureRecord[]): readonly string[] {
  return exposures
    .filter((exposure) => exposure.riskNote.length > 0)
    .map((exposure) => `${exposure.theme}: ${exposure.riskNote}`);
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function splitTheme(theme: string): readonly string[] {
  return theme.split('/').map((item) => item.trim()).filter(Boolean);
}

function replaceBy<T>(items: readonly T[], nextItem: T, isMatch: (item: T) => boolean): readonly T[] {
  const next = items.filter((item) => !isMatch(item));
  return [...next, nextItem];
}

function upsertThemeExposure(
  exposures: readonly PortfolioThemeExposureRecord[],
  nextExposure: PortfolioThemeExposureRecord,
): readonly PortfolioThemeExposureRecord[] {
  return replaceBy(exposures, nextExposure, (item) => item.theme === nextExposure.theme && item.source === nextExposure.source);
}

const RICKI_PORTFOLIO_SEED: PortfolioContextRecord = {
  account: {
    id: 'ricki-primary',
    owner: 'Ricki',
    name: 'A 股账户 + 可见基金持仓',
    accountType: 'mixed',
    totalAssetValue: 206994.69,
    visibleAssetValue: 137386,
    cashAmount: 0,
    positionLevel: '股票约三成，基金为主',
    isPrimary: true,
  },
  stockHoldings: [
    {
      accountId: 'ricki-primary',
      symbol: '600366',
      name: '宁波韵升',
      quantity: 800,
      costPrice: 13.47,
      latestPrice: null,
      marketValue: 10776,
      unrealizedPnl: null,
      themeTags: ['稀土永磁', '电机材料'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '稀土永磁/电机材料方向长期持有，关注电机材料需求与稀土价格周期。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '601689',
      name: '拓普集团',
      quantity: 200,
      costPrice: 69.62,
      latestPrice: null,
      marketValue: 13924,
      unrealizedPnl: null,
      themeTags: ['物理AI', '机器人执行器', '智能车'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '物理AI/机器人执行器/智能车方向长期持有，关注机器人执行器与智能车业务兑现。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '002031',
      name: '巨轮智能',
      quantity: 2100,
      costPrice: 8.1329,
      latestPrice: null,
      marketValue: 17079.09,
      unrealizedPnl: null,
      themeTags: ['机器人', '工业母机高弹性'],
      riskLevel: 'high',
      actionBias: 'hold',
      thesis: '机器人/工业母机高弹性方向长期持有，重点控制高波动仓位风险。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '002714',
      name: '牧原股份',
      quantity: 100,
      costPrice: 44.67,
      latestPrice: null,
      marketValue: 4467,
      unrealizedPnl: null,
      themeTags: ['生猪养殖', '农业'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '生猪养殖/农业方向长期持有，用于组合周期分散。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '603005',
      name: '晶方科技',
      quantity: 200,
      costPrice: 38.397,
      latestPrice: null,
      marketValue: 7679.4,
      unrealizedPnl: null,
      themeTags: ['半导体封测', 'CIS封装'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '半导体封测/CIS封装方向长期持有，关注国产替代和消费电子景气度。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '560710',
      name: '船舶ETF',
      quantity: 6400,
      costPrice: 1.013,
      latestPrice: null,
      marketValue: 6483.2,
      unrealizedPnl: null,
      themeTags: ['船舶军工', '高端装备'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '船舶军工/高端装备方向长期持有，关注军工订单和高端装备周期。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '002050',
      name: '三花智控',
      quantity: 200,
      costPrice: 46,
      latestPrice: null,
      marketValue: 9200,
      unrealizedPnl: null,
      themeTags: ['新能源车热管理', '物理AI机器人'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '新能源车热管理/物理AI机器人方向长期持有，关注机器人零部件和热管理业务。',
    },
  ],
  fundHoldings: [
    { accountId: 'ricki-primary', fundCode: 'NASDAQ100', name: '纳指100', theme: '美股科技/QDII', amount: 33910, weightPercent: 24.68, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'COMMUNICATION', name: '通信设备', theme: '通信设备/光模块/AI算力链', amount: 21137, weightPercent: 15.39, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'DIGITAL_ECONOMY', name: '数字经济', theme: '数字经济/大科技', amount: 19320, weightPercent: 14.06, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'GOLD', name: '黄金', theme: '黄金/避险资产', amount: 16017, weightPercent: 11.66, riskLevel: 'low', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'CSI1000', name: '中证1000', theme: 'A股小盘宽基', amount: 14516, weightPercent: 10.57, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'AI', name: '人工智能', theme: '人工智能/AI应用', amount: 13301, weightPercent: 9.68, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'GREEN_POWER', name: '绿电', theme: '新能源/绿电', amount: 8960, weightPercent: 6.52, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'CONSUMPTION', name: '消费', theme: '消费复苏', amount: 2747, weightPercent: 2, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'HSTECH', name: '恒生科技', theme: '港股科技/恒生科技', amount: 4307, weightPercent: 3.13, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'GLOBAL_SELECT', name: '全球精选', theme: '全球权益', amount: 2029, weightPercent: 1.48, riskLevel: 'low', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: 'SP500', name: '标普500', theme: '美股宽基/QDII', amount: 1142, weightPercent: 0.83, riskLevel: 'low', actionBias: 'hold' },
  ],
  themeExposures: [
    { accountId: 'ricki-primary', theme: '美股科技/QDII', source: 'fund', amount: 33910, weightPercent: 24.68, actionBias: 'hold', riskNote: '纳指100为最大单一基金暴露，和 AI/大科技方向存在同向波动。', nextStep: '长期持有，重点观察美股科技估值和汇率扰动。' },
    { accountId: 'ricki-primary', theme: '通信设备/光模块/AI算力链', source: 'fund', amount: 21137, weightPercent: 15.39, actionBias: 'hold', riskNote: '通信设备和 AI 算力链暴露较高，和人工智能基金存在交叉。', nextStep: '长期持有，若 AI 算力链拥挤回落，优先观察组合集中度。' },
    { accountId: 'ricki-primary', theme: '数字经济/大科技', source: 'fund', amount: 19320, weightPercent: 14.06, actionBias: 'hold', riskNote: '数字经济与美股科技、AI 应用存在风格相关。', nextStep: '长期持有，结合主题强弱决定是否保持现有暴露。' },
    { accountId: 'ricki-primary', theme: '机器人/物理AI', source: 'stock', amount: 40203.09, weightPercent: 19.42, actionBias: 'hold', riskNote: '拓普集团、巨轮智能、三花智控均与机器人/物理 AI 相关，弹性和波动同步放大。', nextStep: '长期持有，但需重点跟踪主题拥挤和回撤风险。' },
    { accountId: 'ricki-primary', theme: '黄金/避险资产', source: 'fund', amount: 16017, weightPercent: 11.66, actionBias: 'hold', riskNote: '黄金用于平衡科技成长高波动。', nextStep: '长期持有，风险偏好显著回升时再评估权重。' },
    { accountId: 'ricki-primary', theme: '半导体封测/CIS封装', source: 'stock', amount: 7679.4, weightPercent: 3.71, actionBias: 'hold', riskNote: '半导体封测方向弹性较高，受消费电子和国产替代预期影响。', nextStep: '长期持有，关注产业景气和个股趋势。' },
    { accountId: 'ricki-primary', theme: '船舶军工/高端装备', source: 'stock', amount: 6483.2, weightPercent: 3.13, actionBias: 'hold', riskNote: 'ETF 分散度较好，但军工高端装备仍受主题波动影响。', nextStep: '长期持有，观察军工订单和板块趋势。' },
    { accountId: 'ricki-primary', theme: '新能源/绿电', source: 'fund', amount: 8960, weightPercent: 6.52, actionBias: 'hold', riskNote: '新能源/绿电当前处在修复观察区。', nextStep: '长期持有，等待趋势修复或明确产业催化。' },
  ],
  watchlistItems: [
    { accountId: 'ricki-primary', symbol: null, name: '物理 AI', theme: '机器人/物理AI', reason: '股票侧已有拓普集团、巨轮智能、三花智控暴露，重点跟踪主题拥挤度。', actionBias: 'hold' },
    { accountId: 'ricki-primary', symbol: null, name: '通信设备/光模块', theme: '通信设备/光模块/AI算力链', reason: '基金侧已有较高暴露，适合观察 AI 算力链持续性。', actionBias: 'hold' },
    { accountId: 'ricki-primary', symbol: null, name: '半导体封测', theme: '半导体封测/CIS封装', reason: '晶方科技对应方向，关注国产替代和消费电子复苏。', actionBias: 'hold' },
    { accountId: 'ricki-primary', symbol: null, name: '船舶军工', theme: '船舶军工/高端装备', reason: '船舶ETF 对应方向，观察军工高端装备景气。', actionBias: 'hold' },
    { accountId: 'ricki-primary', symbol: null, name: '黄金', theme: '黄金/避险资产', reason: '组合稳定器。', actionBias: 'hold' },
    { accountId: 'ricki-primary', symbol: null, name: '中证1000', theme: 'A股小盘宽基', reason: '风格切换观察。', actionBias: 'hold' },
    { accountId: 'ricki-primary', symbol: null, name: '绿电', theme: '新能源/绿电', reason: '等待趋势或催化修复。', actionBias: 'hold' },
    { accountId: 'ricki-primary', symbol: null, name: '恒生科技', theme: '港股科技/恒生科技', reason: '港股科技映射观察。', actionBias: 'hold' },
  ],
};
