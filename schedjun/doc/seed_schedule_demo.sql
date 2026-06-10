-- ============================================================
-- Schedjun 日程演示数据（2026 年 6 月）
-- MySQL 8.0+
-- 前置条件：已执行 db.md 建表，且存在 user_id = 1（如 admin）
-- 说明：会清空 user_id=1 的全部日程后重新插入
-- ============================================================

USE schedjun;

DELETE FROM `schedule` WHERE `user_id` = 1;

INSERT INTO `schedule`
  (`user_id`, `title`, `start_time`, `end_time`, `notes`, `repeat_json`, `reminder_json`, `source`)
VALUES

-- ---------- 6 月上旬 ----------
(1, '清晨慢跑五公里', '2026-06-01 06:30:00.000', '2026-06-01 07:15:00.000',
 '沿护城河跑，配速 6 分半左右，跑完记得拉伸。',
 '{"preset":"daily"}',
 '{"enabled":true,"preset":"min15"}',
 'manual'),

(1, '带朵朵去红山动物园', '2026-06-01 09:00:00.000', '2026-06-01 16:00:00.000',
 '儿童节礼物已买好，记得推婴儿车。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min30"}',
 'manual'),

(1, '华东供应链合作洽谈', '2026-06-03 10:30:00.000', '2026-06-03 12:00:00.000',
 '对方王总，议题：Q3 采购价与交付周期。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min15"}',
 'manual'),

(1, '羽毛球双打夜场', '2026-06-03 20:00:00.000', '2026-06-03 22:00:00.000',
 '体育馆 3 号场，AA 场地费，带水。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min5"}',
 'manual'),

(1, '准备前端技术分享 PPT', '2026-06-05 14:00:00.000', '2026-06-05 17:00:00.000',
 '主题：React Native 原生模块桥接实践。',
 '{"preset":"never"}',
 '{"enabled":false,"preset":"none"}',
 'manual'),

(1, '还信用卡账单', '2026-06-05 08:00:00.000', '2026-06-05 08:30:00.000',
 '招行 + 花呗，合计约 6800 元。',
 '{"preset":"monthly"}',
 '{"enabled":true,"preset":"custom","custom":{"value":2,"unit":"hour"}}',
 'manual'),

(1, '高中同学聚会', '2026-06-06 18:30:00.000', '2026-06-06 22:00:00.000',
 '老城火锅店二楼包间，班长张磊组局。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min30"}',
 'voice'),

(1, '紫金山露营过夜', '2026-06-07 14:00:00.000', '2026-06-08 10:00:00.000',
 '帐篷、睡袋、头灯、防蚊液已装车。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"custom","custom":{"value":1,"unit":"day"}}',
 'manual'),

(1, '车险续保电话沟通', '2026-06-08 11:00:00.000', '2026-06-08 11:30:00.000',
 '平安产险，对比三者险报价。',
 '{"preset":"yearly"}',
 '{"enabled":true,"preset":"min15"}',
 'manual'),

(1, '整理露营装备归位', '2026-06-08 15:00:00.000', '2026-06-08 16:00:00.000',
 '帐篷晾干后收纳，检查燃气炉。',
 '{"preset":"never"}',
 '{"enabled":false,"preset":"none"}',
 'manual'),

-- ---------- 6 月中旬 ----------
(1, '剧本杀《年轮》', '2026-06-10 19:00:00.000', '2026-06-10 23:00:00.000',
 '六人本，缺 1 人，店家在文鼎广场。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min10"}',
 'voice'),

(1, '月嫂阿姨面试', '2026-06-11 10:00:00.000', '2026-06-11 11:00:00.000',
 '第二位候选人，重点问夜间带娃经验。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min30"}',
 'manual'),

(1, '导师讨论毕业论文提纲', '2026-06-12 15:30:00.000', '2026-06-12 17:00:00.000',
 '学院 408 办公室，打印三份提纲带去。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"custom","custom":{"value":45,"unit":"minute"}}',
 'manual'),

(1, '杭州出差值机', '2026-06-13 06:00:00.000', '2026-06-13 06:45:00.000',
 'MU5137，禄口 T2，身份证 + 登机牌。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"custom","custom":{"value":2,"unit":"hour"}}',
 'manual'),

(1, '拜访杭州电商客户', '2026-06-13 14:00:00.000', '2026-06-13 17:30:00.000',
 '地址：余杭未来科技城，演示新版排期功能。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min15"}',
 'manual'),

(1, '出口退税材料整理', '2026-06-15 09:30:00.000', '2026-06-15 11:30:00.000',
 '报关单、发票、合同扫描上传税务局系统。',
 '{"preset":"custom","custom":{"frequency":"month","interval":1,"weekdays":[],"monthDays":[15],"monthMode":"date","yearMonths":[]}}',
 '{"enabled":true,"preset":"min10"}',
 'manual'),

(1, '父亲六十大寿家宴', '2026-06-16 17:30:00.000', '2026-06-16 21:00:00.000',
 '饭店：金陵饭店梅花厅，蛋糕已预订。',
 '{"preset":"yearly"}',
 '{"enabled":true,"preset":"custom","custom":{"value":1,"unit":"day"}}',
 'manual'),

(1, 'Vue3 组合式 API 直播课', '2026-06-18 20:00:00.000', '2026-06-18 21:30:00.000',
 'B 站直播，担任嘉宾，提前测试麦克风。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min15"}',
 'ai'),

-- ---------- 6 月下旬 ----------
(1, '星巴克区域经理面试', '2026-06-20 14:30:00.000', '2026-06-20 15:30:00.000',
 '视频面试，着正装，准备过往门店运营案例。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min30"}',
 'manual'),

(1, '高铁返程 G5068', '2026-06-22 19:24:00.000', '2026-06-22 20:37:00.000',
 '瑞金站出发，二等座 05 车 12F，别误点。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"custom","custom":{"value":1,"unit":"hour"}}',
 'manual'),

(1, '每月工资到账核对', '2026-06-22 09:00:00.000', '2026-06-22 09:15:00.000',
 '核对基本工资、绩效与五险一金扣款。',
 '{"preset":"monthly"}',
 '{"enabled":true,"preset":"atStart"}',
 'manual'),

(1, '跟进小区电梯维修进度', '2026-06-24 10:00:00.000', '2026-06-24 10:30:00.000',
 '物业说配件已到，确认是否完成更换。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"atStart"}',
 'voice'),

(1, '雅思口语模考', '2026-06-26 16:00:00.000', '2026-06-26 17:00:00.000',
 '外教 Tom，重点练 Part 2 话题卡。',
 '{"preset":"custom","custom":{"frequency":"week","interval":1,"weekdays":[4],"monthDays":[],"monthMode":"date","yearMonths":[]}}',
 '{"enabled":true,"preset":"min10"}',
 'manual'),

(1, '深夜写周报', '2026-06-28 22:30:00.000', '2026-06-28 23:30:00.000',
 '每周日提交，模板在飞书文档。',
 '{"preset":"weekly"}',
 '{"enabled":true,"preset":"min15"}',
 'manual'),

-- ---------- 重复类日程（锚定在 6 月）----------
(1, '站立晨会同步进度', '2026-06-02 09:30:00.000', '2026-06-02 09:45:00.000',
 '每日 15 分钟，飞书语音频道。',
 '{"preset":"daily"}',
 '{"enabled":true,"preset":"atStart"}',
 'manual'),

(1, 'Sprint 迭代代码评审', '2026-06-04 10:00:00.000', '2026-06-04 11:30:00.000',
 '评审 schedjun 提醒模块，重点关注 Android 原生闹钟。',
 '{"preset":"weekly"}',
 '{"enabled":true,"preset":"atStart"}',
 'manual'),

(1, '晚间瑜伽放松课', '2026-06-04 19:30:00.000', '2026-06-04 20:30:00.000',
 '带瑜伽垫，场馆在万达广场 B2。',
 '{"preset":"weekly"}',
 '{"enabled":true,"preset":"min5"}',
 'manual'),

(1, '力量训练（胸背）', '2026-06-09 18:00:00.000', '2026-06-09 19:00:00.000',
 '周一/周五固定训练日。',
 '{"preset":"custom","custom":{"frequency":"week","interval":1,"weekdays":[0,4],"monthDays":[],"monthMode":"date","yearMonths":[]}}',
 '{"enabled":true,"preset":"min10"}',
 'manual'),

(1, '每两天复盘日记', '2026-06-14 22:00:00.000', '2026-06-14 22:30:00.000',
 '记录工作、健康、情绪三件事。',
 '{"preset":"custom","custom":{"frequency":"day","interval":2,"weekdays":[],"monthDays":[],"monthMode":"date","yearMonths":[]}}',
 '{"enabled":true,"preset":"min5"}',
 'manual'),

(1, '健身房私教课', '2026-06-19 19:00:00.000', '2026-06-19 20:00:00.000',
 '教练小李，练腿日，别吃太饱。',
 '{"preset":"custom","custom":{"frequency":"week","interval":2,"weekdays":[0,3],"monthDays":[],"monthMode":"date","yearMonths":[]}}',
 '{"enabled":true,"preset":"min5"}',
 'manual'),

(1, '《人类简史》读书分享', '2026-06-21 20:00:00.000', '2026-06-21 21:30:00.000',
 '线上腾讯会议，讨论第三章「人类的融合」。',
 '{"preset":"weekly"}',
 '{"enabled":true,"preset":"min30"}',
 'manual'),

(1, '二季度 OKR 复盘会', '2026-06-25 15:00:00.000', '2026-06-25 16:30:00.000',
 '准备本季度完成率数据，会议室 A302。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"min15"}',
 'manual'),

(1, '和朋友看球赛直播', '2026-06-27 22:00:00.000', '2026-06-28 00:30:00.000',
 '酒吧包间已订，别开车。',
 '{"preset":"never"}',
 '{"enabled":true,"preset":"custom","custom":{"value":1,"unit":"hour"}}',
 'manual'),

(1, '端午家宴', '2026-06-30 12:00:00.000', '2026-06-30 14:30:00.000',
 '回爸妈家吃饭，带一盒蛋黄粽和水果。',
 '{"preset":"yearly"}',
 '{"enabled":true,"preset":"custom","custom":{"value":1,"unit":"day"}}',
 'voice');

-- 插入后统计
SELECT DATE(`start_time`) AS day, COUNT(*) AS cnt
FROM `schedule`
WHERE `user_id` = 1
  AND `start_time` >= '2026-06-01'
  AND `start_time` < '2026-07-01'
GROUP BY DATE(`start_time`)
ORDER BY day;
