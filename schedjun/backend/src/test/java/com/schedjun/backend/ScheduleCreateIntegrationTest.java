package com.schedjun.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.dto.CreateScheduleDTO;
import com.schedjun.backend.common.model.ReminderRule;
import com.schedjun.backend.common.model.RepeatRule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.OffsetDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ScheduleCreateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @AfterEach
    void cleanup() {
        BaseContext.removeCurrentId();
    }

    @Test
    void createScheduleReturnsSuccess() throws Exception {
        String token = loginAndGetToken();

        CreateScheduleDTO dto = new CreateScheduleDTO();
        dto.setTitle("集成测试日程");
        dto.setStartTime(OffsetDateTime.parse("2026-05-30T10:00:00+08:00"));
        dto.setEndTime(OffsetDateTime.parse("2026-05-30T11:00:00+08:00"));
        dto.setNotes("");
        dto.setAllDay(false);
        dto.setRepeat(new RepeatRule() {{
            setPreset("never");
        }});
        dto.setReminder(new ReminderRule() {{
            setEnabled(true);
            setPreset("atStart");
        }});

        MvcResult result = mockMvc.perform(
                        post("/schedules")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andReturn();

        System.out.println(result.getResponse().getContentAsString());
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
