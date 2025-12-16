"use client";

import { useState, useCallback, useEffect } from "react";
import Link from 'next/link';

interface HttpBenchmarkStats {
  results: number[];
  min: number;
  max: number;
  avg: number;
  isRunning: boolean;
}

export function ClientBenchmark() {
  const [httpBenchmark, setHttpBenchmark] = useState<HttpBenchmarkStats | null>(null);
  const [wsBenchmark, setWsBenchmark] = useState<HttpBenchmarkStats | null>(null);
  const [kvBenchmark, setKvBenchmark] = useState<HttpBenchmarkStats | null>(null);
  const [d1Benchmark, setD1Benchmark] = useState<HttpBenchmarkStats | null>(null);
  const [doBenchmark, setDoBenchmark] = useState<HttpBenchmarkStats | null>(null);
  const [redisBenchmark, setRedisBenchmark] = useState<HttpBenchmarkStats | null>(null);
  const [serverLocation, setServerLocation] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  
  const runHttpBenchmark = useCallback(async () => {
    setHttpBenchmark({ results: [], min: 0, max: 0, avg: 0, isRunning: true });
    const results: number[] = [];

    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const start = Date.now();
      try {
        const res = await fetch('/api/ping');
        // Ensure request was successful
        if (!res.ok) throw new Error('Request failed');
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

  const runWebSocketBenchmarks = useCallback(async (type: 'ping' | 'ping-kv' | 'ping-d1' | 'ping-do' | 'ping-redis', setStats: React.Dispatch<React.SetStateAction<HttpBenchmarkStats | null>>) => {
    setStats({ results: [], min: 0, max: 0, avg: 0, isRunning: true });
    const results: number[] = [];

    const ws = new WebSocket('wss://you-had-one-job-ws.lllencinas.workers.dev');
    
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        resolve();
      }
    });

    if (ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket failed to connect");
      setStats(prev => prev ? { ...prev, isRunning: false } : null);
      return;
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'welcome' && data.serverLocation) {
        setServerLocation(data.serverLocation);
      }
      
      const isResponse = 
        (type === 'ping' && data.type === 'pong') ||
        (type === 'ping-kv' && data.type === 'pong-kv') ||
        (type === 'ping-d1' && data.type === 'pong-d1') ||
        (type === 'ping-do' && data.type === 'pong-do') ||
        (type === 'ping-redis' && data.type === 'pong-redis');

      if (isResponse && data.timestamp) {
        const now = Date.now();
        const latency = now - data.timestamp;
        results.push(latency);
        
        setStats({
          results: [...results],
          min: Math.min(...results),
          max: Math.max(...results),
          avg: Math.round(results.reduce((a, b) => a + b, 0) / results.length),
          isRunning: results.length < 5
        });
      }
    };

    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const now = Date.now();
      ws.send(JSON.stringify({ type, timestamp: now }));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    ws.close();
    setStats(prev => prev ? { ...prev, isRunning: false } : null);
  }, []);

  const runAllBenchmarks = useCallback(async () => {
    if (isRunningAll) return;
    setIsRunningAll(true);
    
    await runHttpBenchmark();
    await runWebSocketBenchmarks('ping', setWsBenchmark);
    await runWebSocketBenchmarks('ping-redis', setRedisBenchmark);
    await runWebSocketBenchmarks('ping-kv', setKvBenchmark);
    await runWebSocketBenchmarks('ping-d1', setD1Benchmark);
    await runWebSocketBenchmarks('ping-do', setDoBenchmark);
    
    setIsRunningAll(false);
  }, [runHttpBenchmark, runWebSocketBenchmarks, isRunningAll]);

  useEffect(() => {
    runAllBenchmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <main className="main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Link href="/" className="button" style={{ background: '#333', marginRight: '20px' }}>
                    ← Back to Game
                </Link>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>Cloudflare Performance Lab</h1>
            </div>
            
            <button 
                onClick={runAllBenchmarks}
                className="button"
                disabled={isRunningAll}
                style={{ 
                    background: isRunningAll ? '#333' : '#66FCF1', 
                    color: isRunningAll ? '#888' : '#000',
                    cursor: isRunningAll ? 'not-allowed' : 'pointer',
                    minWidth: '200px'
                }}
            >
                {isRunningAll ? 'Running Benchmarks...' : 'Retrigger Benchmarks'}
            </button>
        </div>

        <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {renderStats("🌐 HTTP API (Stateless)", httpBenchmark, "#FFD700", "#000")}
            {renderStats("🔌 Raw WebSocket (Stateless)", wsBenchmark, "#66FCF1", "#000")}
            {renderStats("🚀 Upstash Redis (EU)", redisBenchmark, "#FF6B6B", "#fff")}
            {renderStats("🌍 Cloudflare KV (Global)", kvBenchmark, "#FFA500", "#fff")}
            {renderStats("💾 Cloudflare D1 (SQLite)", d1Benchmark, "#4CAF50", "#fff")}
            {renderStats("📦 Durable Object (Compute)", doBenchmark, "#9C27B0", "#fff")}
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', fontSize: '0.9em', opacity: 0.7, textAlign: 'center' }}>
            {serverLocation && <p>Worker Location: <span style={{ color: '#66FCF1' }}>{serverLocation}</span></p>}
        </div>
      </main>
    </div>
  );
}

function renderStats(label: string, stats: HttpBenchmarkStats | null, bgColor: string, textColor: string) {
  // Always render the box, even if empty/null, to keep layout stable? 
  // User said "Show 2 columns", triggering implies they fill up. 
  // If we sequentially load, initially they might be missing.
  // "The benchmark, i don't want to click on the buttons, when the page loads, trigger all those benchmarks in sequence"
  // It looks nicer if placeholders are there, but the original code returned null.
  // I'll keep the behavior of showing them as they come for now, but maybe I should show a "Waiting..." state?
  // Let's modify renderStats to show a placeholder if stats is null but we want the layout to be consistent?
  // Actually, let's keep it simple. The user just said "trigger all... in sequence".
  // Note: if I hide them, the grid will jump around. 
  // Better to show a "Pending" state or just keep them hidden until they start?
  // "Show 2 columns instead of one" implies filling the space. 
  // Let's make renderStats return a placeholder if stats is null so the grid structure is visible immediately?
  // No, the original code had `if (!stats) return null`. 
  // I will keep it as is, but maybe the user wants to see the grid immediately. 
  // I'll implement a "Pending" state inside renderStats to ensure the layout is stable and users see what's coming.
  
  const isPending = !stats;
  
  return (
    <div className="latency-box" style={{ 
        padding: '15px', 
        background: `rgba(${hexToRgb(bgColor)}, 0.1)`, 
        borderRadius: '12px', 
        border: `1px solid ${bgColor}`,
        opacity: isPending ? 0.5 : 1
    }}>
      <p className="latency" style={{ marginBottom: '10px', color: bgColor, fontWeight: 'bold' }}>
        {label}
      </p>
      {isPending ? (
          <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              Waiting...
          </div>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '1.1em' }}>
            <div>
              <span style={{ opacity: 0.7 }}>Min:</span> <span style={{ color: '#fff' }}>{stats.min}ms</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Avg:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{stats.avg}ms</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Max:</span> <span style={{ color: '#fff' }}>{stats.max}ms</span>
            </div>
          </div>
      )}
    </div>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : '255, 255, 255';
}
