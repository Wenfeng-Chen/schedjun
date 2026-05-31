package com.schedjun.backend.common.dto;

import com.schedjun.backend.common.model.ScheduleDraft;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssistantConfirmDTO {

    @NotBlank(message = "groupId 不能为空")
    private String groupId;

    @NotBlank(message = "messageId 不能为空")
    private String messageId;

    @NotBlank(message = "action 不能为空")
    private String action;

    @Valid
    private ScheduleDraft scheduleDraft;
}
