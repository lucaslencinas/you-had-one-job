"use client";

import { useState, useRef, useCallback } from "react";

interface ClientPageProps {
  vercelRegion: string;
}

interface LatencyResult {
  total: number;
  processing: number;
  network: number;
}

interface HttpBenchmarkStats {
  results: number[];
  min: number;
  max: number;
  avg: number;
  isRunning: boolean;
}

export default function ClientPage({ vercelRegion }: ClientPageProps) {
  const [httpBenchmark, setHttpBenchmark] = useState<HttpBenchmarkStats | null>(null);
  
  const runHttpBenchmark = useCallback(async () => {
    setHttpBenchmark({ results: [], min: 0, max: 0, avg: 0, isRunning: true });
    const results: number[] = [];

    // Send 10 HTTP requests with 100ms gaps
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const start = Date.now();
      try {
        await fetch('/api/ping');
        const end = Date.now();
        results.push(end - start);
        
        setHttpBenchmark({
          results: [...results],
          min: Math.min(...results),
          max: Math.max(...results),
          avg: Math.round(results.reduce((a, b) => a + b, 0) / results.length),
          isRunning: true
        });
      } catch (e) {
        console.error('HTTP ping failed', e);
      }
    }

    setHttpBenchmark(prev => prev ? { ...prev, isRunning: false } : null);
  }, []);

  const [workerBenchmark, setWorkerBenchmark] = useState<HttpBenchmarkStats | null>(null);
  const [workerLocation, setWorkerLocation] = useState<string | null>(null);
  
  const runWorkerBenchmark = useCallback(async () => {
    setWorkerBenchmark({ results: [], min: 0, max: 0, avg: 0, isRunning: true });
    const results: number[] = [];

    // Connect to the Worker WebSocket
    const ws = new WebSocket('wss://you-had-one-job-ws.lllencinas.workers.dev');
    
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
      ws.onerror = () => resolve();
      // Handle connection errors
      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        resolve(); // Continue even on error to avoid hanging
      }
    });

    if (ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket failed to connect");
      setWorkerBenchmark(prev => prev ? { ...prev, isRunning: false } : null);
      return;
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'welcome' && data.serverLocation) {
        // Only set location, don't interfere with ping
      }
      if (data.type === 'pong' && data.timestamp) {
        const now = Date.now();
        const latency = now - data.timestamp;
        results.push(latency);
        
        setWorkerBenchmark({
          results: [...results],
          min: Math.min(...results),
          max: Math.max(...results),
          avg: Math.round(results.reduce((a, b) => a + b, 0) / results.length),
          isRunning: results.length < 10
        });
      }
    };

    // Send 10 pings with 100ms gaps
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const now = Date.now();
      ws.send(JSON.stringify({ type: 'ping', timestamp: now }));
    }

    // Wait for responses
    await new Promise(resolve => setTimeout(resolve, 2000));
    ws.close();
    
    setWorkerBenchmark(prev => prev ? { ...prev, isRunning: false } : null);
  }, []);

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">You Had One Job</h1>
        
        <div className="controls">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button 
              onClick={runHttpBenchmark} 
              className="button"
              disabled={httpBenchmark?.isRunning}
              style={{ opacity: httpBenchmark?.isRunning ? 0.5 : 1, background: '#FFD700', color: '#000' }}
            >
              {httpBenchmark?.isRunning ? 'Running...' : 'Test HTTP API Latency'}
            </button>
            <button 
              onClick={runWorkerBenchmark} 
              className="button"
              disabled={workerBenchmark?.isRunning}
              style={{ opacity: workerBenchmark?.isRunning ? 0.5 : 1, background: '#66FCF1', color: '#000' }}
            >
              {workerBenchmark?.isRunning ? 'Running...' : 'Test Game Server Latency'}
            </button>
          </div>
          
          <div className="stats">
            {httpBenchmark && httpBenchmark.results.length > 0 && (
              <div className="latency-box" style={{ marginTop: '15px', padding: '10px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                <p className="latency" style={{ marginBottom: '8px' }}>
                  <strong>🌐 HTTP API / Cloudflare Edge ({httpBenchmark.results.length}/10)</strong>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.9em' }}>
                  <div>
                    <span style={{ opacity: 0.7 }}>Min:</span> <span style={{ color: '#FFD700' }}>{httpBenchmark.min}ms</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Avg:</span> <span style={{ color: '#FFD700' }}>{httpBenchmark.avg}ms</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Max:</span> <span style={{ color: '#FFD700' }}>{httpBenchmark.max}ms</span>
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.8em', opacity: 0.6 }}>
                  All pings: [{httpBenchmark.results.map(r => r + 'ms').join(', ')}]
                </div>
              </div>
            )}

            {workerBenchmark && workerBenchmark.results.length > 0 && (
              <div className="latency-box" style={{ marginTop: '15px', padding: '10px', background: 'rgba(102, 252, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(102, 252, 241, 0.3)' }}>
                <p className="latency" style={{ marginBottom: '8px' }}>
                  <strong>⚡ Game Server / WebSockets ({workerBenchmark.results.length}/10)</strong>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.9em' }}>
                  <div>
                    <span style={{ opacity: 0.7 }}>Min:</span> <span className="latency-value">{workerBenchmark.min}ms</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Avg:</span> <span className="latency-value">{workerBenchmark.avg}ms</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Max:</span> <span className="latency-value">{workerBenchmark.max}ms</span>
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.8em', opacity: 0.6 }}>
                  All pings: [{workerBenchmark.results.map(r => r + 'ms').join(', ')}]
                </div>
                {workerLocation && (
                  <div style={{ marginTop: '5px', fontSize: '0.8em', opacity: 0.7 }}>
                    Server Location: {workerLocation}
                  </div>
                )}
              </div>
            )}

            <p className="latency" style={{ marginTop: '20px' }}>
              Your Region (detected): <span className="latency-value">{vercelRegion}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
