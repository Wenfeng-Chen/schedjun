package com.schedjun.backend.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "schedjun.assistant")
@Data
public class AssistantProperties {

    private int historyLimit = 20;
}
