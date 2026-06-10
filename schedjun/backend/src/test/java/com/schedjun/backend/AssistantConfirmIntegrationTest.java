package com.schedjun.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.model.AssistantAiResult;
import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.service.AssistantChatService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AssistantConfirmIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AssistantChatService assistantChatService;

    @AfterEach
    void cleanup() {
        BaseContext.removeCurrentId();
    }

    @Test
    void confirmCreatesSchedule() throws Exception {
        String token = loginAndGetToken();
        ScheduleDraft draft = buildDraft();
        String messageId = voiceToSchedule(token, draft, "create_schedule", "明天下午三点开会");

        String confirmBody = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "groupId", "grp_confirm_001",
                        "messageId", messageId,
                        "action", "confirm",
                        "scheduleDraft", draft
                )
        );

        MvcResult result = mockMvc.perform(
                        post("/assistant/confirm")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(confirmBody)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertEquals("日程已创建。", data.path("reply").asText());
        assertTrue(data.path("schedule").path("id").asText().startsWith("sch_"));
        assertEquals("voice", data.path("schedule").path("source").asText());
        assertEquals("开会", data.path("schedule").path("title").asText());
    }

    @Test
    void confirmUpdatesSchedule() throws Exception {
        String token = loginAndGetToken();
        ScheduleDraft createDraft = buildDraft();
        String createMessageId = voiceToSchedule(token, createDraft, "create_schedule", "明天下午三点开会");

        String createBody = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "groupId", "grp_confirm_001",
                        "messageId", createMessageId,
                        "action", "confirm",
                        "scheduleDraft", createDraft
                )
        );

        MvcResult createResult = mockMvc.perform(
                        post("/assistant/confirm")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(createBody)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String scheduleId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data")
                .path("schedule")
                .path("id")
                .asText();

        ScheduleDraft updateDraft = buildDraft();
        updateDraft.setScheduleId(scheduleId);
        updateDraft.setTitle("改期会议");
        updateDraft.setStartTime(OffsetDateTime.parse("2026-06-01T16:00:00+08:00"));
        updateDraft.setEndTime(OffsetDateTime.parse("2026-06-01T17:00:00+08:00"));

        String updateMessageId = voiceToSchedule(
                token,
                updateDraft,
                "update_schedule",
                "把明天的开会改到四点"
        );

        String updateBody = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "groupId", "grp_confirm_001",
                        "messageId", updateMessageId,
                        "action", "confirm",
                        "scheduleDraft", updateDraft
                )
        );

        MvcResult updateResult = mockMvc.perform(
                        post("/assistant/confirm")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(updateBody)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(updateResult.getResponse().getContentAsString()).path("data");
        assertEquals("日程已更新。", data.path("reply").asText());
        assertEquals(scheduleId, data.path("schedule").path("id").asText());
        assertEquals("改期会议", data.path("schedule").path("title").asText());
    }

    @Test
    void confirmDeletesSchedule() throws Exception {
        String token = loginAndGetToken();
        ScheduleDraft createDraft = buildDraft();
        String createMessageId = voiceToSchedule(token, createDraft, "create_schedule", "明天下午三点开会");

        String createBody = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "groupId", "grp_confirm_001",
                        "messageId", createMessageId,
                        "action", "confirm",
                        "scheduleDraft", createDraft
                )
        );

        MvcResult createResult = mockMvc.perform(
                        post("/assistant/confirm")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(createBody)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String scheduleId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data")
                .path("schedule")
                .path("id")
                .asText();

        ScheduleDraft deleteDraft = new ScheduleDraft();
        deleteDraft.setScheduleId(scheduleId);
        deleteDraft.setTitle("开会");

        String deleteMessageId = voiceToSchedule(
                token,
                deleteDraft,
                "delete_schedule",
                "删除明天的开会"
        );

        String deleteBody = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "groupId", "grp_confirm_001",
                        "messageId", deleteMessageId,
                        "action", "confirm",
                        "scheduleDraft", deleteDraft
                )
        );

        MvcResult deleteResult = mockMvc.perform(
                        post("/assistant/confirm")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(deleteBody)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(deleteResult.getResponse().getContentAsString()).path("data");
        assertEquals("日程已删除。", data.path("reply").asText());
        assertFalse(data.hasNonNull("schedule"));
    }

    @Test
    void cancelReturnsReplyOnly() throws Exception {
        String token = loginAndGetToken();
        ScheduleDraft draft = buildDraft();
        String messageId = voiceToSchedule(token, draft, "create_schedule", "明天下午三点开会");

        String cancelBody = """
                {
                  "groupId": "grp_confirm_001",
                  "messageId": "%s",
                  "action": "cancel"
                }
                """.formatted(messageId);

        MvcResult result = mockMvc.perform(
                        post("/assistant/confirm")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(cancelBody)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertEquals("好的，已取消。", data.path("reply").asText());
        assertFalse(data.hasNonNull("schedule"));
    }

    private String voiceToSchedule(
            String token,
            ScheduleDraft draft,
            String intent,
            String asrText
    ) throws Exception {
        AssistantAiResult aiResult = new AssistantAiResult();
        aiResult.setReply("助手回复");
        aiResult.setIntent(intent);
        aiResult.setNeedConfirm(true);
        aiResult.setScheduleDraft(draft);

        when(assistantChatService.analyze(anyString(), anyList(), anyString(), anyString(), anyString()))
                .thenReturn(aiResult);

        String body = objectMapper.writeValueAsString(java.util.Map.of(
                "groupId", "grp_confirm_001",
                "text", asrText,
                "timezone", "Asia/Shanghai",
                "currentTime", "2026-06-01T10:00:00+08:00",
                "autoConfirm", false
        ));

        MvcResult result = mockMvc.perform(
                        post("/assistant/text-to-schedule")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data")
                .path("messageId")
                .asText();
    }

    private ScheduleDraft buildDraft() {
        ScheduleDraft draft = new ScheduleDraft();
        draft.setTitle("开会");
        draft.setStartTime(OffsetDateTime.parse("2026-06-01T15:00:00+08:00"));
        draft.setEndTime(OffsetDateTime.parse("2026-06-01T16:00:00+08:00"));
        draft.setNotes("");
        draft.setAllDay(false);
        draft.setRepeat(new RepeatRule() {{
            setPreset("never");
        }});
        draft.setReminder(new ReminderRule() {{
            setEnabled(true);
            setPreset("min30");
        }});
        return draft;
    }

    private String loginAndGetToken() throws Exception {
        MvcResult result = mockMvc.perform(
                        post("/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"username\":\"admin\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data")
                .path("accessToken")
                .asText();
    }
}
