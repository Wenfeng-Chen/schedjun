package com.schedjun.backend.tool;

import lombok.Data;

/**
 * 日程查询工具入参。所有字段均为可选，AI 只传入用户提到的条件。
 * <p>
 * 时间字段接受两种格式：
 * <ul>
 *   <li>日期（如 2026-06-12）：查询该天的全部日程</li>
 *   <li>完整时间戳（如 2026-06-12T15:00:00 或 2026-06-12T15:00:00+08:00）：等值匹配</li>
 * </ul>
 */
@Data
public class ScheduleQueryParam {

    /** 日程 ID（sch_xxx 或纯数字），等值匹配 */
    private String id;

    /** 标题，模糊匹配 */
    private String title;

    /** 备注，模糊匹配 */
    private String notes;

    /** 开始时间 */
    private String startTime;

    /** 结束时间 */
    private String endTime;

    /** 重复规则预设值：never / daily / weekly / monthly / yearly，模糊匹配 */
    private String repeat;

    /** 提醒规则预设值：atStart / min5 / min15 / min30 / hour1，模糊匹配 */
    private String reminder;

    /** 来源（manual / voice），等值匹配 */
    private String source;
}
