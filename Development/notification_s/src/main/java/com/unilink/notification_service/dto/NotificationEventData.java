package com.unilink.notification_service.dto;

//import lombok.AllArgsConstructor;
//import lombok.Builder;
//import lombok.Data;
//import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

//@Data
//@Builder
//@NoArgsConstructor
//@AllArgsConstructor
public class NotificationEventData implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userId;
    private String type;
    private String actorId;
    private String actorName;
    private String actorPicture;
    private String relatedId;
    private String message;
    private String priority;
    private Map<String, Object> metadata;

    // Explicit builder method (in case Lombok doesn't work)
    public static NotificationEventDataBuilder builder() {
        return new NotificationEventDataBuilder();
    }

    // Manual builder class (backup if Lombok fails)
    public static class NotificationEventDataBuilder {
        private String userId;
        private String type;
        private String actorId;
        private String actorName;
        private String actorPicture;
        private String relatedId;
        private String message;
        private String priority;
        private Map<String, Object> metadata;

        public NotificationEventDataBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public NotificationEventDataBuilder type(String type) {
            this.type = type;
            return this;
        }

        public NotificationEventDataBuilder actorId(String actorId) {
            this.actorId = actorId;
            return this;
        }

        public NotificationEventDataBuilder actorName(String actorName) {
            this.actorName = actorName;
            return this;
        }

        public NotificationEventDataBuilder actorPicture(String actorPicture) {
            this.actorPicture = actorPicture;
            return this;
        }

        public NotificationEventDataBuilder relatedId(String relatedId) {
            this.relatedId = relatedId;
            return this;
        }

        public NotificationEventDataBuilder message(String message) {
            this.message = message;
            return this;
        }

        public NotificationEventDataBuilder priority(String priority) {
            this.priority = priority;
            return this;
        }

        public NotificationEventDataBuilder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public NotificationEventData build() {
            NotificationEventData data = new NotificationEventData();
            data.userId = this.userId;
            data.type = this.type;
            data.actorId = this.actorId;
            data.actorName = this.actorName;
            data.actorPicture = this.actorPicture;
            data.relatedId = this.relatedId;
            data.message = this.message;
            data.priority = this.priority;
            data.metadata = this.metadata != null ? this.metadata : new HashMap<>();
            return data;
        }
    }

    // Explicit getters and setters (in case Lombok @Data doesn't work)
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
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

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}