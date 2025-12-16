"use client";

import { useState, useCallback } from "react";
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
  
  const runHttpBenchmark = useCallback(async () => {
    setHttpBenchmark({ results: [], min: 0, max: 0, avg: 0, isRunning: true });
    const results: number[] = [];

    for (let i = 0; i < 5; i++) {
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

  return (
    <div className="container">
      <main className="main">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            <Link href="/" className="button" style={{ background: '#333', marginRight: '20px' }}>
                ← Back to Game
            </Link>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Cloudflare Performance Lab</h1>
        </div>

        <div className="controls">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <button 
            onClick={runHttpBenchmark} 
            className="button"
            disabled={httpBenchmark?.isRunning}
            style={{ background: '#FFD700', color: '#000', opacity: httpBenchmark?.isRunning ? 0.5 : 1, fontSize: '0.8rem', padding: '10px' }}
            >
            {httpBenchmark?.isRunning ? 'Running...' : 'HTTP API'}
            </button>
            <button 
            onClick={() => runWebSocketBenchmarks('ping', setWsBenchmark)} 
            className="button"
            disabled={wsBenchmark?.isRunning}
            style={{ background: '#66FCF1', color: '#000', opacity: wsBenchmark?.isRunning ? 0.5 : 1, fontSize: '0.8rem', padding: '10px' }}
            >
            {wsBenchmark?.isRunning ? 'Running...' : 'Raw WebSocket'}
            </button>
            <button 
            onClick={() => runWebSocketBenchmarks('ping-redis', setRedisBenchmark)} 
            className="button"
            disabled={redisBenchmark?.isRunning}
            style={{ background: '#FF6B6B', color: '#fff', opacity: redisBenchmark?.isRunning ? 0.5 : 1, fontSize: '0.8rem', padding: '10px' }}
            >
            {redisBenchmark?.isRunning ? 'Running...' : 'Upstash Redis'}
            </button>
            <button 
            onClick={() => runWebSocketBenchmarks('ping-kv', setKvBenchmark)} 
            className="button"
            disabled={kvBenchmark?.isRunning}
            style={{ background: '#FFA500', color: '#fff', opacity: kvBenchmark?.isRunning ? 0.5 : 1, fontSize: '0.8rem', padding: '10px' }}
            >
            {kvBenchmark?.isRunning ? 'Running...' : 'Cloudflare KV'}
            </button>
            <button 
            onClick={() => runWebSocketBenchmarks('ping-d1', setD1Benchmark)} 
            className="button"
            disabled={d1Benchmark?.isRunning}
            style={{ background: '#4CAF50', color: '#fff', opacity: d1Benchmark?.isRunning ? 0.5 : 1, fontSize: '0.8rem', padding: '10px' }}
            >
            {d1Benchmark?.isRunning ? 'Running...' : 'Cloudflare D1'}
            </button>
            <button 
            onClick={() => runWebSocketBenchmarks('ping-do', setDoBenchmark)} 
            className="button"
            disabled={doBenchmark?.isRunning}
            style={{ background: '#9C27B0', color: '#fff', opacity: doBenchmark?.isRunning ? 0.5 : 1, fontSize: '0.8rem', padding: '10px' }}
            >
            {doBenchmark?.isRunning ? 'Running...' : 'Durable Object'}
            </button>
        </div>
        
        <div className="stats" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {renderStats("🌐 HTTP API (Stateless)", httpBenchmark, "#FFD700", "#000")}
            {renderStats("🔌 Raw WebSocket (Stateless)", wsBenchmark, "#66FCF1", "#000")}
            {renderStats("🚀 Upstash Redis (EU)", redisBenchmark, "#FF6B6B", "#fff")}
            {renderStats("🌍 Cloudflare KV (Global)", kvBenchmark, "#FFA500", "#fff")}
            {renderStats("💾 Cloudflare D1 (SQLite)", d1Benchmark, "#4CAF50", "#fff")}
            {renderStats("📦 Durable Object (Compute)", doBenchmark, "#9C27B0", "#fff")}

            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', fontSize: '0.9em', opacity: 0.7 }}>
            {serverLocation && <p>Worker Location: <span style={{ color: '#66FCF1' }}>{serverLocation}</span></p>}
            </div>
        </div>
        </div>
      </main>
    </div>
  );
}

function renderStats(label: string, stats: HttpBenchmarkStats | null, bgColor: string, textColor: string) {
  if (!stats || stats.results.length === 0) return null;
  return (
    <div className="latency-box" style={{ padding: '15px', background: `rgba(${hexToRgb(bgColor)}, 0.1)`, borderRadius: '12px', border: `1px solid ${bgColor}` }}>
      <p className="latency" style={{ marginBottom: '10px', color: bgColor, fontWeight: 'bold' }}>
        {label}
      </p>
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
    </div>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : '255, 255, 255';
}
