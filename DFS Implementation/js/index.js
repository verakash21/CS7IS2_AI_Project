var num_threads = 1;
var MT = new Multithread(num_threads);

var currentTurn = 'human'; // human turn
var choosingState = 'none';

var game_depth = 3;

var FIRST_BACKGROUND_COLOR = '#AB7B2A';
var SECOND_BACKGROUND_COLOR = '#FFFAD5';

var cells = [];
var moveTo = [];
for (var i=0; i<8; i++) {
  moveTo[i] = [];
  for (var j=0; j<8; j++) {
    moveTo[i][j] = null;
  }
}

var board = null;

var getModelOf = function(container) {
  var type = null;
  var url = 'images/';
  for (var key in Piece) {
    if (Piece[key] == container.type) {
      type = key;
      break;
    }
  }
  if (type == 'Empty') return '';
  url += type + '_';
  if (container.color == BLACK) url += 'black.png';
  else url += 'white.png';
  return url;
}

var getCell = function(x,y) {
  return $("[x="+x+"][y="+ y+"]");
}

var setCellContainer = function(x,y,container) {
  var modelUrl = getModelOf(container);
  if (modelUrl.length > 0)
    cells[x][y].find('img').attr('src', modelUrl);
  else cells[x][y].find('img').removeAttr('src');
}

var setCellStateSelecting = function(x,y) {
  var highlightDiv = cells[x][y].find('.highlight_overlay');
  var chosenDiv = highlightDiv.find('.chosen_overlay');
  chosenDiv.addClass("enabled");
}

var setCellStateHighlighting = function(x,y) {
  var highlightDiv = cells[x][y].find('.highlight_overlay');
  var chosenDiv = highlightDiv.find('.chosen_overlay');
  highlightDiv.addClass("enabled");
  chosenDiv.removeClass("enabled");
}

var setCellStateNormal = function(x,y) {
  var highlightDiv = cells[x][y].find('.highlight_overlay');
  var chosenDiv = highlightDiv.find('.chosen_overlay');
  highlightDiv.removeClass("enabled");
  chosenDiv.removeClass("enabled");
}

var checkState = function(x,y) {
  var highlightDiv = cells[x][y].find('.highlight_overlay');
  var chosenDiv = highlightDiv.find('.chosen_overlay');
  if (highlightDiv.hasClass("enabled")) return "highlight";
  if (chosenDiv.hasClass("enabled")) return "chosen";
  return "normal";
}

var fromx, tox;

var makeMove = function(fromx,fromy,tox,toy, move) {
  choosingState = 'none';
  $('.enabled').removeClass('enabled');
  var m = moveTo[tox][toy];
  if (move != undefined) {
    m = move;
  }
  var log = board.makeMove(m);
  $('textarea#moveLog').append(currentTurn.toUpperCase() + ": " +log+'\n');
  setCellContainer(fromx,fromy,board.get(fromx, fromy));
  setCellContainer(tox,toy,board.get(tox, toy));
  if (m.specialCondition != undefined) {
    updateBoard();
  }
}

var chooseCell = function(x,y) {
  var possibleMoves = board.getPossibleMovesFrom(x,y);
  $('.enabled').removeClass('enabled');
  setCellStateSelecting(x,y);
  fromx = x; fromy = y;
  possibleMoves.forEach(function(move) {
    setCellStateHighlighting(move.to.x, move.to.y);
    moveTo[move.to.x][move.to.y] = move;
  });
  choosingState = 'chosen';
}

var enableBoard = function() {
  $('div#chessdiv').removeClass('disabled');
}

var disableBoard = function() {
  $('div#chessdiv').addClass('disabled');
}

var setStatus = function(text) {
  $('p#status').text(text);
}

var checkWin = function() {
  var whoWin = board.checkWin();
  if (whoWin != GameState.Normal) {
    choosingState = 'over';
    disableBoard();
    if (whoWin == GameState.HumanWin) {
      setStatus('Congratulations, You Win!')
    } else {
      setStatus('Sorry, You lose!')
    }
    return true;
  }
  return false;
}

var startGame = function() {
  board = new Board();
  board.setMaxDepth(game_depth);
  setStatus('Your turn, You are white!');
  initBoard();
  choosingState = 'none';
  currentTurn = 'human';
  $('.enabled').removeClass('enabled');
  $('#moveLog').text('');
}

var chessEngine = new Worker('js/chessboard.js');
chessEngine.addEventListener('message', function(e) {
  var move = e.data;
  makeMove(move.from.x, move.from.y, move.to.x, move.to.y, move);
  currentTurn = 'human';
  choosingState = 'none';
  $('.enabled').removeClass('enabled');
  setStatus('Your turn, You are white!');
  if (checkWin()) return;
})

var cellOnClick = function() {
  if (choosingState == 'over') return;
  if (currentTurn != 'human') return;
  var x = parseInt($(this).attr("x"));
  var y = parseInt($(this).attr("y"));
  var state = checkState(x,y);
  if (currentTurn == 'human') {
    if (board.isHumanPiece(x,y)) {
      chooseCell(x,y);
    } else if (choosingState == 'chosen' && checkState(x,y) == 'highlight') {
      makeMove(fromx,fromy,x,y);

      if (checkWin()) return;
      currentTurn = 'pc';
      setStatus('PC turn, he is thinking...');
      chessEngine.postMessage(board.getConfiguration());
    }
  }
}

var updateBoard = function() {
  for (var i=0; i<8; i++) {
    for (var j=0; j<8; j++) {
      setCellContainer(i,j,board.get(i,j));
    }
  }
}

var initBoard = function() {
  for (var i=0; i<8; i++) cells[i] = [];
  for (var i=0; i<8; i++) {
    for (var j=0; j<8; j++) {
      cells[i][j] = getCell(i,j);
      setCellContainer(i,j,board.get(i,j));
    }
  }
}

var changeBackgroundMode = function(mode) {
  if (mode == 0) {
    $("body").css('background-color', '#FDFDFD');
    $("body").css('color', '#333');
  } else {
    $("body").css('background-color', '#333');
    $("body").css('color', '#FDFDFD');
  }
}

$(document).ready(function(){
  $("input[name=difficulty]").click(function() {
    game_depth = parseInt($(this).val());
    console.log("Set game depth to " + game_depth);
  });
  $("input[name='backgroundmode']").click(function() {
    changeBackgroundMode(parseInt($(this).val()));
  })
  var str = '';
  for (var i=0; i<8; i++) {
    var row = '<tr>';
    for (var j=0; j<8; j++) {
      var bgcolor = ((i+j)%2 == 0) ? FIRST_BACKGROUND_COLOR : SECOND_BACKGROUND_COLOR;
      row += '<td x="' + i + '" y="' + j + '" bgcolor="' + bgcolor +'">  <div class="highlight_overlay"><div class="chosen_overlay"><img/></div></div> </td>';
    }
    row+='</tr>'
    str += row;
  }
  $('table#chessboard').append(str);
  $('table#chessboard').find('td').click(cellOnClick);
  startGame();
});