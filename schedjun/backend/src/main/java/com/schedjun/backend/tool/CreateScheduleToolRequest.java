package com.schedjun.backend.tool;

import lombok.Data;

@Data
public class CreateScheduleToolRequest {

    /** 日程标题 */
    private String title;

    /** 开始时间，ISO-8601 格式带时区偏移，例如 2026-06-10T15:00:00+08:00 */
    private String startTime;

    /** 结束时间，ISO-8601 格式带时区偏移，例如 2026-06-10T16:00:00+08:00 */
    private String endTime;

    /** 备注，可为空 */
    private String notes;

    /** 是否全天日程，默认 false */
    private Boolean allDay;

    /** 重复规则预设：never / daily / weekly / monthly / yearly / custom */
    private String repeatPreset;

    /** 自定义重复：间隔数值（仅 preset=custom 时生效，例如每周二的2 → value=2, unit=week） */
    private Integer repeatCustomValue;

    /** 自定义重复：间隔单位（day / week / month / year） */
    private String repeatCustomUnit;

    /** 是否启用提醒，默认 true */
    private Boolean reminderEnabled;

    /** 提醒规则预设：atStart / min5 / min15 / min30 / hour1 / custom */
    private String reminderPreset;

    /** 自定义提醒：提前数值（仅 preset=custom 时生效，例如提前30分钟 → value=30, unit=minute） */
    private Integer reminderCustomValue;

    /** 自定义提醒：提前单位（minute / hour / day） */
    private String reminderCustomUnit;
}
