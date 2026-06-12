# 意图识别：Spring AI ToolCallback 日程增删改查

## 核心流程

```mermaid
sequenceDiagram
    participant U as 用户文本
    participant AC as AssistantChatService
    participant AI as DeepSeek
    participant TL as ScheduleTools<br/>(@Tool)

    U->>AC: "明天下午三点开会"
    AC->>AI: prompt + 历史 + 工具列表
    AI-->>TL: 选择 createSchedule(title/startTime/endTime)
    TL->>TL: 存入 ThreadLocal（不落库）
    TL-->>AI: "已准备好，请确认"
    AI-->>AC: 自然语言回复
    AC->>TL: 检查 ThreadLocal
    AC-->>U: intent=create_schedule<br/>needConfirm=true

    U->>AC: 点击确认
    AC->>AC: 真正落库
```

## 四个 @Tool 方法

| 方法 | 执行方式 | 说明 |
| --- | --- | --- |
| `createSchedule` | 写入 ThreadLocal | 不直接落库，等用户确认 |
| `querySchedules` | 直接查 MySQL | 组装 LambdaQueryWrapper 动态查询 |
| `deleteSchedules` | 写入 ThreadLocal | 先查后删，批量存入待确认 |
| `updateSchedule` | 直接更新 MySQL | AI 先 query 再 update，无需确认 |

## 意图判断逻辑

```
call() 返回后 → 检查 ThreadLocal
  ├─ PENDING_REQUEST 非空    → create_schedule
  ├─ PENDING_DELETIONS 非空  → delete_schedule
  ├─ UPDATE_COUNT 非空       → update_schedule
  └─ 以上都为空              → chitchat / clarify
```

## 两段式提交

```mermaid
graph LR
    A[用户输入] --> B[AI 生成草稿]
    B --> C{需要确认?}
    C -->|create / delete| D[needConfirm=true<br/>前端展示确认卡片]
    D --> E[用户点确认]
    E --> F[真正写入数据库]
    C -->|update / query| G[直接返回结果]
```

- **写操作**（创建/删除）必须用户二次确认
- **读操作**（查询）直接返回，不落草稿
- **更新**由 AI 先查询定位再修改，不经过确认
