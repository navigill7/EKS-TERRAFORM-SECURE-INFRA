package com.unilink.notification_service.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "notifications")
@CompoundIndexes({
        @CompoundIndex(name = "userId_createdAt", def = "{'userId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "userId_read", def = "{'userId': 1, 'read': 1}")
})
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private NotificationType type;

    private String actorId;

    private String actorName;

    private String actorPicture;

    private String relatedId;

    private String message;

    private Boolean read = false;

    private Priority priority = Priority.MEDIUM;

    private Map<String, Object> metadata = new HashMap<>();

    @Indexed(expireAfterSeconds = 0)
    private LocalDateTime expiresAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // No-arg constructor
    public Notification() {
    }

    // All-args constructor
    public Notification(String id, String userId, NotificationType type, String actorId, String actorName,
                        String actorPicture, String relatedId, String message, Boolean read, Priority priority,
                        Map<String, Object> metadata, LocalDateTime expiresAt, LocalDateTime createdAt,
                        LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorPicture = actorPicture;
        this.relatedId = relatedId;
        this.message = message;
        this.read = read != null ? read : false;
        this.priority = priority != null ? priority : Priority.MEDIUM;
        this.metadata = metadata != null ? metadata : new HashMap<>();
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Virtual fields (computed on the fly)
    @Transient
    public Boolean isGrouped() {
        return metadata != null &&
                metadata.containsKey("groupCount") &&
                ((Integer) metadata.get("groupCount")) > 1;
    }

    @Transient
    public Integer getGroupCount() {
        return metadata != null && metadata.containsKey("groupCount")
                ? (Integer) metadata.get("groupCount")
                : 1;
    }

    public enum NotificationType {
        LIKE("like"),
        MESSAGE("message"),
        PROFILE_VIEW("profile-view"),
        FRIEND_POST("friend-post"),
        FRIEND_REQUEST("friend-request");

        private final String value;

        NotificationType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static NotificationType fromString(String value) {
            for (NotificationType type : NotificationType.values()) {
                if (type.value.equals(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Invalid notification type: " + value);
        }
    }

    public enum Priority {
        HIGH, MEDIUM, LOW
    }

    // Manual builder (kept as-is)
    public static NotificationBuilder builder() {
        return new NotificationBuilder();
    }

    public static class NotificationBuilder {
        private String id;
        private String userId;
        private NotificationType type;
        private String actorId;
        private String actorName;
        private String actorPicture;
        private String relatedId;
        private String message;
        private Boolean read = false;
        private Priority priority = Priority.MEDIUM;
        private Map<String, Object> metadata = new HashMap<>();
        private LocalDateTime expiresAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public NotificationBuilder id(String id) {
            this.id = id;
            return this;
        }

        public NotificationBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public NotificationBuilder type(NotificationType type) {
            this.type = type;
            return this;
        }

        public NotificationBuilder actorId(String actorId) {
            this.actorId = actorId;
            return this;
        }

        public NotificationBuilder actorName(String actorName) {
            this.actorName = actorName;
            return this;
        }

        public NotificationBuilder actorPicture(String actorPicture) {
            this.actorPicture = actorPicture;
            return this;
        }

        public NotificationBuilder relatedId(String relatedId) {
            this.relatedId = relatedId;
            return this;
        }

        public NotificationBuilder message(String message) {
            this.message = message;
            return this;
        }

        public NotificationBuilder read(Boolean read) {
            this.read = read;
            return this;
        }

        public NotificationBuilder priority(Priority priority) {
            this.priority = priority;
            return this;
        }

        public NotificationBuilder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public NotificationBuilder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public NotificationBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public NotificationBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Notification build() {
            Notification notification = new Notification();
            notification.id = this.id;
            notification.userId = this.userId;
            notification.type = this.type;
            notification.actorId = this.actorId;
            notification.actorName = this.actorName;
            notification.actorPicture = this.actorPicture;
            notification.relatedId = this.relatedId;
            notification.message = this.message;
            notification.read = this.read;
            notification.priority = this.priority;
            notification.metadata = this.metadata != null ? this.metadata : new HashMap<>();
            notification.expiresAt = this.expiresAt;
            notification.createdAt = this.createdAt;
            notification.updatedAt = this.updatedAt;
            return notification;
        }
    }

    // Getters and setters (kept as-is)
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorPicture() {
        return actorPicture;
    }

    public void setActorPicture(String actorPicture) {
        this.actorPicture = actorPicture;
    }

    public String getRelatedId() {
        return relatedId;
    }

    public void setRelatedId(String relatedId) {
        this.relatedId = relatedId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
