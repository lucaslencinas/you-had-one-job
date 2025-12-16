"use client";

import { useState } from "react";
import usePartySocket from "partysocket/react";

export default function Home() {
  const [latency, setLatency] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [serverLocation, setServerLocation] = useState<string | null>(null);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTY_HOST || "localhost:1999",
    room: "lobby",
    onMessage(event) {
      const data = JSON.parse(event.data);
      if (data.type === "pong" && data.timestamp) {
        const now = Date.now();
        setLatency(now - data.timestamp);
      }
      if (data.type === "welcome" && data.serverLocation) {
        setServerLocation(data.serverLocation);
      }
    },
  });

  const sendPing = () => {
    const now = Date.now();
    setLastPing(now);
    socket.send(JSON.stringify({ type: "ping", timestamp: now }));
  };

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">You Had One Job</h1>
        
        <div className="controls">
          <button 
            onClick={sendPing}
            className="button"
          >
            Send Ping
          </button>
          
        {latency !== null && (
            <p className="latency">
              Latency: <span className="latency-value">{latency}ms</span>
            </p>
          )}
          {serverLocation && (
            <p className="latency">
              Server Location: <span className="latency-value">{serverLocation}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
