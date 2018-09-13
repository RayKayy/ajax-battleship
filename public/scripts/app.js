// DOM Manupilation with jQuery.

// const bs = require('../../bs-logic');

// const { D_STATE } = bs;
// const { SHIPS } = bs;
// const { fireMissle } = bs;
// const { genBoard } = bs;
// const { placeShips } = bs;

// const mem = JSON.parse(JSON.stringify(D_STATE));
// mem.player1.refBoard = genBoard(10);
// mem.player1.board = genBoard(10);
// mem.player2.refBoard = genBoard(10);
// mem.player2.board = genBoard(10);

function chooseShip() {
  $('#ship-type input').on('change', (e) => {
    const ship = $('input[name=ships]:checked', '#ship-type').attr('id');
    $.ajax('/ship', {
      method: 'POST',
      data: ship,
    });
  });
}

function resetButton() {
  $('#reset').on('click', (e) => {
    $.ajax('/reset', { method: 'GET' });
    $('.grid').removeClass('hit miss tgt');
    $('.grid').empty();
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


function placeShips() {
  $('#own-board .grid').click((e) => {
    let coord = Number($(e.target).attr('id'));
    console.log(coord);
    $.ajax(`/place/${coord}`, { method: 'POST' })
      .then((data) => {
        const message = `<p>${new Date().toTimeString().slice(0, 8)} - ${coord}, ${data[0][1]}!</p>`;
        if (data[0][0] === 1) {
          $(`#${coord}`).addClass('deployed');
          console.log(data[1].player2.board);
          for (let i = 0; i < data[2]; i += 1) {
            if (data[3]) {
              coord += 1;
              $(`#${coord}`).addClass('deployed');
            }
          }
        }
        $('#log').prepend(message);
      });
  });
}

function placeButton() {
  $('#place').on('click', (e) => {
    $('#own-board .grid').off('click');
    placeShips();
    // $.ajax('/reset', { method: 'GET' });
    // $('.grid').removeClass('hit miss tgt');
    // $('.grid').empty();
  });
}

function checkGrid() {
  $('#board-container .grid').click((e) => {
    const coord = $(e.target).attr('id');
    console.log(coord);
    $.ajax(`/mem/${coord}`, { method: 'POST' })
      .then((data) => {
        const message = `<p>${new Date().toTimeString().slice(0, 8)} - Fired at: ${coord}, ${data}!</p>`;
        console.log(data);
        if (data === 'HIT') {
          $(e.target).addClass('hit');
          $(e.target).text('hit');
        } else if (data === 'MISS') {
          $(e.target).addClass('miss');
          $(e.target).text('miss');
        } else if (data === 'TGT') {
          $(e.target).addClass('tgt');
          $(e.target).text('tgt');
        }
        $('#log').prepend(message);
      });
  });
}

function generateGrid() {
  $.ajax('/mem', { method: 'GET' })
    .then((obj) => {
      const board = obj.player1.refBoard;
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
      const board = obj.player1.refBoard;
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

$(document).ready(() => {
  generateGrid();
  generatePlaceGrid();
  resetButton();
  orientButton();
  chooseShip();
});
