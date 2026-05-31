git checkout -b feat/你的功能名package com.schedjun.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.model.AssistantAiResult;
import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import com.schedjun.backend.common.model.ScheduleDraft;
import com.schedjun.backend.service.AsrService;
import com.schedjun.backend.service.AssistantChatService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AssistantVoiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AsrService asrService;

    @MockBean
    private AssistantChatService assistantChatService;

    @AfterEach
    void cleanup() {
        BaseContext.removeCurrentId();
    }

    @Test
    void voiceToScheduleReturnsSuccess() throws Exception {
        String token = loginAndGetToken();

        when(asrService.transcribe(any(), anyString(), org.mockito.ArgumentMatchers.anyInt(), any()))
                .thenReturn("明天下午三点开会");

        AssistantAiResult aiResult = new AssistantAiResult();
        aiResult.setReply("好的，已为你创建「开会」，明天 15:00。");
        aiResult.setIntent("create_schedule");
        aiResult.setNeedConfirm(true);

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
        aiResult.setScheduleDraft(draft);

        when(assistantChatService.analyze(anyString(), anyList(), anyString(), anyString(), anyString()))
                .thenReturn(aiResult);

        MockMultipartFile audio = new MockMultipartFile(
                "audio",
                "voice.wav",
                "audio/wav",
                new byte[1280]
        );

        MvcResult result = mockMvc.perform(
                        multipart("/assistant/voice-to-schedule")
                                .file(audio)
                                .param("groupId", "grp_test_001")
                                .param("format", "wav")
                                .param("sampleRate", "16000")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertEquals("grp_test_001", data.path("groupId").asText());
        assertEquals("明天下午三点开会", data.path("asrText").asText());
        assertEquals("create_schedule", data.path("intent").asText());
        assertTrue(data.path("needConfirm").asBoolean());
        assertTrue(data.path("messageId").asText().startsWith("msg_"));
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
