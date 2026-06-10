package com.schedjun.backend.controller;



import com.schedjun.backend.common.dto.AssistantConfirmDTO;

import com.schedjun.backend.common.dto.TextToScheduleDTO;

import com.schedjun.backend.common.result.Result;

import com.schedjun.backend.common.vo.AssistantConfirmVO;

import com.schedjun.backend.common.vo.VoiceToScheduleVO;

import com.schedjun.backend.service.AssistantService;

import jakarta.validation.Valid;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.RestController;



@Slf4j

@RestController

@RequestMapping("/assistant")

public class AssistantController {



    @Autowired

    private AssistantService assistantService;



    @PostMapping("/text-to-schedule")

    public Result<VoiceToScheduleVO> textToSchedule(@Valid @RequestBody TextToScheduleDTO dto) {

        log.info("文本理解: groupId={}, textLength={}", dto.getGroupId(), dto.getText().length());

        return Result.success(assistantService.textToSchedule(dto));

    }

    @PostMapping("/confirm")

    public Result<AssistantConfirmVO> confirm(@Valid @RequestBody AssistantConfirmDTO dto) {

        log.info("确认交互: groupId={}, messageId={}, action={}",

                dto.getGroupId(), dto.getMessageId(), dto.getAction());

        return Result.success(assistantService.confirm(dto));

    }

}

