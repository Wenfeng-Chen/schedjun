package com.schedjun.backend.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "schedjun.jwt")
@Data
public class JwtProperties {

    private String secret;
    private long expiresIn;

}
