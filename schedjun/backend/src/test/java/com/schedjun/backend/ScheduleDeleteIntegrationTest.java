package com.schedjun.backend;

import com.fasterxml.jackson.databind.JsonNode;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ScheduleDeleteIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @AfterEach
    void cleanup() {
        BaseContext.removeCurrentId();
    }

    @Test
    void deleteSingleScheduleReturnsSuccess() throws Exception {
        String token = loginAndGetToken();
        String scheduleId = createScheduleAndGetId(token);

        MvcResult result = mockMvc.perform(
                        delete("/schedules")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"scheduleIds\":[\"" + scheduleId + "\"]}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertEquals(1, data.path("deletedCount").asInt());
        assertEquals(scheduleId, data.path("scheduleIds").get(0).asText());

        MvcResult notFoundResult = mockMvc.perform(
                        delete("/schedules")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"scheduleIds\":[\"" + scheduleId + "\"]}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode notFoundBody = objectMapper.readTree(notFoundResult.getResponse().getContentAsString());
        assertEquals(0, notFoundBody.path("code").asInt());
        assertEquals("日程不存在", notFoundBody.path("msg").asText());
    }

    @Test
    void deleteMultipleSchedulesReturnsSuccess() throws Exception {
        String token = loginAndGetToken();
        String firstId = createScheduleAndGetId(token);
        String secondId = createScheduleAndGetId(token);

        String body = objectMapper.writeValueAsString(java.util.Map.of(
                "scheduleIds", java.util.List.of(firstId, secondId)
        ));

        MvcResult result = mockMvc.perform(
                        delete("/schedules")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertEquals(2, data.path("deletedCount").asInt());
        assertTrue(data.path("scheduleIds").toString().contains(firstId));
        assertTrue(data.path("scheduleIds").toString().contains(secondId));
    }

    private CreateScheduleDTO buildScheduleDto() {
        CreateScheduleDTO dto = new CreateScheduleDTO();
        dto.setTitle("待删除的集成测试日程");
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
        return dto;
    }

    private String createScheduleAndGetId(String token) throws Exception {
        MvcResult result = mockMvc.perform(
                        post("/schedules")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(buildScheduleDto())))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data")
                .path("id")
                .asText();
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
