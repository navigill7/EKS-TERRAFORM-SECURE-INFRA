package com.unilink.notification_service.service;
import com.unilink.notification_service.model.Notification;


import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;


@Service

public class WebSocketService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WebSocketService.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ONLINE_USERS_KEY = "notification:online";
    private static final String SOCKET_PREFIX = "notification:socket:";

    public WebSocketService(SimpMessagingTemplate messagingTemplate, RedisTemplate<String, Object> redisTemplate) {
        this.messagingTemplate = messagingTemplate;
        this.redisTemplate = redisTemplate;
    }

    public void sendToUser(String userId, String event, Object payload) {
        // Check if user is online
        Boolean isOnline = redisTemplate.opsForSet().isMember(ONLINE_USERS_KEY, userId);

        if (Boolean.TRUE.equals(isOnline)) {
            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/" + event,
                    payload
            );
            log.info("📤 Sent {} to user {}", event, userId);
        } else {
            log.info("👤 User {} is offline, notification stored in DB", userId);
        }
    }

    public void broadcastToAll(String event, Object payload) {
        messagingTemplate.convertAndSend("/topic/" + event, payload);
        log.info("📡 Broadcasted {} to all users", event);
    }

    public void addOnlineUser(String userId, String sessionId) {
        redisTemplate.opsForSet().add(ONLINE_USERS_KEY, userId);
        redisTemplate.opsForValue().set(SOCKET_PREFIX + userId, sessionId);
        log.info("✅ User {} connected (session: {})", userId, sessionId);
    }

    public void removeOnlineUser(String userId) {
        redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, userId);
        redisTemplate.delete(SOCKET_PREFIX + userId);
        log.info("❌ User {} disconnected", userId);
    }

    public boolean isUserOnline(String userId) {
        return Boolean.TRUE.equals(
                redisTemplate.opsForSet().isMember(ONLINE_USERS_KEY, userId));
    }

    public Set<Object> getOnlineUsers() {
        return redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
    }
}