package com.schedjun.backend.controller;



import com.schedjun.backend.common.dto.CreateScheduleDTO;

import com.schedjun.backend.common.result.Result;

import com.schedjun.backend.common.vo.ScheduleDeleteVO;
import com.schedjun.backend.common.vo.ScheduleScrollVO;

import com.schedjun.backend.common.vo.ScheduleVO;

import com.schedjun.backend.service.ScheduleService;

import jakarta.validation.Valid;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.web.bind.annotation.PutMapping;

import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.RequestParam;

import org.springframework.web.bind.annotation.RestController;



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

    @PutMapping
    public Result<ScheduleVO> update(@Valid @RequestBody CreateScheduleDTO dto) {
        log.info("更新日程: {}", dto);
        return Result.success(scheduleService.update(dto));
    }

    @DeleteMapping("/{scheduleId}")
    public Result<ScheduleDeleteVO> delete(@PathVariable String scheduleId) {
        log.info("删除日程: {}", scheduleId);
        return Result.success(scheduleService.delete(scheduleId));
    }

    @GetMapping

    public Result<ScheduleScrollVO> list(

            @RequestParam(required = false) String startDate,

            @RequestParam(required = false) String endDate,

            @RequestParam(required = false) String keyword,

            @RequestParam(required = false) String cursor,

            @RequestParam(defaultValue = "20") int limit

    ) {

        return Result.success(scheduleService.scrollList(startDate, endDate, keyword, cursor, limit));

    }

}

