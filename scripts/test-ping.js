import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:1999/party/lobby");

ws.on("open", () => {
  console.log("Connected to PartyKit");
  const start = Date.now();
  ws.send(JSON.stringify({ type: "ping", timestamp: start }));
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());
  if (message.type === "pong") {
    const end = Date.now();
    console.log(`Pong received! Latency: ${end - message.timestamp}ms`);
    ws.close();
    process.exit(0);
  }
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err);
  process.exit(1);
});
