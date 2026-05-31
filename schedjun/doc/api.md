# Schedjun 后端 API 接口参考

> 技术栈：Java Spring Boot · MySQL · Spring AI · 讯飞 ASR  
> 版本：v1 · Base URL：`https://api.example.com/api/v1`  
> 与现有移动端 `ScheduleItem` / 君听聊天层字段对齐

---

## 一、通用约定

### 1.1 请求头


| Header          | 必填  | 说明                                         |
| --------------- | --- | ------------------------------------------ |
| `Authorization` | 是*  | `Bearer {accessToken}`                     |
| `Content-Type`  | 视接口 | `application/json` 或 `multipart/form-data` |
| `X-Request-Id`  | 否   | 链路追踪 UUID                                  |


 登录、注册、健康检查除外

### 1.2 统一响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "8f3c2a1b-xxxx"
}
```


| code    | 含义             |
| ------- | -------------- |
| `0`     | 成功             |
| `40001` | 参数校验失败         |
| `40101` | 未登录 / Token 失效 |
| `40301` | 无权限            |
| `40401` | 资源不存在          |
| `40901` | 资源冲突           |
| `50001` | 服务器内部错误        |
| `50201` | 讯飞 ASR 调用失败    |
| `50202` | Spring AI 调用失败 |


### 1.3 分页（列表类接口）

**Query：**


| 参数         | 类型  | 默认  | 说明          |
| ---------- | --- | --- | ----------- |
| `page`     | int | 1   | 页码          |
| `pageSize` | int | 20  | 每页条数，最大 100 |


**响应 data：**

```json
{
  "list": [],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### 1.4 时间格式

- 请求/响应统一：**ISO 8601**，带时区  
例：`2026-05-30T15:00:00+08:00`
- 数据库存储建议：`DATETIME(3)` + 用户时区字段，或统一 UTC

---

## 二、认证模块

### 2.1 注册

`POST /auth/register`

**Body：**

```json
{
  "username": "wenfeng",
  "password": "******"
}
```

**Response data：**

```json
{
  "userId": "u_10001",
  "accessToken": "eyJ...",
  "expiresIn": 7200
}
```

---

### 2.2 登录

`POST /auth/login`

**Body：**

```json
{
  "username": "wenfeng",
  "password": "******"
}
```

**Response：** 同注册

---

### 2.3 刷新 Token

`POST /auth/refresh`

**Body：**

```json
{
  "refreshToken": "rt_xxx"
}
```

---

### 2.4 当前用户信息

`GET /users/me`

**Response data：**

```json
{
  "userId": "u_10001",
  "username": "wenfeng",
  "timezone": "Asia/Shanghai",
  "createdAt": "2026-01-01T10:00:00+08:00"
}
```

---

## 三、日程模块

> 与移动端 `ScheduleItem`、`RepeatRule`、`ReminderRule` 一一对应

### 3.1 日程对象 ScheduleVO

```json
{
  "id": "sch_90001",
  "title": "文华在线教育 Java 实习生 线下面试",
  "startTime": "2026-03-05T15:00:00+08:00",
  "endTime": "2026-03-05T16:00:00+08:00",
  "notes": "候选人：张三\n面试职位：java 实习生",
  "repeat": {
    "preset": "never",
    "custom": null
  },
  "reminder": {
    "enabled": true,
    "preset": "min30",
    "custom": null
  },
  "source": "manual",
  "createdAt": "2026-03-01T09:00:00+08:00",
  "updatedAt": "2026-03-01T09:00:00+08:00"
}
```

**repeat.preset 枚举：** `never` | `daily` | `weekly` | `monthly` | `yearly` | `custom`

**repeat.custom（preset=custom 时）：**

```json
{
  "frequency": "week",
  "interval": 1,
  "weekdays": [1, 3, 5],
  "monthDays": [],
  "monthMode": "date",
  "yearMonths": []
}
```

**reminder.preset 枚举：** `none` | `atStart` | `min5` | `min10` | `min15` | `min30` | `custom`

**reminder.custom（preset=custom 时）：**

```json
{
  "value": 3,
  "unit": "hour"
}
```

**source 枚举：** `manual` | `voice` | `ai`

---

### 3.2 创建日程

`POST /schedules`

**Body：**

```json
{
  "id": "sch_90001",
  "title": "团队周会",
  "startTime": "2026-05-30T10:00:00+08:00",
  "endTime": "2026-05-30T11:00:00+08:00",
  "notes": "",
  "allDay": false,
  "repeat": { "preset": "weekly" },
  "reminder": { "enabled": true, "preset": "min15" }
}
```

**Response data：** `ScheduleVO`

---

### 3.3 更新日程

`PUT /schedules`

**Body：** 完整字段，同 3.2 创建结构。

**Response data：** 更新后的完整 `ScheduleVO`

---

### 3.5 删除日程

`DELETE /schedules/{scheduleId}`

**Response data：**

```json
{
  "deleted": true,
  "scheduleId": "sch_90001"
}
```

---

### 3.6 日程详情

`GET /schedules/{scheduleId}`

**Response data：** `ScheduleVO`

---

### 3.7 日程列表（我的日程）

`GET /schedules`

**Query：**


| 参数          | 类型     | 说明                  |
| ----------- | ------ | ------------------- |
| `startDate` | string | 筛选起始日期 `2026-05-01` |
| `endDate`   | string | 筛选结束日期 `2026-05-31` |
| `keyword`   | string | 标题/备注模糊搜索           |
| `page`      | int    | 分页                  |
| `pageSize`  | int    | 分页                  |


**Response data：** 分页 + `ScheduleVO[]`

---

### 3.8 按日查询（首页日历）

`GET /schedules/by-date`

**Query：**


| 参数     | 类型     | 说明           |
| ------ | ------ | ------------ |
| `date` | string | `2026-05-30` |


**Response data：**

```json
{
  "date": "2026-05-30",
  "schedules": [ /* ScheduleVO[]，按 startTime 升序 */ ]
}
```

---

### 3.9 按月查询（日历打点）

`GET /schedules/by-month`

**Query：**


| 参数      | 类型  | 说明      |
| ------- | --- | ------- |
| `year`  | int | 2026    |
| `month` | int | 5（1-12） |


**Response data：**

```json
{
  "year": 2026,
  "month": 5,
  "datesWithSchedule": ["2026-05-05", "2026-05-30"]
}
```

---

## 四、君听 · 语音助手模块

> 流程：**音频 → 讯飞 ASR → 文本 → Spring AI（结合 groupId 上下文）→ 创建/查询日程**  
> 产品形态：纯语音、无聊天列表 UI；用户说一句、AI 回一句，支持多轮追问（如「几点？」→「下午三点」）。

### 4.1 groupId 约定

一次「打开君听面板 → 关闭面板」视为一组交互，由**移动端生成** `groupId`（UUID），无需调用后端创建会话。


| 时机     | 行为                                   |
| ------ | ------------------------------------ |
| 打开君听面板 | 生成 `groupId`，存 App 内存                |
| 每轮语音请求 | 携带同一 `groupId`                       |
| 关闭面板   | 丢弃 `groupId`（后端 message 仍保留，供上下文与审计） |


后端收到请求后：

1. 按 `groupId` 查询 `assistant_message` 最近 N 条（建议 10～20 条）
2. 拼成 Spring AI 对话历史
3. 写入本轮 user / assistant 消息

---

### 4.2 语音交互（主入口 · ASR + AI 合并）

`POST /assistant/voice-to-schedule`

**Content-Type：** `multipart/form-data`


| 字段            | 类型      | 必填  | 说明                          |
| ------------- | ------- | --- | --------------------------- |
| `groupId`     | string  | 是   | 一次打开面板的分组 ID                |
| `audio`       | file    | 是   | pcm/wav/m4a，≤ 60s           |
| `format`      | string  | 是   | `pcm` / `wav` / `speex`     |
| `sampleRate`  | int     | 是   | 16000                       |
| `language`    | string  | 否   | 默认 `zh_cn`                  |
| `autoConfirm` | boolean | 否   | 默认 false；true 时信息完整则直接落库    |
| `timezone`    | string  | 否   | 默认 `Asia/Shanghai`，辅助解析相对时间 |
| `currentTime` | string  | 否   | 客户端当前时间 ISO 8601            |


**Response data：**

```json
{
  "groupId": "grp_abc123",
  "asrText": "明天下午三点开会",
  "reply": "好的，已为你创建「开会」，5月31日 15:00，提前30分钟提醒。",
  "intent": "create_schedule",
  "scheduleDraft": {
    "title": "开会",
    "startTime": "2026-05-31T15:00:00+08:00",
    "endTime": "2026-05-31T16:00:00+08:00",
    "notes": "",
    "allDay": false,
    "repeat": { "preset": "never" },
    "reminder": { "enabled": true, "preset": "min30" }
  },
  "schedule": null,
  "needConfirm": true,
  "messageId": "msg_002"
}
```

**intent 枚举：**


| 值                 | 说明        |
| ----------------- | --------- |
| `create_schedule` | 创建日程      |
| `update_schedule` | 修改日程      |
| `delete_schedule` | 删除日程      |
| `query_schedule`  | 查询日程      |
| `chitchat`        | 闲聊        |
| `clarify`         | 需追问（信息不足） |


- `needConfirm=true` 时，移动端展示确认后再调 4.3。
- `autoConfirm=true` 且解析成功时，`schedule` 返回已创建的 `ScheduleVO`，`needConfirm=false`。
- `intent=clarify` 时，用户可继续说话，**同一 `groupId` 再调本接口**即可带上上下文。

**多轮示例：**

```
第1轮 groupId=grp_xxx  audio="明天开会"
  → reply="几点开始？"  intent=clarify

第2轮 groupId=grp_xxx  audio="下午三点"
  → reply="好的，已为你创建..."  intent=create_schedule  needConfirm=true
```

---

### 4.3 确认并创建日程

`POST /assistant/confirm`

**Body：**

```json
{
  "groupId": "grp_abc123",
  "messageId": "msg_002",
  "action": "confirm",
  "scheduleDraft": {
    "title": "开会",
    "startTime": "2026-05-31T15:00:00+08:00",
    "endTime": "2026-05-31T16:00:00+08:00",
    "allDay": false,
    "repeat": { "preset": "never" },
    "reminder": { "enabled": true, "preset": "min30" },
    "notes": ""
  }
}
```

**action 枚举：** `confirm` | `cancel`

**Response data（confirm）：**

```json
{
  "reply": "日程已创建。",
  "schedule": { /* ScheduleVO，source 为 voice */ }
}
```

**Response data（cancel）：**

```json
{
  "reply": "好的，已取消。"
}
```

---

### 4.4 语音转文字（可选 · 调试 ASR）

`POST /assistant/asr`

仅用于联调讯飞识别准确率，**正式产品流程走 4.2 即可**。

**Content-Type：** `multipart/form-data`


| 字段           | 类型     | 必填  | 说明                      |
| ------------ | ------ | --- | ----------------------- |
| `groupId`    | string | 否   | 可选，写入 message 审计        |
| `audio`      | file   | 是   | pcm/wav/m4a，≤ 60s       |
| `format`     | string | 是   | `pcm` / `wav` / `speex` |
| `sampleRate` | int    | 是   | 16000                   |
| `language`   | string | 否   | 默认 `zh_cn`              |


**Response data：**

```json
{
  "groupId": "grp_abc123",
  "text": "明天下午三点开会，提前半小时提醒我",
  "confidence": 0.96,
  "durationMs": 3200,
  "asrProvider": "iflytek"
}
```

---

## 六、Spring 模块划分建议

```
backend/
├── controller/
│   ├── AuthController.java
│   ├── ScheduleController.java
│   └── AssistantController.java
├── service/
│   ├── ScheduleService.java
│   ├── AssistantChatService.java      # Spring AI
│   └── AsrService.java              # 讯飞 ASR 封装
├── client/
│   └── IflytekAsrClient.java
├── dto/ / vo/ / entity/
├── repository/
└── config/
    ├── SpringAiConfig.java
    └── IflytekConfig.java
```

---

## 七、移动端对接优先级


| 优先级 | 接口                                  | 对应前端                |
| --- | ----------------------------------- | ------------------- |
| P0  | `GET /schedules/by-date`            | 首页日历 + 当日列表         |
| P0  | `POST /schedules`                   | 创建日程页保存             |
| P0  | `PUT /schedules/{id}`               | 编辑日程页保存（Body 传完整字段） |
| P0  | `DELETE /schedules/{id}`            | 详情页删除               |
| P1  | `POST /assistant/voice-to-schedule` | 君听语音主流程             |
| P1  | `POST /assistant/confirm`           | AI 创建确认             |
| P2  | `GET /schedules/by-month`           | 日历打点优化              |
| P2  | `POST /assistant/asr`               | 仅转写（调试）             |


---

## 八、健康检查

`GET /health`

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "UP",
    "mysql": "UP",
    "springAi": "UP",
    "iflytekAsr": "UP"
  }
}
```

