package com.schedjun.backend.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "schedjun.iflytek.asr")
@Data
public class IflytekAsrProperties {

    private String appId;
    private String apiKey;
    private String apiSecret;
    private String host = "iat-api.xfyun.cn";
    private String path = "/v2/iat";
    private String language = "zh_cn";
    private int sampleRate = 16000;
}
