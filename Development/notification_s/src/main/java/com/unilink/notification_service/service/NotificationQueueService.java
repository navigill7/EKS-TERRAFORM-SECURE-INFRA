package com.unilink.notification_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unilink.notification_service.dto.NotificationEventData;
import com.unilink.notification_service.model.Notification;
import com.unilink.notification_service.model.UserPreferences;

import org.redisson.api.RBlockingQueue;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;


@Service

public class NotificationQueueService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationQueueService.class);

    private final RedissonClient redissonClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final NotificationService notificationService;
    private final UserPreferencesService preferencesService;
    private final WebSocketService webSocketService;
    private final ObjectMapper objectMapper;

    @Value("${notification.grouping.window-seconds}")
    private int groupingWindowSeconds;

    private RBlockingQueue<NotificationEventData> notificationQueue;
    private ExecutorService queueProcessor;

    private static final Map<String, PriorityConfig> PRIORITY_MAP = new HashMap<>() {{
        put("message", new PriorityConfig(1, 0));
        put("friend-request", new PriorityConfig(2, 0));
        put("like", new PriorityConfig(3, 2000));
        put("profile-view", new PriorityConfig(4, 3000));
        put("friend-post", new PriorityConfig(5, 5000));
    }};

    public NotificationQueueService(RedissonClient redissonClient, RedisTemplate<String, Object> redisTemplate, NotificationService notificationService, UserPreferencesService preferencesService, WebSocketService webSocketService, ObjectMapper objectMapper) {
        this.redissonClient = redissonClient;
        this.redisTemplate = redisTemplate;
        this.notificationService = notificationService;
        this.preferencesService = preferencesService;
        this.webSocketService = webSocketService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        notificationQueue = redissonClient.getBlockingQueue("notifications:queue");
        queueProcessor = Executors.newFixedThreadPool(3);

        // Start queue processors
        for (int i = 0; i < 3; i++) {
            queueProcessor.submit(this::processQueue);
        }

        log.info("✅ Notification queue processor started");
    }

    @Async
    public void queueNotification(NotificationEventData data) {
        try {
            PriorityConfig config = PRIORITY_MAP.getOrDefault(
                    data.getType(), new PriorityConfig(5, 3000));

            if (config.delay > 0) {
                Thread.sleep(config.delay);
            }

            notificationQueue.offer(data);
            log.info("📥 Queued {} notification for user {}", data.getType(), data.getUserId());
        } catch (Exception e) {
            log.error("❌ Error queuing notification", e);
        }
    }

    private void processQueue() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                NotificationEventData data = notificationQueue.poll(5, TimeUnit.SECONDS);

                if (data != null) {
                    processNotification(data);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("❌ Error processing notification from queue", e);
            }
        }
    }

    private void processNotification(NotificationEventData data) {
        try {
            log.info("⚙️ Processing {} notification for user {}", data.getType(), data.getUserId());

            // Check user preferences
            UserPreferences preferences = preferencesService.getOrCreate(data.getUserId());

            if (!preferences.isEnabled(data.getType())) {
                log.info("⏭️ Notifications disabled for {}", data.getType());
                return;
            }

            // Check deduplication for groupable notifications
            if ("like".equals(data.getType()) || "profile-view".equals(data.getType())) {
                String dedupKey = getDeduplicationKey(
                        data.getType(), data.getUserId(),
                        data.getActorId(), data.getRelatedId());

                String existingId = (String) redisTemplate.opsForValue().get(dedupKey);

                if (existingId != null) {
                    // Update existing grouped notification
                    notificationService.findById(existingId).ifPresent(notification -> {
                        int currentCount = notification.getGroupCount();
                        notification.getMetadata().put("groupCount", currentCount + 1);

                        // Update message
                        if (currentCount == 1) {
                            notification.setMessage(String.format(
                                    "%s and 1 other %s your %s",
                                    data.getActorName(),
                                    "like".equals(data.getType()) ? "liked" : "viewed",
                                    "like".equals(data.getType()) ? "post" : "profile"
                            ));
                        } else {
                            notification.setMessage(String.format(
                                    "%s and %d others %s your %s",
                                    data.getActorName(),
                                    currentCount,
                                    "like".equals(data.getType()) ? "liked" : "viewed",
                                    "like".equals(data.getType()) ? "post" : "profile"
                            ));
                        }

                        notificationService.updateNotification(notification);
                        webSocketService.sendToUser(data.getUserId(), "notification:updated", notification);

                        log.info("🔄 Grouped notification updated (count: {})", currentCount + 1);
                    });
                    return;
                }
            }

            // Create new notification
            Notification notification = Notification.builder()
                    .userId(data.getUserId())
                    .type(Notification.NotificationType.fromString(data.getType()))
                    .actorId(data.getActorId())
                    .actorName(data.getActorName())
                    .actorPicture(data.getActorPicture())
                    .relatedId(data.getRelatedId())
                    .message(data.getMessage())
                    .priority(data.getPriority() != null ?
                            Notification.Priority.valueOf(data.getPriority().toUpperCase()) :
                            Notification.Priority.MEDIUM)
                    .metadata(data.getMetadata() != null ? data.getMetadata() : new HashMap<>())
                    .build();

            notification = notificationService.createNotification(notification);
            log.info("✅ Notification created: {}", notification.getId());

            // Set deduplication key
            if ("like".equals(data.getType()) || "profile-view".equals(data.getType())) {
                String dedupKey = getDeduplicationKey(
                        data.getType(), data.getUserId(),
                        data.getActorId(), data.getRelatedId());
                redisTemplate.opsForValue().set(
                        dedupKey, notification.getId(),
                        groupingWindowSeconds, TimeUnit.SECONDS);
            }

            // Send via WebSocket
            webSocketService.sendToUser(data.getUserId(), "notification:new", notification);

        } catch (Exception e) {
            log.error("❌ Error processing notification", e);
        }
    }

    private String getDeduplicationKey(String type, String userId, String actorId, String relatedId) {
        return String.format("notification:dedup:%s:%s:%s:%s",
                type, userId, actorId, relatedId != null ? relatedId : "none");
    }

    private static class PriorityConfig {
        int priority;
        long delay;

        PriorityConfig(int priority, long delay) {
            this.priority = priority;
            this.delay = delay;
        }
    }
}





