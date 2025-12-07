package com.unilink.notification_service.service;

import com.unilink.notification_service.dto.NotificationStatistics;
import com.unilink.notification_service.model.Notification;
import com.unilink.notification_service.model.UserPreferences;
import com.unilink.notification_service.repository.NotificationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Service

public class NotificationService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final MongoTemplate mongoTemplate;
    private final UserPreferencesService preferencesService;
    @Autowired
    public NotificationService(NotificationRepository notificationRepository, MongoTemplate mongoTemplate, UserPreferencesService preferencesService) {
        this.notificationRepository = notificationRepository;
        this.mongoTemplate = mongoTemplate;
        this.preferencesService = preferencesService;
    }

    public Page<Notification> getNotifications(String userId, int page, int size, Boolean unreadOnly) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (Boolean.TRUE.equals(unreadOnly)) {
            return notificationRepository.findByUserIdAndRead(userId, false, pageable);
        }

        return notificationRepository.findByUserId(userId, pageable);
    }

    public Long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndRead(userId, false);
    }

    public Optional<Notification> markAsRead(String userId, String notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);

        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();

            if (notification.getUserId().equals(userId)) {
                notification.setRead(true);
                notification.setUpdatedAt(LocalDateTime.now());
                return Optional.of(notificationRepository.save(notification));
            }
        }

        return Optional.empty();
    }

    public void markAllAsRead(String userId) {
        Page<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndRead(userId, false, Pageable.unpaged());

        unreadNotifications.forEach(notification -> {
            notification.setRead(true);
            notification.setUpdatedAt(LocalDateTime.now());
        });

        notificationRepository.saveAll(unreadNotifications.getContent());
        log.info("✅ Marked all notifications as read for user: {}", userId);
    }

    public boolean deleteNotification(String userId, String notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);

        if (notificationOpt.isPresent() && notificationOpt.get().getUserId().equals(userId)) {
            notificationRepository.deleteById(notificationId);
            return true;
        }

        return false;
    }

    public void deleteAllNotifications(String userId) {
        notificationRepository.deleteByUserId(userId);
        log.info("✅ Deleted all notifications for user: {}", userId);
    }

    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());

        if (notification.getExpiresAt() == null) {
            notification.setExpiresAt(LocalDateTime.now().plusDays(90));
        }

        return notificationRepository.save(notification);
    }

    public Optional<Notification> updateNotification(Notification notification) {
        notification.setUpdatedAt(LocalDateTime.now());
        return Optional.of(notificationRepository.save(notification));
    }

    public List<NotificationStatistics> getStatistics(String userId) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("userId").is(userId)),
                Aggregation.group("type")
                        .count().as("count")
                        .sum(Aggregation.newAggregation(
                                Aggregation.match(Criteria.where("read").is(false))
                        ).toString()).as("unread")
        );

        AggregationResults<NotificationStatistics> results =
                mongoTemplate.aggregate(aggregation, "notifications", NotificationStatistics.class);

        return results.getMappedResults();
    }

    public Optional<Notification> findById(String notificationId) {
        return notificationRepository.findById(notificationId);
    }
}