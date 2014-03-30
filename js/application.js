// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
    //KeyboardInputManager
    //HTMLActuator

    var player = new GamePlayer();
    // the game manager makes instances of the classes, I want to have the actuator, and controller in the same class
    function playerSingleton(){ return(player); }
   
    $(".restart-button").click(function(){
        if(player.running){
            player.stop();
            $(".restart-button").html("Start Player");
        }else{
            player.start();
            $(".restart-button").html("Stop Player");
        }
    });

    new GameManager(4, playerSingleton, playerSingleton, LocalStorageManager);
});
KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  button.addEventListener(this.eventTouchend, fn.bind(this));
};
