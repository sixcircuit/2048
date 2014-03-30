// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
    //KeyboardInputManager
    //HTMLActuator


    var player = new GamePlayer();

    player.watch = true;
    player.watchDelay = 10;
   
    player.depth = 1; // won with 3
    //player.sampleSize = 5;

    $(".restart-button").click(function(){
        if(player.running){
            player.stop();
            $(".restart-button").html("Start Player");
        }else{
            player.start();
            $(".restart-button").html("Stop Player");
        }
    });

    function MemoryStorageManager(){
        this.bestScore = 0;
    };

    MemoryStorageManager.prototype.getGameState = _.noop;
    MemoryStorageManager.prototype.getBestScore = function(){ return(this.bestScore); };
    MemoryStorageManager.prototype.setBestScore = function(score){ this.bestScore = score; };
    MemoryStorageManager.prototype.clearGameState = _.noop;
    MemoryStorageManager.prototype.setGameState = _.noop;

    var storageManager = new MemoryStorageManager();
    // var storageManager = new LocalStorageManager();

    var manager = new GameManager(4, player, player, storageManager);
    
    player.manager = manager;

    manager.start();
    player.start();

});
