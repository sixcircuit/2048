# 2048

This was built as the nerdiest flirt ever. The woman I (partially) built it to impress never saw it. However it did cure my addiction to 2048, which was the advice she gave me: she said she built game players when she wanted to be done with a game.

I had to refactor the original code to be computer "player" compatable. You can build off of it if you like, just mess around with the algorithms that compute desireable board states.

Some of the code is a little janky, some of that is my fault, some isn't. The place you would plug in your own player is pretty well defined, and stable.

It'd be great if you could plug in different players and compare them. It'd be great if the code was cleaner. I'm not going to do either.

It'll play forever. On "Watch It" mode, it'll play on fast until it hits 1024 then goes to medium till 1024 + 512, then slow when it hits 1024 + 512 + 256.

Enjoy.

Also, my layout changes aren't in the scss files, only the main.css file. Shit's weak. I know. If you want to be awesome, fix the layout, which is kinda busted anyway.

[Watch it play here!](http://sktaylor.github.io/2048/)

A small clone of [1024](https://play.google.com/store/apps/details?id=com.veewo.a1024), based on [Saming's 2048](http://saming.fr/p/2048/) (also a clone).

Made just for fun. [Play it here!](http://gabrielecirulli.github.io/2048/)

### Contributions

 - [TimPetricola](https://github.com/TimPetricola) added best score storage
 - [chrisprice](https://github.com/chrisprice) added custom code for swipe handling on mobile
 - [elektryk](https://github.com/elektryk) made swipes work on Windows Phone
 - [mgarciaisaia](https://github.com/mgarciaisaia) addes support for Android 2.3

Many thanks to [rayhaanj](https://github.com/rayhaanj), [Mechazawa](https://github.com/Mechazawa), [grant](https://github.com/grant), [remram44](https://github.com/remram44) and [ghoullier](https://github.com/ghoullier) for the many other good contributions.

### Screenshot

<p align="center">
  <img src="http://pictures.gabrielecirulli.com/2048-20140309-234100.png" alt="Screenshot"/>
</p>

## Contributing
Changes and improvements are more than welcome! Feel free to fork and open a pull request. Please make your changes in a specific branch and request to pull into `master`! If you can, please make sure the game fully works before sending the PR, as that will help speed up the process.

You can find the same information in the [contributing guide.](https://github.com/gabrielecirulli/2048/blob/master/CONTRIBUTING.md)

## License
2048 is licensed under the [MIT license.](https://github.com/gabrielecirulli/2048/blob/master/LICENSE.txt)
