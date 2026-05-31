package com.schedjun.backend.common.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthVO {

    private String userId;
    private String accessToken;
    private long expiresIn;
}
