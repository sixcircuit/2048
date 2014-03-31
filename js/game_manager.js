function GameManager(size, inputManager, actuator, storageManager) {

    this.size           = size; // Size of the grid
    this.inputManager   = inputManager;
    this.storageManager = storageManager;
    this.actuator       = actuator;

    this.startTiles     = 2;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

}

GameManager.prototype.start = function(){ this.setup(); };

// Restart the game
GameManager.prototype.restart = function () {
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Clear the game won/lost message
    this.setup();
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
    this.keepPlaying = true;
    this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
    if (this.board.over || (this.board.won && !this.keepPlaying)) {
        return true;
    } else {
        return false;
    }
};

// Set up the game
GameManager.prototype.setup = function () {
    var previousState = this.storageManager.getGameState();

    // Reload the game from a previous game if present
    if (previousState) {
        this.board = new GameBoard(previousState.board); 
        this.keepPlaying = previousState.keepPlaying;
    } else {
        this.board = new GameBoard(this.size);
        this.keepPlaying = false;
    }

    // Update the actuator
    this.actuate();
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
    if (this.storageManager.getBestScore() < this.board.score) {
        this.storageManager.setBestScore(this.board.score);
    }

    // Clear the state when the game is over (game over only, not win)
    if (this.over) {
        this.storageManager.clearGameState();
    } else {
        this.storageManager.setGameState(this.serialize());
    }

    this.actuator.actuate(this.board, {
        bestScore:  this.storageManager.getBestScore(),
        terminated: this.isGameTerminated()
    });
};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
    return({
        board:       this.board.serialize(),
        keepPlaying: this.keepPlaying
    });
};

GameManager.prototype.move = function(move){
    this.board.move(move);
    this.actuate();
};

