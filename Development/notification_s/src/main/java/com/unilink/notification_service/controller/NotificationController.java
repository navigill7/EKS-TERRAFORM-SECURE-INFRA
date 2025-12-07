package com.unilink.notification_service.controller;



import com.unilink.notification_service.dto.NotificationStatistics;
import com.unilink.notification_service.model.Notification;
import com.unilink.notification_service.service.NotificationService;

//import lombok.extern.slf4j.Slf4j;
//import org.slf4j.Logger;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

//@Slf4j
@RestController
@RequestMapping("/api/notifications")

public class NotificationController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean unreadOnly) {

        String userId = authentication.getName();
        log.info("📍 getNotifications - User ID: {}", userId);

        Page<Notification> notifications = notificationService.getNotifications(
                userId, page, size, unreadOnly);

        return ResponseEntity.ok(Map.of(
                "notifications", notifications.getContent(),
                "totalPages", notifications.getTotalPages(),
                "currentPage", notifications.getNumber(),
                "totalNotifications", notifications.getTotalElements()
        ));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        String userId = authentication.getName();
        log.info("📍 getUnreadCount - User ID: {}", userId);

        Long count = notificationService.getUnreadCount(userId);

        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            Authentication authentication,
            @PathVariable String id) {

        String userId = authentication.getName();

        return notificationService.markAsRead(userId, id)
                .map(notification -> ResponseEntity.ok(Map.of(
                        "message", "Notification marked as read",
                        "notification", notification
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication authentication) {
        String userId = authentication.getName();

        notificationService.markAllAsRead(userId);

        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            Authentication authentication,
            @PathVariable String id) {

        String userId = authentication.getName();

        boolean deleted = notificationService.deleteNotification(userId, id);

        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/all")
    public ResponseEntity<Map<String, String>> deleteAllNotifications(Authentication authentication) {
        String userId = authentication.getName();

        notificationService.deleteAllNotifications(userId);

        return ResponseEntity.ok(Map.of("message", "All notifications deleted"));
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, List<NotificationStatistics>>> getStatistics(
            Authentication authentication) {

        String userId = authentication.getName();

        List<NotificationStatistics> stats = notificationService.getStatistics(userId);

        return ResponseEntity.ok(Map.of("statistics", stats));
    }
}