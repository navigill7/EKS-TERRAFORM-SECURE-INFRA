package com.unilink.notification_service.controller;

import com.unilink.notification_service.service.NotificationService;
import com.unilink.notification_service.service.WebSocketService;

//import lombok.extern.slf4j.Slf4j;
//import org.slf4j.Logger;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

//@Slf4j
@Controller

public class WebSocketController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WebSocketController.class);

    private final NotificationService notificationService;
    private final WebSocketService webSocketService;

    public WebSocketController(NotificationService notificationService, WebSocketService webSocketService) {
        this.notificationService = notificationService;
        this.webSocketService = webSocketService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = headerAccessor.getUser();

        if (user != null) {
            String userId = user.getName();
            String sessionId = headerAccessor.getSessionId();

            webSocketService.addOnlineUser(userId, sessionId);

            // Send initial unread count
            Long unreadCount = notificationService.getUnreadCount(userId);
            webSocketService.sendToUser(userId, "notification:unread-count",
                    Map.of("count", unreadCount));
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = headerAccessor.getUser();

        if (user != null) {
            String userId = user.getName();
            webSocketService.removeOnlineUser(userId);
        }
    }

    @MessageMapping("/notification.markRead")
    public void markAsRead(@Payload Map<String, String> payload, Principal principal) {
        String notificationId = payload.get("notificationId");
        String userId = principal.getName();

        notificationService.markAsRead(userId, notificationId).ifPresentOrElse(
                notification -> {
                    webSocketService.sendToUser(userId, "notification:read-success",
                            Map.of("notificationId", notificationId));

                    Long newUnreadCount = notificationService.getUnreadCount(userId);
                    webSocketService.sendToUser(userId, "notification:unread-count",
                            Map.of("count", newUnreadCount));
                },
                () -> webSocketService.sendToUser(userId, "notification:error",
                        Map.of("message", "Failed to mark as read"))
        );
    }

    @MessageMapping("/notification.markAllRead")
    public void markAllAsRead(Principal principal) {
        String userId = principal.getName();

        try {
            notificationService.markAllAsRead(userId);
            webSocketService.sendToUser(userId, "notification:all-read-success", Map.of());
            webSocketService.sendToUser(userId, "notification:unread-count", Map.of("count", 0));
        } catch (Exception e) {
            log.error("Error marking all as read", e);
            webSocketService.sendToUser(userId, "notification:error",
                    Map.of("message", "Failed to mark all as read"));
        }
    }
}