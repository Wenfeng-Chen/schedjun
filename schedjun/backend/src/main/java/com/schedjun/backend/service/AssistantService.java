package com.schedjun.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.dto.AssistantConfirmDTO;
import com.schedjun.backend.common.dto.CreateScheduleDTO;
import com.schedjun.backend.common.entity.AssistantMessage;
import com.schedjun.backend.common.entity.User;
import com.schedjun.backend.common.model.AssistantAiResult;
import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.common.vo.AssistantConfirmVO;
import com.schedjun.backend.common.vo.ScheduleVO;
import com.schedjun.backend.common.vo.VoiceToScheduleVO;
import com.schedjun.backend.mapper.UserMapper;
import org.springframework.ai.chat.messages.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    private AsrService asrService;

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

    @Autowired
    private AssistantIntentResolver assistantIntentResolver;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public VoiceToScheduleVO voiceToSchedule(
            String groupId,
            MultipartFile audio,
            String format,
            int sampleRate,
            String language,
            boolean autoConfirm,
            String timezone,
            String currentTime
    ) throws IOException {
        Long userId = requireUserId();
        validateVoiceRequest(groupId, audio, format, sampleRate);

        String resolvedTimezone = resolveUserTimezone(userId, timezone);
        String resolvedCurrentTime = StringUtils.hasText(currentTime)
                ? currentTime.trim()
                : ZonedDateTime.now(ZoneId.of(resolvedTimezone)).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String resolvedLanguage = StringUtils.hasText(language) ? language.trim() : null;

        byte[] audioBytes = audio.getBytes();
        String asrText = asrService.transcribe(audioBytes, format, sampleRate, resolvedLanguage);

        List<Message> history = assistantMessageService.buildChatHistory(userId, groupId);
        List<ScheduleVO> existingSchedules = scheduleService.listForAssistantContext(userId);
        String existingSchedulesJson = buildSchedulesContext(existingSchedules);
        AssistantAiResult aiResult = assistantChatService.analyze(
                asrText,
                history,
                resolvedTimezone,
                resolvedCurrentTime,
                existingSchedulesJson
        );

        aiResult = assistantIntentResolver.refine(
                asrText,
                aiResult,
                existingSchedules,
                resolvedTimezone,
                resolvedCurrentTime
        );

        String intent = aiResult.getIntent();
        if (aiResult.getScheduleDraft() != null
                && (CREATE_INTENT.equals(intent) || UPDATE_INTENT.equals(intent))) {
            assistantScheduleDraftService.alignDraftWithAsr(
                    aiResult.getScheduleDraft(),
                    asrText,
                    resolvedTimezone,
                    resolvedCurrentTime
            );
        }

        assistantMessageService.saveUserMessage(userId, groupId, asrText);
        String messageId = assistantMessageService.saveAssistantMessage(
                userId,
                groupId,
                aiResult.getReply(),
                intent,
                aiResult.getScheduleDraft()
        );

        boolean needConfirm = Boolean.TRUE.equals(aiResult.getNeedConfirm());
        ScheduleVO schedule = null;

        if (autoConfirm && aiResult.getScheduleDraft() != null) {
            ScheduleDraft draft = aiResult.getScheduleDraft();
            assistantScheduleDraftService.normalizeDraftZone(draft, resolvedTimezone);
            if (CREATE_INTENT.equals(intent) && isCreateDraftComplete(draft)) {
                schedule = scheduleService.createFromVoice(toCreateDto(draft));
                needConfirm = false;
            } else if (UPDATE_INTENT.equals(intent) && isUpdateDraftComplete(draft)) {
                schedule = scheduleService.update(toCreateDto(draft));
                needConfirm = false;
            } else if (DELETE_INTENT.equals(intent) && isDeleteDraftComplete(draft)) {
                scheduleService.delete(draft.getScheduleId().trim());
                needConfirm = false;
            }
        }

        return new VoiceToScheduleVO(
                groupId,
                asrText,
                aiResult.getReply(),
                intent,
                aiResult.getScheduleDraft(),
                schedule,
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
            scheduleService.delete(draft.getScheduleId().trim());
            return new AssistantConfirmVO("日程已删除。", null);
        }

        if (!isCreateDraftComplete(draft)) {
            throw new IllegalArgumentException("日程信息不完整");
        }
        ScheduleVO schedule = scheduleService.createFromVoice(toCreateDto(draft));
        return new AssistantConfirmVO("日程已创建。", schedule);
    }

    private String buildSchedulesContext(List<ScheduleVO> schedules) {
        try {
            return objectMapper.writeValueAsString(schedules);
        } catch (JsonProcessingException ex) {
            return "[]";
        }
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

    private void validateVoiceRequest(String groupId, MultipartFile audio, String format, int sampleRate) {
        if (!StringUtils.hasText(groupId)) {
            throw new IllegalArgumentException("groupId 不能为空");
        }
        if (audio == null || audio.isEmpty()) {
            throw new IllegalArgumentException("音频不能为空");
        }
        if (!StringUtils.hasText(format)) {
            throw new IllegalArgumentException("format 不能为空");
        }
        if (sampleRate <= 0) {
            throw new IllegalArgumentException("sampleRate 无效");
        }
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
