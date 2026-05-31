package com.schedjun.backend.common.dto;

import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class CreateScheduleDTO {

    private String id;

    @NotBlank(message = "标题不能为空")
    @Size(max = 255, message = "标题最多 255 个字符")
    private String title;

    @NotNull(message = "开始时间不能为空")
    private OffsetDateTime startTime;

    @NotNull(message = "结束时间不能为空")
    private OffsetDateTime endTime;

    private String notes;

    private Boolean allDay;

    @NotNull(message = "重复规则不能为空")
    @Valid
    private RepeatRule repeat;

    @NotNull(message = "提醒规则不能为空")
    @Valid
    private ReminderRule reminder;
}
