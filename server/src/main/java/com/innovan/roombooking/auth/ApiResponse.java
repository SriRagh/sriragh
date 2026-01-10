package com.innovan.roombooking.auth;

import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

public class ApiResponse<T> {

    public static final String DATA = "data";
    public static final String RESPONSE_CODE = "responseCode";
    public static final String RESPONSE_TYPE = "responseType";

    private T body;
    protected int code;
    protected String status;
    protected List<String> warnings;
    protected List<String> errors;

    public ApiResponse(HttpStatus status) {
        this.code = status.value();
        this.status = status.getReasonPhrase();
    }

    public ApiResponse(HttpStatus status, T body) {
        this.code = status.value();
        this.status = status.getReasonPhrase();
        this.body = body;
    }

    public ApiResponse() {
    }

    public T getBody() {
        return body;
    }

    public void setBody(T body) {
        this.body = body;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }
}
