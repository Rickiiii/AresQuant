# Phase 8：Eastmoney 真实数据源

Phase 8 Step 1 为 AresQuant 增加 `EastmoneyDataProvider`，用于在本地没有历史数据文件的情况下，从东方财富公开 Web 接口拉取基础研究/回测数据。

Phase 8 Step 2 为东方财富公开接口请求增加基础韧性：请求超时控制、瞬时网络失败重试，以及 429/5xx 响应重试，降低公开接口偶发断连对研究数据同步的影响。

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
- 东方财富请求默认 8 秒超时
- 瞬时网络异常最多重试 1 次
- HTTP 429 / 5xx 响应最多重试 1 次

当前保守返回空数组的接口：

- `getLimitPrices()`
- `getSuspensions()`
- `getAdjFactors()`
- `getFinancialFactors()`

这些数据的东方财富公开接口稳定性和字段契约更弱，建议后续单独扩展并测试。

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

5. 同步指数数据：

```powershell
Invoke-RestMethod -Uri http://localhost:3000/data/sync/index-daily-bars `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"indexCodes":["000300.SH"],"startDate":"2024-05-06","endDate":"2024-05-10"}'
```

## 注意事项

- 东方财富接口是公开 Web 接口，不是官方授权 API。
- 适合个人研究、开发、回测数据补全。
- 不建议直接作为生产交易系统的数据源。
- 接口可能限流或字段变化，后续应加入请求限速、重试、缓存和数据质量报告。
- 财务因子、涨跌停、停复牌、复权因子建议作为 Phase 8 后续 Step 单独接入。

## 测试

覆盖：

- 股票列表解析
- 股票日线 K 线解析
- 指数日线 K 线解析
- 交易日历推导
- 无效 payload 快速失败
- `DATA_PROVIDER` 环境变量切换
