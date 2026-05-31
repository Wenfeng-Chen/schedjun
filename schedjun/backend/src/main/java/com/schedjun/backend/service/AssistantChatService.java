package com.schedjun.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.model.AssistantAiResult;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AssistantChatService {

    private static final Pattern JSON_BLOCK = Pattern.compile("```(?:json)?\\s*(.*?)\\s*```", Pattern.DOTALL);

    @Autowired
    private ChatClient assistantChatClient;

    @Autowired
    private ObjectMapper objectMapper;

    public AssistantAiResult analyze(
            String asrText,
            List<Message> history,
            String timezone,
            String currentTime,
            String existingSchedulesJson
    ) {
        String contextPrompt = """
                [context]
                timezone=%s
                currentTime=%s
                existingSchedules=%s
                """.formatted(timezone, currentTime, existingSchedulesJson);

        String raw = assistantChatClient.prompt()
                .messages(history)
                .user(asrText + "\n\n" + contextPrompt)
                .call()
                .content();

        return parseResult(raw);
    }

    private AssistantAiResult parseResult(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw new IllegalStateException("AI 未返回有效内容");
        }

        String json = extractJson(raw.trim());
        try {
            AssistantAiResult result = objectMapper.readValue(json, AssistantAiResult.class);
            if (!StringUtils.hasText(result.getReply())) {
                result.setReply("好的，我已收到。");
            }
            if (!StringUtils.hasText(result.getIntent())) {
                result.setIntent("chitchat");
            }
            if (result.getNeedConfirm() == null) {
                result.setNeedConfirm(false);
            }
            return result;
        } catch (Exception ex) {
            throw new IllegalStateException("AI 响应解析失败", ex);
        }
    }

    private String extractJson(String raw) {
        Matcher matcher = JSON_BLOCK.matcher(raw);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return raw.substring(start, end + 1);
        }
        return raw;
    }
}
