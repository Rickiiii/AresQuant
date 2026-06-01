# Phase 10 Step 1：Portfolio Context 数据模型

> 范围边界：本阶段只建立 Ricki 个人持仓上下文的数据模型和设计文档，不实现实盘交易、不接 Broker/QMT/PTrade、不做自动下单、不引入 OptimizationService 或机器学习系统。

## 1. 目标

Portfolio Context 的目标是把当前硬编码在 `ResearchService` 里的股票持仓、基金暴露、主题标签和操作倾向沉淀为数据库中的个人投资上下文。

完成后，AresQuant 后续可以围绕同一个 source of truth 输出：

- 14:30 盘中复盘
- Portfolio Review
- Theme Exposure
- Thesis Tracker
- Idea Board
- Watchlist

## 2. 第一版使用场景

### 2.1 每个工作日打开 Dashboard

系统读取 Portfolio Context，回答：

```text
我现在持有哪些股票和基金？
股票/基金/现金占比大概是多少？
AI、机器人、通信设备、黄金、绿电等主题暴露分别有多少？
哪些仓位适合继续持有、分批建仓、观察、止盈或风控？
```

### 2.2 14:30 盘中复盘

Daily Note Engine 使用 Portfolio Context 作为输入：

```text
portfolioContext + marketSnapshot + themeStrength + previousNote
  -> dailyNote
```

每条建议都必须能追溯到具体持仓、主题暴露和风控条件。

### 2.3 用户手动维护

第一版先支持本地个人手动维护，不做复杂导入：

- 更新股票数量和成本
- 更新基金暴露金额
- 更新主题标签
- 更新 actionBias / riskLevel
- 更新 thesisSummary

## 3. Prisma 模型

本阶段在 `prisma/schema.prisma` 中新增以下枚举：

```prisma
enum PortfolioAccountType {
  STOCK
  FUND
  MIXED
}

enum PortfolioActionBias {
  HOLD
  ADD
  BUILD
  WATCH
  TAKE_PROFIT
  RISK_CONTROL
}

enum PortfolioRiskLevel {
  LOW
  MEDIUM
  HIGH
}
```

新增以下模型：

```text
PortfolioAccount
PortfolioPosition
PortfolioFundExposure
PortfolioThemeTag
PortfolioWatchTheme
```

## 4. 模型职责

### 4.1 PortfolioAccount

账户级上下文。

字段重点：

- `name`：账户名称，例如 `Ricki A股账户`、`Ricki 基金账户`
- `accountType`：`STOCK` / `FUND` / `MIXED`
- `totalAssetValue`：账户总资产，可为空
- `cashValue`：现金，可为空
- `visibleAssetValue`：可见资产，用于基金截图等不完整数据
- `isDefault`：后续 Research 默认读取的账户

### 4.2 PortfolioPosition

股票持仓。

字段重点：

- `symbol`
- `name`
- `quantity`
- `costPrice`
- `latestPrice`
- `marketValue`
- `unrealizedPnl`
- `themeTags`
- `thesisSummary`
- `actionBias`
- `riskLevel`

当前 Ricki 股票持仓应能表达：

```text
600366 800 @ 13.47
601689 200 @ 69.62
002031 2100 @ 8.1329
002714 100 @ 44.67
603005 300 @ 38.397
```

### 4.3 PortfolioFundExposure

基金/ETF/主题暴露。

字段重点：

- `name`
- `fundCode`
- `theme`
- `amount`
- `weightPercent`
- `actionBias`
- `riskLevel`

当前基金截图暴露应能表达：

```text
纳指100
通信设备
数字经济 / 大科技
黄金
中证1000
人工智能
绿电
消费
恒生科技
全球精选
标普500
```

### 4.4 PortfolioThemeTag

主题标签字典。

用途：

- 统一主题命名
- 避免前端/后端/Research 文案到处写不同名字
- 为后续 Theme Strength 服务提供主题维度

示例：

```text
AI / 人工智能
机器人 / 物理 AI
通信设备 / CPO
AI 硬件 / 半导体
黄金 / 避险
绿电 / 新能源
中证1000 / 小盘风格
海外科技
港股科技
```

### 4.5 PortfolioWatchTheme

用户重点观察主题。

用途：

- Daily Note 的主题强弱检查范围
- Dashboard Research Center 的主题卡片
- Idea Engine 的候选池入口

## 5. 第一版 API 规划

Step 2 已实现最小只读 API：

```http
GET /portfolio/context
GET /portfolio/positions
GET /portfolio/fund-exposures
```

第一版行为：

1. 优先读取数据库里的默认 `PortfolioAccount` 及其 `positions`、`fundExposures`、`watchThemes`。
2. 如果数据库没有默认账户，回退到 Ricki 当前静态 fallback 持仓上下文，保证新环境仍可预览。
3. Decimal / money 字段对外序列化为字符串，避免前端精度问题。

后续编辑类 API 暂未实现，建议下一步再做：

```http
PUT /portfolio/context
POST /portfolio/positions
PATCH /portfolio/positions/:id
DELETE /portfolio/positions/:id
POST /portfolio/fund-exposures
PATCH /portfolio/fund-exposures/:id
DELETE /portfolio/fund-exposures/:id
```

## 6. ResearchModule 集成

Step 3 已完成 `ResearchService` 与 `PortfolioService` 的只读集成：

```text
1. ResearchService 注入 PortfolioService
2. PortfolioService 优先读取数据库默认账户
3. 数据库为空时使用 fallback portfolio context
4. Daily Note / Portfolio Context / Theme Exposure / Portfolio Review 基于同一个 Portfolio Context 生成
```

这样可以保证：

- 新装项目仍能预览 UI
- Ricki 更新数据库持仓后 Research Center 自动使用新数据
- 后续 14:30 复盘有一致的数据入口
- Research 模块不再维护另一份股票/基金持仓硬编码 source of truth

## 7. 验收标准

Step 1 完成标准：

- `prisma/schema.prisma` 包含 Portfolio Context 相关枚举和模型
- `docs/portfolio-context.md` 说明模型职责、使用场景和下一步 API
- `prisma validate` 通过
- `prisma generate` 通过
- 不影响现有 Research / Dashboard / Backtest / Strategy 测试

Step 2 完成标准：

- 新增 `PortfolioModule`、`PortfolioService`、`PortfolioController` 和 DTO
- `GET /portfolio/context`、`GET /portfolio/positions`、`GET /portfolio/fund-exposures` 可返回标准 `ApiResponse`
- 数据库为空时返回 fallback portfolio context
- 数据库存在默认账户时优先返回数据库数据
- money / Decimal 字段对外返回字符串

Step 3 完成标准：

- `ResearchModule` 导入 `PortfolioModule`
- `ResearchService` 通过 `PortfolioService.getContext()` 获取组合上下文
- `/research/daily-note`、`/research/portfolio-context`、`/research/theme-exposures`、`/research/portfolio-review` 基于 Portfolio Context 生成
- Portfolio 数据库为空时仍保持现有 fallback 行为和 UI 预览能力

## 8. 暂不做

- 不做实盘交易
- 不接券商
- 不做自动同步券商持仓
- 不做复杂权限系统
- 不做多人账户
- 不做机器学习选股
- 不强依赖付费数据源
