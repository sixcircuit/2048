
function GamePlayer(){
    var self = this;

    this.screenActuator = new HTMLActuator();
    
    this.depth = 1;
    this.events = {};
    this.watch = false;
    this.watchDelay = 100;
    this.running = false;
    this.gameCount = 0;
    this.moveCount = 0;
    this.startTime = 0;
    this.totalMoves = 0;
    this.totalScore = 0;
    this.biggestTile = 0;
    this.sampleSize = 500;
    this.bestScore = 0;
    this.manager = null;
}

GamePlayer.prototype.continueGame = function(){ this.screenActuator.continueGame(); };

GamePlayer.prototype.actuate = function(board, game){
    var self = this;
    if(!this.running){ return; }

    if(!board.over && this.watch){ self.screenActuator.actuate.apply(this.screenActuator, arguments); }

    if(board.over){ 
        this.totalScore += board.score;
        this.totalMoves += this.moveCount;
        this.bestScore = _.max(board.score, this.bestScore);
        this.biggestTile = _.max(board.biggestTile(), this.biggestTile);

        _.onceEvery(this.gameCount, 1, function(){
            _.log("game:", self.gameCount, "moves:", self.moveCount, "score:", board.score, "biggest tile:", board.biggestTile());
        });

        if(this.gameCount === this.sampleSize){
            _.log("samples:", this.sampleSize, "gps:", this.gps(), "average moves:", Math.floor(this.totalMoves / this.gameCount), "average score:", Math.floor(this.totalScore / this.gameCount), "best score:", this.bestScore, "biggest tile:", this.biggestTile);
        }else{
            return this.restart(); 
        }

    }if(!board.won && this.running){
        this.makeNextMove(board);
    }
};

GamePlayer.prototype.start = function(){
    this.running = true;
    this.gameCount++;
    this.startTime = _.timestamp();

    this.makeNextMove(this.manager.board);
};

GamePlayer.prototype.stop = function(){
    this.running = false;
};

GamePlayer.prototype.restart = function(){
    this.stop();
    this.clear();
    this.emit("restart");
    this.start();
};

GamePlayer.prototype.clear = function(){
    this.moveCount = 0;
    this.screenActuator.continueGame();
};

GamePlayer.prototype.makeNextMove = function(board){
    var self = this;
    self.moveCount++;

    var move = self.bestMove(board);

    if(self.watch){
        setTimeout(function(){ self.emit("move", move); }, self.watchDelay);
    }else{
        // chrome likes to crash, this is about as fast as we can push it.
        // it's hacky, but this fixes it.
        _.onceEvery(self.moveCount, 100, function(){
            _.nextTick(function(){ self.emit("move", move); });
        }, function(){
            self.emit("move", move);
        });
    }
};

GamePlayer.prototype.inspectTree = function(node){
   _.each(node.moves, function(move){
        if(move){ _.log("move:", move.move, "grid:", move.board.grid.cells); }
    });
};

GamePlayer.prototype.bestMove = function(board){
    var self = this;

    var tree = self.makeTree(board, self.depth-1);

    //var bestMove = Math.floor(Math.random() * 4);
 
    var bestMove = 0;
    var bestScore = -1;
    _.each(tree.moves, function(move){
        var score = self.bestLeafScore(move);
        if(score > bestScore){
            bestScore = score;
            bestMove = move.move;
        }
    });

    //_.log("best move:", bestMove, "score:", bestScore);

    return(bestMove);
};


GamePlayer.prototype.makeTree = function(board, depth, move){
    var self = this;

    if(move === undefined){ move = null; }
    var node = { board: board, move: move, moves:{} };

    var moves = [0, 1, 2, 3];
    _.each(moves, function(move){
        var currentBoard = board.clone();
        //currentBoard.move(move, true);
        currentBoard.move(move);
        if(!currentBoard.moved){ return; }

        if(!currentBoard.over && depth > 0){
            node.moves[move] = self.makeTree(currentBoard, depth-1, move);
        }else{
            node.moves[move] = { board: currentBoard, move: move };
        }
    });

    return(node);
};

GamePlayer.prototype.bestLeafScore = function(node){
    var self = this;

    if(!node.moves){ return(self.rateBoard(node.board)); }

    var bestScore = -1;
    _.each(node.moves, function(node){
        score = self.bestLeafScore(node);
        if(score > bestScore){
            bestScore = score;
        }
    });

    return(bestScore);
};

GamePlayer.prototype.rateBoard = function(board){

    var weights = {
        bigNumbersWeight : 1, 
        numberOfTilesWeight : 1, 
        goodNeighborWeight : 1,
        emptySpacesWeight : 1,
        crowdingWeight : 1,
        neighborWeight : 0
    };

    var score = (
        0
        +(weights.numberOfTilesWeight * scoreNumberOfTiles(board))
        +(weights.bigNumbersWeight * scoreBigNumbers(board))
        +(weights.crowdingWeight * scoreCrowding(board))
        //+(weights.emptySpacesWeight * scoreEmptySpaces(board))
        //+(weights.goodNeighborWeight * scoreNumberOfGoodNeighbors(board))
        //+(weights.neighborWeight * scoreNumberOfNeighbors(grid))
    );

    return(score);
};

function scoreNumberOfTiles(board){
    var score = 0;

    board.eachCell(function(x, y, cell){
        if(cell){ score++; }
    });
    
    // smaller number of tiles are better
    return(board.maxTiles - score);
}

function scoreCrowding(board){
    var score = 0;
    var tiles = 0;

    board.eachCell(function(x, y, cell){
        if(!cell){ return; }
        tiles++;
        var neighbors = board.neighbors(x, y);
        _.each(neighbors, function(cell){
            if(cell){ score++; }
        });
    });

    // "like" fewer tiles with higher crowding
    score = (board.maxTiles - tiles) * score
    
    return(score);
}


function scoreEmptySpaces(board){
    var score = 0;

    /*
    board.eachCell(function(x, y, cell){
        if(cell){
        var neighbors = getMoveNeighbors(x, y, board);
        score += (4 - neighbors.length);
        }
    });
    */
    
    return(score);
}

function scoreBigNumbers(board){
    var score = 0;

    board.eachCell(function(x, y, cell){
        if(cell && cell.value){
            var distance = Math.pow(cell.value, 2);
            score += distance; 
        }
    });

    return(score);
}

function scoreNumberOfGoodNeighbors(board){
    var score = 0;

    board.eachCell(function(x, y, cell){
        var neighbors = board.neighbors(x, y);
        // the expected value of the empty cell is 2 *.9 + 4*.1
        if(!cell){ cell = {value : 2}; }
        _.each(neighbors, function(neighbor){
            if(neighbor){ 
                // 2048 = 2^11
                score += (11 - valueDistance(cell.value, neighbor.value));
            }
        });
    });

    score = Math.ceil(score/board.maxTiles)
    return(score);
}

function valueDistance(a, b){
    if(a < b){
        var temp = a;
        a = b;
        b = a;
    }

    var distance = 0;

    while(a !== b){
        a = a/2;
        distance++;
    }
    return(distance);
}

function scoreNumberOfPossibleMatches(){ }

// fewer the better
function scoreNumberOfNeighbors(board){
    var score = 0;

    /*
    board.eachCell(function(x, y, cell){
        var neighbors = board.neighbors(x, y);
        max += neighbors.length;
        _.each(neighbors, function(neighbor){
            if(!neighbor){ score++; }
        });
    });
    */

    return(score);
}


GamePlayer.prototype.gps = function(){
    return(Math.floor(this.gameCount / ((_.timestamp() - this.startTime))));
};


GamePlayer.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

GamePlayer.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

 
