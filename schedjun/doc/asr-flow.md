# 语音识别（ASR）流程

## 链路图

```mermaid
sequenceDiagram
    participant App as 移动端
    participant BE as 后端 WebSocket
    participant XF as 讯飞 ASR

    App->>BE: 建立连接 /assistant/asr-stream
    BE->>XF: 创建流式会话
    loop 用户说话中
        App->>BE: PCM 音频分片
        BE->>XF: 40ms 一帧实时转发
        XF-->>BE: 中间识别结果
        BE-->>App: 实时文本（边录边显）
    end
    App->>BE: 说话结束 (end)
    XF-->>BE: 最终识别文本
    BE-->>App: 完整文本
```

## 分步说明

| 步骤 | 说明 |
| --- | --- |
| ① 建连 | 移动端通过 WebSocket 连接后端，后端向讯飞发起流式会话 |
| ② 流式上传 | 录音过程中按 40ms 间隔逐帧发送 PCM 音频 |
| ③ 实时反馈 | 讯飞返回中间识别结果，后端透传，前端实时显示 |
| ④ 结束识别 | 用户停止说话，后端通知讯飞结束并获取最终完整文本 |

## 关键设计

- **后端中转**：密钥不暴露到客户端，由后端统一鉴权转发
- **流式识别**：边录边出字，不等录音结束
