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
        // screen
        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        this.zoom = this.zoom.bind(this);
        // camera
        this.cameraOn = this.cameraOn.bind(this);
        this.cameraOff = this.cameraOff.bind(this);
        this.cameraMove = this.cameraMove.bind(this);
        this.cameraMoveKeyboard = this.cameraMoveKeyboard.bind(this);
        // cells
        this.randomCells = this.randomCells.bind(this);
        this.selectCell = this.selectCell.bind(this);
        this.releaseCell = this.releaseCell.bind(this);
        this.toggleCell = this.toggleCell.bind(this);
        // event
        this.keydown = this.keydown.bind(this);
        this.keyup = this.keyup.bind(this);
        this.keypress = this.keypress.bind(this);
        this.mousedown = this.mousedown.bind(this);
        this.mouseup = this.mouseup.bind(this);
        this.mousemove = this.mousemove.bind(this);
        this.addEventListeners = this.addEventListeners.bind(this);
        this.keyRegisterAction = this.keyRegisterAction.bind(this);
        // general
        this.startGameClock = this.startGameClock.bind(this);
        this.stopGameClock = this.stopGameClock.bind(this);
        this.gameClock = this.gameClock.bind(this);
        this.pause = this.pause.bind(this);
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
            selectedCell: null,
            ms: 1000,
            gameInterval: null,
            pause: false,
            keyPressed: {},
        };
        //this.randomCells();
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
        if (!this.state.pause) {
            window.requestAnimationFrame(this.animate);
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

    cameraMoveKeyboard() {
        if (!this.state.pause) {
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
        if ((e.key === 'r' || e.key === 'F5') && e.ctrlKey) return;
        e.preventDefault();
        switch (e.key) {
            case 'p':
                this.pause();
                break;
            case ' ': //space
                this.startGameClock();
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
        if (!this.state.pause) {
            this.cameraOn(e);
            this.selectCell(e);
        }
    }

    mouseup(e) {
        if (!this.state.pause) {
            this.cameraOff(e);
            this.releaseCell(e);
        }
    }

    mousemove(e) {
        this.cameraMove(e);
    }

    selectCell(e) {
        const gscord = this.convertBetweenGSAndScreen({ x:e.offsetX, y:e.offsetY }, 'GS');
        const gamecord = this.convertBetweenGameCordAndGS(gscord, 'game');
        this.state.selectedCell = gamecord;
        setTimeout(() => {
            this.state.selectedCell = null;
        }, 200);
    }

    releaseCell(e) {
        if (this.state.selectedCell !== null) {
            const gscord = this.convertBetweenGSAndScreen({ x:e.offsetX, y:e.offsetY }, 'GS');
            const gamecord = this.convertBetweenGameCordAndGS(gscord, 'game');
            if (gamecord.x === this.state.selectedCell.x && gamecord.y === this.state.selectedCell.y) {
                this.toggleCell(gamecord);
            }
        }
    }

    toggleCell(cord) {
        let index = this.state.cells.findIndex(function(cell) {
            return cell.x == this.x && cell.y == this.y;
        }, cord);
        if (index === -1) {
            this.state.cells.push(cord);
        } else {
            this.state.cells.splice(index, 1);
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

    startGameClock() {
        // this.state.gameInterval = setInterval(this.gameClock, this.state.ms)
    }

    stopGameClock() {
        clearInterval(this.state.gameInterval);
        this.state.gameInterval = null;
    }

    gameClock() {
        /**
         * if cell has 3 living neighbor, it will be born
         * if cell has less than 2 neighbor, it will die
         * if cell has 2 or 3 living neighbor, it will contuine to live
         * if cell has more than 3 living neighbor, it will be die
         */
        // get neighbors and cells
        const board = {};
        for (let cell of this.state.cells) {
            if (!!board[cell.y]) board[cell.y] = {};
            // top row
            if (!board[cell.y - 1]) board[cell.y - 1] = {};
            if (!board[cell.y - 1][cell.x - 1]) board[cell.y - 1][cell.x - 1] = false;
            if (!board[cell.y - 1][cell.x]) board[cell.y - 1][cell.x] = false;
            if (!board[cell.y - 1][cell.x + 1]) board[cell.y - 1][cell.x + 1] = false;
            // middle row
            if (!board[cell.y]) board[cell.y] = {};
            if (!board[cell.y][cell.x - 1]) board[cell.y][cell.x - 1] = false;
            board[cell.y][cell.x] = true;
            if (!board[cell.y][cell.x + 1]) board[cell.y][cell.x + 1] = false;
            // bottom row
            if (!board[cell.y + 1]) board[cell.y + 1] = {};
            if (!board[cell.y + 1][cell.x - 1]) board[cell.y + 1][cell.x - 1] = false;
            if (!board[cell.y + 1][cell.x]) board[cell.y + 1][cell.x] = false;
            if (!board[cell.y + 1][cell.x + 1]) board[cell.y + 1][cell.x + 1] = false;
        }
        console.log(board)
        const cells = [];
        // check living condition of "cells"
        for (let i in board) {
            const row = board[i];
            for (let j in row) {
                const cell = row[j];
                if (cell) { //if a living
                    let numberOfNeighbor = 0;
                    // top row
                    if (!!board[i - 1]) {
                        if (board[i - 1][j - 1]) numberOfNeighbor++;
                        if (board[i - 1][j]) numberOfNeighbor++;
                        if (board[i - 1][j + 1]) numberOfNeighbor++;
                    }
                    // middle row
                    if (board[i][j - 1]) numberOfNeighbor++;
                    if (board[i][j + 1]) numberOfNeighbor++;
                    // bottom row
                    if (!!board[i + 1]) {
                        if (board[i + 1][j - 1]) numberOfNeighbor++;
                        if (board[i + 1][j]) numberOfNeighbor++;
                        if (board[i + 1][j + 1]) numberOfNeighbor++;
                    }
                    console.log(i, j, numberOfNeighbor , 'l', numberOfNeighbor > 1 && numberOfNeighbor < 4);
                    if (numberOfNeighbor > 1 && numberOfNeighbor < 4) cells.push({x: j, y: i});
                } else {
                    let numberOfNeighbor = 0;
                    // top row
                    if (!!board[i - 1]) {
                        if (board[i - 1][j - 1]) numberOfNeighbor++;
                        if (board[i - 1][j]) numberOfNeighbor++;
                        if (board[i - 1][j + 1]) numberOfNeighbor++;
                    }
                    // middle row
                    if (board[i][j - 1]) numberOfNeighbor++;
                    if (board[i][j + 1]) numberOfNeighbor++;
                    // bottom row
                    if (!!board[i + 1]) {
                        if (board[i + 1][j - 1]) numberOfNeighbor++;
                        if (board[i + 1][j]) numberOfNeighbor++;
                        if (board[i + 1][j + 1]) numberOfNeighbor++;
                    }
                    console.log(i, j, numberOfNeighbor , 'd', numberOfNeighbor === 3);
                    if (numberOfNeighbor === 3) cells.push({x: j, y: i});
                }
            }
        }
        this.state.cells = cells;
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
        const screenStartInGS = this.convertBetweenGSAndScreen({x:0,y:0}, 'GS');
        console.log(screenStartInGS)
        console.log((screenStartInGS.x % (this.screen.zoom + BORDER_WIDTH)))
        let cursor = (screenStartInGS.x % (this.screen.zoom + BORDER_WIDTH)) + (this.screen.zoom + BORDER_WIDTH);
        console.log(cursor)
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