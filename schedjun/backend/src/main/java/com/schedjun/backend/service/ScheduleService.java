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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class ScheduleService {

    private static final String DEFAULT_TIMEZONE = "Asia/Shanghai";
    private static final String DEFAULT_SOURCE = "manual";
    private static final String VOICE_SOURCE = "voice";
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
        return createInternal(dto, DEFAULT_SOURCE);
    }

    @Transactional
    public ScheduleVO createFromVoice(CreateScheduleDTO dto) {
        return createInternal(dto, VOICE_SOURCE);
    }

    private ScheduleVO createInternal(CreateScheduleDTO dto, String source) {
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

        ZoneId zoneId = ZoneId.of(resolveTimezone(user));
        LocalDateTime now = LocalDateTime.now();
        Schedule schedule = new Schedule();
        schedule.setUserId(userId);
        applyScheduleFields(schedule, dto, zoneId);
        schedule.setSource(source);
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
        ZoneId zoneId = ZoneId.of(resolveTimezone(user));
        applyScheduleFields(schedule, dto, zoneId);
        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleMapper.updateById(schedule);

        return toScheduleVO(schedule, resolveTimezone(user));
    }

    @Transactional
    public ScheduleVO partialUpdate(CreateScheduleDTO dto) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }

        Long scheduleId = parseScheduleId(dto.getId());
        Schedule schedule = requireOwnedSchedule(userId, scheduleId);
        User user = userMapper.selectById(userId);
        ZoneId zoneId = ZoneId.of(resolveTimezone(user));

        if (StringUtils.hasText(dto.getTitle())) {
            schedule.setTitle(dto.getTitle().trim());
        }
        if (dto.getStartTime() != null) {
            schedule.setStartTime(toLocalDateTime(dto.getStartTime(), zoneId));
        }
        if (dto.getEndTime() != null) {
            schedule.setEndTime(toLocalDateTime(dto.getEndTime(), zoneId));
        }
        if (StringUtils.hasText(dto.getNotes())) {
            schedule.setNotes(dto.getNotes().trim());
        }
        if (dto.getRepeat() != null) {
            schedule.setRepeatJson(toJson(normalizeRepeat(dto.getRepeat())));
        }
        if (dto.getReminder() != null) {
            schedule.setReminderJson(toJson(normalizeReminder(dto.getReminder())));
        }

        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleMapper.updateById(schedule);

        return toScheduleVO(schedule, resolveTimezone(user));
    }

    @Transactional
    public ScheduleDeleteVO delete(List<String> scheduleIdParams) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }
        if (scheduleIdParams == null || scheduleIdParams.isEmpty()) {
            throw new IllegalArgumentException("scheduleIds 不能为空");
        }

        Set<Long> uniqueIds = new LinkedHashSet<>();
        for (String scheduleIdParam : scheduleIdParams) {
            if (!StringUtils.hasText(scheduleIdParam)) {
                throw new IllegalArgumentException("scheduleIds 包含空值");
            }
            uniqueIds.add(parseScheduleId(scheduleIdParam.trim()));
        }

        for (Long scheduleId : uniqueIds) {
            requireOwnedSchedule(userId, scheduleId);
        }

        scheduleMapper.delete(new LambdaQueryWrapper<Schedule>()
                .eq(Schedule::getUserId, userId)
                .in(Schedule::getId, uniqueIds));

        List<String> deletedIds = new ArrayList<>();
        for (Long scheduleId : uniqueIds) {
            deletedIds.add(formatScheduleId(scheduleId));
        }

        return new ScheduleDeleteVO(deletedIds.size(), deletedIds);
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

        long total = scheduleMapper.selectCount(
                new LambdaQueryWrapper<Schedule>().eq(Schedule::getUserId, userId)
        );
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

        ScheduleScrollVO result = new ScheduleScrollVO();
        result.setRecords(records);
        result.setHasMore(hasMore);
        result.setNextCursor(nextCursor);
        result.setTotal(total);
        return result;
    }

    public List<ScheduleVO> listForAssistantContext(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }

        ZoneId zoneId = ZoneId.of(resolveTimezone(user));
        LocalDate today = LocalDate.now(zoneId);

        LambdaQueryWrapper<Schedule> query = buildListQuery(
                userId,
                today.minusDays(3).toString(),
                today.plusDays(7).toString(),
                null
        );
        query.orderByAsc(Schedule::getStartTime)
                .orderByAsc(Schedule::getId)
                .last("LIMIT 10");

        return scheduleMapper.selectList(query).stream()
                .map(schedule -> toScheduleVO(schedule, resolveTimezone(user)))
                .toList();
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
            if (trimmed.chars().allMatch(Character::isDigit)) {
                return Long.parseLong(trimmed);
            }
            throw new IllegalArgumentException("日程 ID 格式无效");
        }

        try {
            return Long.parseLong(trimmed.substring(4));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("日程 ID 格式无效");
        }
    }

    private void applyScheduleFields(Schedule schedule, CreateScheduleDTO dto, ZoneId zoneId) {
        schedule.setTitle(dto.getTitle().trim());
        schedule.setStartTime(toLocalDateTime(dto.getStartTime(), zoneId));
        schedule.setEndTime(toLocalDateTime(dto.getEndTime(), zoneId));
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

    private LocalDateTime toLocalDateTime(OffsetDateTime dateTime, ZoneId zoneId) {
        return dateTime.atZoneSameInstant(zoneId).toLocalDateTime();
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
        if (!StringUtils.hasText(json)) {
            return defaultRule(type);
        }
        try {
            T parsed = objectMapper.readValue(json, type);
            return parsed != null ? parsed : defaultRule(type);
        } catch (JsonProcessingException ex) {
            log.warn("日程规则 JSON 解析失败，使用默认值: {}", json, ex);
            return defaultRule(type);
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T defaultRule(Class<T> type) {
        if (type == RepeatRule.class) {
            RepeatRule repeat = new RepeatRule();
            repeat.setPreset("never");
            return (T) repeat;
        }
        if (type == ReminderRule.class) {
            ReminderRule reminder = new ReminderRule();
            reminder.setEnabled(true);
            reminder.setPreset("atStart");
            return (T) reminder;
        }
        throw new IllegalArgumentException("不支持的规则类型");
    }
}
