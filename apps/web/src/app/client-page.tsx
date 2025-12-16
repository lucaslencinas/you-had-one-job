"use client";

import { useState, useEffect } from "react";
import usePartySocket from "partysocket/react";

interface ClientPageProps {
  vercelRegion: string;
}

export default function ClientPage({ vercelRegion }: ClientPageProps) {
  const [latencyStats, setLatencyStats] = useState<{
    total: number;
    processing: number;
    network: number;
  } | null>(null);
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
        const total = now - data.timestamp;
        const processing = (data.serverSentAt || now) - (data.serverReceivedAt || now);
        
        setLatencyStats({
          total,
          processing,
          network: total - processing
        });
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
          
          <div className="stats">
             {latencyStats !== null && (
              <div className="latency-box">
                <p className="latency">Total Latency: <span className="latency-value">{latencyStats.total}ms</span></p>
                <div className="latency-details" style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '10px' }}>
                  <p>Network (RTT): {latencyStats.network}ms</p>
                  <p>Server Processing: {latencyStats.processing}ms</p>
                </div>
              </div>
            )}
            {serverLocation && (
              <p className="latency">
                PartyKit Server: <span className="latency-value">{serverLocation}</span>
              </p>
            )}
             <p className="latency">
                Vercel Region: <span className="latency-value">{vercelRegion}</span>
              </p>
          </div>
        </div>
      </main>
    </div>
  );
}
