// DOM Manupilation with jQuery.

// Win/Loss screen
const $win = $('<div>').addClass('win');
$win.text('YOU WON!');
const $lost = $('<div>').addClass('lost');
$lost.text('YOU LOST!');

// Startscreen
const $start = $('<div>').addClass('start');
$start.html(`
  <form id="playername" action="/playername" method="POST">
    <span>ENTER YOUR NAME:</span>
    <textarea cols="10" rows="1" placeholder="player1"></textarea>
    <input type="submit" value="START">
  </form>`);

// Helper function to show deployed ships;

function startGame() {
  $('#board-container').fadeIn();
  $('#own-board .grid').off();
  $('header').slideUp();
}

function startButton() {
  $('#start').on('click', () => {
    let message;
    $.ajax('/mem',  {method: 'GET' })
      .then((mem) => {
        console.log(mem);
        if (mem.player1.shipsPlaced.length === 5) {
          startGame();
          message = `<p>${new Date().toTimeString().slice(0, 8)} - Game START!</p>`;
        } else {
          message = `<p>${new Date().toTimeString().slice(0, 8)} - Please place all ships!</p>`;
        }
        $('#log').prepend(message);
      });
  });
}

function chooseShip() {
  $('#ship-type input').on('change', (e) => {
    const ship = $('input[name=ships]:checked', '#ship-type').attr('id');
    $.ajax('/ship', {
      method: 'POST',
      data: ship,
    });
  });
}


function orientButton() {
  $('#orient').on('click', (e) => {
    $.ajax('/status', { method: 'POST' })
      .then((status) => {
        if (status) {
          $('#orient').text('Horizontal');
        } else {
          $('#orient').text('Vertical');
        }
      });
  });
}

function diffButton() {
  $('#difficult').on('click', (e) => {
    $.ajax('/difficulty', { method: 'POST' })
      .then((difficulty) => {
        if (difficulty) {
          $('#difficult').text('Hard');
        } else {
          $('#difficult').text('Easy');
        }
      });
  });
}


function placeShips() {
  $('#own-board .grid').click((e) => {
    let coord = $(e.target).attr('id');
    $.ajax(`/place/${coord}`, { method: 'POST' })
      .then((data) => {
        const message = `<p>${new Date().toTimeString().slice(0, 8)} - ${coord}, ${data[0][1]}!</p>`;
        if (data[0][0] === 1) {
          // Display placed ship on player board by adding class.
          $(`#${coord}`).addClass('deployed');
          coord = Number(coord);
          for (let i = 1; i < data[2]; i += 1) {
            if (data[3]) {
              coord += 1;
              if (coord < 10) {
                coord = `0${coord}`;
              }
              $(`#${coord}`).addClass('deployed');
            } else {
              coord += 10;
              $(`#${coord}`).addClass('deployed');
            }
            coord = Number(coord);
          }
        }
        $('#log').prepend(message);
      });
  });
}

function endPage() {
  $('.win, .lost').on('click', (e) => {
    console.log(e);
    $.ajax('/reset', { method: 'GET' });
    window.location = '/';
  });
}


function checkGrid() {
  $('#board-container .grid').click((e) => {
    const coord = $(e.target).attr('id');
    console.log(coord);
    $.ajax(`/fire/${coord}`, { method: 'POST' })
      .then((data) => {
        let message = `<p>${new Date().toTimeString().slice(0, 8)} - P1 Fired at: ${coord}, ${data[0]}!</p>`;
        console.log(data);
        if (data[0] === 'HIT') {
          $(e.target).addClass('hit');
          $(e.target).text('HIT');
        } else if (data[0] === 'MISS') {
          $(e.target).addClass('miss');
          $(e.target).text('...');
        } else if (data[0] === 'GAME') {
          $(e.target).addClass('hit');
          $(e.target).text('HIT');
          $('#container').empty();
          $('#container').append($win);
          endPage();
          $('#board-container .grid').off();
        }
        $('#log').prepend(message);
        if (data[0] !== 'GAME') {
          if (data[1] === 'HIT') {
            $(`#${data[2]}`).addClass('enemy-hit');
            $(`#${data[2]}`).text('X');
          } else if (data[1] === 'MISS') {
            $(`#${data[2]}`).addClass('miss');
            $(`#${data[2]}`).text('miss');
          } else if (data[1] === 'GAME') {
            $(`#${data[2]}`).addClass('enemy-hit');
            $(`#${data[2]}`).text('X');
            $('#container').empty();
            $('#container').append($lost);
            endPage();
            $('#board-container .grid').off();
          }
          message = `<p>${new Date().toTimeString().slice(0, 8)} - P2 Fired at: ${data[2]}, ${data[1]}!</p>`
          $('#log').prepend(message);
        }
      });
  });
}

function generateGrid() {
  $.ajax('/mem', { method: 'GET' })
    .then((obj) => {
      const { board } = obj.player1;
      let i = 0;
      board.forEach((row) => {
        const $row = $('<div>').addClass('row');
        let j = 0;
        row.forEach((grid) => {
          const $grid = $('<div>').addClass('grid');
          $grid.attr('id', `${i}${j}`);
          $grid.text();
          $row.append($grid);
          j += 1;
        });
        $('#board-container').append($row);
        i += 1;
      });
      checkGrid();
    });
}

function generatePlaceGrid() {
  $.ajax('/mem', { method: 'GET' })
    .then((obj) => {
      const { board } = obj.player1;
      let i = 0;
      board.forEach((row) => {
        const $row = $('<div>').addClass('row');
        let j = 0;
        row.forEach((grid) => {
          const $grid = $('<div>').addClass('grid');
          $grid.attr('id', `${i}${j}`);
          $grid.text();
          $row.append($grid);
          j += 1;
        });
        $('#own-board').append($row);
        i += 1;
      });
      placeShips();
    });
}

function resetButton() {
  $('#reset').on('click', (e) => {
    $.ajax('/reset', { method: 'GET' });
    $('.grid').removeClass('hit miss tgt deployed');
    $('.grid').empty();
    $('.grid').off();
    checkGrid();
    placeShips();
    $('#orient').text('Horizontal');
    $('#carrier').prop('checked', true);
    const message = `<p>${new Date().toTimeString().slice(0, 8)} - Game Reset!</p>`;
    $('#log').prepend(message);
    $('#board-container').fadeOut();
  });
}

function updatePlayer() {
  $('#playername').on('submit', (e) => {
    e.preventDefault();
    $('.start').hide();
    $('#container').fadeIn();
    const data = { name: $(e.target).children('textarea').val() };
    $.ajax('/playername', { method: 'POST', data });
    console.log(data);
    generateGrid();
    generatePlaceGrid();
    resetButton();
    orientButton();
    chooseShip();
    startButton();
    diffButton();
    $('#board-container').fadeOut();
  });
}

$(document).ready(() => {
  $('#container').hide();
  $('body').append($start);
  $('#board-container').fadeOut();
});
