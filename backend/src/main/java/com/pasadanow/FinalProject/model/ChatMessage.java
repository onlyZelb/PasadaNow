package com.pasadanow.FinalProject.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "messages")
public class ChatMessage {

    @Id
    private String id;

    private String rideId; // links to PostgreSQL rides.id
    private String sender; // username
    private String role; // "commuter" or "driver"
    private String content;
    private Instant timestamp = Instant.now();

    public ChatMessage() {
    }

    public ChatMessage(String rideId, String sender, String role, String content) {
        this.rideId = rideId;
        this.sender = sender;
        this.role = role;
        this.content = content;
        this.timestamp = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getRideId() {
        return rideId;
    }

    public String getSender() {
        return sender;
    }

    public String getRole() {
        return role;
    }

    public String getContent() {
        return content;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setRideId(String v) {
        this.rideId = v;
    }

    public void setSender(String v) {
        this.sender = v;
    }

    public void setRole(String v) {
        this.role = v;
    }

    public void setContent(String v) {
        this.content = v;
    }

    public void setTimestamp(Instant v) {
        this.timestamp = v;
    }
}