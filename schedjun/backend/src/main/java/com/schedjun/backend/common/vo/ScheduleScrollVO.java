package com.schedjun.backend.common.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleScrollVO {

    private List<ScheduleVO> records;
    private boolean hasMore;
    private String nextCursor;
    private long total;
}
