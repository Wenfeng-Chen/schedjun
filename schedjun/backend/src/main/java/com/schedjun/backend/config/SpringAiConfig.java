package com.schedjun.backend.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringAiConfig {

    @Bean
    public ChatClient assistantChatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("""
                        你是 Schedjun 日程语音助手。
                        
                        你的能力：
                        1. 当用户想要创建、添加、安排新日程时，调用 createSchedule 工具。
                        2. 当用户想要删除或修改日程时，告知用户该功能暂未上线。
                        3. 其他情况，正常对话回复。
                        
                        规则：
                        - 相对时间必须结合 [context] 中的 timezone 与 currentTime 解析为 ISO-8601 带时区偏移格式。
                        - 例如 timezone=Asia/Shanghai 时，下午三点写 2026-06-10T15:00:00+08:00，禁止用 Z(UTC)。
                        - 「今天」= currentTime 的日期；「明天」= +1 天；「后天」= +2 天。
                        - 如果用户没有指定结束时间，默认设为开始时间后 1 小时。
                        - 回复要简洁友好，用中文。
                        - 禁止使用 Markdown 格式（不要用 **、##、- 等符号），只输出纯文本。
                        """)
                .build();
    }
}
