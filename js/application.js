// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
    //KeyboardInputManager
    //HTMLActuator

    var player = new GamePlayer();
   
    $(".restart-button").click(function(){
        if(player.running){
            player.stop();
            $(".restart-button").html("Start Player");
        }else{
            player.start();
            $(".restart-button").html("Stop Player");
        }
    });

    var manager = new GameManager(4, player, player, new LocalStorageManager());
    
    player.manager = manager;

    manager.start();

});
