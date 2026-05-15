# ArriveMate 轻量开发 Spec

## 1. 项目目标

ArriveMate 是一个面向 Robotaxi 后排智能座舱的 AI Agent Web Demo。

产品目标：

> 将 Robotaxi 车程转化为“到达前准备空间”，让乘客在抵达目的地前完成信息准备、状态调整、行动提醒和座舱环境切换。

本期 Demo 重点验证：

- AI 主动欢迎并确认行程
- AI 主动询问乘客到达后要做什么
- 用户通过预设语音按钮模拟输入
- AI 展示意图识别结果
- AI 生成到达前准备计划
- 用户确认后才执行计划
- 座舱状态随场景联动变化
- 到达前展示 checklist 和收口提醒

本期不做真实后端、数据库、ASR/TTS、地图、车控或消息发送。

## 2. 技术栈

使用：

- React
- Vite
- JavaScript
- CSS
- 前端 Mock Data

约束：

- 纯前端 Demo
- 不接后端
- 不接数据库
- 不接真实 ASR/TTS
- 不接真实地图、ETA、路线 API
- 不接真实车控 API
- 不做真实消息发送或路线变更
- 所有数据和流程均由本地 mock data 驱动

## 3. 页面布局

页面需符合 Robotaxi 后排大屏特点：

- 大字号
- 大卡片
- 低信息密度
- 科技感
- 远距离可读
- 尽量减少用户手动操作

页面分为 5 个区域：

| 区域 | 作用 |
|---|---|
| 顶部：行程与安全状态栏 | 展示目的地、ETA、自动驾驶状态、安全状态、路线状态 |
| 中部左侧：AI Agent 主交互区 | 展示 ArriveMate 当前话术、用户语音、Agent 状态 |
| 中部右侧：AI 决策与到达前准备区 | 展示识别结果、计划、确认分支、异常兜底、到达提醒 |
| 中下：座舱联动状态区 | 展示灯光、音乐、座椅、温度、提醒方式等前后变化 |
| 底部：语音指令模拟区 | 展示 4 个预设语音按钮 |

页面不应呈现为普通 Chatbot、车控设置页或后台 Dashboard。

## 4. P0 组件

第一版只保留 5 个主组件。

| 组件 | 负责内容 |
|---|---|
| `TripStatusBar` | 展示目的地、ETA、预计到达时间、自动驾驶状态、安全状态、路线状态；面试场景中展示 ETA 延误提示 |
| `AgentInteractionPanel` | 展示 ArriveMate 当前话术、Agent 状态、用户语音文本、当前阶段提示 |
| `DecisionPlanPanel` | 根据 `currentStep` 展示能力介绍、识别结果、计划确认、调整后计划、低打扰待命、异常兜底、到达前提醒 |
| `CabinStatePanel` | 展示座舱状态；计划未开启前展示原状态，执行后展示原状态 → 新状态；暂不需要时不执行新状态 |
| `VoiceCommandBar` | 展示 4 个预设语音按钮，点击后进入对应场景流程 |

`DecisionPlanPanel` 内部可包含以下子模块，但第一版不强制拆文件：

- `IntentCard`
- `PlanCard`
- `ConfirmActions`
- `ArrivalReminder`
- `ExceptionRiskCard`
- 低打扰待命卡

## 5. P0 场景

本期只做 4 个场景。

### 面试准备

用户语音：

> 我等会儿要去面试，有点紧张

必须展示：

- AI 识别：面试、紧张、快速准备、稳定状态
- 计划：岗位回顾、模拟问题、材料与仪表检查
- 座舱：柔和专注、音乐关闭、端正坐姿、轻声提醒
- 到达提醒：简历、身份证、作品集、仪表、下车点
- 迟到风险 mock 兜底

### 机场准备

用户语音：

> 我要去首都国际机场，帮我看下要注意什么

必须展示：

- AI 识别：机场、时间敏感、证件行李、到达流程
- 计划：ETA/航站楼确认、证件行李检查、下车后流程
- 座舱：ETA 和 checklist 置顶、提醒更明确、音乐降低
- 到达提醒：身份证/护照、登机信息、行李、入口

### 商务会议准备

用户语音：

> 我等会儿要参加客户会议，帮我整理一下状态

必须展示：

- AI 识别：客户会议、需要专注、会议目标、表达重点
- 计划：会议目标、3 个发言点、资料检查
- 座舱：冷静专注、音乐关闭、办公坐姿、简洁提醒
- 到达提醒：电脑、会议资料、客户称呼、表达重点

### 休息恢复

用户语音：

> 我有点累，想在车上休息一下

必须展示：

- AI 识别：疲惫、低打扰、到达前唤醒
- 计划：调暗灯光、降低声音、低打扰休息、温和唤醒
- 座舱：暗光、白噪音或关闭音乐、放松坐姿、轻柔提醒
- 到达提醒：温和唤醒、手机、包、随身物品

## 6. Mock Data 结构

建议文件：

```text
src/data/scenarios.js
```

每个场景必须包含：

```js
{
  id: 'interview',
  title: '面试准备',
  voiceText: '我等会儿要去面试，有点紧张',

  destination: {
    name: '星河中心东门',
    type: '面试地点',
    address: '星河中心 A 座',
    arrivalPoint: '东门',
    instruction: '进门后右转到前台'
  },

  eta: {
    minutes: 22,
    arrivalTime: '09:52',
    routeStatus: '路线稳定',
    autonomousStatus: '自动驾驶中',
    safetyStatus: '安全系统正常'
  },

  intent: {
    purpose: '面试',
    userState: '有些紧张',
    remainingTime: '22 分钟',
    coreNeed: '快速准备 + 稳定状态',
    recommendedMode: '面试准备模式'
  },

  plan: {
    title: '面试到达前准备',
    steps: [
      '快速回顾公司和岗位匹配点',
      '练习 2 个常见面试问题',
      '到达前检查简历、证件和仪表'
    ]
  },

  adjustedPlan: {
    title: '轻量面试准备',
    steps: [
      '只回顾 3 个核心表达点',
      '做一次 1 分钟放松提醒',
      '到达前检查简历和证件'
    ]
  },

  cabinBefore: {
    lighting: '日常',
    music: '轻音乐 40%',
    seat: '标准坐姿',
    temperature: '24℃',
    reminder: '普通提醒',
    screen: '默认首页'
  },

  cabinAfter: {
    lighting: '柔和专注',
    music: '关闭',
    seat: '端正坐姿',
    temperature: '23℃',
    reminder: '轻声提醒',
    screen: '面试准备置顶'
  },

  checklist: ['简历', '身份证', '作品集', '整理仪表'],

  aiReplies: {
    voice_input: '我听到了，我来帮你看一下这段车程可以怎么准备。',
    understanding: '我正在理解你的行程目的和当前状态。',
    intent_result: '我识别到你正在前往面试，剩余 22 分钟。你现在需要快速进入状态，并在到达前缓解紧张。',
    plan_confirm: '我为你生成了一份面试前准备计划。要现在开启吗？',
    executing: '好的，我会用轻一点的节奏帮你准备。到达前 3 分钟，我会提醒你做最后检查。',
    arrival_reminder: '还有 3 分钟到达。请带好简历和身份证，整理一下仪表。'
  },

  arrivalReminder: {
    minutesBeforeArrival: 3,
    title: '到达前检查',
    text: '请带好简历和身份证，整理一下仪表。下车点在东门，进门后右转到前台。'
  },

  exceptionFallback: {
    enabled: true,
    delayMinutes: 7,
    newEtaMinutes: 29,
    reason: '前方道路拥堵',
    impact: '可能影响面试签到',
    suggestion: '建议提前通知对方，并持续监控 ETA。',
    notificationDraft: '您好，我正在前往面试地点，因前方道路拥堵，预计会晚到约 7 分钟。非常抱歉，我会尽快到达。',
    mockNotice: '本 Demo 仅展示 mock 提示，不会真实发送消息或变更路线。'
  }
}
```

四个场景必须共用同一结构。除面试外，其他场景的 `exceptionFallback.enabled` 为 `false`。

## 7. 状态设计

第一版只保留 6 个 state。

```js
selectedScenarioId
currentStep
confirmationChoice
showExceptionRisk
messages
demoStarted
```

说明：

| State | 作用 |
|---|---|
| `selectedScenarioId` | 当前选择的场景 ID，未选择时为 `null` |
| `currentStep` | 当前产品关键帧，是主流程唯一驱动字段 |
| `confirmationChoice` | 用户确认选择：`start`、`adjust`、`dismiss` 或 `null` |
| `showExceptionRisk` | 是否展示面试场景中的 ETA 延误 mock |
| `messages` | 保存当前关键用户话术和 AI 话术，不做长聊天历史 |
| `demoStarted` | 标记 Demo 是否已进入正式流程 |

派生规则：

| 派生内容 | 来源 |
|---|---|
| `selectedScenario` | 由 `selectedScenarioId` 从 `scenarios` 中查找 |
| `intentResult` | `selectedScenario.intent` |
| `activePlan` | `confirmationChoice === 'adjust' ? selectedScenario.adjustedPlan : selectedScenario.plan` |
| `cabinState` | 执行态展示 `cabinAfter`，否则展示 `cabinBefore` |
| `agentStatus` | 由 `currentStep` 映射 |
| `arrivalReminder` | `selectedScenario.arrivalReminder` |
| `aiReply` | `selectedScenario.aiReplies[currentStep]` |

## 8. currentStep 状态机

统一使用以下状态：

```js
boarding
agent_intro
asking_purpose
voice_input
understanding
intent_result
plan_confirm
executing
arrival_reminder
```

| currentStep | 页面变化 | 触发条件 |
|---|---|---|
| `boarding` | 展示默认行程、安全状态和欢迎语 | 页面初始加载 |
| `agent_intro` | Agent 介绍到达前准备能力，右侧展示 4 个场景示例 | 欢迎后进入或点击开始 |
| `asking_purpose` | Agent 主动询问到达后要做什么，底部语音按钮突出 | 能力介绍后进入 |
| `voice_input` | 展示用户语音转文字 | 点击语音按钮 |
| `understanding` | 展示 AI 正在理解 | 语音输入后推进 |
| `intent_result` | 展示 AI 结构化识别结果 | 理解完成后推进 |
| `plan_confirm` | 展示准备计划和确认分支 | 识别结果后推进 |
| `executing` | 展示计划执行态和座舱原状态 → 新状态 | 点击开启计划 |
| `arrival_reminder` | 展示到达前 checklist、下车点和提醒 | 执行后推进 |

标准主路径：

```text
boarding → agent_intro → asking_purpose → voice_input → understanding → intent_result → plan_confirm → executing → arrival_reminder
```

## 9. 用户确认分支

计划生成后必须展示三个分支。

### 开启计划

状态变化：

```js
confirmationChoice = 'start'
currentStep = 'executing'
```

页面表现：

- 计划进入执行态
- 座舱展示 `cabinBefore → cabinAfter`
- 后续进入 `arrival_reminder`

### 调整计划

状态变化：

```js
confirmationChoice = 'adjust'
currentStep = 'plan_confirm'
```

页面表现：

- 展示 `adjustedPlan`
- 不做复杂编辑器
- 仍可点击开启计划
- 座舱不变化

再点击开启：

```js
confirmationChoice = 'start'
currentStep = 'executing'
```

### 暂不需要

状态变化：

```js
confirmationChoice = 'dismiss'
currentStep = 'plan_confirm'
showExceptionRisk = false
```

页面表现：

- 展示低打扰待命
- 不继续反复询问用户
- 不执行 `cabinAfter`
- 座舱保持当前状态或待命状态
- 展示文案：

> 好的，我先不打扰你。你需要到达前准备时，可以随时叫我。

## 10. 异常兜底

仅面试场景展示 ETA 延误 mock。

触发条件：

```js
selectedScenarioId === 'interview'
currentStep === 'executing'
```

展示内容：

- ETA 延误，例如 22 分钟 → 29 分钟
- 延误原因：前方道路拥堵
- 影响：可能影响面试签到
- 建议：生成通知文案 / 持续监控
- mock 通知文案
- mock notice：

> 本 Demo 仅展示 mock 提示，不会真实发送消息或变更路线。

不做：

- 真实消息发送
- 真实路线变更
- 真实下车点变更

## 11. 点击语音按钮后的状态流

以面试准备为例。

### 默认

```js
selectedScenarioId = null
currentStep = 'boarding'
confirmationChoice = null
showExceptionRisk = false
messages = []
demoStarted = false
```

### 进入能力介绍

```js
currentStep = 'agent_intro'
demoStarted = true
```

### AI 主动询问

```js
currentStep = 'asking_purpose'
```

### 点击语音按钮

```js
selectedScenarioId = 'interview'
currentStep = 'voice_input'
messages = [
  { role: 'user', text: selectedScenario.voiceText }
]
confirmationChoice = null
showExceptionRisk = false
```

### AI 理解

```js
currentStep = 'understanding'
messages = [
  { role: 'user', text: selectedScenario.voiceText },
  { role: 'assistant', text: selectedScenario.aiReplies.understanding }
]
```

### 展示识别结果

```js
currentStep = 'intent_result'
messages = [
  { role: 'assistant', text: selectedScenario.aiReplies.intent_result }
]
```

### 展示计划确认

```js
currentStep = 'plan_confirm'
confirmationChoice = null
```

### 点击开启计划

```js
confirmationChoice = 'start'
currentStep = 'executing'
```

若为面试场景，可展示：

```js
showExceptionRisk = true
```

### 进入到达前提醒

```js
currentStep = 'arrival_reminder'
```

## 12. 验收标准

### 页面

- 页面像 Robotaxi 后排大屏，不像普通网页或手机应用
- 大字号、大卡片、低信息密度
- 远距离可读
- 有科技感但不过度装饰
- 默认能看到目的地、ETA、自动驾驶状态、安全状态

### 主流程

必须跑通：

- AI 欢迎
- AI 能力介绍
- AI 主动询问
- 用户点击语音按钮
- 用户语音转文字
- AI 理解
- AI 识别结果
- AI 计划生成
- 用户确认
- 座舱联动
- 到达前提醒

### 场景

4 个 P0 场景都必须可运行：

- 面试准备
- 机场准备
- 商务会议准备
- 休息恢复

每个场景必须有明显差异：

- 识别结果不同
- 准备计划不同
- 座舱联动不同
- checklist 不同
- 到达提醒不同

### 确认分支

必须实现：

- 开启计划：进入执行态
- 调整计划：展示 adjustedPlan
- 暂不需要：低打扰待命，不反复询问

### 异常兜底

面试场景必须展示：

- mock ETA 延误
- AI 原因解释
- mock 通知文案
- 不真实发送、不真实路线变更的提示

### 技术边界

必须确认：

- 无后端
- 无数据库
- 无真实 ASR/TTS
- 无真实地图 API
- 无真实车控 API
- 无真实消息发送
- 所有核心内容由本地 mock data 驱动
