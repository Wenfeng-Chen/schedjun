package com.schedjun.backend.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TextToScheduleDTO {

    @NotBlank
    private String groupId;

    @NotBlank
    private String text;

    private String timezone;

    private String currentTime;

    private boolean autoConfirm;
}
