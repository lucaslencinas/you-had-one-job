"use client";

import { useState, useRef, useCallback } from "react";
import usePartySocket from "partysocket/react";

interface ClientPageProps {
  vercelRegion: string;
}

interface LatencyResult {
  total: number;
  processing: number;
  network: number;
}

interface BenchmarkStats {
  results: LatencyResult[];
  min: number;
  max: number;
  avg: number;
  isRunning: boolean;
}

export default function ClientPage({ vercelRegion }: ClientPageProps) {
  const [latencyStats, setLatencyStats] = useState<LatencyResult | null>(null);
  const [serverLocation, setServerLocation] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkStats | null>(null);
  
  const pendingPingsRef = useRef<Map<number, number>>(new Map());
  const benchmarkResultsRef = useRef<number[]>([]);

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

        // Check if this is part of a benchmark
        if (pendingPingsRef.current.has(data.timestamp)) {
          pendingPingsRef.current.delete(data.timestamp);
          benchmarkResultsRef.current.push(total);
          
          // Update benchmark stats
          const results = benchmarkResultsRef.current;
          setBenchmark(prev => ({
            results: results.map(t => ({ total: t, processing: 0, network: t })),
            min: Math.min(...results),
            max: Math.max(...results),
            avg: Math.round(results.reduce((a, b) => a + b, 0) / results.length),
            isRunning: prev?.isRunning ?? false
          }));
        }
      }
      if (data.type === "welcome" && data.serverLocation) {
        setServerLocation(data.serverLocation);
      }
    },
  });

  const sendPing = () => {
    const now = Date.now();
    socket.send(JSON.stringify({ type: "ping", timestamp: now }));
  };

  const runBenchmark = useCallback(async () => {
    // Reset
    benchmarkResultsRef.current = [];
    pendingPingsRef.current.clear();
    setBenchmark({ results: [], min: 0, max: 0, avg: 0, isRunning: true });

    // Send 10 pings with 100ms gaps
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const now = Date.now();
      pendingPingsRef.current.set(now, now);
      socket.send(JSON.stringify({ type: "ping", timestamp: now }));
    }

    // Wait for all responses (max 3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBenchmark(prev => prev ? { ...prev, isRunning: false } : null);
  }, [socket]);

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">You Had One Job</h1>
        
        <div className="controls">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={sendPing} className="button">
              Single Ping
            </button>
            <button 
              onClick={runBenchmark} 
              className="button"
              disabled={benchmark?.isRunning}
              style={{ opacity: benchmark?.isRunning ? 0.5 : 1 }}
            >
              {benchmark?.isRunning ? 'Running...' : 'Run 10-Ping Benchmark'}
            </button>
          </div>
          
          <div className="stats">
            {latencyStats !== null && (
              <div className="latency-box">
                <p className="latency">Last Ping: <span className="latency-value">{latencyStats.total}ms</span></p>
                <div className="latency-details" style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '10px' }}>
                  <p>Network (RTT): {latencyStats.network}ms</p>
                  <p>Server Processing: {latencyStats.processing}ms</p>
                </div>
              </div>
            )}

            {benchmark && benchmark.results.length > 0 && (
              <div className="latency-box" style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <p className="latency" style={{ marginBottom: '8px' }}>
                  <strong>Benchmark ({benchmark.results.length}/10 pings)</strong>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.9em' }}>
                  <div>
                    <span style={{ opacity: 0.7 }}>Min:</span> <span className="latency-value">{benchmark.min}ms</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Avg:</span> <span className="latency-value">{benchmark.avg}ms</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Max:</span> <span className="latency-value">{benchmark.max}ms</span>
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.8em', opacity: 0.6 }}>
                  All pings: [{benchmark.results.map(r => r.total + 'ms').join(', ')}]
                </div>
              </div>
            )}

            {serverLocation && (
              <p className="latency" style={{ marginTop: '15px' }}>
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
