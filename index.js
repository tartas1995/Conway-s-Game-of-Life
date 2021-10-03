const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#FFFFFF';
const COLOR_GRAY = '#808080';
const COLOR_BLUE = '#009DFF';

const BORDER_WIDTH = 1;

const WORKER_READY = 'worker ready';
const CELL_UPDATE = 'cell update';
const CELLS_UPDATED = 'cells updated';
const GAME_START = 'game start';
const GAME_END = 'game end';
const MS_CHANGED = 'ms changed';

/**
 * TODO: center focus point(zoom into center)
 * TODO: disable border when zoom too small
 * TODO: move camera
 * TODO: add game
 */

class Game {
    constructor(canvas) {
        // screen
        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        this.calculateIconRegister = this.calculateIconRegister.bind(this);
        this.zoom = this.zoom.bind(this);
        // camera
        this.cameraOn = this.cameraOn.bind(this);
        this.cameraOff = this.cameraOff.bind(this);
        this.cameraMove = this.cameraMove.bind(this);
        this.cameraMoveKeyboard = this.cameraMoveKeyboard.bind(this);
        // cells
        this.selectCell = this.selectCell.bind(this);
        this.releaseCell = this.releaseCell.bind(this);
        this.toggleCell = this.toggleCell.bind(this);
        // event
        // keyboad event
        this.keydown = this.keydown.bind(this);
        this.keyup = this.keyup.bind(this);
        this.keypress = this.keypress.bind(this);
        // mouse event
        this.mousedown = this.mousedown.bind(this);
        this.mouseup = this.mouseup.bind(this);
        this.mousemove = this.mousemove.bind(this);
        // touch event
        this.touchstart = this.touchstart.bind(this);
        // general event
        this.addEventListeners = this.addEventListeners.bind(this);
        this.keyRegisterAction = this.keyRegisterAction.bind(this);
        this.workerListener = this.workerListener.bind(this);
        this.checkIconRegisterForEvents = this.checkIconRegisterForEvents.bind(this);
        // general
        this.startGameClock = this.startGameClock.bind(this);
        this.stopGameClock = this.stopGameClock.bind(this);
        this.pause = this.pause.bind(this);
        this.freeze = this.freeze.bind(this);
        this.animate = this.animate.bind(this);
        this.convertBetweenGameCordAndGS = this.convertBetweenGameCordAndGS.bind(this);
        this.convertBetweenGSAndScreen = this.convertBetweenGSAndScreen.bind(this);
        this.printDebug = this.printDebug.bind(this);
        // assignment
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        // cache to store framerate related data
        this.frameCache = {
            fpsInterval: 1000 / 60, // fps / 1 second
            timeOfLastFrame: 0,
        };
        this.iconRegister = {
            playButton: {
                x: 0,
                y: 0,
                size: 0,
                hoverText: "Play/Pause (SPACE)",
                action: this.pause,
            }
        }
        // cache to store screen related data
        this.screen = {
            height: this.canvas.clientHeight,
            width: this.canvas.clientWidth,
            x: 0,
            y: 0,
            zoom: 100,
            grabPosition: {x:null, y:null},
            hover: {
                text: null,
                x: null,
                y: null,
            }
        };
        // cache to store game related data
        this.state = {
            cells: null,
            selectedCell: null,
            pause: true,
            freezed: false,
            keyPressed: {},
        };
        this.resize();
        // worker
        this.worker = new Worker('./worker.js');
        this.worker.onmessage = this.workerListener;
        // init Event listeners
        this.addEventListeners();
    }

    workerListener(e) {
        if (!e.data.name) console.log('missing name in message', e.data);
        switch(e.data.name) {
            case WORKER_READY:
                this.state.cells = e.data.cells;
                window.requestAnimationFrame(this.animate);
            case CELLS_UPDATED:
                this.state.cells = e.data.cells;
                break;
            default:
                console.log('unknown message type', e.data);
                break;
        }
    }

    updateMS(ms) {
        this.worker.postMessage({
            name: MS_CHANGED,
            ms: ms,
        })
    }

    calculateIconRegister() {
        this.iconRegister.playButton.size = this.screen.width / 20;
        this.iconRegister.playButton.x = this.screen.width / 100;
        this.iconRegister.playButton.y = this.screen.height - (this.screen.width / 100) - (this.screen.width / 20);
    }

    checkIconRegisterForEvents(mouseX, mouseY) {
        for (let key in this.iconRegister) {
            const icon = this.iconRegister[key];
            if (icon.x < mouseX && (icon.x + icon.size) > mouseX
            &&  icon.y < mouseY && (icon.y + icon.size) > mouseY) {
                icon.action();
                return true;
            }
        }
        return false;
    }

    checkIconRegisterForHover(mouseX, mouseY) {
        for (let key in this.iconRegister) {
            const icon = this.iconRegister[key];
            if (icon.x < mouseX && (icon.x + icon.size) > mouseX
            &&  icon.y < mouseY && (icon.y + icon.size) > mouseY) {
                this.screen.hover.text = icon.hoverText;
                this.screen.hover.x = mouseX;
                this.screen.hover.y = mouseY;
                return;
            }
        }
        this.screen.hover.text = null;
        this.screen.hover.x = null;
        this.screen.hover.y = null;
        return false;
    }

    freeze() {
        this.state.freezed = !this.state.freezed;
        if (this.state.freezed) {
            this.state.pause = true;
            this.stopGameClock();
        } else {
            window.requestAnimationFrame(this.animate);
        }
    }

    /**
     * toggles the pause status of the game
     */
    pause() {
        this.state.pause = !this.state.pause;
        if (!this.state.pause) {
            this.startGameClock();
        } else {
            this.stopGameClock();
        }
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
        this.canvas.addEventListener('mousedown', this.mousedown);
        this.canvas.addEventListener('mouseup', this.mouseup);
        this.canvas.addEventListener('mousemove', this.mousemove);
        //this.canvas.addEventListener('touchstart', this.touchstart);
        /*this.canvas.addEventListener('touchend', this.mouseup);
        this.canvas.addEventListener('touchcancel', this.mouseup);
        this.canvas.addEventListener('touchmove', this.mousemove);*/
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
        this.calculateIconRegister();
    }

    /**
     * handles Wheel Events
     * @param {WheelEvent} e 
     */
    zoom(e) {
        e.preventDefault();
        // disable zoom when paused
        if (this.state.freezed) return false;
        // scroll direction 
        if (e.deltaY > 0) { // deltaY+ = down
            this.screen.zoom -= this.screen.zoom * 10 / 100;
        } else { // deltaY- = up
            this.screen.zoom += this.screen.zoom * 10 / 100;
        }
    }

    cameraOn(e) {
        e.preventDefault();
        if (this.state.freezed) return;
        if (e.button !== 0) return; // only when main button pressed
        this.canvas.style.cursor = 'grab';
        this.screen.grabPosition.x = e.offsetX;
        this.screen.grabPosition.y = e.offsetY;
    }

    cameraOff(e) {
        e.preventDefault();
        if (this.state.freezed) return;
        if (e.button !== 0) return; // only when main button pressed
        this.canvas.style.cursor = 'auto';
        this.screen.grabPosition.x = null;
        this.screen.grabPosition.y = null;
    }

    cameraMove(e) {
        e.preventDefault();
        if (this.state.freezed) return;
        if (this.screen.grabPosition.x !== null && this.screen.grabPosition.y !== null) {
            const distanceX = this.screen.grabPosition.x - e.offsetX;
            const distanceY = this.screen.grabPosition.y - e.offsetY;
            this.screen.x += distanceX;
            this.screen.y += distanceY;
            this.screen.grabPosition.x = e.offsetX;
            this.screen.grabPosition.y = e.offsetY;
        }
    }

    cameraMoveKeyboard() {
        if (!this.state.freezed) {
            if (this.state.keyPressed['w'] || this.state.keyPressed['ArrowUp']){
                this.screen.y += -10;
            }
            if (this.state.keyPressed['d'] || this.state.keyPressed['ArrowRight']){
                this.screen.x += 10
            }
            if (this.state.keyPressed['a'] || this.state.keyPressed['ArrowLeft']){
                this.screen.x += -10
            }
            if (this.state.keyPressed['s'] || this.state.keyPressed['ArrowDown']){
                this.screen.y += 10
            }
        }
    }

    keyRegisterAction() {
        this.cameraMoveKeyboard();
    }

    keydown(e) {
        // windows
        if (e.key === 'F5') return;
        // linux
        if (e.key === 'r' && e.ctrlKey) return;
        // macos
        if (e.key === 'r' && e.metaKey) return;
        e.preventDefault();
        switch (e.key) {
            case 'f':
                this.freeze();
                break;
            case 'p':
            case ' ': //space
                this.pause();
                break;
        }
        this.state.keyPressed[e.key] = true;
        this.keyRegisterAction();
    }

    keyup(e) {
        e.preventDefault();
        this.state.keyPressed[e.key] = false;
    }

    keypress(e) {
        e.preventDefault();
    }

    mousedown(e) {
        if (!this.state.freezed) {
            if (this.checkIconRegisterForEvents(e.offsetX, e.offsetY)) {
                return;
            }
            this.cameraOn(e);
            this.selectCell(e);
        }
    }

    mouseup(e) {
        if (!this.state.freezed) {
            this.cameraOff(e);
            this.releaseCell(e);
        }
    }

    mousemove(e) {
        this.cameraMove(e);
        this.checkIconRegisterForHover(e.offsetX, e.offsetY);
    }

    touchstart(e) {
        console.log(e);
    }

    selectCell(e) {
        if (e.button !== 0) return; // only when main button pressed
        const gscord = this.convertBetweenGSAndScreen({ x:e.offsetX, y:e.offsetY }, 'GS');
        const gamecord = this.convertBetweenGameCordAndGS(gscord, 'game');
        this.state.selectedCell = gamecord;
        setTimeout(() => {
            this.state.selectedCell = null;
        }, 200);
    }

    releaseCell(e) {
        if (e.button !== 0) return; // only when main button pressed
        if (this.state.selectedCell !== null) {
            const gscord = this.convertBetweenGSAndScreen({ x:e.offsetX, y:e.offsetY }, 'GS');
            const gamecord = this.convertBetweenGameCordAndGS(gscord, 'game');
            if (gamecord.x === this.state.selectedCell.x && gamecord.y === this.state.selectedCell.y) {
                this.toggleCell(gamecord);
            }
        }
    }

    toggleCell(cord) {
        this.worker.postMessage({
            name: CELL_UPDATE,
            cord: cord,
        })
    }

    /**
     * animation frame request that throttles to the fpsInterval in the frame cache
     */
    animate() {
        // request new frame as soon as possible
        if (!this.state.freezed) {
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

    startGameClock() {
        this.worker.postMessage({ name: GAME_START });
    }

    stopGameClock() {
        this.worker.postMessage({ name: GAME_END });
    }

    convertBetweenGameCordAndGS(cord, to) {
        if (to == 'GS') {
            return { x: cord.x * (this.screen.zoom+BORDER_WIDTH), y: cord.y * (this.screen.zoom+BORDER_WIDTH) }
        } else {
            return { x: Math.floor(cord.x / (this.screen.zoom+BORDER_WIDTH)), y: Math.floor(cord.y / (this.screen.zoom+BORDER_WIDTH)) }
        }
    }

    convertBetweenGSAndScreen(cord, to) {
        if (to == 'GS') {
            return { x: cord.x + this.screen.x, y: cord.y + this.screen.y }
        } else {
            return { x: cord.x - this.screen.x, y: cord.y - this.screen.y }
        }
    }

    printDebug() {
        //debug
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
            let cursor = ((screenStartInGS.x % (this.screen.zoom + BORDER_WIDTH)) * -1);
            while (cursor < this.screen.width) {
                this.ctx.moveTo(cursor, 0);
                this.ctx.lineTo(cursor, this.screen.height);
                cursor = cursor + (this.screen.zoom + BORDER_WIDTH);
            }
            // draw horizontal lines
            cursor = ((screenStartInGS.y % (this.screen.zoom + BORDER_WIDTH)) * -1);
            while (cursor < this.screen.height) {
                this.ctx.moveTo(0, cursor);
                this.ctx.lineTo(this.screen.width, cursor);
                cursor = cursor + (this.screen.zoom + BORDER_WIDTH);
            }
            this.ctx.stroke();
        }
        // draw cells
        this.ctx.fillStyle = COLOR_WHITE;
        const renderBorderThreshold = (-1 * (this.screen.zoom + BORDER_WIDTH));
        for (const cell of this.state.cells) {
            const gscord = this.convertBetweenGameCordAndGS(cell, 'GS');
            const cord = this.convertBetweenGSAndScreen(gscord,'screen');
            if (cord.x < renderBorderThreshold) continue;
            if (cord.y < renderBorderThreshold) continue;
            if (cord.x > this.screen.width) continue;
            if (cord.y > this.screen.height) continue;
            this.ctx.fillRect(
                cord.x,
                cord.y, 
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
        // draw freezed text
        if (this.state.freezed) {
            const text = 'freezed!';
            const textPixelSize = 30;
            this.ctx.font = `bold ${textPixelSize}px Arial`;
            this.ctx.lineWidth = BORDER_WIDTH;
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
        // playButton
        if (this.state.pause) {
            const x = this.iconRegister.playButton.x;
            const y = this.iconRegister.playButton.y;
            const size = this.iconRegister.playButton.size;
            this.ctx.fillStyle = COLOR_WHITE;
            this.ctx.strokeStyle = COLOR_BLUE;
            this.ctx.lineWidth = size / 20;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + size);
            this.ctx.lineTo(x + size, y + (size / 2));
            this.ctx.lineTo(x, y);
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            const x = this.iconRegister.playButton.x;
            const y = this.iconRegister.playButton.y;
            const size = this.iconRegister.playButton.size;
            const width = size / 3;
            this.ctx.fillStyle = COLOR_WHITE;
            this.ctx.strokeStyle = COLOR_BLUE;
            this.ctx.lineWidth = size / 20;
            this.ctx.beginPath();
            // first element
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + size);
            this.ctx.lineTo(x + width, y + size);
            this.ctx.lineTo(x + width, y);
            this.ctx.lineTo(x, y);
            // second element
            this.ctx.moveTo(x + (width * 2), y);
            this.ctx.lineTo(x + (width * 2), y + size);
            this.ctx.lineTo(x + (width * 3), y + size);
            this.ctx.lineTo(x + (width * 3), y);
            this.ctx.lineTo(x + (width * 2), y);
            this.ctx.fill();
            this.ctx.stroke();
        }
        // hover text for icon
        if (this.screen.hover.x !== null) {
            const textPixelSize = 20;
            this.ctx.font = `bold ${textPixelSize}px Arial`;
            this.ctx.lineWidth = BORDER_WIDTH;
            this.ctx.fillStyle = COLOR_WHITE;
            this.ctx.strokeStyle = COLOR_BLACK;
            this.ctx.fillText(
                this.screen.hover.text, 
                this.screen.hover.x, 
                this.screen.hover.y
            ); 
            this.ctx.strokeText(
                this.screen.hover.text, 
                this.screen.hover.x, 
                this.screen.hover.y
            );
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game(document.querySelector('canvas'));
});