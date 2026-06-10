package com.schedjun.backend.client;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * 讯飞 wpgs 动态修正：apd 追加；rpl 按 rg 区间作废旧片段后再追加。
 */
public class IflytekAsrTranscriptAccumulator {

    private final List<Segment> segments = new ArrayList<>();
    private final StringBuilder fallback = new StringBuilder();

    public void appendResult(JsonNode result) {
        String piece = extractPiece(result.path("ws"));
        if (!StringUtils.hasText(piece)) {
            return;
        }

        if (!result.has("pgs")) {
            fallback.append(piece);
            return;
        }

        String pgs = result.path("pgs").asText("");
        if ("rpl".equals(pgs)) {
            JsonNode rg = result.path("rg");
            if (rg.isArray() && rg.size() == 2) {
                int start = rg.get(0).asInt() - 1;
                int end = rg.get(1).asInt() - 1;
                for (int i = start; i <= end && i < segments.size(); i++) {
                    segments.get(i).deleted = true;
                }
            }
        }

        segments.add(new Segment(piece));
    }

    public String toText() {
        if (segments.isEmpty()) {
            return fallback.toString();
        }
        StringBuilder text = new StringBuilder();
        for (Segment segment : segments) {
            if (!segment.deleted) {
                text.append(segment.text);
            }
        }
        return text.toString();
    }

    private String extractPiece(JsonNode ws) {
        if (!ws.isArray()) {
            return "";
        }
        StringBuilder piece = new StringBuilder();
        for (JsonNode wordSlot : ws) {
            for (JsonNode cw : wordSlot.path("cw")) {
                piece.append(cw.path("w").asText(""));
            }
        }
        return piece.toString();
    }

    private static final class Segment {
        private final String text;
        private boolean deleted;

        private Segment(String text) {
            this.text = text;
        }
    }
}
