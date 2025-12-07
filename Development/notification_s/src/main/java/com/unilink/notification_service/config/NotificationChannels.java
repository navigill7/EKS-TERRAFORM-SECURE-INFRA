package com.unilink.notification_service.config;

public class NotificationChannels {
    public static final String LIKE = "notification:like";
    public static final String MESSAGE = "notification:message";
    public static final String PROFILE_VIEW = "notification:profile-view";
    public static final String FRIEND_POST = "notification:friend-post";
    public static final String FRIEND_REQUEST = "notification:friend-request";

    public static String[] getAllChannels() {
        return new String[]{LIKE, MESSAGE, PROFILE_VIEW, FRIEND_POST, FRIEND_REQUEST};
    }
}
