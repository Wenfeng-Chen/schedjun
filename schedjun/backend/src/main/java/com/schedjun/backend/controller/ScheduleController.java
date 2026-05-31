package com.schedjun.backend.controller;

import com.schedjun.backend.common.dto.CreateScheduleDTO;
import com.schedjun.backend.common.result.Result;
import com.schedjun.backend.common.vo.ScheduleVO;
import com.schedjun.backend.service.ScheduleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/schedules")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @PostMapping
    public Result<ScheduleVO> create(@Valid @RequestBody CreateScheduleDTO dto) {
        log.info("创建日程: {}", dto);
        return Result.success(scheduleService.create(dto));
    }
}
