package com.unilink.notification_service.controller;
import com.unilink.notification_service.model.UserPreferences;
import com.unilink.notification_service.service.UserPreferencesService;

//import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

//@Slf4j
@RestController
@RequestMapping("/api/notifications/preferences")

public class PreferencesController {

    private final UserPreferencesService preferencesService;

    public PreferencesController(UserPreferencesService preferencesService) {
        this.preferencesService = preferencesService;
    }

    @GetMapping
    public ResponseEntity<UserPreferences> getPreferences(Authentication authentication) {
        String userId = authentication.getName();

        UserPreferences preferences = preferencesService.getOrCreate(userId);

        return ResponseEntity.ok(preferences);
    }

    @PatchMapping
    public ResponseEntity<Map<String, Object>> updatePreferences(
            Authentication authentication,
            @RequestBody UserPreferences updates) {

        String userId = authentication.getName();

        UserPreferences preferences = preferencesService.updatePreferences(userId, updates);

        return ResponseEntity.ok(Map.of(
                "message", "Preferences updated",
                "preferences", preferences
        ));
    }
}
