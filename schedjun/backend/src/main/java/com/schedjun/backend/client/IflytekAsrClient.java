package com.schedjun.backend.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.properties.IflytekAsrProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class IflytekAsrClient {

    private final IflytekAsrProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public IflytekAsrClient(IflytekAsrProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public IflytekAsrStreamSession openStreamSession(int sampleRate, String language) throws Exception {
        validateCredentials();
        String lang = StringUtils.hasText(language) ? language : properties.getLanguage();
        int rate = sampleRate > 0 ? sampleRate : properties.getSampleRate();
        return IflytekAsrStreamSession.connect(properties, objectMapper, httpClient, rate, lang);
    }

    private void validateCredentials() {
        if (!StringUtils.hasText(properties.getAppId())
                || !StringUtils.hasText(properties.getApiKey())
                || !StringUtils.hasText(properties.getApiSecret())) {
            throw new IllegalStateException("讯飞 ASR 未配置");
        }
    }
}
