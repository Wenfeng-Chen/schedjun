package com.schedjun.backend.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schedjun.backend.common.constant.AuthConstants;
import com.schedjun.backend.common.context.BaseContext;
import com.schedjun.backend.common.result.Result;
import com.schedjun.backend.common.utils.JwtUtils;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class JwtTokenInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith(AuthConstants.BEARER_PREFIX)) {
            writeError(response, "未登录或 token 无效");
            return false;
        }

        String token = authorization.substring(AuthConstants.BEARER_PREFIX.length());
        try {
            Claims claims = jwtUtils.parseClaims(token);
            Long userId = Long.parseLong(claims.getSubject());
            String username = claims.get("username", String.class);

            BaseContext.setCurrentId(userId);
            response.setHeader(
                    AuthConstants.REFRESHED_TOKEN_HEADER,
                    jwtUtils.generateToken(userId, username)
            );
            return true;
        } catch (Exception ex) {
            writeError(response, "token 无效或已过期");
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        BaseContext.removeCurrentId();
    }

    private void writeError(HttpServletResponse response, String msg) throws IOException {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(response.getWriter(), Result.error(msg));
    }
}
