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
- **Real-time**: Socket.io (or similar WebSocket solution) for low-latency control.
- **Database**: 
  - **MongoDB**: Flexible schema for Game Rooms and Logs.
  - **Postgres** (Future): User accounts and relational data.
- **Hosting**: Vercel (Frontend/API). *Note: Custom server might be needed for persistent WebSockets if Vercel Serverless limits are hit, but Vercel supports integrations or we can use a separate socket server.*

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

### C. The Server (Orchestrator)
- **Responsibility**: 
  - Room management (Create/Join).
  - Input relay (Player -> Host).
  - *Future*: Server-authoritative game state to prevent cheating.
- **Data Model (Draft)**:
  - `Room`: `{ code: string, status: 'waiting'|'playing', teams: Team[] }`
  - `Team`: `{ id: string, players: Player[] }`
  - `Player`: `{ id: string, socketId: string, assignedInputs: InputType[] }`

## 4. Technical Decisions & Constraints
- **Latency**: Critical. Inputs must reach the Host client immediately.
- **Responsiveness**: Player clients must work on any mobile screen size.
- **Scalability**: MVP focuses on single-instance lobbies.

## 5. Directory Structure (Proposed)
```
/src
  /app          # Next.js App Router
  /components   # React Components
    /game       # Game-specific logic (Tetris, etc.)
    /controller # Mobile controller UIs
  /lib
    /socket     # Socket.io client/server logic
    /game-engine # Pure JS game logic (shared if possible)
  /models       # DB Schemas
```
