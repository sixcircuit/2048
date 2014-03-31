function GameBoard(data) {
    data = data || {};

    if(data.grid && data.grid.size){
        this.size = data.grid.size;
    }else{
        this.size = data.size || 4;
    }

    this.maxTiles = this.size * this.size;
    this.startTiles = data.startTiles || 2;

    if (data.grid) { 
        this.grid = new Grid(data.grid);
    }else{
        this.grid = new Grid(this.size);
        this.addStartTiles();
    }

    if(data.moved !== undefined){
        this.moved = data.moved;
    }else{
        this.moved = false;
    }

    if(data.score !== undefined){ 
        this.score = data.score;
    }else{
        this.score = 0;
    }

    if(data.over !== undefined){
        this.over = data.over;
    }else{
        this.over = false;
    }

    if(data.won !== undefined){
        this.won = data.won;
    }else{
        this.won = false;
    }
}

GameBoard.prototype.clone = function(){
    return(new GameBoard(this.serialize()));
};

// Represent the current game as an object
GameBoard.prototype.serialize = function () {
    return({
        size: this.size,
        grid: this.grid.serialize(),
        score:this.score,
        won: this.won,
        over: this.over,
        moved: this.moved
    });
};

// Set up the initial tiles to start the game with
GameBoard.prototype.addStartTiles = function () {
    for (var i = 0; i < this.startTiles; i++) {
        this.addRandomTile();
    }
};

// Adds a tile in a random position
GameBoard.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

// Save all tile positions and remove merger info
GameBoard.prototype.prepareTiles = function () {
    this.grid.eachCell(function (x, y, tile) {
        if (tile) {
            tile.mergedFrom = null;
            tile.savePosition();
        }
    });
};


GameBoard.prototype.neighbors = function(x, y, diagonal){

    var size = this.grid.size;
    var matrix = this.grid.cells;

    var neighbors = [];

    // up, down, left, right
    if(x-1 > 0){ neighbors.push(matrix[x-1][y]); }
    if(x+1 < size){ neighbors.push(matrix[x+1][y]); }
    if(y-1 > 0){ neighbors.push(matrix[x][y-1]); }
    if(y+1 < size){ neighbors.push(matrix[x][y+1]); }

    if(diagonal){
        if(x-1 > 0 && y-1 > 0){ neighbors.push(matrix[x-1][y-1]); }
        if(x+1 < size && y+1 < size){ neighbors.push(matrix[x+1][y+1]); }
        if(y-1 > 0 && x+1 < size ){ neighbors.push(matrix[x+1][y-1]); }
        if(y+1 < size && x-1 > 0){ neighbors.push(matrix[x-1][y+1]); }
    }

    return(neighbors);
}

GameBoard.prototype.biggestTile = function(){
    var max = 0;
    this.eachCell(function(x, y, cell){
        if(cell){
            max = _.max(max, cell.value);
        }
    });
    return(max);
}

// Move a tile and its representation
GameBoard.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

GameBoard.prototype.eachCell = function(callback){
    this.grid.eachCell(callback);
};

GameBoard.prototype.move = function(direction, noRandom){
   // 0: up, 1: right, 2: down, 3: left
    var self = this;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    self.moved = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            var cell = { x: x, y: y };
            var tile = self.grid.cellContent(cell);

            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next      = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                    // The mighty 2048 tile
                    if (merged.value === 2048) self.won = true;
                } else {
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    self.moved = true; // The tile moved from its original cell!
                }
            }
        });
    });

    if(self.moved){
        if(!noRandom){ this.addRandomTile(); }
        if (!this.movesAvailable()) { this.over = true; }
    }
};

// Get the vector representing the chosen direction
GameBoard.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
        0: { x: 0,  y: -1 }, // Up
        1: { x: 1,  y: 0 },  // Right
        2: { x: 0,  y: 1 },  // Down
        3: { x: -1, y: 0 }   // Left
    };

    return map[direction];
};

// Build a list of positions to traverse in the right order
GameBoard.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

GameBoard.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
            this.grid.cellAvailable(cell));

    return {
        farthest: previous,
            next: cell // Used to check if a merge is required
    };
};

GameBoard.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameBoard.prototype.tileMatchesAvailable = function () {
    var self = this;

    var tile;

    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            tile = this.grid.cellContent({ x: x, y: y });

            if (tile) {
                for (var direction = 0; direction < 4; direction++) {
                    var vector = self.getVector(direction);
                    var cell   = { x: x + vector.x, y: y + vector.y };

                    var other  = self.grid.cellContent(cell);

                    if (other && other.value === tile.value) {
                        return true; // These two tiles can be merged
                    }
                }
            }
        }
    }

    return false;
};

GameBoard.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};
