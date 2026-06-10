package com.schedjun.backend.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.schedjun.backend.client.IflytekAsrClient;
import com.schedjun.backend.client.IflytekAsrStreamSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AssistantAsrWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(AssistantAsrWebSocketHandler.class);
    private static final int SAMPLE_RATE = 16000;

    @Autowired
    private IflytekAsrClient iflytekAsrClient;

    @Autowired
    private ObjectMapper objectMapper;

    private final Map<String, SessionContext> contexts = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        log.info("ASR WS 连接: sessionId={}, userId={}", session.getId(), userId);

        IflytekAsrStreamSession asrSession = iflytekAsrClient.openStreamSession(SAMPLE_RATE, null);
        contexts.put(session.getId(), new SessionContext(asrSession));
        sendJson(session, readyMessage());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        SessionContext context = contexts.get(session.getId());
        if (context == null) {
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(message.getPayload());
            String type = root.path("type").asText("");
            switch (type) {
                case "audio" -> handleAudio(session, context, root);
                case "end" -> handleEnd(session, context);
                default -> sendError(session, "未知消息类型: " + type);
            }
        } catch (Exception ex) {
            log.warn("ASR WS 消息处理失败: {}", ex.getMessage());
            sendError(session, ex.getMessage() == null ? "消息处理失败" : ex.getMessage());
            closeSession(session, context);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        SessionContext context = contexts.remove(session.getId());
        if (context != null) {
            context.asrSession.close();
        }
        log.info("ASR WS 关闭: sessionId={}, status={}", session.getId(), status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("ASR WS 传输错误: sessionId={}, error={}", session.getId(), exception.getMessage());
        SessionContext context = contexts.remove(session.getId());
        if (context != null) {
            context.asrSession.close();
        }
    }

    private void handleAudio(WebSocketSession session, SessionContext context, JsonNode root) throws Exception {
        if (context.ended) {
            return;
        }

        String data = root.path("data").asText("");
        if (data.isEmpty()) {
            return;
        }

        byte[] pcm = Base64.getDecoder().decode(data);
        if (pcm.length == 0) {
            return;
        }

        context.asrSession.feedPcm(pcm);
    }

    private void handleEnd(WebSocketSession session, SessionContext context) {
        if (context.ended) {
            return;
        }
        context.ended = true;

        context.asrSession.finish().whenComplete((asrText, error) -> {
            try {
                if (error != null) {
                    sendError(session, error.getMessage() == null ? "语音识别失败" : error.getMessage());
                } else {
                    ObjectNode payload = objectMapper.createObjectNode();
                    payload.put("type", "final");
                    payload.put("asrText", asrText);
                    sendJson(session, payload);
                }
            } catch (Exception ex) {
                log.warn("ASR WS 返回 final 失败: {}", ex.getMessage());
            } finally {
                closeSession(session, context);
            }
        });
    }

    private void closeSession(WebSocketSession session, SessionContext context) {
        contexts.remove(session.getId());
        context.asrSession.close();
        if (session.isOpen()) {
            try {
                session.close(CloseStatus.NORMAL);
            } catch (Exception ex) {
                log.debug("关闭 ASR WS 失败: {}", ex.getMessage());
            }
        }
    }

    private ObjectNode readyMessage() {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("type", "ready");
        return payload;
    }

    private void sendError(WebSocketSession session, String message) {
        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("type", "error");
            payload.put("message", message);
            sendJson(session, payload);
        } catch (Exception ex) {
            log.debug("发送 ASR WS 错误失败: {}", ex.getMessage());
        }
    }

    private void sendJson(WebSocketSession session, JsonNode payload) throws Exception {
        if (!session.isOpen()) {
            return;
        }
        synchronized (session) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
        }
    }

    private static final class SessionContext {
        private final IflytekAsrStreamSession asrSession;
        private boolean ended;

        private SessionContext(IflytekAsrStreamSession asrSession) {
            this.asrSession = asrSession;
        }
    }
}
