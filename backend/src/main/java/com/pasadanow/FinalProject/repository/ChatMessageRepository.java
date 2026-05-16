package com.pasadanow.FinalProject.repository;

import com.pasadanow.FinalProject.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByRideIdOrderByTimestampAsc(String rideId);
}