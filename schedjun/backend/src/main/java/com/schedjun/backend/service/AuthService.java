package com.schedjun.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.schedjun.backend.common.dto.RegisterDTO;
import com.schedjun.backend.common.entity.User;
import com.schedjun.backend.common.properties.JwtProperties;
import com.schedjun.backend.common.utils.JwtUtils;
import com.schedjun.backend.common.vo.AuthVO;
import com.schedjun.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtProperties jwtProperties;

    @Autowired
    private JwtUtils jwtUtils;

    @Transactional
    public AuthVO register(RegisterDTO dto) {
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername())
        );
        if (count != null && count > 0) {
            throw new IllegalArgumentException("用户名已存在");
        }

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        user.setTimezone("Asia/Shanghai");
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userMapper.insert(user);

        String accessToken = jwtUtils.generateToken(user.getId(), user.getUsername());
        return new AuthVO(formatUserId(user.getId()), accessToken, jwtProperties.getExpiresIn());
    }

    static String formatUserId(Long id) {
        return "u_" + id;
    }
}
