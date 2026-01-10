package com.innovan.roombooking.enums;

import java.util.HashMap;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Getter
@AllArgsConstructor
@Slf4j
public enum Permission {
    ADMIN("READ Permission"),
    USER("USER");

    private final String permissionVal;

    public static Permission getEnum(String name) {
        try {
            return Permission.valueOf(name);
        } catch (Exception e) {
            log.warn(e.getMessage());
            return null;
        }
    }

    public static Map<Integer, Permission> getPermissionMap() {
        Map<Integer, Permission> map = new HashMap<>();
        map.put(1, Permission.ADMIN);
        return map;
    }
}
