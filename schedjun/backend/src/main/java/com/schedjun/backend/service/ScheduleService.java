package com.schedjun.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.dto.CreateScheduleDTO;
import com.schedjun.backend.common.entity.Schedule;
import com.schedjun.backend.common.entity.User;
import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import com.schedjun.backend.common.vo.ScheduleVO;
import com.schedjun.backend.mapper.ScheduleMapper;
import com.schedjun.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class ScheduleService {

    private static final String DEFAULT_TIMEZONE = "Asia/Shanghai";
    private static final String DEFAULT_SOURCE = "manual";

    @Autowired
    private ScheduleMapper scheduleMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public ScheduleVO create(CreateScheduleDTO dto) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }

        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("结束时间需晚于开始时间");
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }

        LocalDateTime now = LocalDateTime.now();
        Schedule schedule = new Schedule();
        schedule.setUserId(userId);
        schedule.setTitle(dto.getTitle().trim());
        schedule.setStartTime(toLocalDateTime(dto.getStartTime()));
        schedule.setEndTime(toLocalDateTime(dto.getEndTime()));
        schedule.setNotes(normalizeNotes(dto.getNotes()));
        schedule.setRepeatJson(toJson(normalizeRepeat(dto.getRepeat())));
        schedule.setReminderJson(toJson(normalizeReminder(dto.getReminder())));
        schedule.setSource(DEFAULT_SOURCE);
        schedule.setCreatedAt(now);
        schedule.setUpdatedAt(now);
        scheduleMapper.insert(schedule);

        return toScheduleVO(schedule, resolveTimezone(user));
    }

    static String formatScheduleId(Long id) {
        return "sch_" + id;
    }

    private ScheduleVO toScheduleVO(Schedule schedule, String timezone) {
        ZoneId zoneId = ZoneId.of(timezone);
        return new ScheduleVO(
                formatScheduleId(schedule.getId()),
                schedule.getTitle(),
                formatDateTime(schedule.getStartTime(), zoneId),
                formatDateTime(schedule.getEndTime(), zoneId),
                schedule.getNotes() == null ? "" : schedule.getNotes(),
                fromJson(schedule.getRepeatJson(), RepeatRule.class),
                fromJson(schedule.getReminderJson(), ReminderRule.class),
                schedule.getSource(),
                formatDateTime(schedule.getCreatedAt(), zoneId),
                formatDateTime(schedule.getUpdatedAt(), zoneId)
        );
    }

    private String resolveTimezone(User user) {
        return user.getTimezone() != null ? user.getTimezone() : DEFAULT_TIMEZONE;
    }

    private LocalDateTime toLocalDateTime(OffsetDateTime dateTime) {
        return dateTime.toLocalDateTime();
    }

    private String formatDateTime(LocalDateTime dateTime, ZoneId zoneId) {
        return dateTime.atZone(zoneId).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    private String normalizeNotes(String notes) {
        return notes == null ? "" : notes.trim();
    }

    private RepeatRule normalizeRepeat(RepeatRule repeat) {
        if (repeat.getPreset() == null || repeat.getPreset().isBlank()) {
            repeat.setPreset("never");
        }
        if (!"custom".equals(repeat.getPreset())) {
            repeat.setCustom(null);
        }
        return repeat;
    }

    private ReminderRule normalizeReminder(ReminderRule reminder) {
        if (reminder.getEnabled() == null) {
            reminder.setEnabled(!"none".equals(reminder.getPreset()));
        }
        if (reminder.getPreset() == null || reminder.getPreset().isBlank()) {
            reminder.setPreset(reminder.getEnabled() ? "atStart" : "none");
        }
        if (!"custom".equals(reminder.getPreset())) {
            reminder.setCustom(null);
        }
        return reminder;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("日程规则格式无效");
        }
    }

    private <T> T fromJson(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("日程规则解析失败");
        }
    }
}
