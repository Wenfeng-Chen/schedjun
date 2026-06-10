package com.schedjun.backend.common.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssistantToolResult {

    /** AI 给用户的回复文本 */
    private String reply;

    /** 识别到的意图：create_schedule / chitchat / clarify 等 */
    private String intent;

    /** 是否调用了工具 */
    private boolean toolCalled;

    /** 工具调用产生的日程草稿（需要确认后才真正创建） */
    private ScheduleDraft scheduleDraft;
}
