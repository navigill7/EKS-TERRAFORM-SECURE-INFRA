package com.unilink.notification_service.repository;

import com.unilink.notification_service.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByUserId(String userId, Pageable pageable);

    Page<Notification> findByUserIdAndRead(String userId, Boolean read, Pageable pageable);

    Long countByUserIdAndRead(String userId, Boolean read);

    Long deleteByUserId(String userId);
}