// the functions associated with preload, create and update.
var actions = { preload: preload, create: create, update: update };
// the Game object used by the phaser.io library
var width = 700;
var height = 400;
var game = new Phaser.Game(width, height, Phaser.AUTO, "game", actions);
// Global score variable initialised to 0.
var score = 0;
// Global variable to hold the text displaying the score.
var labelScore;
// Global player variable declared but not initialised.
var player;
// Global pipes variable initialised to an empty collection
var pipes = [];
// Physics constants of the game
var gameGravity = 200;
var gameSpeed = 200;
var jumpPower = 200;

// the interval (in seconds) at which new pipe columns are spawned and the
// distance (in pixels) between ends of pipes.
var pipeInterval = 1.75;
var pipeGap = 100;

// Global variables to store the bonuses
var balloons = [];
var weights = [];

// Loads all resources for the game and gives them names.
function preload() {
    // make image file available to game and associate with alias playerImg
    game.load.image("playerImg","assets/flappy-cropped.png");
    // make sound file available to game and associate with alias score
    game.load.audio("score", "assets/point.ogg");
    // make image file available to game and associate with alias pipe
    game.load.image("pipe","assets/pipe.png");
    game.load.image("pipeEnd","assets/pipe-end.png");
    // make the bonus images available
    game.load.image("balloons","assets/balloons.png");
    game.load.image("weight","assets/weight.png");
}

// Initialises the game. This function is only called once.
function create() {
    // set the background colour of the scene
    game.stage.setBackgroundColor("#BADA55");
    // add score text
    labelScore = game.add.text(20, 60, "0", {font: "30px Arial", fill: "#FFFFFF"});
    // initialise the player and associate it with playerImg
    player = game.add.sprite(80, 200, "playerImg");
    // Setting the player's anchor to center the rotation
    player.anchor.setTo(0.5, 0.5);
    // Start the ARCADE physics engine.
    // ARCADE is the most basic physics engine in Phaser.
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // enable physics for the player sprite
    game.physics.arcade.enable(player);
    // set the player's gravity
    player.body.gravity.y = gameGravity;
    // associate spacebar with jump function
    game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(playerJump);
    // time loop for game to update
    game.time.events.loop(pipeInterval * Phaser.Timer.SECOND, generate);
}

// This function updates the scene. It is called for every new frame.
function update() {
    // Call gameOver function when player overlaps with pipe
    // (i.e. when player hits a pipe)
    game.physics.arcade.overlap(player, pipes, gameOver);

    if(0 > player.body.y || player.body.y > width){
        gameOver();
    }

    checkBonus(balloons, -50);
    checkBonus(weights, 50);

    player.rotation = Math.atan(player.body.velocity.y / gameSpeed);
}

function checkBonus(bonusArray, bonusEffect) {
    for(var i=bonusArray.length - 1; i>=0; i--){
        game.physics.arcade.overlap(player,bonusArray[i], function(){
            // destroy sprite
            bonusArray[i].destroy();
            // remove element from array
            bonusArray.splice(i,1);
            // apply the bonus effect
            changeGravity(bonusEffect);
        });
    }
}

// Adds a pipe part to the pipes group
function addPipeBlock(x, y) {
    var block = game.add.sprite(x, y, "pipe");
     pipes.push(block);
    // enable physics engine for pipe
    game.physics.arcade.enable(block);
    // set the pipe's horizontal velocity to a negative value
    // (negative x value for velocity means movement will be towards left)
    block.body.velocity.x = -gameSpeed;
}

function addPipeEnd(x, y) {
    var block = game.add.sprite(x, y, "pipeEnd");
    pipes.push(block);
    game.physics.arcade.enable(block);
    block.body.velocity.x = - gameSpeed;
}

function generate(){
    var diceRoll = game.rnd.integerInRange(1, 10);
    if(diceRoll===1){
        generateBalloons();
    } else if(diceRoll===2){
         generateWeight();
     } else {
        generatePipe();
    }
}

// Generate moving pipe
function generatePipe() {
    // Generate  random integer between 1 and 5. This is the location of the
    // start point of the gap.
    var gapStart = game.rnd.integerInRange(50, height - 50 - pipeGap);

    addPipeEnd(width-5,gapStart - 25);
    for(var y=gapStart - 75; y>-50; y -= 50){
        addPipeBlock(width,y);
    }
    addPipeEnd(width-5,gapStart+pipeGap);
    for(var y=gapStart + pipeGap + 25; y<height; y += 50){
        addPipeBlock(width,y);
    }
    // Increment the score each time a new pipe is generated.
    changeScore();
}

function generateBalloons(){
    var bonus = game.add.sprite(width, height, "balloons");
    balloons.push(bonus);
    game.physics.arcade.enable(bonus);
    bonus.body.velocity.x = -gameSpeed;
    bonus.body.velocity.y = -game.rnd.integerInRange(60,100);
}

function generateWeight(){
    var bonus = game.add.sprite(width, 0, "weight");
    weights.push(bonus);
    game.physics.arcade.enable(bonus);
    bonus.body.velocity.x = -gameSpeed;
    bonus.body.velocity.y = game.rnd.integerInRange(60,100);
}

function changeGravity(g){
    gameGravity += g;
    player.body.gravity.y = gameGravity;
}

function playerJump() {
    // the more negative the value the higher it jumps
    player.body.velocity.y = - jumpPower;
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
    gameGravity = 200;
    game.state.restart();
}
