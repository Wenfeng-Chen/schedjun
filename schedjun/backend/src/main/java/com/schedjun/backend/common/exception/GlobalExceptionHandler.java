package com.schedjun.backend.common.exception;

import com.schedjun.backend.common.result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String msg = fieldError != null ? fieldError.getDefaultMessage() : "参数校验失败";
        return Result.error(msg);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public Result<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return Result.error(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception ex) {
        log.error("Unhandled exception", ex);
        return Result.error("服务器内部错误");
    }
}
