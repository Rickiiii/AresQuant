# Phase 5：Strategy API

Phase 5 在 `StrategyModule` 中新增正式 Strategy API，用于查询策略、校验策略配置和生成策略目标仓位信号。

## 设计边界

Strategy API 当前只面向策略管理和策略信号生成：

- 查询已注册策略
- 查询单个策略元信息
- 校验策略配置
- 根据输入上下文生成目标仓位信号

当前不做：

- 不触发真实交易
- 不创建订单
- 不接入 Broker Gateway
- 不接入 QMT / PTrade
- 不实现模拟盘每日任务
- 不实现参数优化或机器学习
- 不替换旧 Backtest 调用链

## 注册策略

当前 `StrategyService` 中注册的新策略：

| code | 策略 |
|---|---|
| `equal-weight` | EqualWeightStrategy |
| `momentum-top-n` | MomentumTopNStrategy |
| `multi-factor` | MultiFactorStrategy |

旧 Backtest 仍使用旧：

| code | Plugin |
|---|---|
| `multi_factor` | MultiFactorStrategyPlugin |
| `equal_weight_mock` | EqualWeightMockStrategyPlugin |

注意：`multi-factor` 是正式新策略 code，`multi_factor` 是旧 Plugin code，两者刻意并存。

## API 列表

### GET /strategies

查询所有正式策略。

响应示例：

```json
{
  "success": true,
  "data": [
    {
      "code": "equal-weight",
      "name": "Equal Weight Strategy",
      "version": "1.0.0"
    },
    {
      "code": "momentum-top-n",
      "name": "Momentum Top-N Strategy",
      "version": "1.0.0"
    },
    {
      "code": "multi-factor",
      "name": "Multi-Factor Strategy",
      "version": "1.0.0"
    }
  ],
  "timestamp": "2026-05-14T00:00:00.000Z"
}
```

### GET /strategies/:name

查询单个策略元信息。

示例：

```http
GET /strategies/multi-factor
```

响应：

```json
{
  "success": true,
  "data": {
    "code": "multi-factor",
    "name": "Multi-Factor Strategy",
    "version": "1.0.0",
    "description": "Weighted multi-factor Top-N stock selection strategy."
  },
  "timestamp": "2026-05-14T00:00:00.000Z"
}
```

### POST /strategies/:name/validate-config

校验策略配置。

示例：

```http
POST /strategies/multi-factor/validate-config
Content-Type: application/json
```

请求体：

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

响应：

```json
{
  "success": true,
  "data": {
    "valid": true
  },
  "timestamp": "2026-05-14T00:00:00.000Z"
}
```

### POST /strategies/:name/signals

生成策略目标仓位信号。

示例：

```http
POST /strategies/multi-factor/signals
Content-Type: application/json
```

请求体：

```json
{
  "tradeDate": "2026-05-14",
  "rebalanceFrom": "2026-05-01",
  "rebalanceTo": "2026-05-14",
  "universe": ["000001", "000002", "000003"],
  "maxPositions": 2,
  "normalizeMethod": "rank",
  "factors": [
    { "factorCode": "momentum", "weight": 0.7, "direction": "positive" },
    { "factorCode": "pe", "weight": 0.3, "direction": "negative" }
  ],
  "factorValues": [
    { "securityId": "000001", "factorCode": "momentum", "value": 0.2, "tradeDate": "2026-05-14" },
    { "securityId": "000002", "factorCode": "momentum", "value": 0.1, "tradeDate": "2026-05-14" },
    { "securityId": "000003", "factorCode": "momentum", "value": -0.1, "tradeDate": "2026-05-14" },
    { "securityId": "000001", "factorCode": "pe", "value": 20, "tradeDate": "2026-05-14" },
    { "securityId": "000002", "factorCode": "pe", "value": 10, "tradeDate": "2026-05-14" },
    { "securityId": "000003", "factorCode": "pe", "value": 30, "tradeDate": "2026-05-14" }
  ]
}
```

响应：

```json
{
  "success": true,
  "data": [
    {
      "securityId": "000001",
      "targetWeight": 0.5,
      "reason": "multi-factor score=0.850000"
    },
    {
      "securityId": "000002",
      "targetWeight": 0.5,
      "reason": "multi-factor score=0.650000"
    }
  ],
  "timestamp": "2026-05-14T00:00:00.000Z"
}
```

## DTO 校验

DTO 文件：

```text
src/modules/strategy/presentation/dto/strategy-api.dto.ts
```

主要校验：

| 字段 | 校验 |
|---|---|
| `maxPositions` | number，最小值 1 |
| `normalizeMethod` | `rank` / `zscore` / `minmax` |
| `factors` | nested array |
| `factorCode` | string |
| `weight` | number，最小值 0 |
| `direction` | `positive` / `negative` |
| `tradeDate` | ISO date string |
| `rebalanceFrom` | ISO date string |
| `rebalanceTo` | ISO date string |
| `universe` | string array |
| `factorValues` | nested array |
| `momentumScores` | nested array |

Swagger 注解已覆盖 Controller 和 DTO：

- `@ApiTags`
- `@ApiOperation`
- `@ApiParam`
- `@ApiBody`
- `@ApiOkResponse`
- `@ApiProperty`
- `@ApiPropertyOptional`

## 测试覆盖

Strategy API 相关测试：

```text
src/modules/strategy/presentation/strategy.controller.e2e-spec.ts
src/modules/strategy/presentation/dto/strategy-api.dto.spec.ts
```

覆盖：

- 策略列表查询
- 单策略查询
- 策略配置校验
- 策略信号生成
- DTO 合法请求
- DTO 非法请求
- nested factor 校验

## 与 Backtest 的关系

Phase 5 没有改动旧 Backtest。

当前关系：

```text
Strategy API
  -> StrategyService
  -> EqualWeightStrategy / MomentumTopNStrategy / MultiFactorStrategy

BacktestEngine
  -> StrategyRegistryService
  -> MultiFactorStrategyPlugin / EqualWeightMockStrategyPlugin
```

后续如果需要让 Backtest 使用正式 `multi-factor`，应作为独立 Phase 处理，并保留旧 `strategyName` 兼容逻辑。
