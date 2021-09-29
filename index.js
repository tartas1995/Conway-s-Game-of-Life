const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#FFFFFF';
const COLOR_GRAY = '#808080';

const BORDER_WIDTH = 1;

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
        this.cameraMoveKeyboard = this.cameraMoveKeyboard.bind(this);
        this.keydown = this.keydown.bind(this);
        this.keyup = this.keyup.bind(this);
        this.keypress = this.keypress.bind(this);
        this.randomCells = this.randomCells.bind(this);
        this.pause = this.pause.bind(this);
        this.animate = this.animate.bind(this);
        this.addEventListeners = this.addEventListeners.bind(this);
        this.convertBetweenGameCordAndGS = this.convertBetweenGameCordAndGS.bind(this);
        this.convertBetweenGSAndScreen = this.convertBetweenGSAndScreen.bind(this);
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
            grabPosition: {x:null, y:null},
        };
        // cache to store game related data
        this.state = {
            cells:[{x:1,y:1},{x:0,y:0}],
            pause: false,
        };
        //this.randomCells();
        this.resize();
        // init Event listeners
        this.addEventListeners();
        // start the animation motor
        window.requestAnimationFrame(this.animate);
        //this.pause();
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
        document.addEventListener('keydown', this.keydown);
        document.addEventListener('keyup', this.keyup);
        document.addEventListener('keypress', this.keypress);
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
        if (this.state.pause) return;
        this.canvas.style.cursor = 'grab';
        this.screen.grabPosition.x = e.offsetX;
        this.screen.grabPosition.y = e.offsetY;
    }

    cameraOff(e) {
        e.preventDefault();
        if (this.state.pause) return;
        this.canvas.style.cursor = 'auto';
        this.screen.grabPosition.x = null;
        this.screen.grabPosition.y = null;
    }

    cameraMove(e) {
        e.preventDefault();
        if (this.state.pause) return;
        if (this.screen.grabPosition.x !== null && this.screen.grabPosition.y !== null) {
            const distanceX = this.screen.grabPosition.x - e.offsetX;
            const distanceY = this.screen.grabPosition.y - e.offsetY;
            this.screen.x += distanceX;
            this.screen.y += distanceY;
            this.screen.grabPosition.x = e.offsetX;
            this.screen.grabPosition.y = e.offsetY;
        }
    }

    cameraMoveKeyboard(key, type) {
        if (!this.state.pause && type === 'down') {
            switch (key) {
                case 'w':
                case 'ArrowUp':
                    this.screen.y += -10
                    break;
                case 'd':
                case 'ArrowRight':
                    this.screen.x += 10
                    break;
                case 'a':
                case 'ArrowLeft':
                    this.screen.x += -10
                    break;
                case 's':
                case 'ArrowDown':
                    this.screen.y += 10
                    break;
            }
        }
    }

    keydown(e) {
        if ((e.key === 'r' || e.key === 'F5') && e.ctrlKey) return;
        e.preventDefault();
        this.cameraMoveKeyboard(e.key,'down');
        if (e.key === "p") {
            this.pause();
        }
    }

    keyup(e) {
        e.preventDefault();
        this.cameraMoveKeyboard(e.key,'up');
    }

    keypress(e) {
        e.preventDefault();
        this.cameraMoveKeyboard(e.key,'press');
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

    convertBetweenGameCordAndGS(cord, to) {
        if (to == 'GS') {
            return { x: cord.x * (this.screen.zoom+BORDER_WIDTH), y: cord.y * (this.screen.zoom+BORDER_WIDTH) }
        } else {
            return { x: cord.x / (this.screen.zoom+BORDER_WIDTH), y: cord.y / (this.screen.zoom+BORDER_WIDTH) }
        }
    }

    convertBetweenGSAndScreen(cord, to) {
        if (to == 'GS') {
            return { x: cord.x - this.screen.x, y: cord.y - this.screen.y }
        } else {
            return { x: cord.x + this.screen.x, y: cord.y + this.screen.y }
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
            this.ctx.lineWidth = BORDER_WIDTH;
            this.ctx.lineCap = "round";
            this.ctx.beginPath();
            // draw vertical lines
            const screenStartInGS = this.convertBetweenGSAndScreen({x:0,y:0}, 'GS');
            let cursor = (screenStartInGS.x % (this.screen.zoom + BORDER_WIDTH)) - (this.screen.zoom + BORDER_WIDTH);
            while (cursor + (this.screen.zoom + BORDER_WIDTH) < this.screen.width) {
                cursor = cursor + (this.screen.zoom + BORDER_WIDTH);
                this.ctx.moveTo(cursor, 0);
                this.ctx.lineTo(cursor, this.screen.height);
            }
            // draw horizontal lines
            cursor = (screenStartInGS.y % (this.screen.zoom + BORDER_WIDTH)) - (this.screen.zoom + BORDER_WIDTH);
            while (cursor + (this.screen.zoom + BORDER_WIDTH) < this.screen.height) {
                cursor = cursor + (this.screen.zoom + BORDER_WIDTH);
                this.ctx.moveTo(0, cursor);
                this.ctx.lineTo(this.screen.width, cursor);
            }
            this.ctx.stroke();
        }
        // draw cells
        this.ctx.fillStyle = COLOR_WHITE;
        const renderBorderThreshold = (-1 * (this.screen.zoom + BORDER_WIDTH));
        for (const cell of this.state.cells) {
            const gscord = this.convertBetweenGameCordAndGS(cell, 'GS');
            const cord = this.convertBetweenGSAndScreen(gscord,'screen');
            //console.log(cell, gscord, cord)
            if (cord.x < renderBorderThreshold) continue;
            if (cord.y < renderBorderThreshold) continue;
            if (cord.x > this.screen.width) continue;
            if (cord.y > this.screen.height) continue;
            this.ctx.fillRect(
                cord.x,
                cord.x, 
                this.screen.zoom, 
                this.screen.zoom
            );
        }
        if (this.screen.grabPosition.x !== null) {
            const radius = 10;
            this.ctx.beginPath();
            this.ctx.arc(this.screen.grabPosition.x, this.screen.grabPosition.y, radius, 0, 2 * Math.PI, false);
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