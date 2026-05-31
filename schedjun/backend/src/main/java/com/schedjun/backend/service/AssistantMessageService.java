package com.schedjun.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.common.properties.AssistantProperties;
import com.schedjun.backend.mapper.AssistantMessageMapper;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class AssistantMessageService {

    @Autowired
    private AssistantMessageMapper assistantMessageMapper;

    @Autowired
    private AssistantProperties assistantProperties;

    @Autowired
    private ObjectMapper objectMapper;

    public List<Message> buildChatHistory(Long userId, String groupId) {
        List<com.schedjun.backend.common.entity.AssistantMessage> records = assistantMessageMapper.selectList(
                new LambdaQueryWrapper<com.schedjun.backend.common.entity.AssistantMessage>()
                        .eq(com.schedjun.backend.common.entity.AssistantMessage::getUserId, userId)
                        .eq(com.schedjun.backend.common.entity.AssistantMessage::getGroupId, groupId)
                        .orderByDesc(com.schedjun.backend.common.entity.AssistantMessage::getCreatedAt)
                        .last("LIMIT " + assistantProperties.getHistoryLimit()));

        if (records.isEmpty()) {
            return List.of();
        }

        List<com.schedjun.backend.common.entity.AssistantMessage> ordered = new ArrayList<>(records);
        Collections.reverse(ordered);

        List<Message> messages = new ArrayList<>();
        for (com.schedjun.backend.common.entity.AssistantMessage record : ordered) {
            if ("user".equals(record.getRole())) {
                messages.add(new UserMessage(record.getContent()));
            } else if ("assistant".equals(record.getRole())) {
                messages.add(new org.springframework.ai.chat.messages.AssistantMessage(record.getContent()));
            }
        }
        return messages;
    }

    public void saveUserMessage(Long userId, String groupId, String content) {
        com.schedjun.backend.common.entity.AssistantMessage message = baseMessage(userId, groupId, "user");
        message.setMessageId(generateMessageId());
        message.setContent(content);
        assistantMessageMapper.insert(message);
    }

    public String saveAssistantMessage(
            Long userId,
            String groupId,
            String content,
            String intent,
            ScheduleDraft scheduleDraft
    ) {
        com.schedjun.backend.common.entity.AssistantMessage message = baseMessage(userId, groupId, "assistant");
        String messageId = generateMessageId();
        message.setMessageId(messageId);
        message.setContent(content);
        message.setIntent(intent);
        if (scheduleDraft != null) {
            message.setScheduleDraftJson(toJson(scheduleDraft));
        }
        assistantMessageMapper.insert(message);
        return messageId;
    }

    private com.schedjun.backend.common.entity.AssistantMessage baseMessage(Long userId, String groupId, String role) {
        com.schedjun.backend.common.entity.AssistantMessage message = new com.schedjun.backend.common.entity.AssistantMessage();
        message.setGroupId(groupId);
        message.setUserId(userId);
        message.setRole(role);
        message.setCreatedAt(LocalDateTime.now());
        return message;
    }

    static String generateMessageId() {
        return "msg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    public com.schedjun.backend.common.entity.AssistantMessage requireAssistantMessage(
            Long userId,
            String groupId,
            String messageId
    ) {
        com.schedjun.backend.common.entity.AssistantMessage message = assistantMessageMapper.selectOne(
                new LambdaQueryWrapper<com.schedjun.backend.common.entity.AssistantMessage>()
                        .eq(com.schedjun.backend.common.entity.AssistantMessage::getUserId, userId)
                        .eq(com.schedjun.backend.common.entity.AssistantMessage::getGroupId, groupId)
                        .eq(com.schedjun.backend.common.entity.AssistantMessage::getMessageId, messageId)
        );
        if (message == null) {
            throw new IllegalArgumentException("消息不存在");
        }
        if (!"assistant".equals(message.getRole())) {
            throw new IllegalArgumentException("无效的消息");
        }
        return message;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("日程草稿格式无效");
        }
    }
}
