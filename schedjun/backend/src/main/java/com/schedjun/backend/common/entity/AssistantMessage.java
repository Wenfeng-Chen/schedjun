package com.schedjun.backend.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("assistant_message")
public class AssistantMessage {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("message_id")
    private String messageId;

    @TableField("group_id")
    private String groupId;

    @TableField("user_id")
    private Long userId;

    private String role;

    private String content;

    private String intent;

    @TableField("schedule_draft_json")
    private String scheduleDraftJson;

    @TableField("created_at")
    private LocalDateTime createdAt;
}
