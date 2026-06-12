package com.schedjun.backend.service;

import com.schedjun.backend.common.model.AssistantToolResult;
import com.schedjun.backend.common.model.CustomReminderConfig;
import com.schedjun.backend.common.model.CustomRepeatConfig;
import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.tool.CreateScheduleToolRequest;
import com.schedjun.backend.tool.ScheduleTools;
import com.schedjun.backend.tool.ScheduleTools.PendingDelete;
import com.schedjun.backend.tool.ScheduleTools.PendingUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AssistantChatService {

    @Autowired
    private ChatClient assistantChatClient;

    @Autowired
    private ScheduleTools scheduleTools;

    public AssistantToolResult analyze(
            String asrText,
            List<Message> history,
            String timezone,
            String currentTime
    ) {
        String contextPrompt = """
                [context]
                timezone=%s
                currentTime=%s
                """.formatted(timezone, currentTime);

        try {
            String reply = assistantChatClient.prompt()
                    .messages(history)
                    .user(asrText + "\n\n" + contextPrompt)
                    .tools(scheduleTools)
                    .call()
                    .content();

            CreateScheduleToolRequest pendingRequest = ScheduleTools.consumePendingRequest();
            List<PendingDelete> pendingDeletes = ScheduleTools.consumePendingDeletions();
            PendingUpdate pendingUpdate = ScheduleTools.consumePendingUpdate();
            boolean toolCalled = pendingRequest != null || !pendingDeletes.isEmpty() || pendingUpdate != null;

            String intent;
            ScheduleDraft draft = null;

            if (!pendingDeletes.isEmpty()) {
                intent = "delete_schedule";
                draft = new ScheduleDraft();
                String ids = pendingDeletes.stream()
                        .map(d -> "sch_" + d.scheduleId())
                        .collect(Collectors.joining(","));
                draft.setScheduleId(ids);
                if (!StringUtils.hasText(reply) || reply.contains("确认删除")) {
                    String titles = pendingDeletes.stream()
                            .map(PendingDelete::title)
                            .collect(Collectors.joining("」「"));
                    reply = "确认删除「" + titles + "」这 " + pendingDeletes.size() + " 条日程吗？";
                }
            } else if (pendingRequest != null) {
                intent = "create_schedule";
                draft = buildDraft(pendingRequest);
            } else if (pendingUpdate != null) {
                intent = "update_schedule";
                draft = buildDraftFromUpdate(pendingUpdate);
            } else {
                intent = "chitchat";
                if (StringUtils.hasText(reply) && isClarify(reply)) {
                    intent = "clarify";
                }
            }

            log.info("AI 分析结果: intent={}, toolCalled={}, reply={}", intent, toolCalled, reply);
            return new AssistantToolResult(reply, intent, toolCalled, draft);
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("AI 服务调用失败", ex);
            throw new IllegalStateException("AI 服务暂时不可用，请稍后重试", ex);
        }
    }

    private ScheduleDraft buildDraft(CreateScheduleToolRequest request) {
        ScheduleDraft draft = new ScheduleDraft();
        draft.setTitle(request.getTitle().trim());
        draft.setStartTime(OffsetDateTime.parse(request.getStartTime().trim()));
        draft.setEndTime(OffsetDateTime.parse(request.getEndTime().trim()));
        draft.setNotes(request.getNotes() != null ? request.getNotes().trim() : "");
        draft.setAllDay(Boolean.TRUE.equals(request.getAllDay()));

        RepeatRule repeat = new RepeatRule();
        repeat.setPreset(StringUtils.hasText(request.getRepeatPreset()) ? request.getRepeatPreset().trim() : "never");
        if ("custom".equals(repeat.getPreset()) && request.getRepeatCustomValue() != null) {
            CustomRepeatConfig config = new CustomRepeatConfig();
            config.setInterval(request.getRepeatCustomValue());
            config.setFrequency(request.getRepeatCustomUnit());
            repeat.setCustom(config);
        }
        draft.setRepeat(repeat);

        ReminderRule reminder = new ReminderRule();
        reminder.setEnabled(!Boolean.FALSE.equals(request.getReminderEnabled()));
        reminder.setPreset(StringUtils.hasText(request.getReminderPreset()) ? request.getReminderPreset().trim() : "atStart");
        if ("custom".equals(reminder.getPreset()) && request.getReminderCustomValue() != null) {
            CustomReminderConfig config = new CustomReminderConfig();
            config.setValue(request.getReminderCustomValue());
            config.setUnit(request.getReminderCustomUnit());
            reminder.setCustom(config);
        }
        draft.setReminder(reminder);

        return draft;
    }

    private ScheduleDraft buildDraftFromUpdate(PendingUpdate pending) {
        ScheduleDraft draft = new ScheduleDraft();
        if (pending.condition().id() != null) {
            draft.setScheduleId("sch_" + pending.condition().id());
        }
        if (StringUtils.hasText(pending.updateValue().title())) {
            draft.setTitle(pending.updateValue().title().trim());
        }
        if (StringUtils.hasText(pending.updateValue().startTime())) {
            draft.setStartTime(OffsetDateTime.parse(pending.updateValue().startTime().trim()));
        }
        if (StringUtils.hasText(pending.updateValue().endTime())) {
            draft.setEndTime(OffsetDateTime.parse(pending.updateValue().endTime().trim()));
        }
        if (StringUtils.hasText(pending.updateValue().notes())) {
            draft.setNotes(pending.updateValue().notes().trim());
        }

        boolean hasReminder = StringUtils.hasText(pending.updateValue().reminderPreset())
                || pending.updateValue().reminderEnabled() != null
                || pending.updateValue().reminderCustomValue() != null;
        if (hasReminder) {
            ReminderRule reminder = new ReminderRule();
            if (pending.updateValue().reminderEnabled() != null) {
                reminder.setEnabled(pending.updateValue().reminderEnabled());
            }
            if (StringUtils.hasText(pending.updateValue().reminderPreset())) {
                reminder.setPreset(pending.updateValue().reminderPreset().trim());
            }
            if (pending.updateValue().reminderCustomValue() != null) {
                CustomReminderConfig config = new CustomReminderConfig();
                config.setValue(pending.updateValue().reminderCustomValue());
                config.setUnit(pending.updateValue().reminderCustomUnit());
                reminder.setCustom(config);
                reminder.setPreset("custom");
            }
            draft.setReminder(reminder);
        }

        boolean hasRepeat = StringUtils.hasText(pending.updateValue().repeatPreset())
                || pending.updateValue().repeatCustomValue() != null;
        if (hasRepeat) {
            RepeatRule repeat = new RepeatRule();
            if (StringUtils.hasText(pending.updateValue().repeatPreset())) {
                repeat.setPreset(pending.updateValue().repeatPreset().trim());
            }
            if (pending.updateValue().repeatCustomValue() != null) {
                CustomRepeatConfig config = new CustomRepeatConfig();
                config.setInterval(pending.updateValue().repeatCustomValue());
                config.setFrequency(pending.updateValue().repeatCustomUnit());
                repeat.setCustom(config);
                repeat.setPreset("custom");
            }
            draft.setRepeat(repeat);
        }

        return draft;
    }

    private boolean isClarify(String reply) {
        return reply.contains("请问") || reply.contains("请提供") || reply.contains("不确定")
                || reply.contains("哪个") || reply.contains("哪条");
    }
}
