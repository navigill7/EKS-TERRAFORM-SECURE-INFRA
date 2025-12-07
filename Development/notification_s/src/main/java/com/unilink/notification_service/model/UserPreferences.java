package com.unilink.notification_service.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "user_preferences")
public class UserPreferences {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private Map<String, Boolean> notifications = new HashMap<>() {{
        put("profile-view", true);
        put("like", true);
        put("message", true);
        put("friend-request", true);
        put("friend-post", true);
    }};

    private Boolean emailNotifications = true;

    private Boolean pushNotifications = true;

    private QuietHours quietHours = new QuietHours(false, "22:00", "08:00");

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ---------------------------
    // NO-ARGS CONSTRUCTOR
    // ---------------------------
    public UserPreferences() {}

    // ---------------------------
    // ALL-ARGS CONSTRUCTOR

    public UserPreferences(String id, String userId, Map<String, Boolean> notifications,
                           Boolean emailNotifications, Boolean pushNotifications,
                           QuietHours quietHours, LocalDateTime createdAt,
                           LocalDateTime updatedAt) {

        this.id = id;
        this.userId = userId;
        this.notifications = notifications != null ? notifications : new HashMap<>();
        this.emailNotifications = emailNotifications != null ? emailNotifications : true;
        this.pushNotifications = pushNotifications != null ? pushNotifications : true;
        this.quietHours = quietHours != null ? quietHours : new QuietHours(false, "22:00", "08:00");
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


    public static class QuietHours {

        private Boolean enabled = false;
        private String start = "22:00";
        private String end = "08:00";

        public QuietHours() {
        }

        public QuietHours(Boolean enabled, String start, String end) {
            this.enabled = enabled;
            this.start = start;
            this.end = end;
        }

        // Builder (manual)
        public static QuietHoursBuilder builder() {
            return new QuietHoursBuilder();
        }

        public static class QuietHoursBuilder {
            private Boolean enabled = false;
            private String start = "22:00";
            private String end = "08:00";

            public QuietHoursBuilder enabled(Boolean enabled) {
                this.enabled = enabled;
                return this;
            }

            public QuietHoursBuilder start(String start) {
                this.start = start;
                return this;
            }

            public QuietHoursBuilder end(String end) {
                this.end = end;
                return this;
            }

            public QuietHours build() {
                return new QuietHours(enabled, start, end);
            }
        }

        // Getters + setters
        public Boolean getEnabled() {
            return enabled;
        }

        public void setEnabled(Boolean enabled) {
            this.enabled = enabled;
        }

        public String getStart() {
            return start;
        }

        public void setStart(String start) {
            this.start = start;
        }

        public String getEnd() {
            return end;
        }

        public void setEnd(String end) {
            this.end = end;
        }
    }

    public boolean isEnabled(String notificationType) {
        if (notifications != null && notifications.containsKey(notificationType)) {
            return Boolean.TRUE.equals(notifications.get(notificationType));
        }
        return true;
    }

    public boolean isInQuietHours() {
        if (quietHours == null || !Boolean.TRUE.equals(quietHours.getEnabled())) {
            return false;
        }

        LocalTime now = LocalTime.now();
        LocalTime start = LocalTime.parse(quietHours.getStart());
        LocalTime end = LocalTime.parse(quietHours.getEnd());

        if (start.isAfter(end)) {
            return !now.isBefore(start) || now.isBefore(end);
        } else {
            return !now.isBefore(start) && now.isBefore(end);
        }
    }

    public void updateNotificationPreference(String type, Boolean enabled) {
        if (notifications == null) notifications = new HashMap<>();
        notifications.put(type, enabled);
    }

    public void enableAllNotifications() {
        notifications = new HashMap<>() {{
            put("profile-view", true);
            put("like", true);
            put("message", true);
            put("friend-request", true);
            put("friend-post", true);
        }};
    }

    public void disableAllNotifications() {
        notifications = new HashMap<>() {{
            put("profile-view", false);
            put("like", false);
            put("message", false);
            put("friend-request", false);
            put("friend-post", false);
        }};
    }

    // Factory method for default preferences
    public static UserPreferences createDefault(String userId) {
        return new UserPreferencesBuilder()
                .userId(userId)
                .notifications(new HashMap<>() {{
                    put("profile-view", true);
                    put("like", true);
                    put("message", true);
                    put("friend-request", true);
                    put("friend-post", true);
                }})
                .emailNotifications(true)
                .pushNotifications(true)
                .quietHours(new QuietHours(false, "22:00", "08:00"))
                .build();
    }

    public static UserPreferencesBuilder builder() {
        return new UserPreferencesBuilder();
    }

    public static class UserPreferencesBuilder {

        private String id;
        private String userId;
        private Map<String, Boolean> notifications = new HashMap<>() {{
            put("profile-view", true);
            put("like", true);
            put("message", true);
            put("friend-request", true);
            put("friend-post", true);
        }};
        private Boolean emailNotifications = true;
        private Boolean pushNotifications = true;
        private QuietHours quietHours = new QuietHours(false, "22:00", "08:00");
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public UserPreferencesBuilder id(String id) { this.id = id; return this; }
        public UserPreferencesBuilder userId(String userId) { this.userId = userId; return this; }
        public UserPreferencesBuilder notifications(Map<String, Boolean> n) { this.notifications = n; return this; }
        public UserPreferencesBuilder emailNotifications(Boolean value) { this.emailNotifications = value; return this; }
        public UserPreferencesBuilder pushNotifications(Boolean value) { this.pushNotifications = value; return this; }
        public UserPreferencesBuilder quietHours(QuietHours qh) { this.quietHours = qh; return this; }
        public UserPreferencesBuilder createdAt(LocalDateTime t) { this.createdAt = t; return this; }
        public UserPreferencesBuilder updatedAt(LocalDateTime t) { this.updatedAt = t; return this; }

        public UserPreferences build() {
            return new UserPreferences(
                    id, userId, notifications, emailNotifications,
                    pushNotifications, quietHours, createdAt, updatedAt
            );
        }
    }



    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Map<String, Boolean> getNotifications() { return notifications; }
    public void setNotifications(Map<String, Boolean> notifications) { this.notifications = notifications; }

    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean value) { this.emailNotifications = value; }

    public Boolean getPushNotifications() { return pushNotifications; }
    public void setPushNotifications(Boolean value) { this.pushNotifications = value; }

    public QuietHours getQuietHours() { return quietHours; }
    public void setQuietHours(QuietHours quietHours) { this.quietHours = quietHours; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
