
function GamePlayer(){
    var self = this;

    this.screenActuator = new HTMLActuator();

    this.events = {};
    this.watch = true;
    this.watchDelay = 100;
    this.running = false;
    this.gameCount = 0;
    this.moveCount = 0;
    this.actuatedCount = 0;

    //this.continueGame();

    //setTimeout(function(){
        //self.start();
    //}, 1000)
}

GamePlayer.prototype.continueGame = function(){ this.screenActuator.continueGame(); };

GamePlayer.prototype.actuate = function(grid, meta){
    if(!this.running){ return; }

    this.actuatedCount++;
    //_.log(grid);
    
    /*
    meta.score;
    meta.over;
    meta.won;
    meta.bestScore;
    meta.terminated;
    */
 
    if(meta.terminated){ 
        if(this.actuatedCount !== this.moveCount){
            throw(new Error("Outpaced screen."));
        }else{ _.log("game:", this.gameCount, "total moves:", this.moveCount); }

        return this.restart(); // we return to avoid redrawing the screen for the end of game message
    }else if(!meta.won && this.running){
        this.makeNextMove();
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
    this.actuatedCount = 0;
    this.screenActuator.continueGame();
};

GamePlayer.prototype.makeNextMove = function(){
    var self = this;
    self.moveCount++;

    var move = Math.floor(Math.random() * 4);
    //_.log("move: ", move);
    // wait for animation

    if(self.watch){
        setTimeout(function(){ self.emit("move", move); }, self.watchDelay);
    }else{
        _.nextTick(function(){ self.emit("move", move); });
    }
};

GamePlayer.prototype.start = function(){
    this.running = true;
    this.gameCount++;

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

 
