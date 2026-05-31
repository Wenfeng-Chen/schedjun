package com.schedjun.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.dto.CreateScheduleDTO;
import com.schedjun.backend.common.entity.Schedule;
import com.schedjun.backend.common.entity.User;
import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import com.schedjun.backend.common.vo.ScheduleDeleteVO;
import com.schedjun.backend.common.vo.ScheduleScrollVO;
import com.schedjun.backend.common.vo.ScheduleVO;
import com.schedjun.backend.mapper.ScheduleMapper;
import com.schedjun.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ScheduleService {

    private static final String DEFAULT_TIMEZONE = "Asia/Shanghai";
    private static final String DEFAULT_SOURCE = "manual";
    private static final int MAX_SCROLL_LIMIT = 50;
    private static final DateTimeFormatter CURSOR_TIME_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

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
        applyScheduleFields(schedule, dto);
        schedule.setSource(DEFAULT_SOURCE);
        schedule.setCreatedAt(now);
        schedule.setUpdatedAt(now);
        scheduleMapper.insert(schedule);

        return toScheduleVO(schedule, resolveTimezone(user));
    }

    @Transactional
    public ScheduleVO update(CreateScheduleDTO dto) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }

        Long scheduleId = parseScheduleId(dto.getId());

        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("结束时间需晚于开始时间");
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }

        Schedule schedule = requireOwnedSchedule(userId, scheduleId);
        applyScheduleFields(schedule, dto);
        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleMapper.updateById(schedule);

        return toScheduleVO(schedule, resolveTimezone(user));
    }

    @Transactional
    public ScheduleDeleteVO delete(String scheduleIdParam) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }

        Long scheduleId = parseScheduleId(scheduleIdParam);
        requireOwnedSchedule(userId, scheduleId);

        scheduleMapper.delete(new LambdaQueryWrapper<Schedule>()
                .eq(Schedule::getId, scheduleId)
                .eq(Schedule::getUserId, userId));

        return new ScheduleDeleteVO(true, formatScheduleId(scheduleId));
    }

    public ScheduleScrollVO scrollList(String startDate, String endDate, String keyword, String cursor, int limit) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }

        int safeLimit = Math.min(Math.max(limit, 1), MAX_SCROLL_LIMIT);
        String timezone = resolveTimezone(user);

        LambdaQueryWrapper<Schedule> listQuery = buildListQuery(userId, startDate, endDate, keyword);
        applyCursorFilter(listQuery, cursor);
        listQuery.orderByAsc(Schedule::getStartTime)
                .orderByAsc(Schedule::getId)
                .last(String.format("LIMIT %d", safeLimit + 1));

        List<Schedule> fetched = scheduleMapper.selectList(listQuery);
        boolean hasMore = fetched.size() > safeLimit;
        List<Schedule> pageItems = hasMore ? fetched.subList(0, safeLimit) : fetched;

        List<ScheduleVO> records = pageItems.stream()
                .map(schedule -> toScheduleVO(schedule, timezone))
                .toList();

        String nextCursor = hasMore && !pageItems.isEmpty()
                ? encodeCursor(pageItems.get(pageItems.size() - 1))
                : null;

        return new ScheduleScrollVO(records, hasMore, nextCursor);
    }

    private void applyCursorFilter(LambdaQueryWrapper<Schedule> wrapper, String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return;
        }

        String[] parts = cursor.trim().split("\\|", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("游标格式无效");
        }

        LocalDateTime cursorStartTime = LocalDateTime.parse(parts[0], CURSOR_TIME_FORMAT);
        Long cursorId = Long.parseLong(parts[1]);

        wrapper.and(query -> query
                .gt(Schedule::getStartTime, cursorStartTime)
                .or(nested -> nested
                        .eq(Schedule::getStartTime, cursorStartTime)
                        .gt(Schedule::getId, cursorId)));
    }

    private String encodeCursor(Schedule schedule) {
        return schedule.getStartTime().format(CURSOR_TIME_FORMAT) + "|" + schedule.getId();
    }

    private LambdaQueryWrapper<Schedule> buildListQuery(
            Long userId,
            String startDate,
            String endDate,
            String keyword
    ) {
        LambdaQueryWrapper<Schedule> wrapper = new LambdaQueryWrapper<Schedule>()
                .eq(Schedule::getUserId, userId);

        if (StringUtils.hasText(startDate)) {
            LocalDate start = LocalDate.parse(startDate);
            wrapper.ge(Schedule::getStartTime, start.atStartOfDay());
        }

        if (StringUtils.hasText(endDate)) {
            LocalDate end = LocalDate.parse(endDate);
            wrapper.lt(Schedule::getStartTime, end.plusDays(1).atStartOfDay());
        }

        if (StringUtils.hasText(keyword)) {
            String trimmedKeyword = keyword.trim();
            wrapper.and(query -> query
                    .like(Schedule::getTitle, trimmedKeyword)
                    .or()
                    .like(Schedule::getNotes, trimmedKeyword));
        }

        return wrapper;
    }

    static String formatScheduleId(Long id) {
        return "sch_" + id;
    }

    static Long parseScheduleId(String scheduleId) {
        if (!StringUtils.hasText(scheduleId)) {
            throw new IllegalArgumentException("日程 ID 不能为空");
        }

        String trimmed = scheduleId.trim();
        if (!trimmed.startsWith("sch_")) {
            throw new IllegalArgumentException("日程 ID 格式无效");
        }

        try {
            return Long.parseLong(trimmed.substring(4));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("日程 ID 格式无效");
        }
    }

    private void applyScheduleFields(Schedule schedule, CreateScheduleDTO dto) {
        schedule.setTitle(dto.getTitle().trim());
        schedule.setStartTime(toLocalDateTime(dto.getStartTime()));
        schedule.setEndTime(toLocalDateTime(dto.getEndTime()));
        schedule.setNotes(normalizeNotes(dto.getNotes()));
        schedule.setRepeatJson(toJson(normalizeRepeat(dto.getRepeat())));
        schedule.setReminderJson(toJson(normalizeReminder(dto.getReminder())));
    }

    private Schedule requireOwnedSchedule(Long userId, Long scheduleId) {
        Schedule schedule = scheduleMapper.selectOne(new LambdaQueryWrapper<Schedule>()
                .eq(Schedule::getId, scheduleId)
                .eq(Schedule::getUserId, userId));
        if (schedule == null) {
            throw new IllegalArgumentException("日程不存在");
        }
        return schedule;
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
