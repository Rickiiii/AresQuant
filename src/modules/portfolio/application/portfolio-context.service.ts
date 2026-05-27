import { Inject, Injectable } from '@nestjs/common';
import {
  PORTFOLIO_CONTEXT_REPOSITORY,
  type PortfolioContextRepository,
} from '../domain/portfolio.repositories';
import type { PortfolioContextRecord, PortfolioThemeExposureRecord } from '../domain/portfolio.types';
import type { PortfolioContextDto } from '../presentation/dto/portfolio-context.dto';

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

const RICKI_PORTFOLIO_SEED: PortfolioContextRecord = {
  account: {
    id: 'ricki-primary',
    owner: 'Ricki',
    name: 'A 股账户 + 可见基金持仓',
    accountType: 'mixed',
    totalAssetValue: 141737,
    visibleAssetValue: 135386,
    cashAmount: 6351,
    positionLevel: '半仓不到',
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
      marketValue: null,
      unrealizedPnl: null,
      themeTags: ['机器人', '新材料', '磁材'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '物理 AI 与机器人链条观察标的，后续需要用行情强弱和主题延续性验证。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '601689',
      name: '拓普集团',
      quantity: 200,
      costPrice: 69.62,
      latestPrice: null,
      marketValue: null,
      unrealizedPnl: null,
      themeTags: ['机器人', '汽车零部件'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '机器人和智能汽车弹性方向，重点跟踪主题拥挤度与趋势质量。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '002031',
      name: '巨轮智能',
      quantity: 1500,
      costPrice: 8.37,
      latestPrice: null,
      marketValue: null,
      unrealizedPnl: null,
      themeTags: ['机器人', '智能装备'],
      riskLevel: 'high',
      actionBias: 'watch',
      thesis: '高弹性机器人方向，适合用风控条件约束，不宜无信号追高。',
    },
    {
      accountId: 'ricki-primary',
      symbol: '002714',
      name: '牧原股份',
      quantity: 100,
      costPrice: 44.67,
      latestPrice: null,
      marketValue: null,
      unrealizedPnl: null,
      themeTags: ['消费', '农牧周期'],
      riskLevel: 'medium',
      actionBias: 'hold',
      thesis: '非 AI 主线的周期/消费平衡仓，关注猪周期和组合分散价值。',
    },
  ],
  fundHoldings: [
    { accountId: 'ricki-primary', fundCode: null, name: '纳指100', theme: '海外科技', amount: 33910, weightPercent: 23.93, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: null, name: '通信设备', theme: '通信设备 / CPO', amount: 21137, weightPercent: 14.91, riskLevel: 'medium', actionBias: 'watch' },
    { accountId: 'ricki-primary', fundCode: null, name: '数字经济 / 大科技', theme: '数字经济 / 大科技', amount: 19320, weightPercent: 13.63, riskLevel: 'medium', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: null, name: '黄金', theme: '黄金 / 避险', amount: 16017, weightPercent: 11.3, riskLevel: 'low', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: null, name: '中证1000', theme: '小盘风格', amount: 14516, weightPercent: 10.24, riskLevel: 'medium', actionBias: 'watch' },
    { accountId: 'ricki-primary', fundCode: null, name: '人工智能', theme: 'AI / 人工智能', amount: 13301, weightPercent: 9.38, riskLevel: 'medium', actionBias: 'watch' },
    { accountId: 'ricki-primary', fundCode: null, name: '绿电', theme: '绿电 / 新能源', amount: 8960, weightPercent: 6.32, riskLevel: 'medium', actionBias: 'risk_control' },
    { accountId: 'ricki-primary', fundCode: null, name: '消费', theme: '消费', amount: 2747, weightPercent: 1.94, riskLevel: 'medium', actionBias: 'watch' },
    { accountId: 'ricki-primary', fundCode: null, name: '恒生科技', theme: '港股科技', amount: 2307, weightPercent: 1.63, riskLevel: 'medium', actionBias: 'watch' },
    { accountId: 'ricki-primary', fundCode: null, name: '全球精选', theme: '全球权益', amount: 2029, weightPercent: 1.43, riskLevel: 'low', actionBias: 'hold' },
    { accountId: 'ricki-primary', fundCode: null, name: '标普500', theme: '海外宽基', amount: 1142, weightPercent: 0.81, riskLevel: 'low', actionBias: 'hold' },
  ],
  themeExposures: [
    { accountId: 'ricki-primary', theme: '海外科技', source: 'fund', amount: 33910, weightPercent: 23.93, actionBias: 'hold', riskNote: '纳指100为最大单一基金暴露，和 A 股大科技方向存在风格同向。', nextStep: '若海外科技继续强势可持有；若高位波动放大，优先观察而非追加。' },
    { accountId: 'ricki-primary', theme: '通信设备 / CPO', source: 'fund', amount: 21137, weightPercent: 14.91, actionBias: 'watch', riskNote: '通信设备暴露较高，和 AI 算力链条相关度强。', nextStep: '等待主题强度确认；冲高时关注止盈节奏，回踩不破再考虑分批。' },
    { accountId: 'ricki-primary', theme: 'AI / 人工智能', source: 'fund', amount: 13301, weightPercent: 9.38, actionBias: 'watch', riskNote: '与数字经济、大科技、通信设备存在交叉暴露。', nextStep: '优先结合 AI ETF 和机器人观察池，避免同主题重复追高。' },
    { accountId: 'ricki-primary', theme: '机器人 / 物理 AI', source: 'stock', amount: null, weightPercent: null, actionBias: 'watch', riskNote: '股票侧 600366、601689、002031 均与机器人/物理 AI 相关，弹性和波动同步放大。', nextStep: '后续接入实时价格后计算股票侧实际权重，再决定继续持有、分批或风控。' },
    { accountId: 'ricki-primary', theme: '黄金 / 避险', source: 'fund', amount: 16017, weightPercent: 11.3, actionBias: 'hold', riskNote: '黄金可平衡科技成长高波动，但不应替代权益仓位判断。', nextStep: '作为组合稳定器持有，若风险偏好显著回升再评估止盈。' },
    { accountId: 'ricki-primary', theme: '绿电 / 新能源', source: 'fund', amount: 8960, weightPercent: 6.32, actionBias: 'risk_control', riskNote: '当前暴露不高但趋势和催化优先级偏低。', nextStep: '暂不加仓，等待趋势修复或明确政策/产业催化。' },
  ],
  watchlistItems: [
    { accountId: 'ricki-primary', symbol: null, name: '物理 AI', theme: '物理 AI', reason: '核心观察主题，等待强弱和回踩质量确认。', actionBias: 'watch' },
    { accountId: 'ricki-primary', symbol: null, name: '机器人', theme: '机器人 / 物理 AI', reason: '股票侧已有暴露，后续用风控条件约束加仓。', actionBias: 'watch' },
    { accountId: 'ricki-primary', symbol: null, name: 'AI ETF', theme: 'AI / 人工智能', reason: '避免个股波动时的主题替代观察。', actionBias: 'watch' },
    { accountId: 'ricki-primary', symbol: null, name: '通信设备 / CPO', theme: '通信设备 / CPO', reason: '基金侧已有较高暴露，适合观察止盈和回踩。', actionBias: 'watch' },
    { accountId: 'ricki-primary', symbol: null, name: '黄金', theme: '黄金 / 避险', reason: '组合稳定器。', actionBias: 'hold' },
    { accountId: 'ricki-primary', symbol: null, name: '中证1000', theme: '小盘风格', reason: '风格切换观察。', actionBias: 'watch' },
    { accountId: 'ricki-primary', symbol: null, name: '绿电', theme: '绿电 / 新能源', reason: '等待趋势或催化修复。', actionBias: 'risk_control' },
    { accountId: 'ricki-primary', symbol: null, name: '恒生科技', theme: '港股科技', reason: '港股科技映射观察。', actionBias: 'watch' },
  ],
};
