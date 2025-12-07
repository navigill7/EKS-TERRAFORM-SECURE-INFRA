package com.unilink.notification_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unilink.notification_service.config.NotificationChannels;
import com.unilink.notification_service.dto.NotificationEventData;


import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;


@Service

public class RedisEventListener implements MessageListener {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RedisEventListener.class);

    private final RedisMessageListenerContainer messageListenerContainer;
    private final NotificationQueueService queueService;
    private final ObjectMapper objectMapper;

    private static final Map<String, Function<NotificationEventData, String>> MESSAGE_GENERATORS = new HashMap<>() {{
        put("like", data -> data.getActorName() + " liked your post");
        put("message", data -> data.getActorName() + " sent you a message");
        put("profile-view", data -> data.getActorName() + " viewed your profile");
        put("friend-post", data -> data.getActorName() + " shared a new post");
        put("friend-request", data -> data.getActorName() + " sent you a friend request");
    }};

    public RedisEventListener(RedisMessageListenerContainer messageListenerContainer, NotificationQueueService queueService, ObjectMapper objectMapper) {
        this.messageListenerContainer = messageListenerContainer;
        this.queueService = queueService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        log.info("🎧 Initializing notification event listener...");

        // Subscribe to all notification channels
        for (String channel : NotificationChannels.getAllChannels()) {
            messageListenerContainer.addMessageListener(this, new ChannelTopic(channel));
        }

        log.info("✅ Event listener initialized - subscribed to {} channels",
                NotificationChannels.getAllChannels().length);
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            String body = new String(message.getBody());

            log.info("📨 Received event from {}", channel);

            Map<String, Object> data = objectMapper.readValue(body, Map.class);

            // Validate required fields
            if (!data.containsKey("userId") || !data.containsKey("actorId") ||
                    !data.containsKey("actorName")) {
                log.error("❌ Invalid notification data: {}", data);
                return;
            }

            // Determine notification type from channel
            String type = getTypeFromChannel(channel);
            if (type == null) {
                log.warn("⚠️ Unknown channel: {}", channel);
                return;
            }

            // Generate message
            NotificationEventData eventData = NotificationEventData.builder()
                    .userId((String) data.get("userId"))
                    .type(type)
                    .actorId((String) data.get("actorId"))
                    .actorName((String) data.get("actorName"))
                    .actorPicture((String) data.getOrDefault("actorPicture", ""))
                    .relatedId((String) data.get("relatedId"))
                    .priority((String) data.getOrDefault("priority", "medium"))
                    .metadata((Map<String, Object>) data.getOrDefault("metadata", new HashMap<>()))
                    .build();

            // Generate message
            String generatedMessage = MESSAGE_GENERATORS.getOrDefault(type,
                    d -> "New notification").apply(eventData);
            eventData.setMessage(generatedMessage);

            // Queue for processing
            queueService.queueNotification(eventData);

        } catch (Exception e) {
            log.error("❌ Error processing notification event", e);
        }
    }

    private String getTypeFromChannel(String channel) {
        return switch (channel) {
            case NotificationChannels.LIKE -> "like";
            case NotificationChannels.MESSAGE -> "message";
            case NotificationChannels.PROFILE_VIEW -> "profile-view";
            case NotificationChannels.FRIEND_POST -> "friend-post";
            case NotificationChannels.FRIEND_REQUEST -> "friend-request";
            default -> null;
        };
    }
}