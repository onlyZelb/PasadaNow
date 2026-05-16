package com.pasadanow.FinalProject.controller;

import com.pasadanow.FinalProject.model.ChatMessage;
import com.pasadanow.FinalProject.repository.ChatMessageRepository;
import com.pasadanow.FinalProject.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    @Autowired
    private ChatMessageRepository chatRepo;
    @Autowired
    private SimpMessagingTemplate broker;
    @Autowired
    private JwtUtils jwtUtils;

    // ── WebSocket — send message ─────────────────────────────────────────
    @MessageMapping("/chat/{rideId}")
    public void sendMessage(
            @DestinationVariable String rideId,
            @Payload Map<String, String> payload) {

        ChatMessage msg = new ChatMessage(
                rideId,
                payload.get("sender"),
                payload.get("role"),
                payload.get("content"));
        chatRepo.save(msg);

        broker.convertAndSend("/topic/chat/" + rideId, msg);
    }

    // ── REST GET — load chat history (both URL forms) ────────────────────
    @GetMapping({ "/api/chat/{rideId}", "/api/rides/{rideId}/messages" })
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable String rideId) {
        return ResponseEntity.ok(
                chatRepo.findByRideIdOrderByTimestampAsc(rideId));
    }

    // ── REST POST — send message via HTTP (commuter fallback) ────────────
    @PostMapping("/api/chat/{rideId}")
    public ResponseEntity<ChatMessage> postMessage(
            @PathVariable String rideId,
            @RequestBody Map<String, String> payload) {

        ChatMessage msg = new ChatMessage(
                rideId,
                payload.get("sender"),
                payload.get("role"),
                payload.get("content"));
        chatRepo.save(msg);

        // Broadcast via WebSocket so driver sees it instantly
        broker.convertAndSend("/topic/chat/" + rideId, msg);

        return ResponseEntity.ok(msg);
    }
}