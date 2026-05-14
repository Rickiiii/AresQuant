# Phase 5：多因子系统

Phase 5 在 `StrategyModule` 内新增多因子能力，目标是为正式策略体系提供可组合、可测试、无数据库耦合的因子计算与评分基础设施。

## 设计边界

当前多因子系统只负责：

- 因子接口与基础抽象
- 内存 FactorRegistry
- 内置因子计算
- 因子标准化与加权评分
- 正式 `MultiFactorStrategy` 的 TopN 目标仓位生成

当前不负责：

- 不接入实盘系统
- 不实现 `OptimizationService`
- 不引入机器学习能力
- 不重构旧 Backtest
- 不删除旧 Strategy Plugin
- 不依赖数据库或 Prisma

## 目录结构

```text
src/modules/strategy/
  application/
    factor-score.service.ts
    factor-score.service.spec.ts
  domain/
    factors/
      factor.types.ts
      base-factor.ts
      factor-registry.service.ts
      built-in-factor.types.ts
      built-in-factor.utils.ts
      momentum.factor.ts
      volatility.factor.ts
      fundamental-field.factor.ts
      pe.factor.ts
      pb.factor.ts
      roe.factor.ts
      turnover.factor.ts
      index.ts
    strategies/
      multi-factor.strategy.ts
      multi-factor.strategy.spec.ts
```

## Factor 接口

`Factor<TInput, TResult>` 是所有因子的统一接口：

```ts
export interface Factor<TInput extends object = Readonly<Record<string, unknown>>, TResult = unknown> {
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  validateInput(input: TInput): void;
  calculate(input: TInput): Promise<TResult>;
}
```

### BaseFactor

`BaseFactor` 统一管理因子元信息：

- `code`
- `name`
- `version`
- `description`

具体因子只需要实现：

- `validateInput(input)`
- `calculate(input)`

### FactorRegistryService

`FactorRegistryService` 是纯 TypeScript 内存注册表，不依赖 Nest Provider：

```ts
register(factor)
get(code)
list()
exists(code)
```

它用于管理因子实例，并对重复注册、缺失因子进行显式报错。

## 内置因子

当前内置 6 个因子：

| 因子 | code | 方向建议 | 数据来源 |
|---|---|---|---|
| MomentumFactor | `momentum` | 正向 | marketData close |
| VolatilityFactor | `volatility` | 反向 | marketData close |
| PeFactor | `pe` | 反向 | fundamentals.pe |
| PbFactor | `pb` | 反向 | fundamentals.pb |
| RoeFactor | `roe` | 正向 | fundamentals.roe |
| TurnoverFactor | `turnover` | 正向或反向，取决于策略假设 | fundamentals.turnoverRate |

### MomentumFactor

计算窗口内收盘价收益率：

```text
lastClose / firstClose - 1
```

### VolatilityFactor

计算窗口内日收益率标准差：

```text
std(close_t / close_t-1 - 1)
```

### 财务字段因子

`PeFactor`、`PbFactor`、`RoeFactor`、`TurnoverFactor` 复用 `FundamentalFieldFactor`，按证券取最新财务快照字段。

## FactorScoreService

`FactorScoreService` 将多个 `FactorValue` 标准化后加权聚合为 `StrategyScore[]`。

支持标准化方法：

| method | 说明 |
|---|---|
| `rank` | 排名归一化到 0 到 1 |
| `zscore` | 标准分 |
| `minmax` | 最小最大归一化到 0 到 1 |

支持因子方向：

| direction | 说明 |
|---|---|
| `positive` | 数值越大越好 |
| `negative` | 数值越小越好，内部会反向处理 |

支持权重：

```ts
{
  factorCode: 'momentum',
  weight: 0.5,
  direction: 'positive',
}
```

综合评分：

```text
score = Σ normalizedFactorValue * factorWeight
```

输出按：

```text
score desc, securityId asc
```

排序。

## 正式 MultiFactorStrategy

正式策略文件：

```text
src/modules/strategy/domain/strategies/multi-factor.strategy.ts
```

策略 code：

```text
multi-factor
```

配置示例：

```json
{
  "maxPositions": 10,
  "normalizeMethod": "rank",
  "factors": [
    { "factorCode": "momentum", "weight": 0.4, "direction": "positive" },
    { "factorCode": "roe", "weight": 0.3, "direction": "positive" },
    { "factorCode": "pe", "weight": 0.2, "direction": "negative" },
    { "factorCode": "volatility", "weight": 0.1, "direction": "negative" }
  ]
}
```

运行逻辑：

1. 从 `StrategyContext.factorValues` 读取因子值。
2. 按 `universe` 过滤证券。
3. 使用 `FactorScoreService` 计算综合评分。
4. 选择 TopN。
5. 输出等权目标仓位信号。

输出示例：

```json
[
  {
    "securityId": "000001",
    "targetWeight": 0.1,
    "reason": "multi-factor score=0.850000"
  }
]
```

## 与旧 Backtest 的关系

当前新旧策略架构并存：

```text
旧 Backtest
  -> StrategyRegistryService
  -> MultiFactorStrategyPlugin / EqualWeightMockStrategyPlugin

新 Strategy API / StrategyService
  -> EqualWeightStrategy / MomentumTopNStrategy / MultiFactorStrategy
```

Phase 5 没有修改旧 Backtest 调用链。旧 Backtest 仍继续使用旧 `StrategyRegistryService` 和旧 Plugin。

## 测试覆盖

新增测试包括：

- `base-factor.spec.ts`
- `factor-registry.service.spec.ts`
- `built-in-factors.spec.ts`
- `factor-score.service.spec.ts`
- `multi-factor.strategy.spec.ts`

当前全量测试通过：

```text
Test Suites: 27 passed, 27 total
Tests: 74 passed, 74 total
```
