
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

let mem = JSON.parse(JSON.stringify(D_STATE));

let status = true;
let ship = 'carrier';

function newGame() {
  mem = JSON.parse(JSON.stringify(D_STATE));
  mem.player1.refBoard = genBoard(10);
  mem.player1.board = genBoard(10);
  mem.player2.refBoard = genBoard(10);
  mem.player2.board = genBoard(10);
}
// placeShips('battleship', [0, 0], false, mem, 'player2');
newGame();
console.log(mem);

// Helper function to convert grid id to coordinates
function getCoord(id) {
  const coord = id.split('');
  return coord.map(x => Number(x));
}

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static('public'));

app.get('/mem', (req, res) => {
  res.json(mem);
});

app.get('/reset', (req, res) => {
  newGame();
  ship = 'carrier';
  res.redirect('/');
});

app.post('/fire/:id', (req, res) => {
  console.log(req.params.id);
  const coord = getCoord(req.params.id);
  console.log(coord);
  let code = fireMissle(mem.player2.board, coord);
  if (code === 'HIT') {
    mem.player2.count -= 1;
  }
  if (mem.player2.count === 0) {
    code = 'GAME';
  }
  console.log('posted', coord, code);
  res.send(code);
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
  const result = placeShips(ship, coord, status, mem, 'player2');
  res.send([result, mem, SHIPS[ship].size, status]);
  console.log(mem);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
