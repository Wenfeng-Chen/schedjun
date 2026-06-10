package com.schedjun.backend;

import com.schedjun.backend.common.model.AssistantAiResult;
import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.common.vo.ScheduleVO;
import com.schedjun.backend.service.AssistantIntentResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AssistantIntentResolverTest {

    private AssistantIntentResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new AssistantIntentResolver();
    }

    @Test
    void overridesCreateIntentWhenAsrSaysDelete() {
        AssistantAiResult aiResult = createAiResult("create_schedule", buildDraft("新会议"));
        List<ScheduleVO> schedules = List.of(existingSchedule("sch_1", "开会"));

        AssistantAiResult refined = resolver.refine(
                "删除明天的开会",
                aiResult,
                schedules,
                "Asia/Shanghai",
                "2026-05-30T10:00:00+08:00"
        );

        assertEquals("delete_schedule", refined.getIntent());
        assertTrue(refined.getNeedConfirm());
        assertEquals("sch_1", refined.getScheduleDraft().getScheduleId());
    }

    @Test
    void overridesCreateIntentWhenAsrSaysUpdate() {
        AssistantAiResult aiResult = createAiResult("create_schedule", buildDraft("开会"));
        List<ScheduleVO> schedules = List.of(existingSchedule("sch_2", "开会"));

        AssistantAiResult refined = resolver.refine(
                "把明天的开会改到四点",
                aiResult,
                schedules,
                "Asia/Shanghai",
                "2026-05-30T10:00:00+08:00"
        );

        assertEquals("update_schedule", refined.getIntent());
        assertTrue(refined.getNeedConfirm());
        assertEquals("sch_2", refined.getScheduleDraft().getScheduleId());
    }

    @Test
    void keepsCreateIntentForNewSchedule() {
        AssistantAiResult aiResult = createAiResult("create_schedule", buildDraft("新会议"));

        AssistantAiResult refined = resolver.refine(
                "明天下午三点开会",
                aiResult,
                List.of(),
                "Asia/Shanghai",
                "2026-05-30T10:00:00+08:00"
        );

        assertEquals("create_schedule", refined.getIntent());
    }

    @Test
    void matchesDeleteIntentForTodayBarScheduleByTitle() {
        AssistantAiResult aiResult = createAiResult("create_schedule", buildDraft("去酒吧"));
        List<ScheduleVO> schedules = List.of(existingSchedule(
                "sch_9",
                "去酒吧",
                "2026-05-29T20:00:00+08:00",
                "2026-05-29T23:00:00+08:00",
                ""
        ));

        AssistantAiResult refined = resolver.refine(
                "删除今天去酒吧的日程",
                aiResult,
                schedules,
                "Asia/Shanghai",
                "2026-05-29T10:00:00+08:00"
        );

        assertEquals("delete_schedule", refined.getIntent());
        assertTrue(refined.getNeedConfirm());
        assertEquals("sch_9", refined.getScheduleDraft().getScheduleId());
        assertEquals("好的，确认删除「去酒吧」吗？", refined.getReply());
    }

    @Test
    void matchesDeleteIntentWhenBarKeywordIsInNotes() {
        AssistantAiResult aiResult = createAiResult("create_schedule", buildDraft("看球赛"));
        List<ScheduleVO> schedules = List.of(existingSchedule(
                "sch_10",
                "和朋友看球赛直播",
                "2026-05-29T22:00:00+08:00",
                "2026-05-30T00:30:00+08:00",
                "酒吧包间已订，别开车。"
        ));

        AssistantAiResult refined = resolver.refine(
                "删除今天去酒吧的日程",
                aiResult,
                schedules,
                "Asia/Shanghai",
                "2026-05-29T10:00:00+08:00"
        );

        assertEquals("delete_schedule", refined.getIntent());
        assertEquals("sch_10", refined.getScheduleDraft().getScheduleId());
    }

    @Test
    void clarifiesWhenDeleteWithoutMatchingSchedule() {
        AssistantAiResult aiResult = createAiResult("create_schedule", buildDraft("开会"));

        AssistantAiResult refined = resolver.refine(
                "删除明天的开会",
                aiResult,
                List.of(),
                "Asia/Shanghai",
                "2026-05-30T10:00:00+08:00"
        );

        assertEquals("clarify", refined.getIntent());
        assertFalse(refined.getNeedConfirm());
        assertNull(refined.getScheduleDraft());
    }

    private AssistantAiResult createAiResult(String intent, ScheduleDraft draft) {
        AssistantAiResult result = new AssistantAiResult();
        result.setIntent(intent);
        result.setNeedConfirm(true);
        result.setReply("AI 回复");
        result.setScheduleDraft(draft);
        return result;
    }

    private ScheduleDraft buildDraft(String title) {
        ScheduleDraft draft = new ScheduleDraft();
        draft.setTitle(title);
        draft.setStartTime(OffsetDateTime.parse("2026-05-31T15:00:00+08:00"));
        draft.setEndTime(OffsetDateTime.parse("2026-05-31T16:00:00+08:00"));
        return draft;
    }

    private ScheduleVO existingSchedule(String id, String title) {
        return existingSchedule(
                id,
                title,
                "2026-05-31T15:00:00+08:00",
                "2026-05-31T16:00:00+08:00",
                ""
        );
    }

    private ScheduleVO existingSchedule(
            String id,
            String title,
            String startTime,
            String endTime,
            String notes
    ) {
        ScheduleVO schedule = new ScheduleVO();
        schedule.setId(id);
        schedule.setTitle(title);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setNotes(notes);
        return schedule;
    }
}
