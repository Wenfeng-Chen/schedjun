package com.schedjun.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.schedjun.backend.common.entity.Schedule;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ScheduleMapper extends BaseMapper<Schedule> {
}
