package com.schedjun.backend.service;

import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.dto.AssistantConfirmDTO;
import com.schedjun.backend.common.dto.CreateScheduleDTO;
import com.schedjun.backend.common.dto.TextToScheduleDTO;
import com.schedjun.backend.common.entity.AssistantMessage;
import com.schedjun.backend.common.entity.User;
import com.schedjun.backend.common.model.AssistantToolResult;
import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.common.vo.AssistantConfirmVO;
import com.schedjun.backend.common.vo.ScheduleVO;
import com.schedjun.backend.common.vo.VoiceToScheduleVO;
import com.schedjun.backend.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
public class AssistantService {

    private static final String DEFAULT_TIMEZONE = "Asia/Shanghai";
    private static final String CREATE_INTENT = "create_schedule";
    private static final String UPDATE_INTENT = "update_schedule";
    private static final String DELETE_INTENT = "delete_schedule";
    private static final String ACTION_CONFIRM = "confirm";
    private static final String ACTION_CANCEL = "cancel";

    @Autowired
    private AssistantChatService assistantChatService;

    @Autowired
    private AssistantMessageService assistantMessageService;

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AssistantScheduleDraftService assistantScheduleDraftService;

    @Transactional
    public VoiceToScheduleVO textToSchedule(TextToScheduleDTO dto) {
        Long userId = requireUserId();
        if (!StringUtils.hasText(dto.getGroupId())) {
            throw new IllegalArgumentException("groupId 不能为空");
        }
        if (!StringUtils.hasText(dto.getText())) {
            throw new IllegalArgumentException("text 不能为空");
        }

        String groupId = dto.getGroupId().trim();
        String asrText = dto.getText().trim();
        String resolvedTimezone = resolveUserTimezone(userId, dto.getTimezone());
        String resolvedCurrentTime = StringUtils.hasText(dto.getCurrentTime())
                ? dto.getCurrentTime().trim()
                : ZonedDateTime.now(ZoneId.of(resolvedTimezone)).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        List<Message> history = assistantMessageService.buildChatHistory(userId, groupId);

        AssistantToolResult toolResult = assistantChatService.analyze(
                asrText,
                history,
                resolvedTimezone,
                resolvedCurrentTime
        );

        assistantMessageService.saveUserMessage(userId, groupId, asrText);
        String messageId = assistantMessageService.saveAssistantMessage(
                userId,
                groupId,
                toolResult.getReply(),
                toolResult.getIntent(),
                toolResult.getScheduleDraft()
        );

        boolean needConfirm = CREATE_INTENT.equals(toolResult.getIntent()) && toolResult.isToolCalled();

        log.info("textToSchedule 完成: intent={}, toolCalled={}, needConfirm={}, messageId={}",
                toolResult.getIntent(), toolResult.isToolCalled(), needConfirm, messageId);

        return new VoiceToScheduleVO(
                groupId,
                asrText,
                toolResult.getReply(),
                toolResult.getIntent(),
                toolResult.getScheduleDraft(),
                null,
                needConfirm,
                messageId
        );
    }

    @Transactional
    public AssistantConfirmVO confirm(AssistantConfirmDTO dto) {
        Long userId = requireUserId();
        validateConfirmRequest(dto);

        AssistantMessage message = assistantMessageService.requireAssistantMessage(
                userId,
                dto.getGroupId(),
                dto.getMessageId()
        );

        if (ACTION_CANCEL.equals(dto.getAction())) {
            return new AssistantConfirmVO("好的，已取消。", null);
        }

        String intent = message.getIntent();
        log.info("confirm 执行: messageId={}, intent={}, action={}", dto.getMessageId(), intent, dto.getAction());
        ScheduleDraft draft = dto.getScheduleDraft();
        User user = userMapper.selectById(userId);
        String timezone = resolveUserTimezone(userId, user != null ? user.getTimezone() : null);
        if (draft != null) {
            assistantScheduleDraftService.normalizeDraftZone(draft, timezone);
        }

        if (UPDATE_INTENT.equals(intent)) {
            if (!isUpdateDraftComplete(draft)) {
                throw new IllegalArgumentException("日程信息不完整");
            }
            ScheduleVO schedule = scheduleService.update(toCreateDto(draft));
            return new AssistantConfirmVO("日程已更新。", schedule);
        }

        if (DELETE_INTENT.equals(intent)) {
            if (!isDeleteDraftComplete(draft)) {
                throw new IllegalArgumentException("未指定要删除的日程");
            }
            scheduleService.delete(List.of(draft.getScheduleId().trim()));
            return new AssistantConfirmVO("日程已删除。", null);
        }

        if (!isCreateDraftComplete(draft)) {
            throw new IllegalArgumentException("日程信息不完整");
        }
        ScheduleVO schedule = scheduleService.createFromVoice(toCreateDto(draft));
        return new AssistantConfirmVO("日程已创建。", schedule);
    }

    private void validateConfirmRequest(AssistantConfirmDTO dto) {
        if (!StringUtils.hasText(dto.getGroupId())) {
            throw new IllegalArgumentException("groupId 不能为空");
        }
        if (!StringUtils.hasText(dto.getMessageId())) {
            throw new IllegalArgumentException("messageId 不能为空");
        }
        if (!ACTION_CONFIRM.equals(dto.getAction()) && !ACTION_CANCEL.equals(dto.getAction())) {
            throw new IllegalArgumentException("action 无效");
        }
        if (ACTION_CONFIRM.equals(dto.getAction()) && dto.getScheduleDraft() == null) {
            throw new IllegalArgumentException("scheduleDraft 不能为空");
        }
    }

    private String resolveUserTimezone(Long userId, String requestedTimezone) {
        if (userId != null) {
            User user = userMapper.selectById(userId);
            if (user != null && StringUtils.hasText(user.getTimezone())) {
                return user.getTimezone().trim();
            }
        }
        if (StringUtils.hasText(requestedTimezone)) {
            return requestedTimezone.trim();
        }
        return DEFAULT_TIMEZONE;
    }

    private Long requireUserId() {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }
        return userId;
    }

    private boolean isCreateDraftComplete(ScheduleDraft draft) {
        return draft != null
                && StringUtils.hasText(draft.getTitle())
                && draft.getStartTime() != null
                && draft.getEndTime() != null
                && draft.getEndTime().isAfter(draft.getStartTime());
    }

    private boolean isUpdateDraftComplete(ScheduleDraft draft) {
        return isCreateDraftComplete(draft) && StringUtils.hasText(draft.getScheduleId());
    }

    private boolean isDeleteDraftComplete(ScheduleDraft draft) {
        return draft != null && StringUtils.hasText(draft.getScheduleId());
    }

    private CreateScheduleDTO toCreateDto(ScheduleDraft draft) {
        CreateScheduleDTO dto = new CreateScheduleDTO();
        if (StringUtils.hasText(draft.getScheduleId())) {
            dto.setId(draft.getScheduleId().trim());
        }
        dto.setTitle(draft.getTitle().trim());
        dto.setStartTime(draft.getStartTime());
        dto.setEndTime(draft.getEndTime());
        dto.setNotes(draft.getNotes() == null ? "" : draft.getNotes());
        dto.setAllDay(Boolean.TRUE.equals(draft.getAllDay()));

        RepeatRule repeat = draft.getRepeat();
        if (repeat == null) {
            repeat = new RepeatRule();
            repeat.setPreset("never");
        }
        dto.setRepeat(repeat);

        ReminderRule reminder = draft.getReminder();
        if (reminder == null) {
            reminder = new ReminderRule();
            reminder.setEnabled(true);
            reminder.setPreset("atStart");
        }
        dto.setReminder(reminder);
        return dto;
    }
}
