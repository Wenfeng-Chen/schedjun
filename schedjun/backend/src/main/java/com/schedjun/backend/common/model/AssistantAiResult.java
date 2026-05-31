package com.schedjun.backend.common.model;

import lombok.Data;

@Data
public class AssistantAiResult {

    private String reply;
    private String intent;
    private Boolean needConfirm;
    private ScheduleDraft scheduleDraft;
}
