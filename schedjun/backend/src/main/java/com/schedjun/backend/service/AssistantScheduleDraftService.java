package com.schedjun.backend.service;

import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.utils.ChineseTimeParser;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
public class AssistantScheduleDraftService {

    public void alignDraftWithAsr(
            ScheduleDraft draft,
            String asrText,
            String timezone,
            String currentTimeIso
    ) {
        if (draft == null || draft.getStartTime() == null || !StringUtils.hasText(asrText)) {
            return;
        }

        Integer hourHint = ChineseTimeParser.parseHourHint(asrText);
        if (hourHint == null) {
            return;
        }

        ZoneId zone = ZoneId.of(timezone);
        ZonedDateTime now = parseCurrentTime(currentTimeIso, zone);
        LocalDate targetDate = now.toLocalDate().plusDays(ChineseTimeParser.parseDayOffset(asrText));
        ZonedDateTime expectedStart = targetDate.atTime(hourHint, 0).atZone(zone);

        ZonedDateTime aiStart = draft.getStartTime().atZoneSameInstant(zone);
        boolean hourMismatch = Math.abs(aiStart.getHour() - hourHint) >= 1;
        boolean dateMismatch = !aiStart.toLocalDate().equals(targetDate);

        if (!hourMismatch && !dateMismatch) {
            normalizeDraftZone(draft, zone);
            return;
        }

        draft.setStartTime(expectedStart.toOffsetDateTime());
        draft.setEndTime(expectedStart.plusHours(1).toOffsetDateTime());
    }

    public void normalizeDraftZone(ScheduleDraft draft, String timezone) {
        if (draft == null) {
            return;
        }
        ZoneId zone = ZoneId.of(timezone);
        normalizeDraftZone(draft, zone);
    }

    private void normalizeDraftZone(ScheduleDraft draft, ZoneId zone) {
        if (draft.getStartTime() != null) {
            ZonedDateTime start = draft.getStartTime().atZoneSameInstant(zone);
            draft.setStartTime(start.toOffsetDateTime());
        }
        if (draft.getEndTime() != null) {
            ZonedDateTime end = draft.getEndTime().atZoneSameInstant(zone);
            draft.setEndTime(end.toOffsetDateTime());
        }
    }

    private ZonedDateTime parseCurrentTime(String currentTimeIso, ZoneId zone) {
        if (StringUtils.hasText(currentTimeIso)) {
            return OffsetDateTime.parse(currentTimeIso.trim()).atZoneSameInstant(zone);
        }
        return ZonedDateTime.now(zone);
    }
}
