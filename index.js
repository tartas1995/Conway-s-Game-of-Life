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

    pause() {
        this.state.pause = !this.state.pause;
    }

    addEventListeners() {
        window.addEventListener('resize', this.resize);
        document.addEventListener('wheel', this.zoom);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.height = rect.height;
        this.canvas.width = rect.width;
        this.screen.height = this.canvas.clientHeight;
        this.screen.width = this.canvas.clientWidth;
    }

    randomCells() {
        this.state.cells = [];
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * 5);
            const y = Math.floor(Math.random() * 5);
            this.state.cells.push({x,y})
        }
    }

    zoom(e) {
        e.preventDefault();
        // scroll direction 
        // deltaY+ = down
        if (e.deltaY > 0) {
            this.screen.zoom -= this.screen.zoom * 10 / 100;
        } else { // deltaY- = up
            this.screen.zoom += this.screen.zoom * 10 / 100;
        }
    }

    animate() {
        // request new frame as soon as possible
        if (!this.state.pause) window.requestAnimationFrame(this.animate);
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

    render() {
        // draw background
        this.ctx.fillStyle = COLOR_BLACK;
        this.ctx.fillRect(0, 0, this.screen.width, this.screen.height);
        // draw borders
        this.ctx.strokeStyle = COLOR_WHITE;
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = "round";
        let cursor = -1 * Math.abs(this.screen.x % (this.screen.zoom + 1));
        this.ctx.beginPath();
        while (cursor + (this.screen.zoom + 1) < this.screen.width) {
            cursor = cursor + (this.screen.zoom + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(cursor, 0);
            this.ctx.lineTo(cursor, this.screen.height);
            this.ctx.stroke();
        }
        cursor = -1 * Math.abs(this.screen.y % (this.screen.zoom + 1));
        while (cursor + (this.screen.zoom + 1) < this.screen.height) {
            cursor = cursor + (this.screen.zoom + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(0, cursor);
            this.ctx.lineTo(this.screen.width, cursor);
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game(document.querySelector('canvas'));
});