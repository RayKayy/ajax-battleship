
// Require and create express server.
const MONGODB_URI = 'mongodb://localhost:27017/battleship';
const PORT = 8080;
const express = require('express');
const { MongoClient } = require('mongodb');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
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
let difficulty = false;
let aiFired = [];
let moves = 0;
let username = 'player1';
let DB;

function generateRandomString(length) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const random = Math.floor(Math.random() * chars.length);
    const char = chars[random];
    result += char;
  }
  return result;
}

function newGame() {
  mem = JSON.parse(JSON.stringify(D_STATE));
  mem.player1.board = genBoard(10);
  mem.player2.board = genBoard(10);
  moves = 0;
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

// Connect to database.
MongoClient.connect(MONGODB_URI)
  .then((db) => {
    DB = db;
    // console.log(DB);
  });

const app = express();
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(`${__dirname}/public`));
app.use(cookieSession({
  name: 'session',
  keys: ['this is my key'],
}));

// GET routes
app.get('/', (req, res) => {
  req.session.id = generateRandomString(5);
  console.log(req.session.id);
  res.status(200).send();
});

app.get('/mem', (req, res) => {
  res.json(mem);
});

app.get('/reset', (req, res) => {
  newGame();
  aiPlace();
  ship = 'carrier';
  status = true;
  aiFired = [];
  res.redirect('/');
});

app.get('/leader', (req, res) => {
  DB.collection('leader').find().sort({ score: 1 }).toArray()
    .then((arr) => {
      const data = { arr };
      res.render('leader', data);
    });
    // .then(x => res.status(200).json(x));
});

app.post('/fire/:id', (req, res) => {
  const coord = getCoord(req.params.id);
  // Fires at targeted grid
  let code = fireMissle(mem.player2.board, coord);
  if (code === 'HIT') {
    mem.player2.count -= 1;
  }
  if (mem.player2.count === 0) {
    code = 'GAME';
    const leader = {
      name: username,
      score: moves,
      time: new Date(),
    };
    DB.collection('leader').insertOne(leader);
  }
  // AI fires randomly
  let aiCoord = randomCoord();

  if (difficulty) {
    while (aiFired.includes(aiCoord.join(''))) {
      aiCoord = randomCoord();
    }
    aiFired.push(aiCoord.join(''));
  }

  let aiCode = fireMissle(mem.player1.board, aiCoord);
  if (aiCode === 'HIT') {
    mem.player1.count -= 1;
  }
  if (mem.player1.count === 0) {
    aiCode = 'GAME';
    moves = 0;
  }
  moves += 1;
  res.send([code, aiCode, aiCoord.join('')]);
});

app.post('/status', (req, res) => {
  status = !status;
  res.send(status);
});

app.post('/difficulty', (req, res) => {
  difficulty = !difficulty;
  console.log(difficulty);
  res.send(difficulty);
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

app.post('/playername', (req, res) => {
  username = req.body.name;
  console.log();
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
