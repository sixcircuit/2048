// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
    //KeyboardInputManager
    //HTMLActuator


    var player = new GamePlayer();

    //player.watch = true;
    //player.watchDelay = 100;
   

    $(".restart-button").click(function(){
        if(player.running){
            player.stop();
            $(".restart-button").html("Start Player");
        }else{
            player.start();
            $(".restart-button").html("Stop Player");
        }
    });

    var storageManager = {
        getGameState : _.noop,
        getBestScore : _.noop,
        setBestScore : _.noop,
        clearGameState : _.noop,
        setGameState : _.noop
    };

    //storageManager = new LocalStorageManager();

    var manager = new GameManager(4, player, player, storageManager);
    
    player.manager = manager;

    manager.start();

});
