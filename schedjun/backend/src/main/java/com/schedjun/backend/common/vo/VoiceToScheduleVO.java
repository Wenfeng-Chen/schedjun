package com.schedjun.backend.common.vo;

import com.schedjun.backend.common.model.ScheduleDraft;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceToScheduleVO {

    private String groupId;
    private String asrText;
    private String reply;
    private String intent;
    private ScheduleDraft scheduleDraft;
    private ScheduleVO schedule;
    private boolean needConfirm;
    private String messageId;
}
