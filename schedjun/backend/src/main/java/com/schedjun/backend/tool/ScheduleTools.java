package com.schedjun.backend.tool;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.entity.Schedule;
import com.schedjun.backend.mapper.ScheduleMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Slf4j
@Component
public class ScheduleTools {

    private static final Pattern FULL_DATETIME = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final ThreadLocal<CreateScheduleToolRequest> PENDING_REQUEST = new ThreadLocal<>();
    private static final ThreadLocal<List<PendingDelete>> PENDING_DELETIONS = ThreadLocal.withInitial(ArrayList::new);

    public record PendingDelete(Long scheduleId, String title) {}

    @Autowired
    private ScheduleMapper scheduleMapper;

    @Tool(description = "创建一个新的日程安排。当用户想要创建、添加、安排一个新日程时调用此工具。"
            + "时间必须是 ISO-8601 格式带时区偏移（例如 2026-06-10T15:00:00+08:00）。"
            + "如果用户没有指定结束时间，默认设为开始时间后 1 小时。"
            + "repeatPreset 可选值：never / daily / weekly / monthly / yearly，默认 never。"
            + "reminderPreset 可选值：atStart / min5 / min15 / min30 / hour1，默认 atStart。")
    public String createSchedule(CreateScheduleToolRequest request) {
        log.info("Tool [createSchedule] 被调用，等待用户确认: {}", request);
        PENDING_REQUEST.set(request);
        return "已准备好创建日程「" + request.getTitle() + "」，请用户确认后再执行。";
    }

    @Tool(description = "查询当前用户的日程列表。根据用户提供的条件筛选日程。"
            + "id 为日程ID，等值匹配。title / notes / repeat / reminder 为模糊匹配（包含关键词即可）。"
            + "时间查询规则（重要）："
            + "1) 仅日期（如 2026-06-12）：查询该天全部日程；"
            + "2) 仅传 startTime 的日期：查询 startTime >= 该日期的日程；仅传 endTime：endTime <= 该日期；"
            + "3) 仅传 startTime 的完整时间戳：startTime >= 该时间；仅传 endTime：endTime <= 该时间；"
            + "4) 同时传 startTime 和 endTime 的完整时间戳：查询与该时间段有重叠的日程（startTime <= end 且 endTime >= start）。"
            + "repeat 匹配重复规则预设值（never/daily/weekly/monthly/yearly），对应数据库 repeatJson 字段。"
            + "reminder 匹配提醒规则预设值（atStart/min5/min15/min30/hour1），对应数据库 reminderJson 字段。"
            + "当用户想查看、搜索、列出日程时调用此工具。"
            + "如果用户没有提供任何筛选条件，返回所有日程。")
    public String querySchedules(ScheduleQueryParam param) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            return "查询失败：用户未登录。";
        }

        log.info("Tool [querySchedules] 被调用: userId={}, param={}", userId, param);

        LambdaQueryWrapper<Schedule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Schedule::getUserId, userId);

        if (param == null) {
            return buildResult(scheduleMapper.selectList(wrapper));
        }

        if (StringUtils.hasText(param.getId())) {
            Long parsedId = parseId(param.getId().trim());
            if (parsedId != null) {
                wrapper.eq(Schedule::getId, parsedId);
            }
        }
        if (StringUtils.hasText(param.getTitle())) {
            wrapper.like(Schedule::getTitle, param.getTitle().trim());
        }
        if (StringUtils.hasText(param.getNotes())) {
            wrapper.like(Schedule::getNotes, param.getNotes().trim());
        }
        if (StringUtils.hasText(param.getRepeat())) {
            wrapper.like(Schedule::getRepeatJson, param.getRepeat().trim());
        }
        if (StringUtils.hasText(param.getReminder())) {
            wrapper.like(Schedule::getReminderJson, param.getReminder().trim());
        }
        if (StringUtils.hasText(param.getSource())) {
            wrapper.eq(Schedule::getSource, param.getSource().trim());
        }

        applyTimeRange(wrapper, param.getStartTime(), param.getEndTime());

        wrapper.orderByAsc(Schedule::getStartTime);

        List<Schedule> schedules = scheduleMapper.selectList(wrapper);
        return buildResult(schedules);
    }

    @Tool(description = "批量删除日程。传入日程ID列表（数字或 sch_xxx 格式）。"
            + "当用户想删除一条或多条日程时调用此工具，将所有要删的ID一次性传入。"
            + "必须先调用 querySchedules 查询出要删除的日程及其ID，然后从结果中提取所有ID传入。"
            + "本工具不会直接删除，需要用户确认后才会执行。")
    public String deleteSchedules(List<String> scheduleIds) {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            return "删除失败：用户未登录。";
        }
        if (scheduleIds == null || scheduleIds.isEmpty()) {
            return "删除失败：请提供要删除的日程ID。";
        }

        List<PendingDelete> pendingList = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        for (String sid : scheduleIds) {
            Long parsedId = parseId(sid.trim());
            if (parsedId == null) {
                errors.add(sid + "：无效的ID");
                continue;
            }
            Schedule schedule = scheduleMapper.selectById(parsedId);
            if (schedule == null) {
                errors.add(sid + "：未找到");
                continue;
            }
            if (!userId.equals(schedule.getUserId())) {
                errors.add(schedule.getTitle() + "：无权删除");
                continue;
            }
            pendingList.add(new PendingDelete(parsedId, schedule.getTitle()));
        }

        PENDING_DELETIONS.get().addAll(pendingList);
        log.info("Tool [deleteSchedules] 等待确认: userId={}, count={}, titles={}",
                userId, pendingList.size(),
                pendingList.stream().map(PendingDelete::title).collect(Collectors.joining(",")));

        if (pendingList.isEmpty()) {
            return "删除失败：" + String.join("；", errors);
        }

        String titles = pendingList.stream().map(PendingDelete::title).collect(Collectors.joining("」「"));
        String msg = "确认删除「" + titles + "」这 " + pendingList.size() + " 条日程吗？";
        if (!errors.isEmpty()) {
            msg += "\n（" + String.join("；", errors) + "）";
        }
        return msg;
    }

    public static CreateScheduleToolRequest consumePendingRequest() {
        CreateScheduleToolRequest request = PENDING_REQUEST.get();
        PENDING_REQUEST.remove();
        return request;
    }

    public static List<PendingDelete> consumePendingDeletions() {
        List<PendingDelete> list = new ArrayList<>(PENDING_DELETIONS.get());
        PENDING_DELETIONS.get().clear();
        return list;
    }

    /**
     * 根据 startTime / endTime 参数拼接时间范围条件。
     * <ul>
     *   <li>两者都是完整时间戳 → 时间段重叠查询：startTime &lt;= endValue AND endTime &gt;= startValue</li>
     *   <li>仅 startTime 是完整时间戳 → startTime &gt;= value</li>
     *   <li>仅 endTime 是完整时间戳 → endTime &lt;= value</li>
     *   <li>日期字符串 → 按当天或范围处理</li>
     * </ul>
     */
    private void applyTimeRange(
            LambdaQueryWrapper<Schedule> wrapper,
            String startRaw,
            String endRaw
    ) {
        boolean hasStart = StringUtils.hasText(startRaw);
        boolean hasEnd = StringUtils.hasText(endRaw);
        if (!hasStart && !hasEnd) {
            return;
        }

        LocalDateTime startValue = hasStart ? toLocalDateTime(startRaw.trim()) : null;
        LocalDateTime endValue = hasEnd ? toLocalDateTime(endRaw.trim()) : null;

        // 两个完整时间戳 → 时间段重叠
        if (isFullDatetime(startRaw) && isFullDatetime(endRaw)
                && startValue != null && endValue != null) {
            wrapper.le(Schedule::getStartTime, endValue)
                   .ge(Schedule::getEndTime, startValue);
            return;
        }

        // 两个日期字符串 → 范围
        if (isDateOnly(startRaw) && isDateOnly(endRaw)
                && startValue != null && endValue != null) {
            wrapper.ge(Schedule::getStartTime, startValue)
                   .le(Schedule::getStartTime, endValue.toLocalDate().atTime(23, 59, 59));
            return;
        }

        // 单独处理
        if (hasStart && startValue != null) {
            if (isFullDatetime(startRaw)) {
                wrapper.ge(Schedule::getStartTime, startValue);
            } else {
                wrapper.ge(Schedule::getStartTime, startValue);
                wrapper.le(Schedule::getStartTime, startValue.toLocalDate().atTime(23, 59, 59));
            }
        }
        if (hasEnd && endValue != null) {
            if (isFullDatetime(endRaw)) {
                wrapper.le(Schedule::getEndTime, endValue);
            } else {
                wrapper.le(Schedule::getEndTime, endValue.toLocalDate().atTime(23, 59, 59));
            }
        }
    }

    private boolean isFullDatetime(String value) {
        return StringUtils.hasText(value) && FULL_DATETIME.matcher(value.trim()).find();
    }

    private boolean isDateOnly(String value) {
        return StringUtils.hasText(value) && !FULL_DATETIME.matcher(value.trim()).find();
    }

    private LocalDateTime toLocalDateTime(String value) {
        String trimmed = value.trim();
        if (FULL_DATETIME.matcher(trimmed).find()) {
            String timePortion = trimmed.length() > 19 ? trimmed.substring(0, 19) : trimmed;
            return LocalDateTime.parse(timePortion, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
        }
        return LocalDate.parse(trimmed, DATE_FMT).atStartOfDay();
    }

    private Long parseId(String id) {
        if (id.startsWith("sch_")) {
            try {
                return Long.parseLong(id.substring(4));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String buildResult(List<Schedule> schedules) {
        if (schedules == null || schedules.isEmpty()) {
            return "未找到符合条件的日程。";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("找到 ").append(schedules.size()).append(" 条日程：");

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (int i = 0; i < schedules.size(); i++) {
            Schedule s = schedules.get(i);
            sb.append("\n").append(i + 1).append(". [ID:").append(s.getId()).append("] ").append(s.getTitle());

            if (s.getStartTime() != null) {
                sb.append(" 时间：").append(s.getStartTime().format(fmt));
            }
            if (s.getEndTime() != null) {
                sb.append(" - ").append(s.getEndTime().format(fmt));
            }
            if (StringUtils.hasText(s.getNotes())) {
                sb.append(" 备注：").append(s.getNotes());
            }
        }

        return sb.toString();
    }
}
