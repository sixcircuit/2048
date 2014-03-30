
function GamePlayer(){
    var self = this;

    this.screenActuator = new HTMLActuator();
    
    this.watch = true;

    this.depth = 2;
    this.events = {};
    this.watchDelay = 100;
    this.running = false;
    this.gameCount = 0;
    this.moveCount = 0;
    this.startTime = 0;
    this.totalMoves = 0;
    this.totalScore = 0;
    this.sampleSize = 500;

    _.nextTick(function(){ self.start(); });
}

GamePlayer.prototype.continueGame = function(){ this.screenActuator.continueGame(); };

GamePlayer.prototype.actuate = function(board, game){
    if(!this.running){ return; }

    if(game.terminated){ 
        this.totalScore += board.score;
        this.totalMoves += this.moveCount;

        //if((this.gameCount % 50) === 0){
            _.log("game:", this.gameCount, "moves:", this.moveCount, "score:", board.score);
        //}

        if(this.gameCount === this.sampleSize){
            _.log("samples:", this.sampleSize, "gps:", this.gps(), "average moves:", Math.floor(this.totalMoves / this.gameCount), "average score:", Math.floor(this.totalScore / this.gameCount));
        }else{
            return this.restart(); // we return to avoid redrawing the screen for the end of game message
        }

    }else if(!board.won && this.running){
        this.makeNextMove(board);
    }
    
    // update screen
    if(this.watch){ this.screenActuator.actuate.apply(this.screenActuator, arguments); }
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

    var move = Math.floor(Math.random() * 4);
 
    //var move = self.calculateBestMove();
    _.log("move: ", move);

    if(self.watch){
        setTimeout(function(){ self.emit("move", move); }, self.watchDelay);
    }else{
        _.nextTick(function(){ self.emit("move", move); });
    }
};

function GameModel(initialData){

    var mockStorageMananger = function(){
        return({
            getGameState : function(){ return(initialData); },
            getBestScore : _.noop,
            setBestScore : _.noop,
            clearGameState : _.noop,
            setGameState : _.noop
        });
    };

    var mockActuate = function(){
        return({
            actuate: _.noop
        });
    };

    var mockInput = function(){
        return({
            on : _.noop
        });
    };

    return(new GameManager(4, mockInput, mockActuate, mockStorageMananger));
}

GamePlayer.prototype.makeNewGame = function(gameData, move){
    var game = GameModel(gameData);
    var moved = game.move(move, true);
    if(moved){ return(game); }
    else{ return(null); }
};

GamePlayer.prototype.fillMovesNode = function(gameData, node, depth){
    var self = this;
    if(depth === 0 || node.game === null){ return(node); }
    var moves = [0, 1, 2, 3];
    node.moves = {};
    _.each(moves, function(move){
        node.moves[move] = self.fillMovesNode(gameData, { move: move, game: self.makeNewGame(gameData, move) }, depth-1);;
    });

    return(node);
};

GamePlayer.prototype.bestLeaf = function(node){
    var self = this;

    var bestScore = -1;

    if(node.moves){
        _.each(node.moves, function(move){
            score = self.bestLeaf(move);
            if(score > bestScore){
                bestScore = score;
            }
        });
    }else if(node.game){
        bestScore = self.rateGrid(node.game.grid.serialize());
    }

    return(bestScore);
};

GamePlayer.prototype.calculateBestMove = function(depth){
    var self = this;

    depth = depth || 1;

    var grids = { moves: {} };

    var gameData = self.manager.serialize();

    self.fillMovesNode(gameData, grids, self.depth);

    var bestScore = -1;
    var bestMove = 0;
    _.each(grids.moves, function(move){
        var score = self.bestLeaf(move);
        //_.log("move:", move.move, "score:", score);
        if(score > bestScore){
            bestScore = score;
            bestMove = move.move;
        }
    });

    //_.log("best move:", bestMove, "score:", bestScore);
    //_.log("");
    return(bestMove);
};

GamePlayer.prototype.rateGrid = function(grid){
    /*
     [ { position: { x: 3, y: 0 }, value: 64 },
       { position: { x: 3, y: 1 }, value: 32 },
       { position: { x: 3, y: 2 }, value: 16 },
       { position: { x: 3, y: 3 }, value: 4 } ] ] } 
       */

    var weights = {
        bigNumbersWeight : 0, 
        numberOfTilesWeight : 1, 
        goodNeighborWeight : 0,
        neighborWeight : 0
    };

    var score = (
            (weights.numberOfTilesWeight * scoreNumberOfTiles(grid))
        //+   (weights.neighborWeight * scoreNumberOfNeighbors(grid))
        +   (weights.goodNeighborWeight * scoreNumberOfGoodNeighbors(grid))
        +   (weights.bigNumbersWeight * scoreBigNumbers(grid))
    );

    return(score);
};

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
                //_.log("val:", val, "distance:", distance);
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

function scoreNumberOfTiles(grid){
    var score = 0;
    var size = grid.size;
    var matrix = grid.cells;

    for(var x = 0; x < size; x++){
        for(var y = 0; y < size; y++){
            if(matrix[x] && matrix[x][y]){
                score++;
            }
        }
    }

    // smaller number of tiles are better
    score = (size * size) - score;
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

    this.makeNextMove();

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

 
