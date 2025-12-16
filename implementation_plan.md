# implementation_plan.md

## Phase 1: Room & Connection Management (Milestone 1)
- [ ] **UI: Lobby & Create Room**
    - [ ] Create `CreateRoomButton` component calling `/api/rooms/create`.
    - [ ] Create `JoinRoomForm` component to input Room ID.
    - [ ] Handle redirect to `/room/[roomId]`.
- [ ] **UI: Waiting Room**
    - [ ] Create `RoomPage` (client-side) connecting to `wss://.../game/[roomId]`.
    - [ ] Implement `join` message handling in `GameRoom` DO (`src/game-room.ts`).
    - [ ] Broadcast player list update from DO to all clients.
    - [ ] Show connected players list in UI.
- [ ] **Team Selection**
    - [ ] Add "Join Team A" / "Join Team B" logic in UI & Backend.
    - [ ] Enforce team limits (optional but good).

## Phase 2: Single Player Tetris Core (Milestone 2 & 3)
- [x] **Tetris Logic (Pure Function)**
    - [x] Create `libs/tetris.ts` with pure game logic (grid, pieces, rotation, collision).
    - [x] Implement `moveLeft`, `moveRight`, `rotate`, `drop`, `hardDrop`.
    - [x] Implement `tick` function for gravity.
- [x] **Tetris UI Component**
    - [x] Create `<TetrisBoard />` using HTML Canvas or CSS Grid.
    - [x] Implement keyboard controls hook.
    - [x] Create `/tetris-solo` page to test game loop locally (no backend).

## Phase 3: Multiplayer Synchronization (Milestone 4)
- [ ] **Backend Game State**
    - [ ] Update `GameRoom` DO to hold `TetrisState` for the room.
    - [ ] Implement `game-tick` loop inside DO (using `setInterval` or `alarm`).
    - [ ] Handle client input messages (`move`, `rotate`, etc.) in DO.
- [ ] **Client-Server Sync**
    - [ ] Send inputs from Client -> Server (optimistically update local UI?).
    - [ ] Broadcast `state-update` from Server -> Clients.
    - [ ] Render remote state in UI.

## Phase 4: Two-Team Mechanics (Milestone 5)
- [ ] **Dual Boards**
    - [ ] Update `GameRoom` DO to manage TWO separate Tetris instances (Team A vs Team B).
    - [ ] Update UI to render two `<TetrisBoard />` components side-by-side.
- [ ] **Role Management (The "You Had One Job" Twist)**
    - [ ] Assign roles: "Mover" (Left/Right), "Rotator" (Up), "Dropper" (Down/Space).
    - [ ] Enforce input restrictions based on role in Backend.
    - [ ] Update UI to show assigned role and only enable relevant keys.

## Phase 5: Game Loop & Polish (Milestone 6)
- [ ] **Game Flow**
    - [ ] Implement "Ready Check" logic.
    - [ ] Countdown (3... 2... 1... GO).
    - [ ] Game Over detection (top out).
    - [ ] "Winner" declaration screen.
- [ ] **Cleanup & Rematch**
    - [ ] "Play Again" button resetting state.
    - [ ] Handle player disconnects (pause game?).
- [ ] **Visual Polish**
    - [ ] Animations for line clears.
    - [ ] Sound effects (optional).
