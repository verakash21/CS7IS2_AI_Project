var BLACK = 0;
var WHITE = 1;

var shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var Piece = {
  Pawn: 100,
  Knight: 320,
  Bishop: 330,
  Rook: 500,
  Queen: 900,
  King: 20000,
  Empty: 0
}

var bonusPos ={};
bonusPos[Piece.Knight]= [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

bonusPos[Piece.Bishop] = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

bonusPos[Piece.Rook] =[
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

bonusPos[Piece.Queen] = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

var kingMiddle = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

var kingLate = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
]
bonusPos[Piece.King] = kingMiddle;

var GameState = {
  HumanWin: 1,
  PCWin: -1,
  Normal: 0
}


var MAX_INT = 1000000000;

var moveToString = function(m, board) {
  var from = m.from;
  var to = m.to;
  var specialCondition = m.specialCondition;
  var str = board.findNameOfPiece(from.container.type) + '(' +from.x +','+from.y+')'+ ' to ' 
      + board.findNameOfPiece(to.container.type) + '(' +to.x +','+to.y+')';
  if (specialCondition != undefined) {
    if (specialCondition.name == 'castling') {
      return str + " - CASTLING";
    } else if (specialCondition.name == 'upgradePawn') {
      return str + " - PAWN UPGRADED";
    }
  }
  return str;

}

var Board = function(conf) {
  var MAX_DEPTH = 3;
  var HUMAN_COLOR = WHITE;
  var PC_COLOR = BLACK;
  var firstColor = BLACK;
  var secondColor = WHITE;
  var state = {};

  var isKingMove = {};
  var isLeftRookMove = {};
  var isRightRookMove = {};
  isKingMove[firstColor] = 0;
  isKingMove[secondColor] = 0;
  isLeftRookMove[firstColor] = 0;
  isLeftRookMove[secondColor] = 0;
  isRightRookMove[firstColor] = 0;
  isRightRookMove[secondColor] = 0;

  if (conf !== undefined) {
    isKingMove = conf.isKingMove;
    isLeftRookMove = conf.isLeftRookMove;
    isRightRookMove = conf.isRightRookMove;
    firstColor = conf.firstColor;
    secondColor = conf.secondColor;
    state = conf.state;
    HUMAN_COLOR = conf.HUMAN_COLOR;
    PC_COLOR = conf.PC_COLOR;
    MAX_DEPTH = conf.MAX_DEPTH;
  }

  var findNameOfPiece = function(piece) {
    for (var key in Piece) {
      if (Piece[key] == piece) return key;
    }
    return null;
  }

  var Move = function(from, to, specialCondition) {
    this.from = from;
    this.to = to;
    if (specialCondition != undefined) this.specialCondition = specialCondition;
    
  };

  var makePieceContainer = function(type, color) {
    return {
      type: type,
      color: color
    };
  }

  var abs = function(a) { return a>0? a : -a; }
  var isValid = function(move) {
    var x = move.to.x, y = move.to.y;
    var destination = move.to.container;
    var source = move.from.container;
    return x>-1 && y >-1 && x<8 && y < 8 && ((destination.type == Piece.Empty) || (destination.color != source.color));
  }

  var hash = function(x,y) {
    return x*8 + y;
  }

  var decode = function(h) {
    return [Math.floor(h/8), h%8];
  }

  var get = function(x,y) {
    var h = hash(x,y);
    if (state[h] == undefined) {
      return {
        type: Piece.Empty,
        color: 0
      };
    } else return state[h];
  }

  var set = function(x,y,pieceContainer) {
    if (pieceContainer.type == Piece.Empty) {
      del(x,y);
    } else state[hash(x,y)] = pieceContainer;
  }

  var del = function(x,y) {
    delete state[hash(x,y)];
  }

  var makeMoveObject = function(fromx, fromy, tox, toy, specialCondition) {
    var from = {
      x: fromx,
      y: fromy,
      container: get(fromx,fromy)
    };
    var to = {
      x: tox,
      y: toy,
      container: get(tox,toy)
    }
    return new Move(from, to, specialCondition);
  }

  var pieceMoves = {};
  pieceMoves[Piece.King] = function(x,y) {
    var moves = [
      [-1, 0], [0, -1], [1, 0], [0, 1], [-1,-1], [1,1], [-1,1], [1,-1]
    ];

    var result = [];

    moves.forEach(function(move) {
      var i = x + move[0];
      var j = y + move[1];
      var m = makeMoveObject(x,y,i,j);
      if (isValid(m)) {
        result.push(m);
      }
    })

    // castling move
    var isBottom = get(x,y).color == secondColor;
    var color = get(x,y).color;
    var bottomRow = (isBottom)?7:0;
    if (isKingMove[color] == 0 && x == bottomRow) {
      var sumOfSpace = 0;
      // check right
      for (var i=5; i<7; i++) sumOfSpace+=get(x,i).type;
      var rook = get(x,7);
      if (sumOfSpace == 0 && rook.color == color && rook.type == Piece.Rook && isRightRookMove[color] == 0) {
        // make special move
        var m = makeMoveObject(x,y,x,y+2, {
          name: 'castling',
          secondMove: makeMoveObject(x,y+3,x,y+1)
        });
        result.push(m);
      }

      //check left
      sumOfSpace = 0;
      for (var i=1; i<4; i++) sumOfSpace+=get(x,i).type;
      rook = get(x,0);
      if (sumOfSpace == 0 && rook.color == color && rook.type == Piece.Rook && isLeftRookMove[color] == 0) {
        // make special move
        var m = makeMoveObject(x,y,x,y-2, {
          name: 'castling',
          secondMove: makeMoveObject(x,0,x,3)
        });
        result.push(m);
      }
    }


    return result;
  }

  pieceMoves[Piece.Queen] = function(x,y) {
    var moves = [
      [-1, 0], [0, -1], [1, 0], [0, 1], 
      [-1, -1], [1, 1], [-1,1], [1,-1]
    ];

    var result = [];

    moves.forEach(function(move) {
      var i = x;
      var j = y;
      for (var multiplier = 1; multiplier < 8; multiplier++) {
        i += move[0];
        j+= move[1];
        var m = makeMoveObject(x,y,i,j);
        if (isValid(m)) {
          result.push(m);
          if (m.to.container.type != Piece.Empty) break;
        } else break;
      }
    })
    return result;
  }

  pieceMoves[Piece.Rook] = function(x,y) {
    var moves = [
      [-1, 0], [0, -1], [1, 0], [0, 1], 
    ];

    var result = [];

    moves.forEach(function(move) {
      var i = x;
      var j = y;
      for (var multiplier = 1; multiplier < 8; multiplier++) {
        i += move[0];
        j+= move[1];
        var m = makeMoveObject(x,y,i,j);
        if (isValid(m)) {
          result.push(m);
          if (m.to.container.type != Piece.Empty) break;
        } else break;
      }
    })
    return result;
  }

  pieceMoves[Piece.Bishop] =function(x,y) {
    var moves = [
      [-1, -1], [1, 1], [-1,1], [1,-1]
    ];

    var result = [];

    moves.forEach(function(move) {
      var i = x;
      var j = y;
      for (var multiplier = 1; multiplier < 8; multiplier++) {
        i += move[0];
        j += move[1];
        var m = makeMoveObject(x,y,i,j);
        if (isValid(m)) {
          result.push(m);
          if (m.to.container.type != Piece.Empty) break;
        } else break;
      }
    })
    return result;
  }

  pieceMoves[Piece.Pawn] = function(x,y) {
    var moves = [
      [1, 1], [1, -1]
    ];

    var result = [];
    var direction = (get(x,y).color == secondColor) ? -1 : 1;
    var m = {};
    var color = get(x,y).color;
    if ((direction == 1 && x == 6) || (direction == -1 && x == 1)) {
      m = makeMoveObject(x,y,x+direction,y, {
          name: 'upgradePawn'
        });
    } else {
      m = makeMoveObject(x,y,x+direction,y);
    }
    if (m.to.container.type == Piece.Empty) {
      result.push(m);
    
      if ((direction == 1 && x == 1) || (direction == -1 && x == 6)) {
        m = makeMoveObject(x,y,x+2*direction,y);
        if (m.to.container.type == Piece.Empty) result.push(m);
      }
    }

    moves.forEach(function(move) {
      var i = x + move[0] * direction;
      var j = y + move[1];
      var m = {};
      if ((direction == 1 && i==7) || (direction == -1 && i==0)) {
        m = makeMoveObject(x,y,i,j, {
          name: 'upgradePawn'
        });
      } else {
        m = makeMoveObject(x,y,i,j);
      }
      if (isValid(m) && m.to.container.type != Piece.Empty) {
        result.push(m);
      }
    });
    return result;
  }

  pieceMoves[Piece.Knight] = function(x,y) {
    var moves = [
      [1, 2], [2, 1], [-1, 2], [2, -1], [1, -2], [-2, 1], [-1, -2], [-2, -1]
    ];

    var result = [];

    moves.forEach(function(move) {
      var i = x + move[0];
      var j = y + move[1];
      var m = makeMoveObject(x,y,i,j);
      if (isValid(m)) {
        result.push(m);
      }
    })

    return result;
  }

  if (conf === undefined) {
    set(0,0, makePieceContainer(Piece.Rook, firstColor));
    set(0,1, makePieceContainer(Piece.Knight, firstColor));
    set(0,2, makePieceContainer(Piece.Bishop, firstColor));
    set(0,3, makePieceContainer(Piece.Queen, firstColor));
    set(0,4, makePieceContainer(Piece.King, firstColor));
    set(0,5, makePieceContainer(Piece.Bishop, firstColor));
    set(0,6, makePieceContainer(Piece.Knight, firstColor));
    set(0,7, makePieceContainer(Piece.Rook, firstColor));
    for (var i = 0; i<8; i++) {
      set(1,i, makePieceContainer(Piece.Pawn, firstColor));
      set(6,i, makePieceContainer(Piece.Pawn, secondColor));
    }

    set(7,0, makePieceContainer(Piece.Rook, secondColor));
    set(7,1, makePieceContainer(Piece.Knight, secondColor));
    set(7,2, makePieceContainer(Piece.Bishop, secondColor));
    set(7,3, makePieceContainer(Piece.Queen, secondColor));
    set(7,4, makePieceContainer(Piece.King, secondColor));
    set(7,5, makePieceContainer(Piece.Bishop, secondColor));
    set(7,6, makePieceContainer(Piece.Knight, secondColor));
    set(7,7, makePieceContainer(Piece.Rook, secondColor));
  }
  
  var makeMove = function(move) {
    
    set(move.to.x, move.to.y, move.from.container);
    del(move.from.x, move.from.y);
    if (move.from.container.type == Piece.King) {
      isKingMove[move.from.container.color]++;
    } else if (move.from.container.type == Piece.Rook) {
      var color = null;
      if (move.from.x == 0) color = firstColor;
      else if (move.from.x == 7) color = secondColor;
      if (color != null) {
        if (move.from.y == 0) isLeftRookMove[color]++;
        else if (move.from.y == 7) {
          isRightRookMove[color]++;
        }
      }
    }
    if (move.specialCondition != undefined) {
      if (move.specialCondition.name == 'castling') {
        makeMove(move.specialCondition.secondMove);
      } else if (move.specialCondition.name == 'upgradePawn') {
        var color = move.from.container.color;
        set(move.to.x, move.to.y, makePieceContainer(Piece.Queen, color));
      }
    }
  }

  var undoMove = function(move) {
    set(move.from.x, move.from.y, move.from.container);
    set(move.to.x, move.to.y, move.to.container);
    if (move.from.container.type == Piece.King) {
      isKingMove[move.from.container.color]--;
    } else if (move.from.container.type == Piece.Rook) {
      var color = null;
      if (move.from.x == 0) color = firstColor;
      else if (move.from.x == 7) color = secondColor;
      if (color != null) {
        if (move.from.y == 0) isLeftRookMove[color]--;
        else if (move.from.y == 7) {
          isRightRookMove[color]--;
        }
      }
    }
    if (move.specialCondition != undefined) {
      if (move.specialCondition.name == 'castling') {
        undoMove(move.specialCondition.secondMove);
      } else if (move.specialCondition.name == 'upgradePawn') {

      }
    }
  }

  var getHumanOrPCPositions = function(humanOrPC) {
    var checkColor = PC_COLOR;
    if (humanOrPC) checkColor = HUMAN_COLOR;

    var result = [];
    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        if (state[key].color == checkColor) result.push(decode(key));
      }
    }
    
    shuffle(result);
    result.sort(function(a,b) {
      return get(a[0], a[1]).type - get(b[0], b[1]).type;
    })
    return result;
  }

  var getAllPossibleMoves = function(humanOrPC) {
    var positions = getHumanOrPCPositions(humanOrPC);
    var result = [];
    for (var i=0; i<positions.length; i++) {
      var x = positions[i][0], y = positions[i][1];
      var pieceType = get(x,y).type;
      if (pieceType != Piece.Empty) {
        var possibleMoves = pieceMoves[pieceType](x,y);
        result = result.concat(possibleMoves);
      };
    }
    return result;
  }

  var getHumanPositions = function() {
    return getHumanOrPCPositions(true);
  }
  var getPCPositions = function() {
    return getHumanOrPCPositions(false);
  }

  var calculateScore = function() {
    var result = 0;

    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        var score = state[key].type;
        if (bonusPos[state[key].type] != undefined) {
          var pos = decode(key);
          var x = pos[0], y = pos[1];
          if (HUMAN_COLOR != secondColor) {
            y = 7-y;
          } 
          score += bonusPos[state[key].type][x][y];
        }
        if (state[key].color == HUMAN_COLOR) result -= score;
        else result += score;
      }
    }
    return result;
  }
  var calcCount = 0;

  var tryMove = function(humanOrPC, depth, alpha, beta) {
    calcCount++;
    if (depth == 0) return { move: null, bestScore: humanOrPC ? -calculateScore(state) : calculateScore(state)};
    var MINVALUE = -MAX_INT;
    var maxScoreCanHave = MINVALUE-1;
    var rightMove = null;
    var allPossibleMoves = getAllPossibleMoves(humanOrPC);
    
    for (var ii = 0; ii<allPossibleMoves.length; ii++) {
      var move = allPossibleMoves[ii];
      makeMove(move);
      if (move.to.container.type == Piece.King) {
        undoMove(move);
        return { move: move, bestScore: -MINVALUE };
      }
      var bestOfTheOther= -tryMove(humanOrPC ^ 1, depth-1, -beta, -alpha).bestScore;

      undoMove(move);
      if ( bestOfTheOther > maxScoreCanHave) {
        maxScoreCanHave = bestOfTheOther;
        rightMove = move;
      }
      if (maxScoreCanHave > alpha) alpha = maxScoreCanHave;
      if (alpha >= beta) return { move: move, bestScore: alpha };
    }
    return {move: rightMove, bestScore: maxScoreCanHave }; 
  }

  this.get = get;
  this.getHumanPositions = getHumanPositions;
  this.getPCPositions = getPCPositions;
  this.setMaxDepth = function(depth) {
    MAX_DEPTH = depth;
  }

  // allow player to make a move from (i,j) to (x,y)
  this.makeMove = function(move) {
    makeMove(move);
    return moveToString(move, this);
  };

  this.checkWin = function() {
    var isHumanKingAlive = false;
    var isPCKingAlive = false;
    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        var container = state[key];
        if (container.type == Piece.King) {
          if (container.color == HUMAN_COLOR) {
            isHumanKingAlive = true;
          } else {
            isPCKingAlive = true;
          }
        }
      }
    }

    if (!isHumanKingAlive) {
      return GameState.PCWin;
    } else if (!isPCKingAlive) {
      return GameState.HumanWin;
    } else return GameState.Normal;
  }

  this.getPCResponse = function() {
    calcCount = 0;
    var res = tryMove(false, MAX_DEPTH, -MAX_INT, MAX_INT).move;
    console.log('Calculation steps: ' + calcCount);
    return res;
  }

  this.getPossibleMovesFrom = function(x,y) {
    var container = get(x,y);
    if (container.type == Piece.Empty) return [];
    return pieceMoves[container.type](x,y);
  }

  this.isHumanPiece = function(x,y) {
    return get(x,y).type != Piece.Empty && get(x,y).color == HUMAN_COLOR;
  }

  this.getConfiguration = function() {
    var conf = {};
    conf.isKingMove = isKingMove;
    conf.isLeftRookMove = isLeftRookMove;
    conf.isRightRookMove = isRightRookMove;
    conf.firstColor = firstColor;
    conf.secondColor = secondColor;
    conf.state = state;
    conf.HUMAN_COLOR = HUMAN_COLOR;
    conf.PC_COLOR = PC_COLOR;
    conf.MAX_DEPTH = MAX_DEPTH;
    return conf;
  }

  this.findNameOfPiece = findNameOfPiece;
};

Board.findBestMove = function(conf) {
  var board = new Board(conf);
  return board.getPCResponse();
}

self.addEventListener('message', function(e) {
  var bestMove = Board.findBestMove(e.data);
  self.postMessage(bestMove);
});
