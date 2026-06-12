# Spring AI ToolCalling 机制

## 核心流程

| 步骤 | 说明 |
| --- | --- |
| ① 注册工具 | `@Tool` 标注 Java 方法，注入 `ChatClient` |
| ② AI 决策 | 用户输入 + 工具列表 → LLM 选择工具、填入参数 |
| ③ 反射执行 | Spring AI 反射调用对应的 `@Tool` 方法 |
| ④ 生成回复 | 工具返回结果 → LLM 组织自然语言回复 |

## 链路图

```mermaid
graph LR
    APP[应用代码] -->|注册 @Tool| TL[@Tool 方法]
    APP -->|用户输入| AI[大语言模型]
    AI -->|选择工具 + 填参| TL
    TL -->|执行结果| AI
    AI -->|自然语言回复| APP
```

**APP** 向 AI 提交用户输入和工具列表；**AI** 自主选择工具并填入参数；**@Tool 方法** 执行后结果回传；**AI** 生成最终回复返回 APP。

## 关键设计

- **AI 自主决策**：无需写 if-else 意图路由，LLM 自己判断何时调哪个工具
- **参数自动填充**：方法签名即是 Tool Schema，LLM 按语义将用户的话转为结构化参数
- **无需额外通信**：Tool 调用和结果回传都在同一次 API 请求内完成，Spring AI 自动编排
