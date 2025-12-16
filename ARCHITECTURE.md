# Architecture & Tech Stack

## 1. High-Level Architecture
The system follows a **Host-Controller** pattern, common in party games (like Jackbox).

```mermaid
graph TD
    subgraph "Clients"
        Host[Game Client (Laptop/TV)] -- "Socket.io (Game State)" --> Server
        P1[Player 1 (Phone)] -- "Socket.io (Inputs)" --> Server
        P2[Player 2 (Phone)] -- "Socket.io (Inputs)" --> Server
    end

    subgraph "Backend (Vercel/Node)"
        Server[Next.js Server / Socket Server]
        DB[(MongoDB/Postgres)]
    end

    P1 -->|Input: 'Left'| Server
    P2 -->|Input: 'Rotate'| Server
    Server -->|Broadcast Input| Host
    Host -->|Render Game| Host
```

## 2. Tech Stack
- **Framework**: Next.js (React) - Unified frontend and API routes.
- **Real-time**: **PartyKit** (Cloudflare Workers) for WebSockets.
  - *Reasoning*: Serverless WebSockets, scales to zero, easy integration with Vercel.
- **Database**: 
  - **MongoDB**: Flexible schema for Game Rooms and Logs.
- **Hosting**: 
  - **Frontend**: Vercel (points to `apps/web`).
  - **WebSocket Server**: PartyKit (points to `apps/server`).

## 3. Key Components

### A. Game Client (The Host)
- **Responsibility**: The "Source of Truth" for the visual game state in MVP.
- **Logic**: Runs the game loop (Tetris engine).
- **Display**: Split screen for 2v2.
- **Tech**: React + Canvas (or HTML DOM for simple Tetris).

### B. Player Client (The Controller)
- **Responsibility**: Low-latency input transmission.
- **UI**: Context-aware buttons. If I am assigned "Left/Right", I only see those.
- **Tech**: React, Touch Events (prevent double-tap zoom, low latency).

### C. The Server (PartyKit)
- **Responsibility**: 
  - Room management (Create/Join).
  - Input relay (Player -> Host).
  - **Ping/Pong**: Latency monitoring.
- **Disconnection Logic**:
  - **Player Drop**: 
    - Game **PAUSES** immediately.
    - Show "Waiting for Player..." overlay.
    - **Timeout**: 120s. If no reconnect, game ends or buttons re-arranged (if possible).
    - **Reconnect**: Show 3-2-1 countdown before resuming.
  - **Host Drop**: Game state lost. Redirect players to Lobby with error.

## 4. Technical Decisions & Constraints
- **Latency**: Critical. Inputs must reach the Host client immediately.
- **Responsiveness**: Player clients must work on any mobile screen size.
- **Scalability**: MVP focuses on single-instance lobbies.

## 5. Directory Structure (Monorepo)
We will use a simple monorepo structure to manage both deployments from one repo.
```
/
  /apps
    /web          # Next.js App (Deployed to Vercel)
    /server       # PartyKit Server (Deployed to Cloudflare)
  /packages
    /shared       # Shared Types/Logic (optional)
  package.json    # Workspaces config
```
