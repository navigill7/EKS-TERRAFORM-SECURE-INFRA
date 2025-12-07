package com.unilink.notification_service.service;

import com.unilink.notification_service.model.UserPreferences;
import com.unilink.notification_service.repository.UserPreferencesRepository;


import org.springframework.stereotype.Service;

import java.time.LocalDateTime;


@Service

public class UserPreferencesService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserPreferencesService.class);

    private final UserPreferencesRepository preferencesRepository;

    public UserPreferencesService(UserPreferencesRepository preferencesRepository) {
        this.preferencesRepository = preferencesRepository;
    }

    public UserPreferences getOrCreate(String userId) {
        return preferencesRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("📝 Creating default preferences for user: {}", userId);
                    UserPreferences preferences = UserPreferences.createDefault(userId);
                    preferences.setCreatedAt(LocalDateTime.now());
                    preferences.setUpdatedAt(LocalDateTime.now());
                    return preferencesRepository.save(preferences);
                });
    }

    public UserPreferences updatePreferences(String userId, UserPreferences updates) {
        UserPreferences existing = getOrCreate(userId);

        if (updates.getNotifications() != null) {
            existing.setNotifications(updates.getNotifications());
        }

        if (updates.getEmailNotifications() != null) {
            existing.setEmailNotifications(updates.getEmailNotifications());
        }

        if (updates.getPushNotifications() != null) {
            existing.setPushNotifications(updates.getPushNotifications());
        }

        if (updates.getQuietHours() != null) {
            existing.setQuietHours(updates.getQuietHours());
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return preferencesRepository.save(existing);
    }

    public boolean isNotificationEnabled(String userId, String notificationType) {
        UserPreferences preferences = getOrCreate(userId);
        return preferences.isEnabled(notificationType);
    }

    public boolean isInQuietHours(String userId) {
        UserPreferences preferences = getOrCreate(userId);
        return preferences.isInQuietHours();
    }
}
