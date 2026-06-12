# Schedjun 后端 API 接口参考

> 技术栈：Java Spring Boot 3.5 · MyBatis-Plus · MySQL · Spring AI  
> 版本：v1 · Base URL：`http://{host}:{port}`
> 接口均以 JSON 交互，认证后需携带 Token

---

## 一、通用约定

### 1.1 请求头

| Header          | 必填  | 说明                     |
| --------------- | --- | ---------------------- |
| `Authorization` | 是*  | `Bearer {accessToken}` |
| `Content-Type`  | 全接口 | `application/json`      |

> * 注册、登录除外

### 1.2 统一响应格式 `Result<T>`

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

- `code=0` 成功，非 0 为业务错误
- `data` 为各接口具体返回数据

### 1.3 时间格式

请求/响应统一 **ISO 8601** 带时区偏移，如 `2026-06-11T15:00:00+08:00`

---

## 二、认证模块

> 完成用户注册与登录，签发 JWT Token 用于后续接口鉴权。

| 方法 | 路径 | 说明 |
| --- | --- | --- | 
| `POST` | `/auth/register` | 用户注册 |
| `POST` | `/auth/login` | 用户登录 | 

### 2.1 注册

`POST /auth/register`

**Body：**

```json
{
  "username": "wenfeng",
  "password": "********"
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

### 2.2 登录

`POST /auth/login`

**Body：** 同注册

**Response data：** 同注册

---

## 三、用户模块

> 获取当前登录用户信息，包括用户名、时区等。

| 方法 | 路径 | 说明 |
| --- | --- | --- | 
| `GET` | `/users/me` | 当前用户信息 | 

### 3.1 当前用户信息

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

## 四、日程模块

> 日程的增删改查核心业务，支持批量删除和游标滚动加载。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/schedules` | 创建日程 |
| `PUT` | `/schedules` | 更新日程 | 
| `DELETE` | `/schedules` | 批量删除日程 | 
| `GET` | `/schedules` | 滚动查询日程列表 | 

### 4.1 日程对象 ScheduleVO

```json
{
  "id": "sch_90001",
  "title": "团队周会",
  "startTime": "2026-06-11T10:00:00+08:00",
  "endTime": "2026-06-11T11:00:00+08:00",
  "notes": "讨论本周进度",
  "repeat": { "preset": "weekly", "custom": null },
  "reminder": { "enabled": true, "preset": "min15", "custom": null },
  "source": "manual",
  "createdAt": "2026-06-01T09:00:00+08:00",
  "updatedAt": "2026-06-01T09:00:00+08:00"
}
```

**repeat.preset：** `never` | `daily` | `weekly` | `monthly` | `yearly` | `custom`

**reminder.preset：** `none` | `atStart` | `min5` | `min10` | `min15` | `min30` | `custom`

**source：** `manual` | `voice` | `ai`

### 4.2 创建日程

`POST /schedules`

**Body：**

```json
{
  "id": "sch_90001",
  "title": "团队周会",
  "startTime": "2026-06-11T10:00:00+08:00",
  "endTime": "2026-06-11T11:00:00+08:00",
  "notes": "",
  "allDay": false,
  "repeat": { "preset": "weekly" },
  "reminder": { "enabled": true, "preset": "min15" }
}
```

**Response data：** `ScheduleVO`

### 4.3 更新日程

`PUT /schedules`

**Body：** 同 4.2 创建结构（包含 `id` 定位要更新的日程）

**Response data：** 更新后的 `ScheduleVO`

### 4.4 批量删除日程

`DELETE /schedules`

**Body：**

```json
{
  "scheduleIds": ["sch_90001", "sch_90002"]
}
```

**Response data：**

```json
{
  "deletedCount": 2,
  "scheduleIds": ["sch_90001", "sch_90002"]
}
```

### 4.5 日程列表（滚动加载）

`GET /schedules`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startDate` | string | 否 | 筛选起始日期，如 `2026-06-01` |
| `endDate` | string | 否 | 筛选结束日期，如 `2026-06-30` |
| `keyword` | string | 否 | 标题/备注模糊搜索 |
| `cursor` | string | 否 | 滚动游标，首次不传，取上批 `nextCursor` |
| `limit` | int | 否 | 每批条数，默认 `20`，最大 `50` |

**Response data：**

```json
{
  "records": [ /* ScheduleVO[] */ ],
  "hasMore": true,
  "nextCursor": "2026-06-11T10:00:00|123",
  "total": 156
}
```

- `records`：按 `startTime` 升序
- `hasMore`：是否还有下一批
- `nextCursor`：下一批游标，`hasMore=false` 时为 `null`
- `total`：该用户全部日程总数

---

## 五、语音交互模块

> AI 语音助手"君听"的核心接口。用户发送自然语言文本，AI 识别意图并返回回复；确认后执行增删改。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/assistant/text-to-schedule` | 文本理解（主入口） | 
| `POST` | `/assistant/confirm` | 确认/取消草稿 | 

### 5.1 groupId 约定

一次"打开助手面板 → 关闭面板"为一组交互，由**前端生成** `groupId`（UUID），不需调用后端创建会话。

| 时机 | 行为 |
| --- | --- |
| 打开面板 | 生成 `groupId`，存 App 内存 |
| 每轮请求 | 携带同一 `groupId` |
| 关闭面板 | 丢弃 `groupId`（后端保留消息用于审计） |

后端按 `groupId` 查询 `assistant_message` 历史消息拼成 AI 对话上下文。

### 5.2 文本理解（主入口）

`POST /assistant/text-to-schedule`

**Body：**

```json
{
  "groupId": "grp_abc123",
  "text": "明天下午三点开会，提前半小时提醒我",
  "timezone": "Asia/Shanghai",
  "currentTime": "2026-06-11T21:00:00+08:00",
  "autoConfirm": false
}
```

**Response data：**

```json
{
  "groupId": "grp_abc123",
  "asrText": "明天下午三点开会，提前半小时提醒我",
  "reply": "好的，已为你备好日程「开会」—— 6月12日 15:00，提前30分钟提醒。确认创建吗？",
  "intent": "create_schedule",
  "scheduleDraft": {
    "title": "开会",
    "startTime": "2026-06-12T15:00:00+08:00",
    "endTime": "2026-06-12T16:00:00+08:00",
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

| 值 | 说明 |
| --- | --- |
| `create_schedule` | 创建日程 |
| `update_schedule` | 修改日程 |
| `delete_schedule` | 删除日程 |
| `query_schedule` | 查询日程 |
| `chitchat` | 闲聊 |
| `clarify` | 需追问（信息不足） |

- `needConfirm=true` 时，前端展示确认卡片，用户确认/取消后调用 5.3
- `needConfirm=false` 时（仅 `query_schedule` 和 `chitchat`），直接展示回复内容

### 5.3 确认交互

`POST /assistant/confirm`

**Body：**

```json
{
  "groupId": "grp_abc123",
  "messageId": "msg_002",
  "action": "confirm",
  "scheduleDraft": {
    "title": "开会",
    "startTime": "2026-06-12T15:00:00+08:00",
    "endTime": "2026-06-12T16:00:00+08:00",
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
  "schedule": { /* ScheduleVO */ }
}
```

**Response data（cancel）：**

```json
{
  "reply": "好的，已取消。"
}
```

---

## 六、模块划分总结

```
backend/src/main/java/com/schedjun/backend/
├── controller/
│   ├── AuthController.java          # 认证模块
│   ├── UserController.java          # 用户模块
│   ├── ScheduleController.java      # 日程模块
│   └── AssistantController.java     # 语音交互模块
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   ├── ScheduleService.java
│   ├── AssistantService.java        # 语音交互编排
│   ├── AssistantChatService.java    # Spring AI 对话
│   └── AssistantMessageService.java # 对话消息管理
├── tool/
│   └── ScheduleTools.java           # Spring AI @Tool 方法
├── common/
│   ├── entity/    # 数据库实体 (Schedule, User, AssistantMessage)
│   ├── dto/       # 请求体
│   ├── vo/        # 响应体
│   ├── model/     # 内部模型 (RepeatRule, ReminderRule, ScheduleDraft)
│   └── result/    # Result<T> 统一响应
└── config/
    └── SpringAiConfig.java
```
