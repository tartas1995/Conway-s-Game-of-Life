const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#FFFFFF';
const COLOR_GRAY = '#808080';

/**
 * TODO: center focus point(zoom into center)
 * TODO: disable border when zoom too small
 * TODO: move camera
 * TODO: add game
 */

class Game {
    constructor(canvas) {
        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        this.zoom = this.zoom.bind(this);
        this.cameraOn = this.cameraOn.bind(this);
        this.cameraOff = this.cameraOff.bind(this);
        this.cameraMove = this.cameraMove.bind(this);
        this.randomCells = this.randomCells.bind(this);
        this.pause = this.pause.bind(this);
        this.animate = this.animate.bind(this);
        this.addEventListeners = this.addEventListeners.bind(this);
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        // cache to store framerate related data
        this.frameCache = {
            fpsInterval: 1000 / 60, // fps / 1 second
            timeOfLastFrame: 0,
        };
        // cache to store screen related data
        this.screen = {
            height: this.canvas.clientHeight,
            width: this.canvas.clientWidth,
            x: 0,
            y: 0,
            zoom: 100,
            pastPosition: {x:null, y:null},
        };
        // cache to store game related data
        this.state = {
            cells:[{x:1,y:1},{x:0,y:0}],
            pause: false,
        };
        this.randomCells();
        this.resize();
        // init Event listeners
        this.addEventListeners();
        // start the animation motor
        window.requestAnimationFrame(this.animate);
    }

    /**
     * toggles the pause status of the game
     */
    pause() {
        this.state.pause = !this.state.pause;
        if (!this.state.pause) window.requestAnimationFrame(this.animate);
    }

    /**
     * add Event Listeners 
     */
    addEventListeners() {
        window.addEventListener('resize', this.resize);
        document.addEventListener('wheel', this.zoom);
        this.canvas.addEventListener('mousedown', this.cameraOn);
        this.canvas.addEventListener('mouseup', this.cameraOff);
        this.canvas.addEventListener('mousemove', this.cameraMove);
    }

    /**
     * handles resize 
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.height = rect.height;
        this.canvas.width = rect.width;
        this.screen.height = this.canvas.clientHeight;
        this.screen.width = this.canvas.clientWidth;
    }

    /**
     * clear cells
     * generate random Cells 
     */
    randomCells() {
        this.state.cells = [];
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * 5);
            const y = Math.floor(Math.random() * 5);
            this.state.cells.push({x,y})
        }
    }

    /**
     * handles Wheel Events
     * @param {WheelEvent} e 
     */
    zoom(e) {
        e.preventDefault();
        // disable zoom when paused
        if (this.state.pause) return false;
        // scroll direction 
        if (e.deltaY > 0) { // deltaY+ = down
            this.screen.zoom -= this.screen.zoom * 10 / 100;
        } else { // deltaY- = up
            this.screen.zoom += this.screen.zoom * 10 / 100;
        }
    }

    cameraOn(e) {
        e.preventDefault();
        this.canvas.style.cursor = 'grab';
        this.screen.pastPosition.x = e.offsetX;
        this.screen.pastPosition.y = e.offsetY;
    }

    cameraOff(e) {
        e.preventDefault();
        this.canvas.style.cursor = 'auto';
        this.screen.pastPosition.x = null;
        this.screen.pastPosition.y = null;
    }

    cameraMove(e) {
        e.preventDefault();
        if (this.screen.pastPosition.x !== null && this.screen.pastPosition.y !== null) {
            const distanceX = this.screen.pastPosition.x - e.offsetX;
            const distanceY = this.screen.pastPosition.y - e.offsetY;
            const speed = 0.2;
            this.screen.x += distanceX * speed;
            this.screen.y += distanceY * speed;
        }
    }

    /**
     * animation frame request that throttles to the fpsInterval in the frame cache
     */
    animate() {
        // request new frame as soon as possible
        if (!this.state.pause) {
            window.requestAnimationFrame(this.animate);
        }
        // get now and calculate the time that has passed
        const now = Date.now();
        const elapsed = now - this.frameCache.timeOfLastFrame;
        // if more time has passed than the interval between frames
        if (elapsed > this.frameCache.fpsInterval) {
            // set the time of the last frame as now adjusted to smooth out lag
            this.frameCache.timeOfLastFrame = now - (elapsed % this.frameCache.fpsInterval);
            this.render();
        }
    }

    /**
     * renders a frame
     */
    render() {
        // draw background
        this.ctx.fillStyle = COLOR_BLACK;
        this.ctx.fillRect(0, 0, this.screen.width, this.screen.height);
        // draw borders
        if (this.screen.zoom > 8) {
            this.ctx.strokeStyle = COLOR_GRAY;
            this.ctx.lineWidth = 1;
            this.ctx.lineCap = "round";
            this.ctx.beginPath();
            // draw vertical lines
            let cursor = -1 * Math.abs(this.screen.x % (this.screen.zoom + 1));
            while (cursor + (this.screen.zoom + 1) < this.screen.width) {
                cursor = cursor + (this.screen.zoom + 1);
                this.ctx.moveTo(cursor, 0);
                this.ctx.lineTo(cursor, this.screen.height);
            }
            // draw horizontal lines
            cursor = -1 * Math.abs(this.screen.y % (this.screen.zoom + 1));
            while (cursor + (this.screen.zoom + 1) < this.screen.height) {
                cursor = cursor + (this.screen.zoom + 1);
                this.ctx.moveTo(0, cursor);
                this.ctx.lineTo(this.screen.width, cursor);
            }
            this.ctx.stroke();
        }
        // draw cells
        this.ctx.fillStyle = COLOR_WHITE;
        for (const cell of this.state.cells) {
            this.ctx.fillRect(
                (cell.x + 1) * (this.screen.zoom + 1),
                (cell.y + 1) * (this.screen.zoom + 1), 
                this.screen.zoom, 
                this.screen.zoom
            );
        }
        if (this.screen.pastPosition.x !== null) {
            const radius = 10;
            this.ctx.beginPath();
            this.ctx.arc(this.screen.pastPosition.x, this.screen.pastPosition.y, radius, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'green';
            this.ctx.fill();
        }
        // draw pause text
        if (this.state.pause) {
            const text = 'Paused!';
            const textPixelSize = 30;
            this.ctx.font = `bold ${textPixelSize}px Arial`;
            this.ctx.fillStyle = COLOR_WHITE;
            this.ctx.strokeStyle = COLOR_BLACK;
            const textMetrix = this.ctx.measureText(text);
            this.ctx.fillText(
                text, 
                this.screen.width / 2 - textMetrix.width / 2, 
                this.screen.height / 2 - textPixelSize / 2
            ); 
            this.ctx.strokeText(
                text, 
                this.screen.width / 2 - textMetrix.width / 2, 
                this.screen.height / 2 - textPixelSize / 2
            );
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game(document.querySelector('canvas'));
});