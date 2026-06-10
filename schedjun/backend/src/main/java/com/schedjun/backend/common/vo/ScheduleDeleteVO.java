package com.schedjun.backend.common.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDeleteVO {

    private int deletedCount;
    private List<String> scheduleIds;
}
