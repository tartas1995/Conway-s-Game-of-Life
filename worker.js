const WORKER_READY = 'worker ready';
const CELL_UPDATE = 'cell update';
const CELLS_UPDATED = 'cells updated';
const GAME_START = 'game start';
const GAME_END = 'game end';
const MS_CHANGED = 'ms changed';

class Game {
    constructor(refSelf) {
        this.listener = this.listener.bind(this);
        this.gameStart = this.gameStart.bind(this);
        this.gameEnd = this.gameEnd.bind(this);
        this.gameClock = this.gameClock.bind(this);
        this.cellUpdated = this.cellUpdated.bind(this);
        this.msChanged = this.msChanged.bind(this);
        this.state = {
            cells:[
                {x:0,y:0},{x:1,y:0},{x:2,y:0},
                {x:0,y:1},{x:2,y:1},
                {x:0,y:2},{x:2,y:2},
                {x:0,y:4},{x:2,y:4},
                {x:0,y:5},{x:2,y:5},
                {x:0,y:6},{x:1,y:6},{x:2,y:6},
            ],
            ms: 500,
            gameInterval: null,
        };
        refSelf.onmessage = this.listener;
        this.refSelf = refSelf;
        this.refSelf.postMessage({ name:WORKER_READY, cells:this.state.cells });
    }

    gameStart() {
        this.state.gameInterval = setInterval(this.gameClock, this.state.ms)
    }

    gameEnd() {
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
        const cells = [];
        // check living condition of "cells"
        for (let i in board) {
            const row = board[i];
            let ii = parseInt(i);
            for (let j in row) {
                const cell = row[j];
                let jj = parseInt(j);
                if (cell) { //if a living
                    let numberOfNeighbor = 0;
                    // top row
                    if (!!board[ii - 1]) {
                        if (!!board[ii - 1][jj - 1]) numberOfNeighbor++;
                        if (!!board[ii - 1][jj]) numberOfNeighbor++;
                        if (!!board[ii - 1][jj + 1]) numberOfNeighbor++;
                    }
                    // middle row
                    if (board[ii][jj - 1]) numberOfNeighbor++;
                    if (board[ii][jj + 1]) numberOfNeighbor++;
                    // bottom row
                    if (!!board[ii + 1]) {
                        if (board[ii + 1][jj - 1]) numberOfNeighbor++;
                        if (board[ii + 1][jj]) numberOfNeighbor++;
                        if (board[ii + 1][jj + 1]) numberOfNeighbor++;
                    }
                    if (numberOfNeighbor > 1 && numberOfNeighbor < 4) cells.push({x: jj, y: ii});
                } else {
                    let numberOfNeighbor = 0;
                    // top row
                    if (!!board[ii - 1]) {
                        if (board[ii - 1][jj - 1]) numberOfNeighbor++;
                        if (board[ii - 1][jj]) numberOfNeighbor++;
                        if (board[ii - 1][jj + 1]) numberOfNeighbor++;
                    }
                    // middle row
                    if (board[ii][jj - 1]) numberOfNeighbor++;
                    if (board[ii][jj + 1]) numberOfNeighbor++;
                    // bottom row
                    if (!!board[ii + 1]) {
                        if (board[ii + 1][jj - 1]) numberOfNeighbor++;
                        if (board[ii + 1][jj]) numberOfNeighbor++;
                        if (board[ii + 1][jj + 1]) numberOfNeighbor++;
                    }
                    //console.log(i, j, numberOfNeighbor , 'd', numberOfNeighbor === 3);
                    if (numberOfNeighbor === 3) cells.push({x: jj, y: ii});
                }
            }
        }
        this.state.cells = cells;
        this.refSelf.postMessage({
            name: CELLS_UPDATED,
            cells: cells,
        });
    }

    cellUpdated(cord) {
        let index = this.state.cells.findIndex(function(cell) {
            return cell.x == this.x && cell.y == this.y;
        }, cord);
        if (index === -1) {
            this.state.cells.push(cord);
        } else {
            this.state.cells.splice(index, 1);
        }
        this.refSelf.postMessage({
            name: CELLS_UPDATED,
            cells: this.state.cells,
        })
    }

    msChanged(ms) {
        if (this.state.ms !== ms) {
            this.state.ms = ms;
            if (this.state.gameInterval !== null) {
                this.gameEnd()
                this.gameStart()
            }
        }
    }

    // handle worker messages
    listener(e) {
        if (!e.data.name) {
            console.log('missing name in message');
            return;
        }
        switch(e.data.name) {
            case GAME_START:
                this.gameStart();
                break;
            case GAME_END:
                this.gameEnd();
                break;
            case CELL_UPDATE:
                this.cellUpdated(e.data.cord);
                break;
            case MS_CHANGED:
                this.msChanged(e.data.ms);
                break;
            default:
                console.log('unknown message type', e.data);
                break;
        }
    }
}

const game = new Game(self);