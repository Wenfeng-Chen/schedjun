package com.schedjun.backend.tool;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ScheduleTools {

    private static final ThreadLocal<CreateScheduleToolRequest> PENDING_REQUEST = new ThreadLocal<>();

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

    public static CreateScheduleToolRequest consumePendingRequest() {
        CreateScheduleToolRequest request = PENDING_REQUEST.get();
        PENDING_REQUEST.remove();
        return request;
    }
}
