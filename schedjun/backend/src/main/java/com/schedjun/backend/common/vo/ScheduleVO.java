package com.schedjun.backend.common.vo;

import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleVO {

    private String id;
    private String title;
    private String startTime;
    private String endTime;
    private String notes;
    private RepeatRule repeat;
    private ReminderRule reminder;
    private String source;
    private String createdAt;
    private String updatedAt;
}
