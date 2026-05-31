package com.schedjun.backend.common.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssistantConfirmVO {

    private String reply;
    private ScheduleVO schedule;
}
