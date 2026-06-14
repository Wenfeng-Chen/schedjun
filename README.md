# Schedjun

一款带语音助手的跨平台日程管理应用。支持日历视图、日程增删改查、重复与提醒规则，并通过「君听」语音助手用自然语言创建、修改、删除日程。

## 演示视频

> 将下方链接替换为你的实际视频地址即可。

【超级会员V3】通过百度网盘分享的文件：Screenre…  
链接:++[https://pan.baidu.com/s/1lbM7_CG9AazdeZkaX-aLyw](https://pan.baidu.com/s/1lbM7_CG9AazdeZkaX-aLyw)++   
提取码:7g83  
复制这段内容打开「百度网盘APP 即可获取」

---

## 功能概览


| 模块         | 说明                                  |
| ---------- | ----------------------------------- |
| **日历**     | 月视图浏览、左右滑动切换月份、点击日期查看当日日程           |
| **我的日程**   | 按时间线滚动查看日程列表                        |
| **日程管理**   | 新建 / 编辑 / 删除日程，支持备注、全天、重复与提醒        |
| **君听语音助手** | 按住说话 → 语音识别 → AI 理解意图 → 确认后写入日程     |
| **语音操作**   | 支持「明天下午三点开会」「把开会改到四点」「删除明天的开会」等自然语言 |
| **用户系统**   | 注册、登录、JWT 鉴权、用户信息与时区                |


---

## 技术栈

### 后端 `backend/`

- Java 17 · Spring Boot 3.5
- MyBatis-Plus · MySQL
- Spring AI（DeepSeek）— 意图识别与结构化解析
- 讯飞 ASR — 语音转文字
- JWT 鉴权

### 移动端 `mobile/`

- React Native · Expo 56
- TypeScript
- expo-audio / expo-file-system — 录音与上传

---

## 项目结构

```
schedjun/
├── backend/          # Spring Boot 后端
│   ├── src/main/java/com/schedjun/backend/
│   │   ├── controller/    # REST 接口
│   │   ├── service/       # 业务逻辑（含语音助手、日程）
│   │   ├── client/        # 讯飞 ASR 客户端
│   │   └── ...
│   └── src/main/resources/
│       └── application.yaml.example
├── mobile/           # Expo React Native 客户端
│   ├── api/               # 接口封装
│   ├── components/        # UI 组件（日历、君听、日程等）
│   └── constants/         # 主题、配置
└── doc/
    ├── api.md             # 接口文档
    └── db.md              # 数据库设计
```

---

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.8+
- MySQL 8.0+
- Node.js 18+（移动端）
- DeepSeek API Key、讯飞 ASR 凭证（语音功能）

### 1. 克隆项目

```bash
git clone https://github.com/Wenfeng-Chen/schedjun.git
cd schedjun
```

### 2. 初始化数据库

参考 [doc/db.md](./schedjun/doc/db.md) 执行建表 SQL，至少包含 `user`、`schedule`、`assistant_message` 三张表。

### 3. 启动后端

```bash
cd schedjun/backend
mvn spring-boot:run
```

后端默认地址：`http://localhost:8080/api/v1`

### 4. 启动移动端

```bash
cd schedjun/mobile
npm install
npx expo run:android
```

1. 手机开启「开发者选项」→「USB 调试」，通过数据线连接电脑
2. 确保手机和电脑连接**同一个 Wi-Fi**（手机热点无效）
3. 打开 `mobile/constants/apiConfig.ts`，将 `MANUAL_API_HOST` 设为电脑的局域网 IP

### 5. 登录体验

默认测试账号（若已初始化）：

- 用户名：`admin`
- 密码：`123456`

---

## 配置说明


| 配置项      | 位置                              | 说明         |
| -------- | ------------------------------- | ---------- |
| 数据库      | `backend/.../application.yaml`  | MySQL 连接信息 |
| DeepSeek | `spring.ai.deepseek.*`          | AI 意图解析    |
| 讯飞 ASR   | `schedjun.iflytek.asr.*`        | 语音识别       |
| API 地址   | `mobile/constants/apiConfig.ts` | 移动端后端地址    |


完整接口说明见 [doc/api.md](./schedjun/doc/api.md)。

---

## 语音助手流程

```
用户按住麦克风说话
    ↓
讯飞 ASR 转文字
    ↓
Spring AI 识别意图（create / update / delete / query）
    ↓
展示确认卡片（创建 / 修改 / 删除）
    ↓
用户确认 → 写入 / 更新 / 删除 schedule 表
```

支持的意图：

- `create_schedule` — 创建日程
- `update_schedule` — 修改已有日程
- `delete_schedule` — 删除日程
- `query_schedule` — 查询日程（文本回复）
- `clarify` — 信息不足，追问用户

---

## 文档

- [API 接口参考](./schedjun/doc/api.md)
- [数据库设计](./schedjun/doc/db.md)

---

## 仓库

[https://github.com/Wenfeng-Chen/schedjun](https://github.com/Wenfeng-Chen/schedjun)