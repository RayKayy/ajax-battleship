
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

let DB;


function newGame() {
  mem = JSON.parse(JSON.stringify(D_STATE));
  mem.player1.board = genBoard(10);
  mem.player2.board = genBoard(10);
  mem.player1.moves = 0;
}

// AI placing ships
function aiPlace() {
  const keys = Object.keys(SHIPS);
  let ori = true;
  keys.forEach((type) => {
    while (!mem.player2.shipsPlaced.includes(type)) {
      placeShips(type, randomCoord(), ori, mem, 'player2');
      ori = !ori;
    }
  });
  console.log(mem.player2.board);
}
newGame();
aiPlace();

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
  keys: ['keykeykey'],
}));

// GET routes
app.get('/', (req, res) => {
  res.status(200).send();
});

app.get('/mem', (req, res) => {
  res.json(mem);
});

app.get('/reset', (req, res) => {
  newGame();
  aiPlace();
  mem.player1.ship = 'carrier';
  mem.player1.status = true;
  mem.player1.aiFired = [];
  res.redirect('/');
});

app.get('/leader', (req, res) => {
  DB.collection('leader').find().sort({ score: 1 }).toArray()
    .then((arr) => {
      const data = { arr };
      res.render('leader', data);
    });
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
      name: mem.player1.username,
      score: mem.player1.moves,
      time: new Date(),
    };
    DB.collection('leader').insertOne(leader);
  }
  // AI fires randomly
  let aiCoord = randomCoord();

  if (mem.player1.difficulty) {
    while (mem.player1.aiFired.includes(aiCoord.join(''))) {
      aiCoord = randomCoord();
    }
    mem.player1.aiFired.push(aiCoord.join(''));
  }

  let aiCode = fireMissle(mem.player1.board, aiCoord);
  if (aiCode === 'HIT') {
    mem.player1.count -= 1;
  }
  if (mem.player1.count === 0) {
    aiCode = 'GAME';
    mem.player1.moves = 0;
  }
  mem.player1.moves += 1;
  res.send([code, aiCode, aiCoord.join('')]);
});

app.post('/status', (req, res) => {
  mem.player1.status = !mem.player1.status;
  res.send(mem.player1.status);
});

app.post('/difficulty', (req, res) => {
  mem.player1.difficulty = !mem.player1.difficulty;
  console.log(mem.player1.difficulty);
  res.send(mem.player1.difficulty);
});

app.post('/ship', (req, res) => {
  [mem.player1.ship] = Object.keys(req.body);
  res.send(`Ship is ${mem.player1.ship}`);
});

app.post('/place/:id', (req, res) => {
  const coord = getCoord(req.params.id);
  console.log(mem.player1.ship);
  const playergame = req.session.game;
  console.log(playergame);


  const result = placeShips(mem.player1.ship, coord, mem.player1.status, mem, 'player1');
  res.send([result, mem, SHIPS[mem.player1.ship].size, mem.player1.status]);
  console.log('mem is', mem.player1.board);
  console.log('cookie is,', req.bs);

});

app.post('/playername', (req, res) => {
  mem.player1.username = req.body.name;
  req.bs.game = JSON.stringify(D_STATE);
  console.log(req.session.game);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
