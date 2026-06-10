package com.schedjun.backend.common.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class DeleteSchedulesDTO {

    @NotEmpty(message = "scheduleIds 不能为空")
    private List<String> scheduleIds;
}
