package com.schedjun.backend.common.model;

import lombok.Data;

@Data
public class ReminderRule {

    private Boolean enabled;
    private String preset;
    private CustomReminderConfig custom;
}
