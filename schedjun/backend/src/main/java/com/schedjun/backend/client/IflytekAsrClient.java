package com.schedjun.backend.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.properties.IflytekAsrProperties;
import com.schedjun.backend.service.AudioTranscodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.TimeUnit;

@Component
public class IflytekAsrClient {

    private static final Logger log = LoggerFactory.getLogger(IflytekAsrClient.class);
    /** 16kHz 16bit mono: 1280 bytes ≈ 40ms */
    private static final int FRAME_SIZE = 1280;
    private static final int FRAME_INTERVAL_MS = 40;
    private static final DateTimeFormatter RFC1123 = DateTimeFormatter.RFC_1123_DATE_TIME;

    private final IflytekAsrProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final AudioTranscodeService audioTranscodeService;

    public IflytekAsrClient(
            IflytekAsrProperties properties,
            ObjectMapper objectMapper,
            AudioTranscodeService audioTranscodeService
    ) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.audioTranscodeService = audioTranscodeService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String transcribe(byte[] audioBytes, String format, int sampleRate, String language) {
        validateCredentials();
        PcmChunk pcmChunk = extractPcm(audioBytes, format, sampleRate);
        if (pcmChunk.data().length == 0) {
            throw new IllegalArgumentException("音频内容为空");
        }
        if (pcmChunk.data().length < 3200) {
            throw new IllegalArgumentException("录音太短，请说长一点再试");
        }

        String lang = StringUtils.hasText(language) ? language : properties.getLanguage();
        log.info("开始讯飞 ASR: format={}, pcmBytes={}, sampleRate={}",
                format, pcmChunk.data().length, pcmChunk.sampleRate());
        try {
            return doTranscribe(pcmChunk.data(), pcmChunk.sampleRate(), lang);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("语音识别被中断");
        } catch (Exception ex) {
            throw new IllegalStateException("语音识别失败: " + ex.getMessage(), ex);
        }
    }

    private String doTranscribe(byte[] pcm, int sampleRate, String language) throws Exception {
        String authUrl = buildAuthUrl();
        StringBuilder transcript = new StringBuilder();
        CompletableFuture<Void> finished = new CompletableFuture<>();

        WebSocket.Listener listener = new WebSocket.Listener() {
            private final StringBuilder messageBuffer = new StringBuilder();

            @Override
            public void onOpen(WebSocket webSocket) {
                webSocket.request(Long.MAX_VALUE);
                sendStartFrame(webSocket, sampleRate, language);
                Thread sender = new Thread(() -> {
                    try {
                        sendAudioFramesWithInterval(webSocket, pcm, sampleRate);
                        sendEndFrame(webSocket, sampleRate);
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                        finished.completeExceptionally(ex);
                    } catch (Exception ex) {
                        finished.completeExceptionally(ex);
                    }
                }, "iflytek-asr-sender");
                sender.setDaemon(true);
                sender.start();
            }

            @Override
            public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
                messageBuffer.append(data);
                if (last) {
                    handleResponse(messageBuffer.toString(), transcript, finished);
                    messageBuffer.setLength(0);
                }
                return WebSocket.Listener.super.onText(webSocket, data, last);
            }

            @Override
            public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
                if (!finished.isDone()) {
                    finished.completeExceptionally(new IllegalStateException(
                            "讯飞连接提前关闭: " + statusCode + " " + reason));
                }
                return WebSocket.Listener.super.onClose(webSocket, statusCode, reason);
            }

            @Override
            public void onError(WebSocket webSocket, Throwable error) {
                finished.completeExceptionally(error);
            }
        };

        httpClient.newWebSocketBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .buildAsync(URI.create(authUrl), listener)
                .join();

        finished.get(60, TimeUnit.SECONDS);
        String text = transcript.toString().trim();
        log.info("讯飞 ASR 结果: {}", text.isEmpty() ? "(空)" : text);
        if (!StringUtils.hasText(text)) {
            throw new IllegalArgumentException("未识别到有效语音内容，请靠近麦克风清晰说话");
        }
        return text;
    }

    private void sendStartFrame(WebSocket webSocket, int sampleRate, String language) {
        String payload = """
                {
                  "common": {"app_id": "%s"},
                  "business": {
                    "language": "%s",
                    "domain": "iat",
                    "accent": "mandarin",
                    "vad_eos": 3000,
                    "dwa": "wpgs"
                  },
                  "data": {
                    "status": 0,
                    "format": "audio/L16;rate=%d",
                    "encoding": "raw",
                    "audio": ""
                  }
                }
                """.formatted(properties.getAppId(), language, sampleRate);
        webSocket.sendText(payload, true);
    }

    private void sendAudioFramesWithInterval(WebSocket webSocket, byte[] pcm, int sampleRate)
            throws InterruptedException {
        int offset = 0;
        while (offset < pcm.length) {
            int length = Math.min(FRAME_SIZE, pcm.length - offset);
            byte[] chunk = new byte[length];
            System.arraycopy(pcm, offset, chunk, 0, length);
            offset += length;

            String audioBase64 = Base64.getEncoder().encodeToString(chunk);
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

            if (offset < pcm.length) {
                Thread.sleep(FRAME_INTERVAL_MS);
            }
        }
    }

    private void sendEndFrame(WebSocket webSocket, int sampleRate) {
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

    private void handleResponse(String payload, StringBuilder transcript, CompletableFuture<Void> finished) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            int code = root.path("code").asInt(-1);
            if (code != 0) {
                finished.completeExceptionally(new IllegalStateException(
                        "讯飞 ASR 错误: " + root.path("message").asText("unknown")));
                return;
            }

            JsonNode result = root.path("data").path("result");
            JsonNode ws = result.path("ws");
            if (ws.isArray()) {
                String piece = extractWords(ws);
                String pgs = result.path("pgs").asText("");
                if ("rpl".equals(pgs)) {
                    // 替换模式：清空后写入最新片段（简化处理）
                    transcript.setLength(0);
                    transcript.append(piece);
                } else {
                    transcript.append(piece);
                }
            }

            if (root.path("data").path("status").asInt() == 2) {
                finished.complete(null);
            }
        } catch (Exception ex) {
            finished.completeExceptionally(ex);
        }
    }

    private String extractWords(JsonNode ws) {
        StringBuilder piece = new StringBuilder();
        for (JsonNode wordSlot : ws) {
            for (JsonNode cw : wordSlot.path("cw")) {
                piece.append(cw.path("w").asText(""));
            }
        }
        return piece.toString();
    }

    private PcmChunk extractPcm(byte[] audioBytes, String format, int fallbackSampleRate) {
        String normalized = format == null ? "" : format.trim().toLowerCase(Locale.ROOT);

        if (isMp4Container(audioBytes)
                || "m4a".equals(normalized)
                || "aac".equals(normalized)
                || "mp4".equals(normalized)) {
            return audioTranscodeService.toPcm16Mono16k(audioBytes);
        }
        if ("wav".equals(normalized)) {
            return stripWavHeader(audioBytes, fallbackSampleRate);
        }
        if ("pcm".equals(normalized)) {
            return new PcmChunk(audioBytes, fallbackSampleRate > 0 ? fallbackSampleRate : 16000);
        }
        throw new IllegalArgumentException("暂不支持的音频格式: " + format);
    }

    private PcmChunk stripWavHeader(byte[] wavBytes, int fallbackSampleRate) {
        if (wavBytes.length < 12) {
            throw new IllegalArgumentException("音频文件过短");
        }

        if (isMp4Container(wavBytes)) {
            return audioTranscodeService.toPcm16Mono16k(wavBytes);
        }

        if (!(wavBytes[0] == 'R' && wavBytes[1] == 'I' && wavBytes[2] == 'F' && wavBytes[3] == 'F')) {
            throw new IllegalArgumentException("不是有效的 WAV 文件，请重新录音");
        }

        int offset = 12;
        int sampleRate = fallbackSampleRate > 0 ? fallbackSampleRate : 16000;
        while (offset + 8 <= wavBytes.length) {
            String chunkId = new String(wavBytes, offset, 4, StandardCharsets.US_ASCII);
            int chunkSize = readLittleEndianInt(wavBytes, offset + 4);
            int chunkDataStart = offset + 8;

            if ("fmt ".equals(chunkId) && chunkDataStart + 8 <= wavBytes.length) {
                sampleRate = readLittleEndianInt(wavBytes, chunkDataStart + 4);
            }

            if ("data".equals(chunkId)) {
                if (chunkDataStart >= wavBytes.length) {
                    throw new IllegalArgumentException("WAV 缺少音频数据");
                }
                int dataLength = Math.min(chunkSize, wavBytes.length - chunkDataStart);
                byte[] pcm = new byte[dataLength];
                System.arraycopy(wavBytes, chunkDataStart, pcm, 0, dataLength);
                return new PcmChunk(pcm, sampleRate > 0 ? sampleRate : 16000);
            }

            offset = chunkDataStart + Math.max(chunkSize, 0);
            if (chunkSize % 2 == 1) {
                offset++;
            }
        }

        throw new IllegalArgumentException("WAV 缺少音频数据");
    }

    private boolean isMp4Container(byte[] bytes) {
        return bytes.length >= 8
                && bytes[4] == 'f'
                && bytes[5] == 't'
                && bytes[6] == 'y'
                && bytes[7] == 'p';
    }

    private int readLittleEndianInt(byte[] bytes, int offset) {
        return ByteBuffer.wrap(bytes, offset, 4).order(ByteOrder.LITTLE_ENDIAN).getInt();
    }

    private void validateCredentials() {
        if (!StringUtils.hasText(properties.getAppId())
                || !StringUtils.hasText(properties.getApiKey())
                || !StringUtils.hasText(properties.getApiSecret())) {
            throw new IllegalStateException("讯飞 ASR 未配置");
        }
    }

    private String buildAuthUrl() throws Exception {
        String host = properties.getHost();
        String path = properties.getPath();
        String date = RFC1123.format(ZonedDateTime.now(ZoneOffset.UTC));

        String signatureOrigin = "host: " + host + "\n"
                + "date: " + date + "\n"
                + "GET " + path + " HTTP/1.1";

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(properties.getApiSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = Base64.getEncoder().encodeToString(mac.doFinal(signatureOrigin.getBytes(StandardCharsets.UTF_8)));

        String authorizationOrigin = String.format(
                "api_key=\"%s\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"%s\"",
                properties.getApiKey(),
                signature
        );
        String authorization = Base64.getEncoder().encodeToString(
                authorizationOrigin.getBytes(StandardCharsets.UTF_8));

        return "wss://" + host + path
                + "?authorization=" + urlEncode(authorization)
                + "&date=" + urlEncode(date)
                + "&host=" + urlEncode(host);
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
