package com.schedjun.backend.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.properties.IflytekAsrProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class IflytekAsrStreamSession implements AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(IflytekAsrStreamSession.class);
    private static final int REALTIME_FRAME_INTERVAL_MS = 40;
    private static final int VAD_EOS_MS = 10000;

    private final ObjectMapper objectMapper;
    private final String appId;
    private final int sampleRate;
    private final IflytekAsrTranscriptAccumulator transcript = new IflytekAsrTranscriptAccumulator();
    private final CompletableFuture<Void> ready = new CompletableFuture<>();
    private final CompletableFuture<Void> finished = new CompletableFuture<>();
    private final AtomicBoolean closed = new AtomicBoolean(false);

    private WebSocket webSocket;
    private long lastSendMs;

    private IflytekAsrStreamSession(ObjectMapper objectMapper, String appId, int sampleRate) {
        this.objectMapper = objectMapper;
        this.appId = appId;
        this.sampleRate = sampleRate;
    }

    public static IflytekAsrStreamSession connect(
            IflytekAsrProperties properties,
            ObjectMapper objectMapper,
            HttpClient httpClient,
            int sampleRate,
            String language
    ) throws Exception {
        validateCredentials(properties);

        IflytekAsrStreamSession session = new IflytekAsrStreamSession(
                objectMapper,
                properties.getAppId(),
                sampleRate
        );
        String authUrl = IflytekAsrAuth.buildAuthUrl(properties);

        WebSocket.Listener listener = new WebSocket.Listener() {
            private final StringBuilder messageBuffer = new StringBuilder();

            @Override
            public void onOpen(WebSocket socket) {
                session.webSocket = socket;
                socket.request(Long.MAX_VALUE);
                session.sendStartFrame(language);
                session.ready.complete(null);
            }

            @Override
            public CompletionStage<?> onText(WebSocket socket, CharSequence data, boolean last) {
                messageBuffer.append(data);
                if (last) {
                    session.handleResponse(messageBuffer.toString());
                    messageBuffer.setLength(0);
                }
                return WebSocket.Listener.super.onText(socket, data, last);
            }

            @Override
            public CompletionStage<?> onClose(WebSocket socket, int statusCode, String reason) {
                if (!session.finished.isDone()) {
                    session.finished.completeExceptionally(new IllegalStateException(
                            "讯飞连接提前关闭: " + statusCode + " " + reason));
                }
                return WebSocket.Listener.super.onClose(socket, statusCode, reason);
            }

            @Override
            public void onError(WebSocket socket, Throwable error) {
                session.ready.completeExceptionally(error);
                session.finished.completeExceptionally(error);
            }
        };

        httpClient.newWebSocketBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .buildAsync(URI.create(authUrl), listener)
                .join();

        session.ready.get(10, TimeUnit.SECONDS);
        return session;
    }

    public void awaitReady() throws Exception {
        ready.get(10, TimeUnit.SECONDS);
    }

    public synchronized void feedPcm(byte[] pcm) throws InterruptedException {
        if (closed.get()) {
            throw new IllegalStateException("ASR 会话已关闭");
        }
        awaitReadyUnchecked();

        long now = System.currentTimeMillis();
        if (lastSendMs > 0) {
            long elapsed = now - lastSendMs;
            if (elapsed < REALTIME_FRAME_INTERVAL_MS) {
                Thread.sleep(REALTIME_FRAME_INTERVAL_MS - elapsed);
            }
        }

        String audioBase64 = Base64.getEncoder().encodeToString(pcm);
        String payload = """
                {
                  "data": {
                    "status": 1,
                    "format": "audio/L16;rate=%d",
                    "encoding": "raw",
                    "audio": "%s"
                  }
                }
                """.formatted(sampleRate, audioBase64);
        webSocket.sendText(payload, true);
        lastSendMs = System.currentTimeMillis();
    }

    public CompletableFuture<String> finish() {
        if (closed.get()) {
            return CompletableFuture.failedFuture(new IllegalStateException("ASR 会话已关闭"));
        }

        CompletableFuture<String> result = new CompletableFuture<>();
        try {
            awaitReadyUnchecked();
            sendEndFrame();
            finished.orTimeout(60, TimeUnit.SECONDS).whenComplete((ignored, error) -> {
                if (error != null) {
                    result.completeExceptionally(error);
                    return;
                }
                String text = transcript.toText().trim();
                log.info("讯飞流式 ASR 结果: {}", text.isEmpty() ? "(空)" : text);
                if (!StringUtils.hasText(text)) {
                    result.completeExceptionally(
                            new IllegalArgumentException("未识别到有效语音内容，请靠近麦克风清晰说话"));
                } else {
                    result.complete(text);
                }
            });
        } catch (Exception ex) {
            result.completeExceptionally(ex);
        }
        return result;
    }

    @Override
    public void close() {
        if (!closed.compareAndSet(false, true)) {
            return;
        }
        WebSocket socket = webSocket;
        if (socket != null) {
            socket.sendClose(WebSocket.NORMAL_CLOSURE, "client closed");
        }
    }

    private void awaitReadyUnchecked() {
        if (!ready.isDone()) {
            try {
                ready.get(10, TimeUnit.SECONDS);
            } catch (Exception ex) {
                throw new IllegalStateException("讯飞 ASR 未就绪", ex);
            }
        }
        if (ready.isCompletedExceptionally()) {
            throw new IllegalStateException("讯飞 ASR 连接失败");
        }
    }

    private void sendStartFrame(String language) {
        String payload = """
                {
                  "common": {"app_id": "%s"},
                  "business": {
                    "language": "%s",
                    "domain": "iat",
                    "accent": "mandarin",
                    "vad_eos": %d,
                    "dwa": "wpgs"
                  },
                  "data": {
                    "status": 0,
                    "format": "audio/L16;rate=%d",
                    "encoding": "raw",
                    "audio": ""
                  }
                }
                """.formatted(appId, language, VAD_EOS_MS, sampleRate);
        webSocket.sendText(payload, true);
    }

    private void sendEndFrame() {
        String payload = """
                {
                  "data": {
                    "status": 2,
                    "format": "audio/L16;rate=%d",
                    "encoding": "raw",
                    "audio": ""
                  }
                }
                """.formatted(sampleRate);
        webSocket.sendText(payload, true);
    }

    private void handleResponse(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            int code = root.path("code").asInt(-1);
            if (code != 0) {
                finished.completeExceptionally(new IllegalStateException(
                        "讯飞 ASR 错误: " + root.path("message").asText("unknown")));
                return;
            }

            JsonNode result = root.path("data").path("result");
            transcript.appendResult(result);

            if (root.path("data").path("status").asInt() == 2) {
                finished.complete(null);
            }
        } catch (Exception ex) {
            finished.completeExceptionally(ex);
        }
    }

    private static void validateCredentials(IflytekAsrProperties properties) {
        if (!StringUtils.hasText(properties.getAppId())
                || !StringUtils.hasText(properties.getApiKey())
                || !StringUtils.hasText(properties.getApiSecret())) {
            throw new IllegalStateException("讯飞 ASR 未配置");
        }
    }
}
