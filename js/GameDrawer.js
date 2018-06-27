
const MARGIN = 20;

const COLOR_MAP = {
  A: 'rgba(233, 30, 99, 1)', B: 'rgba(33, 150, 243, 1)', C: 'rgba(156, 39, 176, 1)',
  D: 'rgba(103, 58, 183, 1)', E: 'rgba(63, 81, 181, 1)', F: 'rgba(3, 169, 244, 1)',
  G: 'rgba(57, 193, 11, 1)', H: 'rgba(0, 150, 136, 1)', I: 'rgba(76, 175, 80, 1)',
  J: 'rgba(0, 188, 212, 1)', K: 'rgba(139, 195, 74, 1)', L: 'rgba(205, 220, 57, 1)',
  M: 'rgba(255, 235, 59, 1)', N: 'rgba(255, 193, 7, 1)', O: 'rgba(255, 152, 0, 1)',
  P: 'rgba(255, 87, 34, 1)', Q: 'rgba(121, 85, 72, 1)', R: 'rgba(244, 67, 54, 1)',
  S: 'rgba(102, 0, 51, 1)', T: 'rgba(0, 51, 102, 1)', U: 'rgba(102, 153, 0, 1)'
};

const STEP_LENGTH = 150;

/**
 * Draws a game state
 */
class GameDrawer {
  /**
   * Create a new GameDrawer
   * @param {HTMLElement} canvas the canvas to draw the game state on
   * @param {number} x the x coordinate of the top left corner of the (visible) game board
   * @param {number} y the y coordinate of the top left corner of the (visible) game board
   * @param {number} width the width of the (visible) game board
   * @param {number} height the height of the (visible) game board
   * @param {GameState} gameState the game state
   */
  constructor(canvas, x, y, width, height, gameState) {
    this.draw = this.draw.bind(this);
    this.click = this.click.bind(this);
    this._canvas = canvas;
    this._context = this._canvas.getContext('2d');
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._state = gameState;
    this._newState = null;
    this._aniArray = null;
    this._aniEnd = 0; // 1: animate game won, -2: animate game lost, -1: animate game lost (endless loop)
    this._aniSnakeMoveInd = -1; // index of the snake that moved
    this._aniAteFruit = false; // whether the moving snake ate a fruit
    this._aniLength = 0; // the length of the animation (in time steps)
    this._aniStartTime = 0;
    this._boardWidth = this._state.width;
    this._boardHeight = this._state.height;
    this._animationRunning = false;
    const stClone = this._state.clone();
    this._snakeQueues = stClone.snakes;
    this._blockQueues = stClone.blocks;
    this._clickListeners = [];
    this._canvas.addEventListener('click', this.click);
  }

  tryMove(snake, direction) {
    if (!this._animationRunning) {
      const moveRes = gameTransition(this._state, snake, direction);
      if (moveRes !== null) {
        this._aniSnakeMoveInd = this._state.snakeMap.get(snake);
        this._aniAteFruit = moveRes[0];
        const cp = this._snakeQueues[this._aniSnakeMoveInd].getFront();
        this._snakeQueues[this._aniSnakeMoveInd].pushFront([cp[0] + direction[0], cp[1] + direction[1]]);
        this._aniEnd = moveRes[1];
        if (this._aniEnd < 0) console.log('Lost!');
        else if (this._aniEnd > 0) console.log('Won!');
        this._aniArray = convertToFullArray(moveRes[2], this._state.snakes.length);
        this._newState = moveRes[3];
        this._aniLength = this._aniArray.length - 1;
        this._animationRunning = true;
        this._aniStartTime = (new Date()).getTime();
        // /**/ this._state = this._newState;
        this.draw();
        return this._newState;
      }
    }
    return this._state;
  }

  addEventListener(type, listener) {
    if (type === 'click') {
      this._clickListeners.push(listener);
    }
  }

  click(event) {
    if (!this._animationRunning) {
      let [xp, yp] = [event.clientX, event.clientY];
      const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();
      xp -= this._x + ax; yp -= this._y + ay;
      if (xp >= 0 && yp >= 0 && xp < w && yp < h) {
        const [xb, yb] = [Math.floor(xp / bSize), Math.floor(yp / bSize)];
        for (let i=0; i<this._clickListeners.length; i++) {
          this._clickListeners[i](xb, yb);
        }
      }
    }
  }

  resize(x, y, width, height) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this.draw();
  }

  getDimVars() {
    const [x, y, width, height, bWidth, bHeight] = [this._x, this._y, this._width,
      this._height, this._boardWidth, this._boardHeight];
    
    let w, h;
    if (bWidth / bHeight > (width - 2 * MARGIN) / (height - 2 * MARGIN)) {
      w = width - 2 * MARGIN;
      h = w * (bHeight / bWidth);
    } else {
      h = height - 2 * MARGIN;
      w = h * (bWidth / bHeight);
    }
    const ax = x + width / 2 - w / 2;
    const ay = y + height / 2 - h / 2;
    const bSize = w / bWidth;
    const bCoord = (bx, by) => {
      return [ax + bSize / 2 + bx * bSize, ay + bSize / 2 + by * bSize];
    };

    return [w, h, ax, ay, bSize, bCoord];
  }

  draw() {
    const [con, x, y, width, height, bWidth, bHeight] = [this._context, this._x, this._y, this._width,
      this._height, this._boardWidth, this._boardHeight];
    let state = this._state;
    const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();

    const snakeOffsets = []; for (let i=0; i<state.snakes.length; i++) snakeOffsets.push([0, 0]);
    const blockOffsets = []; for (let i=0; i<state.blocks.length; i++) blockOffsets.push([0, 0]);
    let cStep, cStepT;
    if (this._animationRunning) {
      const timePassed = (new Date()).getTime() - this._aniStartTime;
      if (timePassed >= STEP_LENGTH * this._aniLength) {
        this._animationRunning = false;
        this._state = this._newState; state = this._state;
        const stClone = this._state.clone();
        this._snakeQueues = stClone.snakes;
        this._blockQueues = stClone.blocks;
      } else {
        const [snakes, blocks] = [this._snakeQueues, this._blockQueues];
        cStep = Math.floor(timePassed / STEP_LENGTH);
        cStepT = (timePassed - cStep * STEP_LENGTH) / STEP_LENGTH;
        for (let i=0; i<this._aniArray[cStep].length; i++) {
          const isSnake = i < snakeOffsets.length; const ib = isSnake ? i : i - snakeOffsets.length;
          const initialPos = isSnake ? snakes[ib].getFront() : blocks[ib].getFront();
          const lastPos = this._aniArray[cStep][i];
          const nextPos = this._aniArray[cStep + 1][i];
          const cPos = [(1 - cStepT) * lastPos[0] + cStepT * nextPos[0],
            (1 - cStepT) * lastPos[1] + cStepT * nextPos[1]];
          if (isSnake) snakeOffsets[ib] = [cPos[0] - initialPos[0], cPos[1] - initialPos[1]];
          else blockOffsets[ib] = [cPos[0] - initialPos[0], cPos[1] - initialPos[1]];
        }
      }
    }

    const [snakes, blocks] = [this._snakeQueues, this._blockQueues];

    con.fillStyle = 'rgba(0, 51, 102, 1)';
    con.fillRect(x, y, width, height);
    con.clearRect(ax, ay, w, h);
    this.drawBoard(state, con, bSize, bCoord);
    for (let i=0; i<snakes.length; i++) {
      if (this._animationRunning && i == this._aniSnakeMoveInd)
        this.drawSnake(state, con, bSize, bCoord, snakes[i], COLOR_MAP[state.snakeToCharacter[i]],
          snakeOffsets[i], cStep == 0 ? cStepT : 2);
      else
        this.drawSnake(state, con, bSize, bCoord, snakes[i], COLOR_MAP[state.snakeToCharacter[i]],
          snakeOffsets[i]);
    }
    for (let i=0; i<blocks.length; i++) {
      this.drawBlock(state, con, bSize, bCoord, blocks[i],
        COLOR_MAP[state.blockToCharacter[i].toUpperCase()], blockOffsets[i]);
    }

    if (this._animationRunning) {
      window.requestAnimationFrame(this.draw);
    }
  }

  drawBoard(state, con, bSize, bCoord) {
    for (let sx=0; sx<state.width; sx++) {
      for (let sy=0; sy<state.height; sy++) {
        const [bx, by] = bCoord(sx, sy);
        const val = state.getVal(sx, sy);
        if (val == OBSTACLE) {
          con.fillStyle = 'rgba(204, 102, 0, 1)';
          con.fillRect(bx - bSize / 2, by - bSize / 2, bSize, bSize);
        } else if (val == SPIKE) {
          con.fillStyle = 'rgba(153, 153, 102, 1)';
          con.fillRect(bx - bSize / 2, by - bSize / 2, bSize, bSize);
        } else if (val == FRUIT) {
          con.fillStyle = 'rgba(255, 0, 0, 1)';
          con.beginPath();
          con.arc(bx, by, bSize / 2.5, 0, 2 * Math.PI);
          con.closePath();
          con.fill();
        } else if (val == PORTAL) {
          con.fillStyle = 'rgba(0, 153, 255, 1)';
          con.beginPath();
          con.arc(bx, by, bSize / 2.5, 0, 2 * Math.PI);
          con.closePath();
          con.fill();
        } else if (val == TARGET) {
          con.fillStyle = 'rgba(102, 0, 51, 1)';
          con.beginPath();
          con.arc(bx, by, bSize / 2.5, 0, 2 * Math.PI);
          con.closePath();
          con.fill();
        }
      }
    }
  }

  drawSnake(state, con, bSize, bCoord, partQ, color, offset, mvSnProg = -1) {
    con.fillStyle = color;
    let len = partQ.length;
    if (mvSnProg == 2 && !this._aniAteFruit) len--;
    for (let i=len-1; i>=0; i--) {
      const [x, y] = partQ.get(i);
      let off = offset;
      if (i != 0 && mvSnProg >= 0 && mvSnProg <= 1) {
        if (i == len - 1 && !this._aniAteFruit) {
          const [nx, ny] = partQ.get(i-1);
          off = [(nx - x) * mvSnProg, (ny - y) * mvSnProg];
        } else off = [0, 0];
      }
      const [bx, by] = bCoord(x + off[0], y + off[1]);
      con.fillRect(bx - bSize / 2, by - bSize / 2, bSize, bSize);
      if (i == 0) {
        con.fillStyle = 'rgba(255, 255, 255, 1)';
        con.beginPath();
        con.arc(bx, by, bSize / 3, 0, 2 * Math.PI);
        con.closePath();
        con.fill();
        con.fillStyle = color;
      }
    }
  }

  drawBlock(state, con, bSize, bCoord, partQ, color, offset) {
    con.fillStyle = color;
    for (let i=0; i<partQ.length; i++) {
      const [x, y] = partQ.get(i);
      const [bx, by] = bCoord(x + offset[0], y + offset[1]);
      con.fillRect(bx - bSize / 2, by - bSize / 2, bSize, bSize);
    }
  }
}
