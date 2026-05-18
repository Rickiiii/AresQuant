# Phase 8：Eastmoney 真实数据源

Phase 8 Step 1 为 AresQuant 增加 `EastmoneyDataProvider`，用于在本地没有历史数据文件的情况下，从东方财富公开 Web 接口拉取基础研究/回测数据。

Phase 8 Step 2 为东方财富公开接口请求增加基础韧性：请求超时控制、瞬时网络失败重试，以及 429/5xx 响应重试，降低公开接口偶发断连对研究数据同步的影响。

Phase 8 Step 4/5 补齐部分衍生数据和诊断能力：基于东方财富列表行情的昨收价推导涨跌停价，基于个股快照读取 PE/PB/PS 估值因子，并提供只读 smoke check 接口用于上线前验证公开接口可用性。

> 范围边界：本阶段只接入真实行情数据源，不进入模拟盘、实盘、Broker/QMT/PTrade、OptimizationService 或机器学习系统。

## 数据源切换

默认仍使用 Mock 数据源，保证测试和离线开发稳定：

```env
DATA_PROVIDER=mock
```

启用东方财富数据源：

```env
DATA_PROVIDER=eastmoney
```

`DataModule` 会根据 `DATA_PROVIDER` 选择：

- `mock` 或未设置：`MockDataProvider`
- `eastmoney`：`EastmoneyDataProvider`

## 已接入能力

`EastmoneyDataProvider` 当前实现：

- `getStocks()`：A 股股票列表
- `getDailyBars(symbol, startDate, endDate)`：股票日线 K 线
- `getIndexDailyBars(indexCode, startDate, endDate)`：指数日线 K 线
- `getTradingCalendar(startDate, endDate)`：基于沪深 300 指数 K 线推导开市日期
- `getLimitPrices(tradeDate)`：基于列表行情昨收价和 A 股涨跌幅规则推导涨跌停价
- `getFinancialFactors(symbol)`：基于个股快照读取 PE/PB/PS 估值字段
- 东方财富请求默认 8 秒超时
- 瞬时网络异常最多重试 1 次
- HTTP 429 / 5xx 响应最多重试 1 次

当前保守返回空数组的接口：

- `getSuspensions()`
- `getAdjFactors()`

停复牌和复权因子的东方财富公开接口稳定性和字段契约更弱，建议后续单独扩展并测试。

## 字段映射

### 股票列表

东方财富 `clist/get` 字段：

- `f12` → `symbol`
- `f14` → `name`

系统推导：

- `tsCode`：根据代码前缀生成 `.SH` / `.SZ`
- `exchange`：`6xxxxx` 为 `SSE`，`0xxxxx` / `3xxxxx` 为 `SZSE`
- `market`：主板 / 创业板 / 科创板
- `listDate`：东方财富列表接口不提供时使用占位 `19000101`
- `isST`：股票名称包含 `ST` 时为 true

### 股票日线 / 指数日线

东方财富 `kline/get` 单行格式：

```text
日期,开盘,收盘,最高,最低,成交量,成交额,振幅,涨跌幅,涨跌额,换手率
```

系统映射：

- `tradeDate`：`YYYY-MM-DD` 转为 `YYYYMMDD`
- `open/high/low/close`
- `volume`
- `amount`
- `pctChange`
- `change`
- `preClose`：使用上一条 K 线收盘价推导，首条使用当日开盘价

### 涨跌停价

东方财富 `clist/get` 额外读取：

- `f12` → `symbol`
- `f14` → 股票名称，用于判断 ST
- `f18` → 昨收价

系统按 A 股常见规则推导：

- 普通主板：±10%
- 创业板 / 科创板：±20%
- 北交所：±30%
- 名称包含 `ST`：±5%

结果四舍五入到 2 位小数；该能力用于研究/回测辅助，若未来进入更高精度撮合，应再补充交易所逐笔规则和特殊新股规则。

### 财务因子

东方财富 `clist/get` 快照字段：

- `f12` → `symbol`
- `f9` / `f162` → `pe`
- `f23` / `f167` → `pb`
- `f115` → `ps`

公开快照不提供稳定报告期，本阶段使用 `00000000` 作为 `reportDate` / `annDate` 占位，表示这是当前估值快照而不是正式财报期数据。

## 诊断接口

`POST /data/sync/eastmoney/smoke-check` 会只读调用东方财富 provider，不写入任何 Repository / 数据库，用于确认当前网络和公开接口字段是否仍可用。

可选环境变量：

```env
EASTMONEY_SMOKE_SYMBOL=000001
EASTMONEY_SMOKE_DATE=20240506
```

返回示例：

```json
{
  "success": true,
  "data": {
    "provider": "eastmoney",
    "status": "SUCCESS",
    "checks": [
      { "name": "stocks", "status": "SUCCESS", "sampleCount": 5000 },
      { "name": "dailyBars", "status": "SUCCESS", "sampleCount": 1 },
      { "name": "indexDailyBars", "status": "SUCCESS", "sampleCount": 1 },
      { "name": "limitPrices", "status": "SUCCESS", "sampleCount": 5000 },
      { "name": "financialFactors", "status": "SUCCESS", "sampleCount": 1 }
    ]
  }
}
```

## 使用示例

1. 修改 `.env`：

```env
DATA_PROVIDER=eastmoney
```

2. 启动后端：

```powershell
pnpm start:dev
```

3. 同步股票列表：

```powershell
Invoke-RestMethod -Uri http://localhost:3000/data/sync/stocks -Method Post
```

4. 同步日线数据：

```powershell
Invoke-RestMethod -Uri http://localhost:3000/data/sync/daily-bars `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"symbols":["000001","600000"],"startDate":"2024-05-06","endDate":"2024-05-10"}'
```

5. 只读诊断东方财富公开接口：

```powershell
Invoke-RestMethod -Uri http://localhost:3000/data/sync/eastmoney/smoke-check -Method Post
```

## 注意事项

- 东方财富接口是公开 Web 接口，不是官方授权 API。
- 适合个人研究、开发、回测数据补全。
- 不建议直接作为生产交易系统的数据源。
- 接口可能限流或字段变化，后续应持续维护请求限速、缓存和数据质量报告。
- `getFinancialFactors()` 当前读取的是估值快照 PE/PB/PS，不是完整财报因子；报告期字段使用 `00000000` 占位。
- 停复牌、复权因子建议作为 Phase 8 后续 Step 单独接入。

## 测试

覆盖：

- 股票列表解析
- 股票日线 K 线解析
- 指数日线 K 线解析
- 交易日历推导
- 涨跌停价推导
- 财务估值快照映射
- Eastmoney smoke check 只读诊断
- 无效 payload 快速失败
- `DATA_PROVIDER` 环境变量切换
