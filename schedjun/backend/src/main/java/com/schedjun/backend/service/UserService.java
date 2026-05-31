package com.schedjun.backend.service;

import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.entity.User;
import com.schedjun.backend.common.vo.UserVO;
import com.schedjun.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public UserVO getCurrentUser() {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }

        return toUserVO(user);
    }

    private UserVO toUserVO(User user) {
        String timezone = user.getTimezone() != null ? user.getTimezone() : "Asia/Shanghai";
        String createdAt = user.getCreatedAt() == null
                ? null
                : user.getCreatedAt()
                        .atZone(ZoneId.of(timezone))
                        .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        return new UserVO(
                AuthService.formatUserId(user.getId()),
                user.getUsername(),
                timezone,
                createdAt
        );
    }
}
