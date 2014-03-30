
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
    this.sampleSize = 500;
    this.bestScore = 0;
    this.manager = null;
}

GamePlayer.prototype.continueGame = function(){ this.screenActuator.continueGame(); };

GamePlayer.prototype.actuate = function(board, game){
    var self = this;
    if(!this.running){ return; }

    // it's helpful to have the board drawn first, so you can compare to the calculated moves
    if(!game.terminated && this.watch){ this.screenActuator.actuate.apply(this.screenActuator, arguments); }

    if(game.terminated){ 
        if(board.score > this.bestScore){ 
            this.bestScore = board.score;
        }
        this.totalScore += board.score;
        this.totalMoves += this.moveCount;

        _.onceEvery(this.gameCount, 5, function(){
            _.log("game:", self.gameCount, "moves:", self.moveCount, "score:", board.score);
        });

        if(this.gameCount === this.sampleSize){
            _.log("samples:", this.sampleSize, "gps:", this.gps(), "average moves:", Math.floor(this.totalMoves / this.gameCount), "average score:", Math.floor(this.totalScore / this.gameCount), "best score:", this.bestScore);
        }else{
            return this.restart(); // we return to avoid redrawing the screen for the end of game message
        }

    }else if(!board.won && this.running){
        this.makeNextMove(board);
    }
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
        currentBoard.move(move, true);
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
        bigNumbersWeight : 0, 
        numberOfTilesWeight : 1, 
        goodNeighborWeight : 0,
        neighborWeight : 0
    };

    var score = (
            (weights.numberOfTilesWeight * scoreNumberOfTiles(board))
        //+   (weights.neighborWeight * scoreNumberOfNeighbors(grid))
        //+   (weights.goodNeighborWeight * scoreNumberOfGoodNeighbors(grid))
        //+   (weights.bigNumbersWeight * scoreBigNumbers(grid))
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

// up down left rigth, no diagonal
function getMoveNeighbors(x, y, grid){

    var size = grid.size;
    var matrix = grid.cells;

    var neighbors = [];

    if(x-1 > 0){ neighbors.push(matrix[x-1][y]); }
    if(x+1 < size){ neighbors.push(matrix[x+1][y]); }
    if(y-1 > 0){ neighbors.push(matrix[x][y-1]); }
    if(y+1 < size){ neighbors.push(matrix[x][y+1]); }

    return(neighbors);
}

function scoreBigNumbers(grid){
    var score = 0;
    var size = grid.size;
    var matrix = grid.cells;

    for(var x = 0; x < size; x++){
        for(var y = 0; y < size; y++){
            if(matrix[x][y] &&  matrix[x][y].value){
                var val = matrix[x][y].value;
                var distance = (10*valueDistance(val, 1));
                score += distance; 
            }
        }
    }

    return(score);
}

function scoreNumberOfPossibleMatches(){ }

// fewer the better
function scoreNumberOfNeighbors(grid){
    var score = 0;
    var max = 0;
    var size = grid.size;
    var matrix = grid.cells;

    for(var x = 0; x < size; x++){
        for(var y = 0; y < size; y++){
            if(matrix[x][y]){
                var moveNeighbors = getMoveNeighbors(x, y, grid);
                max += moveNeighbors.length;
                _.each(moveNeighbors, function(neighbor){
                    if(!neighbor){ score++; }
                });
            }
        }
    }

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

function scoreNumberOfGoodNeighbors(grid){
    var score = 0;
    var size = grid.size;
    var matrix = grid.cells;

    for(var x = 0; x < size; x++){
        for(var y = 0; y < size; y++){
            var cell = matrix[x][y];
            //if(!cell){ cell = { value : 2 }; }
            if(!cell){ continue; }
            var moveNeighbors = getMoveNeighbors(x, y, grid);
            _.each(moveNeighbors, function(neighbor){
                if(neighbor){ 
                    // 2048 = 2^11
                    score += (11 - valueDistance(cell.value, neighbor.value));
                }
            });
        }
    }

    score = Math.ceil(score/(size * size))
    //_.log(score);
    return(score);
}


GamePlayer.prototype.gps = function(){
    return(Math.floor(this.gameCount / ((_.timestamp() - this.startTime))));
};

GamePlayer.prototype.start = function(){
    this.running = true;
    this.gameCount++;
    this.startTime = _.timestamp();

    /*
    0, // Up
    1, // Right
    2, // Down
    3, // Left
    */

    this.makeNextMove(this.manager.board);

    /*
    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
    */
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

 
