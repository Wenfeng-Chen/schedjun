package com.schedjun.backend.common.model;

import lombok.Data;

import java.util.List;

@Data
public class CustomRepeatConfig {

    private String frequency;
    private Integer interval;
    private List<Integer> weekdays;
    private List<Integer> monthDays;
    private String monthMode;
    private List<Integer> yearMonths;
}
