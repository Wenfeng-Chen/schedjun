package com.schedjun.backend;

import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.service.AssistantScheduleDraftService;
import com.schedjun.backend.utils.ChineseTimeParser;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ChineseTimeParserTest {

    @Test
    void parseHourHintForTomorrowAfternoon() {
        assertEquals(15, ChineseTimeParser.parseHourHint("明天下午三点钟开会"));
        assertEquals(1, ChineseTimeParser.parseDayOffset("明天下午三点钟开会"));
    }

    @Test
    void alignDraftFixesWrongAiTime() {
        AssistantScheduleDraftService service = new AssistantScheduleDraftService();

        ScheduleDraft draft = new ScheduleDraft();
        draft.setTitle("开会");
        draft.setStartTime(OffsetDateTime.parse("2026-06-01T08:00:00+08:00"));
        draft.setEndTime(OffsetDateTime.parse("2026-06-01T09:00:00+08:00"));

        service.alignDraftWithAsr(
                draft,
                "明天下午三点钟开会",
                "Asia/Shanghai",
                "2026-05-31T22:00:00+08:00"
        );

        assertEquals(15, draft.getStartTime().getHour());
        assertEquals(1, draft.getStartTime().getDayOfMonth());
        assertEquals(16, draft.getEndTime().getHour());
    }
}
