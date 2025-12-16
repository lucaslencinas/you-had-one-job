# Product Vision: You Had One Job

## 1. Executive Summary
"You Had One Job" is a multiplayer party game platform where players must collaborate to control a single game avatar or mechanism. The core hook is **distributed responsibility**: instead of one player controlling everything, controls are split among teammates (e.g., in Tetris, one player rotates, another moves left).

## 2. Core Value Proposition
- **Chaos & Cooperation**: Success requires intense communication and synchronization.
- **Party Platform**: Designed for groups (2v2, 3v3) in a shared physical or virtual space.
- **Extensibility**: Starts with Tetris, but the engine supports any arcade classic (Snake, Pong, Asteroids).

## 3. User Personas
- **The Host**: Sets up the game on a big screen (Laptop/TV). Wants easy setup.
- **The Player**: Joins via mobile phone. Wants a responsive, lag-free controller interface.
- **The Team**: A group of 2+ players working together against another team.

## 4. MVP Scope (Tetris)
### Features
- **Game Mode**: 2v2 Tetris Battle.
- **Lobby System**: Simple 6-character code for joining. No persistent accounts.
- **Roles**:
  - **Game Client (Host)**: Displays the split-screen game board (Team A vs Team B).
  - **Player Client (Controller)**: Mobile-responsive UI showing assigned buttons (e.g., "Left" & "Rotate").
- **Dynamic Control Assignment**:
  - 2 Players: 2 buttons each.
  - 3 Players: Split 1-1-2.

### User Flow
1. **Host** opens web app on Laptop -> "Create Game" -> Gets Code (e.g., `X7K9P2`).
2. **Players** open web app on Phones -> "Join Game" -> Enter Code -> Select Team.
3. **Host** starts game.
4. **Players** see their specific buttons. **Host** screen shows the Tetris boards.

## 5. Design & UX
- **Visual Style**: "Chaotic Party" - High contrast, vibrant, neon.
- **Palette**: 
  - Background: Dark (`#0B0C10`, `#1F2833`)
  - Accents: Neon Cyan (`#66FCF1`), Muted Teal (`#45A29E`), Light Grey (`#C5C6C7`).
- **Typography**: Chunky, rounded sans-serif (e.g., *Fredoka One*, *Outfit*) for headers.
- **Disconnection UX**:
  - **Pause**: Immediate game freeze.
  - **Feedback**: "Player Disconnected" overlay.
  - **Recovery**: 120s timeout. Reconnect triggers 3s countdown.

## 6. Future Roadmap
- **New Games**: Snake (one controls direction, one controls speed?), Asteroids, Pong.
- **Lobby Browser**: Public game listings.
- **Accounts**: XP, cosmetics, history (Auth via Google/Email).
- **Spectator Mode**: Watch without playing.
