package com.schedjun.backend.utils;

import org.springframework.util.StringUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ChineseTimeParser {

    private static final Pattern HOUR_PATTERN = Pattern.compile("([零一二三四五六七八九十两\\d]+)\\s*点(钟)?");

    private ChineseTimeParser() {
    }

    public static int parseDayOffset(String text) {
        if (!StringUtils.hasText(text)) {
            return 0;
        }
        String normalized = text.replace(" ", "");
        if (normalized.contains("大后天")) {
            return 3;
        }
        if (normalized.contains("后天")) {
            return 2;
        }
        if (normalized.contains("明天")) {
            return 1;
        }
        return 0;
    }

    public static Integer parseHourHint(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        String normalized = text.replace(" ", "");
        Matcher matcher = HOUR_PATTERN.matcher(normalized);
        if (!matcher.find()) {
            return null;
        }

        Integer hour = parseChineseNumber(matcher.group(1));
        if (hour == null || hour < 0 || hour > 23) {
            return null;
        }

        boolean afternoon = normalized.contains("下午") || normalized.contains("傍晚");
        boolean evening = normalized.contains("晚上");
        boolean morning = normalized.contains("上午") || normalized.contains("早上") || normalized.contains("早晨");
        boolean dawn = normalized.contains("凌晨");

        if ((afternoon || evening) && hour >= 1 && hour <= 11) {
            hour += 12;
        } else if (evening && hour == 12) {
            hour = 12;
        } else if ((morning || dawn) && hour == 12) {
            hour = 0;
        }

        return hour;
    }

    private static Integer parseChineseNumber(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        if (raw.chars().allMatch(Character::isDigit)) {
            return Integer.parseInt(raw);
        }

        return switch (raw) {
            case "零" -> 0;
            case "一" -> 1;
            case "二", "两" -> 2;
            case "三" -> 3;
            case "四" -> 4;
            case "五" -> 5;
            case "六" -> 6;
            case "七" -> 7;
            case "八" -> 8;
            case "九" -> 9;
            case "十" -> 10;
            case "十一" -> 11;
            case "十二" -> 12;
            default -> null;
        };
    }
}
