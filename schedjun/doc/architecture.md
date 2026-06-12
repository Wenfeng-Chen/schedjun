# 系统架构图

graph TB
    direction TB
    %% 样式定义
    classDef layerTitle fill:#eee,stroke:#333,stroke-width:1px,font-weight:bold,text-align:center
    classDef clientLayer fill:#cce5ff,stroke:#004085,stroke-width:1px
    classDef serverLayer fill:#d4edda,stroke:#155724,stroke-width:1px
    classDef handlerLayer fill:#fff3cd,stroke:#856404,stroke-width:1px
    classDef infraLayer fill:#e2d9f3,stroke:#6f42c1,stroke-width:1px
    classDef externalLayer fill:#f8f9fa,stroke:#6c757d,stroke-width:1px
    classDef nodeStyle fill:#fff,stroke:#333,stroke-width:1px,rounded:true,padding:10px,text-align:center

    %% 标题
    subgraph "系统总览 — 分层架构"
        %% 客户端层
        subgraph 客户端层
            A["移动端 App<br/>React Native / Expo"]:::clientLayer
        end

        %% 后端服务层
        subgraph 后端服务层
            direction LR
            C["Controller 层<br/>Auth / User / Schedule / Assistant"]:::serverLayer
            S["Service 层<br/>业务编排"]:::serverLayer
            T["ScheduleTools<br/>Spring AI @Tool"]:::serverLayer
        end

        %% 第三方服务层
        subgraph 第三方服务层
            direction LR
            D["DeepSeek v4<br/>大语言模型"]:::handlerLayer
            F["讯飞 ASR<br/>语音识别"]:::handlerLayer
        end

        %% 数据层
        subgraph 数据层
            G["MySQL<br/>user / schedule / assistant_message"]:::infraLayer
        end
    end

    %% 箭头连接
    A -->|REST API| C
    A -.->|音频流| F
    F -.->|识别文本| A
    C --> S
    S --> T
    T -->|prompt + tools| D
    D -->|响应| T
    S --> M
    M[MyBatis-Plus<br/>数据访问]:::nodeStyle --> G
    S --> M

    %% 应用样式
    class 客户端层,后端服务层,第三方服务层,数据层 layerTitle

**链路说明：**

1. **移动端** 发 REST 请求到后端 Controller
2. 语音场景：移动端录音 → 调用讯飞 ASR → 识别文本 → 发给后端
3. **Service 层** 编排业务，调用 `ScheduleTools`（Spring AI `@Tool`）
4. `@Tool` 方法通过 Spring AI 与 **DeepSeek 大模型** 交互，AI 返回意图和参数
5. 数据通过 **MyBatis-Plus** 落到 **MySQL**
6. 结果原路返回移动端展示
