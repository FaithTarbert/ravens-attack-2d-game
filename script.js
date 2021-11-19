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
        //for color collision detection - set random color whole nums between 0-255 (max color channels)
        this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
        this.color = `rgb(${this.randomColors[0]}, ${this.randomColors[1]}, ${this.randomColors[2]})`;

    }
    //moves sprite around and adjusts any values before draw next frame
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
        }
    }

    draw() {
        //fill raven hitbox with random color calculated in raven class on HIT CANVAS
        collisionCtx.fillStyle = this.color;
        //strokeRect/fillRect outlines or fills sprite frame while building/testing on HIT CANVAS
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        //this takes between 3-9 inputs: min is image and where to draw x/y. Optional: coordinate-x/coordinate-y/coordinate-w/coordinate-h (sets where to crop spritesheet to extract one frame - start at top left corner which is 0, 0 - then over sprite width and down sprite height). Finally, sprite width/height (optional). Creates fixed sprite using 0,0 (one frame).
        // ctx.drawImage(this.image, 0, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        //this replaces 0,0, with frames moving right (from spritesheet)
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

//function to track score on canvas
function drawScore() {
    //shadow layer
    ctx.fillStyle = 'black';
    //50, 75 are coordinates to draw score
    ctx.fillText('Score: ' + score, 50, 75)
    //white text, offset slightly
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 55, 80)
}

//add window event listener to collision canvas - event listener by color collision
window.addEventListener('click', function (e) {
    const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
    console.log(detectPixelColor);
})

//this is the function that animates
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
    //call draw score before ravens animate, so core will layer behind them
    drawScore();
    //spread ravens arr into new array and cycle thru each one, calling update() and draw(). Pass deltaTime thru for varying frame rate in draw()
    [...ravens].forEach(raven => raven.update(deltaTime));
    [...ravens].forEach(raven => raven.draw());
    //creates new array removing sprites marked for deletion
    ravens = ravens.filter(raven => !raven.markedForDeletion)

    //creates endless running loop to animate frame by frame
    requestAnimationFrame(animate)
}
//pass starting timestamp for deltatime calc as zero to prevent errors
animate(0)