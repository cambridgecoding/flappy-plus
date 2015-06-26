// the functions associated with preload, create and update.
var actions = { preload: preload, create: create, update: update };
// the Game object used by the phaser.io library
var game = new Phaser.Game(700, 400, Phaser.AUTO, "game", actions);
// Global score variable initialised to 0.
var score = 0;
// Global variable to hold the text displaying the score.
var labelScore;
// Global player variable declared but not initialised.
var player;
// Global pipes variable declared but not initialised.
var pipes;

var modes = [
	easy: {
		pipeInterval: 3,
		gameSpeed: 180,
		gameGravity: 220,
		bonusRate: 4
	},
	normal: {
		pipeInterval: 1.75,
		gameSpeed: 200,
		gameGravity: 200,
		bonusRate: 10
	}
];
var easyTag;
var normalTag;

// the interval (in seconds) at which new pipe columns are spawned
var pipeInterval;

// The value of gravity and speed
var gameGravity;
var gameSpeed;

var bonusDuration = 10;
var bonusRate;
var bonuses;

var bgRed = 110;
var bgGreen = 179;
var bgBlue = 229;

function bgColor() {
    return Phaser.Color.RGBtoString(bgRed, bgGreen, bgBlue, 255, '#');
}

function setMode(modeName) {
	var mode;
	if(modeName = "easy"){ mode = modes.easy; }
	if(modeName = "normal"){ mode = modes.normal; }

	pipeInterval = mode.pipeInterval;
	gameSpeed = mode.gameSpeed;
	gameGravity = mode.gameGravity;
	bonusRate = mode.bonusRate;
}

// Loads all resources for the game and gives them names.
function preload() {
    // make image file available to game and associate with alias playerImg
    game.load.image("playerImg","assets/flappy-cropped.png");
    // make sound file available to game and associate with alias score
    game.load.audio("score", "assets/point.ogg");
    // make image file available to game and associate with alias pipe
    game.load.image("pipe","assets/pipe.png");
    game.load.image("lighter","assets/lighter.png");
    game.load.image("Easy","assets/easy.png");
    game.load.image("Normal","assets/normal.png");
}

// Initialises the game. This function is only called once.
function create() {

	setMode("easy");

    // set the background colour of the scene
    game.stage.setBackgroundColor(bgColor());
    // add welcome text
    game.add.text(20, 20, "Welcome to my game", {font: "30px Arial", fill: "#FFFFFF"});
    // add score text
    labelScore = game.add.text(20, 60, "0", {font: "30px Arial", fill: "#FFFFFF"});
    // initialise the player and associate it with playerImg
    player = game.add.sprite(80, 200, "playerImg");
	 player.anchor.setTo(0.5, 0.5);
	 player.hitArea = Phaser.Ellipse(0,0,43,33);
    // Start the ARCADE physics engine.
    // ARCADE is the most basic physics engine in Phaser.
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // enable physics for the player sprite
    game.physics.arcade.enable(player);
    // set the player's gravity
    player.body.gravity.y = gameGravity;
    // associate spacebar with jump function
    game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(playerJump);
    // create a group called 'pipes' to contain individual pipe elements that
    // the player can interact with
    pipes = game.add.group();
    bonuses = game.add.group();

    easyTag = game.add.sprite(350, 100,"Easy");
    game.physics.arcade.enable(easyTag);
    easyTag.body.velocity.x = - gameSpeed;
    normalTag = game.add.sprite(350, 300,"Normal");
    game.physics.arcade.enable(normalTag);
    normalTag.body.velocity.x = - gameSpeed;
}

// This function updates the scene. It is called for every new frame.
function update() {
    // Call gameOver function when player overlaps with pipe
    // (i.e. when player hits a pipe)
    game.physics.arcade.overlap(player, pipes, gameOver);

	 if(0 > player.body.y || player.body.y > 400){
		 gameOver();
	 }
    // RGU: see comment in previous modules about this
	 //RP: Here's a version with non-nested callbacks. I think it's idiomatic
	 //JS and interesting for them to learn.
    bonuses.forEach(function(bonus){
        if(bonus.overlap(player)){
            lighten();
            bonus.destroy();
        }
    });

	 player.rotation = (player.body.velocity.y / gameSpeed);

    //RGU: I think this can be cool
    // problem if you miss a label at the start you don't get the game
    // I think we should offer a normal starting menu where they click and then the game starts
    // like on the game at http://flappybird.cambridgecoding.com/
	 //RP: I tried to get as unobtrusive as possible. I considered the
	 //following alternative: do it the standard Phaser way by extending the
	 //Game.Stage prototype (a bit overkill and quite complicated), do it
	 //hackily (like the page on cca) but that introduces a lot of functions
	 //and intermediate things, this simple thing where the menu is in the
	 //game.
	 //Maybe we can have the full menu as a bonus?
    game.physics.arcade.overlap(player, easyTag, function(){
        easyTag.destroy();
        normalTag.destroy();
        setMode("easy");
        // time loop for game to update
        game.time.events.loop(pipeInterval * Phaser.Timer.SECOND, generate);
    });
    game.physics.arcade.overlap(player, normalTag, function(){
        easyTag.destroy();
        normalTag.destroy();
        setMode("normal");
       // time loop for game to update
       game.time.events.loop(pipeInterval * Phaser.Timer.SECOND, generate);
    });
}

// Adds a pipe part to the pipes group
function addPipeBlock(x, y) {
    // add a new pipe part to the 'pipes' group
    var pipe = pipes.create(x, y, "pipe");
    // enable physics engine for pipe
    game.physics.arcade.enable(pipe);
    // set the pipe's horizontal velocity to a negative value
    // (negative x value for velocity means movement will be towards left)
    pipe.body.velocity.x = - gameSpeed;
}

function generate() {
    if(game.rnd.integerInRange(1, bonusRate) == bonusRate){
        generateBonus()
    } else {
        generatePipe()
    }
}

// Generate moving pipe
function generatePipe() {
    // Generate  random integer between 1 and 5. This is the location of the
    // start point of the gap.
    var gapStart = game.rnd.integerInRange(1, 5);
    // Loop 8 times (8 is the height of the canvas).
    for (var count = 0; count < 8; count++) {
        // If the value of count is not equal to the gap start point
        // or end point, add the pipe image.
        if(count != gapStart && count != gapStart+1){
            addPipeBlock(750, count * 50);
        }
    }
    // Increment the score each time a new pipe is generated.
    changeScore();
}

function generateBonus() {
	var bonus = bonuses.create(750, game.rnd.integerInRange(1,5) * 80, "lighter");
	game.physics.arcade.enable(bonus);
    bonus.body.velocity.x = - gameSpeed;
}

function lighten() {
	gameGravity -= 50;
	player.body.gravity.y = gameGravity;
	bgRed -= 40;
	bgGreen -= 50;
	bgBlue -= 50;
	game.stage.setBackgroundColor(bgColor());

	game.time.events.add(bonusDuration * Phaser.Timer.SECOND,heavier);
}

function heavier() {
	gameGravity += 50;
	player.body.gravity.y = gameGravity;
	bgRed += 40;
	bgGreen += 50;
	bgBlue += 50;
	game.stage.setBackgroundColor(bgColor());
}


function playerJump() {
    // the more negative the value the higher it jumps
    player.body.velocity.y = -200;
}

// Function to change the score
function changeScore() {
    //increments global score variable by 1
    score++;
    // updates the score label
    labelScore.setText(score.toString());
}

function gameOver() {
    // stop the game (update() function no longer called)
    score = 0;
    game.state.restart();
}
