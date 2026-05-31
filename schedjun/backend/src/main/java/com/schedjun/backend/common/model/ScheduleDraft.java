package com.schedjun.backend.common.model;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class ScheduleDraft {

    /** 修改/删除时必填，格式 sch_123 */
    private String scheduleId;

    private String title;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private String notes;
    private Boolean allDay;
    private RepeatRule repeat;
    private ReminderRule reminder;
}
