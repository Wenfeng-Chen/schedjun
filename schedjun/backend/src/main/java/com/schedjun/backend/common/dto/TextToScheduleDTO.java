package com.schedjun.backend.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TextToScheduleDTO {

    @NotBlank(message = "groupId 不能为空")
    private String groupId;

    @NotBlank(message = "text 不能为空")
    private String text;

    private String timezone;

    private String currentTime;

    private boolean autoConfirm;
}
