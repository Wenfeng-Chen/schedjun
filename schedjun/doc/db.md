# Schedjun 数据库设计

---

## 一、表结构说明

### 1.1 `user`


| 字段            | 类型                 | 说明               |
| ------------- | ------------------ | ---------------- |
| id            | BIGINT PK          | 自增主键             |
| username      | VARCHAR(64) UNIQUE | 登录名              |
| password_hash | VARCHAR(255)       | 密码哈希             |
| timezone      | VARCHAR(64)        | 默认 Asia/Shanghai |
| created_at    | DATETIME(3)        |                  |
| updated_at    | DATETIME(3)        |                  |


### 1.2 `schedule`


| 字段            | 类型           | 说明              |
| ------------- | ------------ | --------------- |
| id            | BIGINT PK    | 自增主键            |
| user_id       | BIGINT FK    | 所属用户            |
| title         | VARCHAR(255) | 标题              |
| start_time    | DATETIME(3)  | 开始时间            |
| end_time      | DATETIME(3)  | 结束时间            |
| notes         | TEXT         | 备注              |
| repeat_json   | JSON         | RepeatRule      |
| reminder_json | JSON         | ReminderRule    |
| source        | VARCHAR(16)  | manual/voice/ai |
| created_at    | DATETIME(3)  |                 |
| updated_at    | DATETIME(3)  |                 |


**索引：** `(user_id, start_time)`、`(user_id, updated_at)`

### 1.3 `assistant_message`

> 无 `assistant_session` 表；用 `group_id` 关联同一轮打开君听面板内的多轮语音上下文。


| 字段                  | 类型                 | 说明                |
| ------------------- | ------------------ | ----------------- |
| id                  | BIGINT PK          | 自增主键              |
| message_id          | VARCHAR(64) UNIQUE | 对外 ID，confirm 时引用 |
| group_id            | VARCHAR(64)        | 一次打开君听面板的分组 ID    |
| user_id             | BIGINT FK          | 所属用户              |
| role                | VARCHAR(16)        | user / assistant  |
| content             | TEXT               | ASR 文本或 AI 回复     |
| intent              | VARCHAR(32)        | 可空，assistant 消息使用 |
| schedule_draft_json | JSON               | 可空，assistant 消息使用 |
| created_at          | DATETIME(3)        |                   |


**索引：** `(group_id, created_at)`、`(user_id, created_at)`

---

## 二、初始化脚本

在 MySQL 客户端或 Navicat 等工具中执行以下脚本。

```sql
-- ============================================================
-- Schedjun 数据库初始化
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS schedjun
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE schedjun;

-- ------------------------------------------------------------
-- 1. user
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(64)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `timezone`      VARCHAR(64)  NOT NULL DEFAULT 'Asia/Shanghai',
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. schedule
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schedule` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT       NOT NULL,
  `title`         VARCHAR(255) NOT NULL,
  `start_time`    DATETIME(3)  NOT NULL,
  `end_time`      DATETIME(3)  NOT NULL,
  `notes`         TEXT         NULL,
  `repeat_json`   JSON         NOT NULL,
  `reminder_json` JSON         NOT NULL,
  `source`        VARCHAR(16)  NOT NULL DEFAULT 'manual',
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_schedule_user_start` (`user_id`, `start_time`),
  KEY `idx_schedule_user_updated` (`user_id`, `updated_at`),
  CONSTRAINT `fk_schedule_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. assistant_message
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assistant_message` (
  `id`                  BIGINT       NOT NULL AUTO_INCREMENT,
  `message_id`          VARCHAR(64)  NOT NULL,
  `group_id`            VARCHAR(64)  NOT NULL,
  `user_id`             BIGINT       NOT NULL,
  `role`                VARCHAR(16)  NOT NULL,
  `content`             TEXT         NOT NULL,
  `intent`              VARCHAR(32)  NULL,
  `schedule_draft_json` JSON         NULL,
  `created_at`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_assistant_message_id` (`message_id`),
  KEY `idx_assistant_group_created` (`group_id`, `created_at`),
  KEY `idx_assistant_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_assistant_message_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

