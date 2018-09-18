#ajax-battleship

A basic battleship game implemented using a full stack approach
This project uses AJAX to implement a single page app experience.

## Getting Started
1. Clone this repo using `git clone`.
2. Install the required dependencies through `npm install`
3. Make sure mongoDB is running locally
4. `npm start` within the repo directory
5. Connect to the server via a browser and enjoy the game!

## Features
- Access the leaderboard which is stored within mongo thorugh the '/leader' endpoint.
  - Number of moves players used to win the game + timestamp
- Two difficulty for the AI (Although both are quite easy)
- Uses AJAX to provide a single page updates on game state
### To be implemented
- Multiplayer against multiple AIs (Currently all connections refer to same game state)
  - This will allow leaderboard to be updated real time with multiple players
- Independent game state for each player
- Player vs player multiplayer mode

## Dependencies
   - "body-parser": "^1.18.3",
   - "cookie-session": "^2.0.0-beta.3",
   - "ejs": "^2.6.1",
   - "express": "^4.16.3",
   - "mongodb": "^2.2.36",
   - "morgan": "^1.9.1"
