package com.schedjun.backend.service;

import com.schedjun.backend.common.model.AssistantAiResult;
import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.common.vo.ScheduleVO;
import com.schedjun.backend.utils.ChineseTimeParser;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * AI 经常把「修改/删除」误判为 create_schedule，这里用 ASR 关键词 + 已有日程匹配做后处理校正。
 */
@Service
public class AssistantIntentResolver {

    private static final String UPDATE_INTENT = "update_schedule";
    private static final String DELETE_INTENT = "delete_schedule";

    private static final Pattern DELETE_PATTERN = Pattern.compile(
            "删除|删掉|去掉|移除|不要了|取消掉|删了|删去"
    );
    private static final Pattern UPDATE_PATTERN = Pattern.compile(
            "改到|改成|改为|修改|调整|推迟|提前|延后|换到|移到|改期|变更|更新|改一下|改下"
    );
    private static final Pattern CREATE_PATTERN = Pattern.compile(
            "创建|新建|新增|添加|安排|订|预约|提醒我|记一下|帮我记"
    );
    private static final Pattern SCHEDULE_HINT_NOISE = Pattern.compile(
            "删除|删掉|去掉|移除|不要了|取消掉|删了|删去|改到|改成|改为|修改|调整|"
                    + "今天|明天|后天|大后天|上午|下午|晚上|早上|早晨|凌晨|"
                    + "的|日程|安排|一下|这个|那条|那条|帮我|请|把"
    );

    public AssistantAiResult refine(
            String asrText,
            AssistantAiResult aiResult,
            List<ScheduleVO> existingSchedules,
            String timezone,
            String currentTimeIso
    ) {
        if (aiResult == null || !StringUtils.hasText(asrText)) {
            return aiResult;
        }

        String normalizedAsr = asrText.replace(" ", "");
        Operation operation = detectOperation(normalizedAsr);
        if (operation == Operation.UNKNOWN) {
            return aiResult;
        }

        Optional<ScheduleVO> matched = matchSchedule(
                normalizedAsr,
                existingSchedules,
                timezone,
                currentTimeIso
        );

        if (operation == Operation.DELETE) {
            applyDeleteIntent(aiResult, matched);
            return aiResult;
        }

        if (operation == Operation.UPDATE) {
            applyUpdateIntent(aiResult, matched);
            return aiResult;
        }

        return aiResult;
    }

    private void applyDeleteIntent(AssistantAiResult aiResult, Optional<ScheduleVO> matched) {
        aiResult.setIntent(DELETE_INTENT);
        aiResult.setNeedConfirm(true);

        ScheduleDraft draft = ensureDraft(aiResult);
        matched.ifPresent(schedule -> fillDraftFromSchedule(draft, schedule));

        if (matched.isEmpty() && !StringUtils.hasText(draft.getScheduleId())) {
            aiResult.setIntent("clarify");
            aiResult.setNeedConfirm(false);
            aiResult.setReply("我没找到要删除的日程，请说明具体是哪一条，比如「删除明天下午的开会」。");
            aiResult.setScheduleDraft(null);
        } else if (matched.isPresent()) {
            aiResult.setReply("好的，确认删除「" + matched.get().getTitle() + "」吗？");
        }
    }

    private void applyUpdateIntent(AssistantAiResult aiResult, Optional<ScheduleVO> matched) {
        aiResult.setIntent(UPDATE_INTENT);
        aiResult.setNeedConfirm(true);

        ScheduleDraft draft = ensureDraft(aiResult);
        matched.ifPresent(schedule -> {
            if (!StringUtils.hasText(draft.getScheduleId())) {
                fillDraftFromSchedule(draft, schedule);
            }
            if (!StringUtils.hasText(draft.getTitle())) {
                draft.setTitle(schedule.getTitle());
            }
            if (draft.getStartTime() == null && StringUtils.hasText(schedule.getStartTime())) {
                draft.setStartTime(OffsetDateTime.parse(schedule.getStartTime()));
            }
            if (draft.getEndTime() == null && StringUtils.hasText(schedule.getEndTime())) {
                draft.setEndTime(OffsetDateTime.parse(schedule.getEndTime()));
            }
        });

        if (matched.isEmpty() && !StringUtils.hasText(draft.getScheduleId())) {
            aiResult.setIntent("clarify");
            aiResult.setNeedConfirm(false);
            aiResult.setReply("我没找到要修改的日程，请说明是哪一条，比如「把明天的开会改到四点」。");
            aiResult.setScheduleDraft(null);
        }
    }

    private ScheduleDraft ensureDraft(AssistantAiResult aiResult) {
        if (aiResult.getScheduleDraft() == null) {
            aiResult.setScheduleDraft(new ScheduleDraft());
        }
        return aiResult.getScheduleDraft();
    }

    private void fillDraftFromSchedule(ScheduleDraft draft, ScheduleVO schedule) {
        draft.setScheduleId(schedule.getId());
        draft.setTitle(schedule.getTitle());
        if (StringUtils.hasText(schedule.getStartTime())) {
            draft.setStartTime(OffsetDateTime.parse(schedule.getStartTime()));
        }
        if (StringUtils.hasText(schedule.getEndTime())) {
            draft.setEndTime(OffsetDateTime.parse(schedule.getEndTime()));
        }
        draft.setNotes(schedule.getNotes());
        draft.setRepeat(schedule.getRepeat());
        draft.setReminder(schedule.getReminder());
    }

    private Operation detectOperation(String normalizedAsr) {
        boolean delete = DELETE_PATTERN.matcher(normalizedAsr).find();
        boolean update = UPDATE_PATTERN.matcher(normalizedAsr).find();
        boolean create = CREATE_PATTERN.matcher(normalizedAsr).find();

        if (delete && !create) {
            return Operation.DELETE;
        }
        if (update && !create) {
            return Operation.UPDATE;
        }
        if (delete) {
            return Operation.DELETE;
        }
        if (update) {
            return Operation.UPDATE;
        }
        return Operation.UNKNOWN;
    }

    private Optional<ScheduleVO> matchSchedule(
            String normalizedAsr,
            List<ScheduleVO> schedules,
            String timezone,
            String currentTimeIso
    ) {
        if (schedules == null || schedules.isEmpty()) {
            return Optional.empty();
        }

        ZoneId zone = ZoneId.of(timezone);
        LocalDate targetDate = parseCurrentTime(currentTimeIso, zone)
                .toLocalDate()
                .plusDays(ChineseTimeParser.parseDayOffset(normalizedAsr));

        List<ScheduleVO> dayCandidates = new ArrayList<>();
        for (ScheduleVO schedule : schedules) {
            if (StringUtils.hasText(schedule.getStartTime())) {
                LocalDate scheduleDate = OffsetDateTime.parse(schedule.getStartTime())
                        .atZoneSameInstant(zone)
                        .toLocalDate();
                if (scheduleDate.equals(targetDate)) {
                    dayCandidates.add(schedule);
                }
            }
        }

        List<ScheduleVO> candidates = dayCandidates.isEmpty() ? schedules : dayCandidates;

        List<ScheduleVO> descriptionMatches = new ArrayList<>();
        for (ScheduleVO schedule : candidates) {
            if (matchesDescription(normalizedAsr, schedule)) {
                descriptionMatches.add(schedule);
            }
        }
        if (descriptionMatches.size() == 1) {
            return Optional.of(descriptionMatches.get(0));
        }
        if (descriptionMatches.size() > 1) {
            return Optional.of(descriptionMatches.get(0));
        }

        if (candidates.size() == 1) {
            return Optional.of(candidates.get(0));
        }

        return Optional.empty();
    }

    private boolean matchesDescription(String normalizedAsr, ScheduleVO schedule) {
        String title = normalizeText(schedule.getTitle());
        String notes = normalizeText(schedule.getNotes());

        if (StringUtils.hasText(title) && normalizedAsr.contains(title)) {
            return true;
        }
        if (StringUtils.hasText(notes) && normalizedAsr.contains(notes)) {
            return true;
        }

        String hint = extractScheduleHint(normalizedAsr);
        if (!StringUtils.hasText(hint) || hint.length() < 2) {
            return false;
        }

        if (StringUtils.hasText(title) && (title.contains(hint) || hint.contains(title))) {
            return true;
        }
        if (StringUtils.hasText(notes) && notes.contains(hint)) {
            return true;
        }

        for (int len = Math.min(hint.length(), 8); len >= 2; len--) {
            for (int i = 0; i <= hint.length() - len; i++) {
                String fragment = hint.substring(i, i + len);
                if ((StringUtils.hasText(title) && title.contains(fragment))
                        || (StringUtils.hasText(notes) && notes.contains(fragment))) {
                    return true;
                }
            }
        }
        return false;
    }

    private String extractScheduleHint(String normalizedAsr) {
        return SCHEDULE_HINT_NOISE.matcher(normalizedAsr).replaceAll("").trim();
    }

    private String normalizeText(String text) {
        return text == null ? "" : text.replace(" ", "");
    }

    private ZonedDateTime parseCurrentTime(String currentTimeIso, ZoneId zone) {
        if (StringUtils.hasText(currentTimeIso)) {
            return OffsetDateTime.parse(currentTimeIso.trim()).atZoneSameInstant(zone);
        }
        return ZonedDateTime.now(zone);
    }

    private enum Operation {
        DELETE,
        UPDATE,
        UNKNOWN
    }
}
