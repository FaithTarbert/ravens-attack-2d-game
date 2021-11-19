//primary game canvas
const canvas = document.getElementById('canvas1');
//ctx = context
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//canvas for color collision detection
const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

//game over var
let gameOver = false;
//track player score
let score = 0;
//score font size
ctx.font = '40px Impact';

//in milliseconds - part of delta time calc to equalize animation speed regardless of a computer's frames-per-second speed
let timeToNextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;

//empty array to hold sprite group
let ravens = []
//class object factory
class Raven {
    constructor() {
        //custom sprite sheet calcs/props
        //this is the px width of a single sprite frame from your sprite sheet (spritesheet total px width / number of sprite frames on sheet ie 6)
        this.spriteWidth = 271;
        //px height of sprite sheet
        this.spriteHeight = 194;
        //make sprite size multiplier between .4 and 1 (so never bigger than 1 full size sprite)
        this.sizeModifier = Math.random() * 0.7 + 0.3;
        //sets the display size the sprite is drawn on canvas using spriteWidth/Height/Modifier above. Because width/height is multiplied by same modifier fraction, sprite art scale is preserved
        this.width = this.spriteWidth * this.sizeModifier;
        this.height = this.spriteHeight * this.sizeModifier;

        //movement props
        //start on canvas right edge
        this.x = canvas.width;
        //random no between canvas height minus the height of raven to keep raven from off edge: ravens come on screen at random heights
        this.y = Math.random() * (canvas.height - this.height);
        //initial horizontal/forward speed range: between pos3 and pos8 (variable range of 5)
        this.directionX = Math.random() * 5 + 3;
        //initial vertical speed: between neg2.5 and pos2.5 (variable range of 5). Minus values move sprite up, plus values move sprite down
        this.directionY = Math.random() * 5 - 2.5;
        //property state to mark sprites that have moved off screen to delete
        this.markedForDeletion = false;
        //set sprite art props
        this.image = new Image();
        //src is entire sprite sheet with multiple frames
        this.image.src = 'raven.png';

        //set moves across spritesheet - right to left, frame by fram
        //selects which sprite frame to display (0 index - which is the first frame on the sheet)
        this.frame = 0;
        //sets spritesheet frames to loop thru
        this.maxFrame = 4;

        //sets how fast sprite frames move - creates varied motion speed, like wing flaps
        //measures time since last flap in ms
        this.timeSinceFlap = 0;
        //randomize each sprite's frame/flap interval (time between frame shifts) between 50 & 100 ms
        this.flapInterval = Math.random() * 50 + 50;
        //for rgb color collision detection - set 3 random color whole nums between 0-255 (max rbg color channel range 255). This picks 3 random colors.
        this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
        //assign the 3 random rbg channel colors to a property for use in drawing on collision canvas in draw()
        this.color = `rgb(${this.randomColors[0]}, ${this.randomColors[1]}, ${this.randomColors[2]})`;
        //calls random num between 0 and 1 and evaluates whether greater than .5 - use this to randomize which ravens have particle trails
        this.hasTrail = Math.random() > 0.05;
    }

    //moves raven sprite around and adjusts any values before draw next frame
    //draws sprite on canvas - deltaTime passed from animate(), raven update()
    update(deltaTime) {
        //to limit sprite vertical movements to stay on screen/bounce off screen edge
        if (this.y < 0 || this.y > canvas.height - this.height) {
            // Then change curr vertical value from neg to +, causing sprite to reverse direction (minus values move sprite up, plus values move sprite down)
            this.directionY = this.directionY * -1;
        }
        //move sprite right to left horizontally
        this.x -= this.directionX;
        //add sprite vertical movements
        this.y += this.directionY;
        //check if sprite has moved off of left screen edge and change prop to true - it can be deleted from sprite array (otherwise array keeps growing exponentially)
        if (this.x < 0 - this.width) this.markedForDeletion = true;
        //adds deltaTime to timeSinceFlap counter, a growing number
        this.timeSinceFlap += deltaTime;

        //if time counter exceeds the max frame interval you set, then either reset frame or move right one frame
        if (this.timeSinceFlap > this.flapInterval) {
            //resets display frame to beginning of sprite sheet (frame 1, index 0)
            if (this.frame > this.maxFrame) this.frame = 0;
            //or move right one frame on sprite sheet
            else this.frame++;
            //reset frame timer
            this.timeSinceFlap = 0;
            //check raven for has particle trail value of true from raven class
            if (this.hasTrail) {
                //running a loop 5x adds 5 particles everytime vs just one
                for (let i = 0; i < 5; i++) {
                    //call particle trail constructor and push into particles array
                    particles.push(new Particle(this.x, this.y, this.width, this.color));
                }
            }
        }
        //handle game over if any raven passes left edge of screen
        if (this.x < 0 - this.width) gameOver = true;
    }

    draw() {
        //fill raven hitbox with random color calculated in raven class on HIT CANVAS
        collisionCtx.fillStyle = this.color;
        //strokeRect/fillRect outlines or fills sprite frame while building/testing on HIT CANVAS
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        //this takes between 3-9 inputs: min is image and where to draw x/y. Optional: coordinate-x/coordinate-y/coordinate-w/coordinate-h (sets where to crop spritesheet to extract one frame - start at top left corner which is 0, 0 - then over sprite width and down sprite height). Finally, sprite width/height (optional). Creates fixed sprite using 0,0 (one frame).
        // ctx.drawImage(this.image, 0, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        //this replaces 0,0, with frames moving right (from spritesheet). We keep the second zero because there is only one row of sprites
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

//handles both visual/audio cloud image explosion using sprite sheet/audio file when ravens clicked/hit
let explosions = [];
class Explosion {
    //passed 3 external values
    constructor(x, y, size) {
        this.image = new Image();
        this.image.src = 'boom.png';
        this.spriteWidth = 200;
        this.spriteHeight = 179;
        this.size = size;
        this.x = x;
        this.y = y;
        //frame tracks which sprite sheet frame to display
        this.frame = 0;
        this.sound = new Audio();
        this.sound.src = 'boom.wav';
        //to track deltaTime for frame speed
        this.timeSinceLastFrame = 0;
        //timer for explosion animation frames in ms
        this.frameInterval = 200;
        this.markedForDeletion = false;
    }

    //handle audio and explosion display/frame speed based on delta time
    update(deltaTime) {
        //play sound if explosion sprite sheet frame is at first frame
        if (this.frame === 0) this.sound.play();
        //increase frame count from 0 by deltaTime count
        this.timeSinceLastFrame += deltaTime;
        //if time exceeds set interval, move sprite sheet count/frame right
        if (this.timeSinceLastFrame > this.frameInterval) {
            this.frame++
            //reset timer
            this.timeSinceLastFrame = 0;
            //if we exceed num of sprite sheet frames, delete
            if (this.frame > 5) this.markedForDeletion = true;
        }
    }
    draw() {
        //tells draw where to crop sprite sheet image and then where to display on canvass using x/y/size (width/height). this.y - this.size/4 adjusts explosion animation vertical coordinate
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y - this.size / 4, this.size, this.size);
    }
}

//add particle trail to some raven sprites, based on their size/hit box color
let particles = [];
class Particle {
    constructor(x, y, size, color) {
        this.size = size;
        //these coordinates define where start of particle trail relative to raven is - adjust division factor to move it around - random moves the point around slightly for more variation
        this.x = x + this.size / 2 + Math.random() * 50 - 25;
        this.y = y + this.size / 3 + Math.random() * 50 - 25;
        //set starting particle circle size but smaller than sprite size
        this.radius = Math.random() * this.size / 10;
        //set random max particle opacity between 35-55px as circles grows
        this.maxRadius = Math.random() * 20 + 35;
        this.markedForDeletion = false;
        //horizontal forward speed between .5 - 1.5
        this.speedX = Math.random() * 1 + 0.5;
        this.color = color;
    }
    //will move particles horizontally
    update() {
        this.x += this.speedX;
        //size to increase radious each frame - how fast/long particle trail grows - larger number grows faster
        this.radious += 0.03;
        //the -5 marks the particles a hair sooner so they don't flicker at the end of the trail
        if (this.radius > this.maxRadius - 5) this.markedForDeletion = true;
    }
    //render particles to canvas
    draw() {
        //save and restore wrapped around this draw method keeps global canvas effects limited to this layer only
        ctx.save();
        //set particle transparency from solid to fade. As this.radius grows to reach same size of maxRadius ie 30/30, the equation would evaluate to 1 - 1, making the transparency zero/clear.
        ctx.setGlobalAlpha = 1 - this.radius / this.maxRadius;
        //begin draw circle
        ctx.beginPath();
        //fill with raven color
        ctx.fillStyle = this.color;
        //draw circle formula
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        //fill circle with color
        ctx.fill();
        ctx.restore();
    }
}

//function to track/draw score on canvas
function drawScore() {
    //shadow layer
    ctx.fillStyle = 'black';
    //50, 75 are coordinates of where to draw score
    ctx.fillText('Score: ' + score, 50, 75)
    //white text, offset slightly
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 55, 80)
}
//function to track/draw gameover text/score
function drawGameOver() {
    //center text on canvas
    ctx.textAlign = 'center';
    //shadow layer
    ctx.fillStyle = 'black';
    //50, 75 are coordinates of where to draw score
    ctx.fillText('GAME OVER! Your Score is ' + score, canvas.width / 2, canvas.height / 2)
    //white text, offset slightly by 5 px
    ctx.fillStyle = 'white';
    ctx.fillText('GAME OVER! Your Score is ' + score, canvas.width / 2 + 5, canvas.height / 2 + 5)
}

//add window event listener to collision canvas - event listener by color collision
window.addEventListener('click', function (e) {
    //grab the color where clicked 1px x 1px...
    const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
    //.data is a canvas method that holds the 3 rbg color values selected on the collision canvas
    const pixelColor = detectPixelColor.data;
    //iterate the raven array and check their hit box color against the clicked color
    ravens.forEach(raven => {
        //if there's a match, mark the raven for deletion - there was a click/hit!
        if (raven.randomColors[0] === pixelColor[0] && raven.randomColors[1] === pixelColor[1] && raven.randomColors[2] === pixelColor[2]) {
            raven.markedForDeletion = true;
            score++;
            //add explosions to array and pass the coordinates & size of raven to explosion class for creation and animation
            explosions.push(new Explosion(raven.x, raven.y, raven.width));
        }
    })
})

//this is the function that animates the ravens
//timestamp = milliseconds, 1000=1 sec. Timestamp is passed to c/b reqeuestAnimationFrame(animate) by default js behaviour. It is used to measure deltaTime/fps speed
function animate(timestamp) {
    //clear prev drawings from entire game canvas coordinates
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    //clear prev drawings from entire collision canvas coordinates
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height)

    //deltatime = diff between frame timestamps in ms
    let deltaTime = timestamp - lastTime;
    //reset lastTime to current timestamp for tracking deltaTime
    lastTime = timestamp;
    timeToNextRaven += deltaTime;
    //if growing val of timeToNextRaven exceeds the ravenInterval hardcoded at the top, create a new raven obj and push into ravens array
    if (timeToNextRaven > ravenInterval) {
        ravens.push(new Raven())
        //reset timer
        timeToNextRaven = 0;
        //sort ravens array based on ascending width (small to large/small behind, larger in front)
        ravens.sort(function (a, b) {
            return a.width - b.width;
        })
    }

    //call draw score before ravens animate, so score will layer behind them
    drawScore();

    //spread ravens arr into new array and cycle thru each one, calling update() and draw(). Pass deltaTime to control frame display rate in draw(). The order the arrays are called determins the order they are drawn. Particles occurr first so they appear behind the ravens.
    [...particles, ...ravens, ...explosions].forEach(raven => raven.update(deltaTime));
    [...particles, ...ravens, ...explosions].forEach(raven => raven.draw());
    //creates new array removing sprites marked for deletion
    ravens = ravens.filter(raven => !raven.markedForDeletion)
    //creates new array removing explosions marked for deletion
    explosions = explosions.filter(explosion => !explosion.markedForDeletion)
    //creates new array removing particle trails marked for deletion
    particles = particles.filter(particle => !particle.markedForDeletion)

    //built in method which creates endless loop to animate frame by frame, as long as gameover condition is still set to false
    if (!gameOver) requestAnimationFrame(animate)
    else drawGameOver();
}
//set starting deltaTime count to zero to prevent errors
animate(0)