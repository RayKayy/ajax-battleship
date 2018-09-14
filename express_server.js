
// Require and create express server.
const PORT = 8080;
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const bs = require('./bs-logic');

const { D_STATE } = bs;
const { SHIPS } = bs;
const { fireMissle } = bs;
const { genBoard } = bs;
const { placeShips } = bs;
const { randomCoord } = bs;

let mem = JSON.parse(JSON.stringify(D_STATE));

let status = true;
let ship = 'carrier';

function newGame() {
  mem = JSON.parse(JSON.stringify(D_STATE));
  // mem.player1.refBoard = genBoard(10);
  mem.player1.board = genBoard(10);
  // mem.player2.refBoard = genBoard(10);
  mem.player2.board = genBoard(10);
  console.log(mem.player1.shipsPlaced);
}

// AI placing ships
function aiPlace() {
  const keys = Object.keys(SHIPS);
  let ori = true;
  keys.forEach((ship) => {
    while (!mem.player2.shipsPlaced.includes(ship)) {
      placeShips(ship, randomCoord(), ori, mem, 'player2');
      ori = !ori;
    }
  });
  console.log(mem.player2.board);
}
// placeShips('battleship', [0, 0], false, mem, 'player2');
newGame();
aiPlace();
// console.log(mem);

// Helper function to convert grid id to coordinates
function getCoord(id) {
  const coord = id.split('');
  return coord.map(x => Number(x));
}

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static('public'));
app.disable('etag');

app.get('/mem', (req, res) => {
  res.json(mem);
});

app.get('/reset', (req, res) => {
  newGame();
  aiPlace();
  ship = 'carrier';
  res.redirect('/');
});

app.post('/fire/:id', (req, res) => {
  // console.log(req.params.id);
  const coord = getCoord(req.params.id);
  // console.log(coord);
  // Fires at targeted grid
  let code = fireMissle(mem.player2.board, coord);
  if (code === 'HIT') {
    mem.player2.count -= 1;
  }
  if (mem.player2.count === 0) {
    code = 'GAME';
  }
  // AI fires randomly
  const aiCoord = randomCoord();
  let aiCode = fireMissle(mem.player1.board, aiCoord);
  if (aiCode === 'HIT') {
    mem.player1.count -= 1;
  }
  if (mem.player1.count === 0) {
    aiCode = 'GAME';
  }
  console.log(mem.player1.board);
  console.log(mem.player2.board);

  res.send([code, aiCode, aiCoord.join('')]);
});

app.post('/status', (req, res) => {
  status = !status;
  res.send(status);
});

app.post('/ship', (req, res) => {
  [ship] = Object.keys(req.body);
  res.send(`Ship is ${ship}`);
});

app.post('/place/:id', (req, res) => {
  const coord = getCoord(req.params.id);
  const result = placeShips(ship, coord, status, mem, 'player1');
  res.send([result, mem, SHIPS[ship].size, status]);
  console.log('mem is', mem.player1.board);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
