package com.schedjun.backend.common.model;

import lombok.Data;

import java.util.List;

@Data
public class RepeatRule {

    private String preset;
    private CustomRepeatConfig custom;
}
