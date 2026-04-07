import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const useWebSocket = ({
  riderId,
  driverId,
  onRideRequest,
  onDriverAccepted,
}) => {
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      onConnect: () => {
        // Driver subscribes to incoming ride requests
        if (driverId) {
          client.subscribe("/topic/rides", (msg) => {
            const ride = JSON.parse(msg.body);
            if (onRideRequest) onRideRequest(ride);
          });
        }

        // Rider subscribes to their own status updates
        if (riderId) {
          client.subscribe(`/topic/rider/${riderId}`, (msg) => {
            const ride = JSON.parse(msg.body);
            if (onDriverAccepted) onDriverAccepted(ride);
          });
        }
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected");
      },
    });

    client.activate();
    clientRef.current = client;

    // Cleanup on unmount
    return () => {
      client.deactivate();
    };
  }, [riderId, driverId]);

  return clientRef;
};

export default useWebSocket;
