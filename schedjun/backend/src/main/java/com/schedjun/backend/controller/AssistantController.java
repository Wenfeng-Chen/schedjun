package com.schedjun.backend.controller;

import com.schedjun.backend.common.dto.AssistantConfirmDTO;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/assistant")
public class AssistantController {

    @Autowired
    private AssistantService assistantService;

    @PostMapping("/voice-to-schedule")
    public Result<VoiceToScheduleVO> voiceToSchedule(
            @RequestParam String groupId,
            @RequestParam("audio") MultipartFile audio,
            @RequestParam String format,
            @RequestParam(defaultValue = "16000") int sampleRate,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "false") boolean autoConfirm,
            @RequestParam(required = false) String timezone,
            @RequestParam(required = false) String currentTime
    ) throws Exception {
        log.info("语音交互: groupId={}, format={}, sampleRate={}, autoConfirm={}",
                groupId, format, sampleRate, autoConfirm);
        return Result.success(assistantService.voiceToSchedule(
                groupId,
                audio,
                format,
                sampleRate,
                language,
                autoConfirm,
                timezone,
                currentTime
        ));
    }

    @PostMapping("/confirm")
    public Result<AssistantConfirmVO> confirm(@Valid @RequestBody AssistantConfirmDTO dto) {
        log.info("确认交互: groupId={}, messageId={}, action={}",
                dto.getGroupId(), dto.getMessageId(), dto.getAction());
        return Result.success(assistantService.confirm(dto));
    }
}
