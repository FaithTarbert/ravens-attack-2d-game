const canvas = document.getElementById('canvas1');
//ctx = context
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//in milliseconds - part of delta time calc to equalize animation speed regardless of a computer's frames-per-second speed
let timeToNextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;

//empty array to hold sprite group
let ravens = []
//class object factory
class Raven {
    constructor() {
        //in pixels
        this.width = 100;
        this.height = 50;
        //start on canvas right edge
        this.x = canvas.width;
        //random no between canvas height minus the height of raven to keep raven from off edge: ravens come on screen at random heights
        this.y = Math.random() * (canvas.height - this.height);
        //initial horizontal/forward speed range: between pos3 and pos8 (variable range of 5)
        this.directionX = Math.random() * 5 + 3;
        //initial vertical speed: between neg2.5 and pos2.5 (variable range of 5). Minus values move sprite up, plus values move sprite down
        this.directionY = Math.random() * 5 - 2.5;
    }
    //moves sprite around and adjusts any values before draw next frame
    update() {
        this.x -= this.directionX;
    }
    //draws sprite on canvas
    draw() {
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}


//this is the function that animates
//timestamp = milliseconds, 1000=1 sec. Timestamp is passed to c/b reqeuestAnimationFrame(animate) by default js behaviour. It is used to measure deltaTime/fps speed
function animate(timestamp) {
    //clear prev drawings from entire canvas coordinates
    ctx.clearRect(0, 0, canvas.width, canvas.height)

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

    }
    //spread ravens arr into new array and cycle thru each one, calling update() and draw()
    [...ravens].forEach(raven => raven.update());
    [...ravens].forEach(raven => raven.draw());
    //creates endless running loop to animate frame by frame
    requestAnimationFrame(animate)
}
//pass starting timestamp for deltatime calc as zero to prevent errors
animate(0)