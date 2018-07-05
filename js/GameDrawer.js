
/**
 * Whether to turn off cyclic animations for development purposes
 * @type {boolean}
 */
const TURN_OFF_CYCLIC_ANIMATIONS = false;

/**
 * Specifies the margin around the game board (in pixels)
 * @type {number}
 */
const MARGIN = 20;

/**
 * Specifies the color of a snake with a given character
 * @type {object}
 */
const COLOR_MAP = {
  A: 'rgba(233, 30, 99, 1)', B: 'rgba(33, 150, 243, 1)', C: 'rgba(156, 39, 176, 1)',
  D: 'rgba(103, 58, 183, 1)', E: 'rgba(63, 81, 181, 1)', F: 'rgba(3, 169, 244, 1)',
  G: 'rgba(57, 193, 11, 1)', H: 'rgba(0, 150, 136, 1)', I: 'rgba(76, 175, 80, 1)',
  J: 'rgba(0, 188, 212, 1)', K: 'rgba(139, 195, 74, 1)', L: 'rgba(205, 220, 57, 1)',
  M: 'rgba(255, 235, 59, 1)', N: 'rgba(255, 193, 7, 1)', O: 'rgba(255, 152, 0, 1)',
  P: 'rgba(255, 87, 34, 1)', Q: 'rgba(121, 85, 72, 1)', R: 'rgba(244, 67, 54, 1)',
  S: 'rgba(102, 0, 51, 1)', T: 'rgba(0, 51, 102, 1)', U: 'rgba(102, 153, 0, 1)'
};

/**
 * Specifies how long one animation step (moving one grid cell) takes (in milliseconds)
 * @type {number}
 */
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
   * @param {GameBoard} gameBoard the game board
   * @param {boolean} [fallThrough] whether the objects that fall out of the board appear again
   * on the other side of the board
   * @param {boolean} [noCyclicAni] whether or not to animate grass, clouds etc.
   * @param {boolean} [noAni] whether or not to animate falling snakes
   */
  constructor(canvas, x, y, width, height, gameState, gameBoard, fallThrough = false,
      noCyclicAni = false, noAni = false) {
    this.draw = this.draw.bind(this);
    this.click = this.click.bind(this);
    this._canvas = canvas;
    this._context = this._canvas.getContext('2d');
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._state = gameState;
    this._fruitPortalTargetArr = [];
    this._gameBoard = gameBoard;
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
    this._noCyclicAni = noCyclicAni;
    this._noAni = noAni;
    const stClone = this._state.clone();
    this._snakeQueues = stClone.snakes;
    this._blockQueues = stClone.blocks;
    this._fallThrough = fallThrough;
    this._currentGravity = DOWN;
    this._clickListeners = [];
    this._absoluteClickListeners = [];
    this._calcFruitPortalTargetArr();
    this._canvas.addEventListener('click', this.click);
    this.draw();
  }

  _calcFruitPortalTargetArr() {
    this._fruitPortalTargetArr = [];
    for (let i=0; i<this._state.width; i++) {
      this._fruitPortalTargetArr[i] = [];
      for (let k=0; k<this._state.height; k++)
        this._fruitPortalTargetArr[i][k] = this._state.getVal(i, k) == SPIKE ? SPIKE : EMPTY;
    }
    this._fruitPortalTargetArr[this._state.target[0]][this._state.target[1]] = TARGET;
    for (let i=0; i<this._state.portalPos.length; i++)
      this._fruitPortalTargetArr[this._state.portalPos[i][0]][this._state.portalPos[i][1]] = PORTAL;
    for (let i=0; i<this._state.fruitPos.length; i++)
      this._fruitPortalTargetArr[this._state.fruitPos[i][0]][this._state.fruitPos[i][1]] = FRUIT;
  }

  /**
   * Try to move a snake
   * @param {string} snake the character corresponding to the snake that should be moved
   * @param {number[]} direction the direction of the movement (LEFT, RIGHT, UP or DOWN)
   * @param {number[]} gravity the direction of gravity (LEFT, RIGHT, UP or DOWN)
   * @return {GameState} the new game state (or the old one if the move was invalid)
   */
  tryMove(snake, direction, gravity = DOWN) {
    this._currentGravity = gravity;
    if (!this._animationRunning && this._state.snakeMap.has(snake) && !this._state.gameEnded) {
      const moveRes = gameTransition(this._state, snake, direction, this._fallThrough, gravity);
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
        this.draw();
        return this._newState;
      }
    }
    return this._state;
  }

  /**
   * Set the game state
   * @param {GameState} state the new game state
   */
  setState(state) {
    this._animationRunning = false;
    this._state = state;
    this._boardWidth = this._state.width;
    this._boardHeight = this._state.height;
    const stClone = this._state.clone();
    this._snakeQueues = stClone.snakes;
    this._blockQueues = stClone.blocks;
    this._calcFruitPortalTargetArr();
    this.draw();
  }

  /**
   * Add an event listener to this game drawer
   * @param {string} type a string specifying the type of event the listener should listen to. Currently,
   * only 'click' and 'absolute click' is supported - 'click' listens for clicks on grid cells,
   * 'absolute click' for general clicks on the canvas. The respective event handlers will be called
   * with the coordinates of the grid cell and the absolute mouse coordinates, respectively.
   * @param {Function} listener the event listener that will be called when the specified event occurred
   */
  addEventListener(type, listener) {
    if (type === 'click') {
      this._clickListeners.push(listener);
    } else if (type === 'absolute click') {
      this._absoluteClickListeners.push(listener);
    }
  }

  /**
   * This method should be called when a 'click' event was detetcted
   * @param {object} event the event object
   */
  click(event) {
    if (!this._animationRunning) {
      let [xp, yp] = [event.clientX, event.clientY];
      const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();
      xp -= ax; yp -= ay;
      if (xp >= 0 && yp >= 0 && xp < w && yp < h) {
        const [xb, yb] = [Math.floor(xp / bSize), Math.floor(yp / bSize)];
        for (let i=0; i<this._clickListeners.length; i++) {
          this._clickListeners[i](xb, yb);
        }
      }
    }
    for (let i=0; i<this._absoluteClickListeners.length; i++)
      this._absoluteClickListeners[i](event.clientX, event.clientY);
  }

  /**
   * Resize this game drawer
   * @param {number} x the x coordinate of the top left corner of the game board on the canvas
   * @param {number} y the y coordinate of the top left corner of the game board on the canvas
   * @param {number} width the width of the game board on the canvas
   * @param {number} height the height of the game board on the canvas
   */
  resize(x, y, width, height) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this.draw();
  }

  /**
   * Calculate various dimension variables
   * @return {number[]} an array [w, h, ax, ay, bSize, bCoord] where
   * - w is the actual width of the game board on the canvas (excluding margin, with the right aspect ratio)
   * - h is the actual height of the game board on the canvas (excluding margin, with the right aspect ratio)
   * - ax is the actual x coordinate of the top left corner of the game board
   * - ay is the actual y coordinate of the top left corner of the game board
   * - bSize is the size of one grid cell
   * - bCoord is a function that takes the x and y coordinates of a grid cell in the game state array
   *   as parameters and returns an array with the corresponding x and y coordinates of the center
   *   of the grid cell on the canvas
   */
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

  /**
   * Draw the current game state
   * @param {boolean} [isAniFrame] whether or not this method should automatically call draw() again
   * to animate the game board
   */
  draw(isAniFrame = false) {
    let undo = false;
    const [con, x, y, width, height, bWidth, bHeight] = [this._context, this._x, this._y, this._width,
      this._height, this._boardWidth, this._boardHeight];
    let state = this._state;
    const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();

    let globalTime = ((new Date()).getTime() % 3000) / 3000;
    let globalSlowTime = ((new Date()).getTime() % 10000) / 10000;
    if (this._noCyclicAni) globalTime = globalSlowTime = 0;

    const snakeOffsets = []; for (let i=0; i<state.snakes.length; i++) snakeOffsets.push([0, 0]);
    const blockOffsets = []; for (let i=0; i<state.blocks.length; i++) blockOffsets.push([0, 0]);
    let cStep, cStepT;
    if (this._animationRunning) {
      const timePassed = (new Date()).getTime() - this._aniStartTime;
      if (timePassed >= STEP_LENGTH * this._aniLength || this._noAni) {
        this._animationRunning = false;
        this._state = this._newState; state = this._state;
        const stClone = this._state.clone();
        this._snakeQueues = stClone.snakes;
        this._blockQueues = stClone.blocks;
        if (this._aniEnd < 0) undo = true;
      } else {
        const [snakes, blocks] = [this._snakeQueues, this._blockQueues];
        cStep = Math.floor(timePassed / STEP_LENGTH);
        cStepT = (timePassed - cStep * STEP_LENGTH) / STEP_LENGTH;
        for (let i=0; i<this._aniArray[cStep].length; i++) {
          const isSnake = i < snakeOffsets.length; const ib = isSnake ? i : i - snakeOffsets.length;
          const initialPos = isSnake ? snakes[ib].getFront() : blocks[ib].getFront();
          const lastPos = this._aniArray[cStep][i];
          let nextPos = this._aniArray[cStep + 1][i];
          if (this._fallThrough && lastPos.length != 6 && lastPos.length != 7) {
            nextPos = this._checkPosChange(lastPos, nextPos);
          }
          const cPos = [(1 - cStepT) * lastPos[0] + cStepT * nextPos[0],
            (1 - cStepT) * lastPos[1] + cStepT * nextPos[1]];
          if (isSnake) snakeOffsets[ib] = [cPos[0] - initialPos[0], cPos[1] - initialPos[1]];
          else blockOffsets[ib] = [cPos[0] - initialPos[0], cPos[1] - initialPos[1]];
        }
      }
    }

    const [snakes, blocks] = [this._snakeQueues, this._blockQueues];

    con.clearRect(ax, ay, w, h);

    let fruitProg = this._state.fruits;
    if (this._animationRunning && this._aniAteFruit && cStep == 0) {
      fruitProg -= cStepT;
    }
    this.drawBoardBack(state, con, bSize, bCoord, globalTime, globalSlowTime, fruitProg);

    const borderArr = [];
    for (let i=0; i<this._state.width; i++) {
      borderArr[i] = [];
      for (let k=0; k<this._state.height; k++)
        borderArr[i][k] = 0;
    }
    for (let i=0; i<snakes.length; i++) {
      if (this._animationRunning && i == this._aniSnakeMoveInd)
        this.drawSnake(state, con, bSize, bCoord, snakes[i], COLOR_MAP[state.snakeToCharacter[i]],
          snakeOffsets[i], borderArr, cStep == 0 ? cStepT : 2);
      else
        this.drawSnake(state, con, bSize, bCoord, snakes[i], COLOR_MAP[state.snakeToCharacter[i]],
          snakeOffsets[i], borderArr);
    }
    for (let i=0; i<blocks.length; i++) {
      this.drawBlock(state, con, bSize, bCoord, blocks[i],
        COLOR_MAP[state.blockToCharacter[i].toUpperCase()], blockOffsets[i], borderArr);
    }

    this.drawBoardFront(state, con, bSize, bCoord, globalTime, globalSlowTime);

    con.globalCompositeOperation = 'destination-in';
    con.fillStyle = 'rgba(255, 255, 255, 1)';
    con.fillRect(ax, ay, w, h);
    con.globalCompositeOperation = 'source-over';

    // make border of game board visible
    const topPath = ctx => {
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - bSize / 2, ay - bSize / 2);
      ctx.lineTo(ax + w + bSize / 2, ay - bSize / 2); ctx.lineTo(ax + w, ay);
      ctx.lineTo(ax, ay); ctx.closePath(); ctx.fill();
    };
    const rightPath = ctx => {
      ctx.beginPath(); ctx.moveTo(ax + w, ay); ctx.lineTo(ax + w + bSize / 2, ay - bSize / 2);
      ctx.lineTo(ax + w + bSize / 2, ay + h + bSize / 2); ctx.lineTo(ax + w, ay + h);
      ctx.lineTo(ax + w, ay); ctx.closePath(); ctx.fill();
    };
    const bottomPath = ctx => {
      ctx.beginPath(); ctx.moveTo(ax + w, ay + h); ctx.lineTo(ax + w + bSize / 2, ay + h + bSize / 2);
      ctx.lineTo(ax - bSize / 2, ay + h + bSize / 2); ctx.lineTo(ax, ay + h);
      ctx.lineTo(ax + w, ay + h); ctx.closePath(); ctx.fill();
    };
    const leftPath = ctx => {
      ctx.beginPath(); ctx.moveTo(ax, ay + h); ctx.lineTo(ax - bSize / 2, ay + h + bSize / 2);
      ctx.lineTo(ax - bSize / 2, ay - bSize / 2); ctx.lineTo(ax, ay);
      ctx.lineTo(ax, ay + h); ctx.closePath(); ctx.fill();
    };

    const con2 = getHiddenContext(this._canvas, true, 0); // for only drawing the required border parts
    let baseColor = 'rgba(55, 117, 161, '; // default color specifying end of game board
    if (this._fallThrough) baseColor = 'rgba(248, 80, 127, '; // color for fallThrough option
    const topBorder = con2.createLinearGradient(ax, 0, ax + w, 0);
    const rightBorder = con2.createLinearGradient(0, ay, 0, ay + h);
    const bottomBorder = con2.createLinearGradient(ax, 0, ax + w, 0);
    const leftBorder = con2.createLinearGradient(0, ay, 0, ay + h);
    const xStep = 1 / this._state.width;
    const yStep = 1 / this._state.height;
    topBorder.addColorStop(0, `${baseColor}0)`);
    rightBorder.addColorStop(0, `${baseColor}0)`);
    bottomBorder.addColorStop(0, `${baseColor}0)`);
    leftBorder.addColorStop(0, `${baseColor}0)`);
    for (let i=0; i<this._state.height; i++) {
      rightBorder.addColorStop((i + 0.5) * yStep, `${baseColor}${borderArr[this._state.width - 1][i]})`);
      leftBorder.addColorStop((i + 0.5) * yStep, `${baseColor}${borderArr[0][i]})`);
    }
    for (let i=0; i<this._state.width; i++) {
      bottomBorder.addColorStop((i + 0.5) * xStep, `${baseColor}${borderArr[i][this._state.height - 1]})`);
      topBorder.addColorStop((i + 0.5) * xStep, `${baseColor}${borderArr[i][0]})`);
    }
    topBorder.addColorStop(1, `${baseColor}0)`);
    rightBorder.addColorStop(1, `${baseColor}0)`);
    bottomBorder.addColorStop(1, `${baseColor}0)`);
    leftBorder.addColorStop(1, `${baseColor}0)`);

    con2.fillStyle = topBorder; if (this._fallThrough || this._currentGravity != UP) topPath(con2);
    con2.fillStyle = rightBorder; if (this._fallThrough || this._currentGravity != RIGHT) rightPath(con2);
    con2.fillStyle = bottomBorder; if (this._fallThrough || this._currentGravity != DOWN) bottomPath(con2);
    con2.fillStyle = leftBorder; if (this._fallThrough || this._currentGravity != LEFT) leftPath(con2);

    const con3 = getHiddenContext(this._canvas, true, 1); // to fade-out the border with increasing distance
    const topGradient = con3.createLinearGradient(0, ay, 0, ay - bSize / 2);
    topGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    const rightGradient = con3.createLinearGradient(ax + w, 0, ax + w + bSize / 2, 0);
    rightGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    rightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    const bottomGradient = con3.createLinearGradient(0, ay + h, 0, ay + h + bSize / 2);
    bottomGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    bottomGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    const leftGradient = con3.createLinearGradient(ax, 0, ax - bSize / 2, 0);
    leftGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    leftGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    con3.fillStyle = topGradient; topPath(con3);
    con3.fillStyle = rightGradient; rightPath(con3);
    con3.fillStyle = bottomGradient; bottomPath(con3);
    con3.fillStyle = leftGradient; leftPath(con3);

    con2.globalCompositeOperation = 'destination-in'; // combine hidden canvases
    drawHiddenCanvas(con2, 1);
    con2.globalCompositeOperation = 'source-over';
    drawHiddenCanvas(con, 0); // draw border on actual canvas

    this._gameBoard.drawBackground(!this._noCyclicAni);

    if (!TURN_OFF_CYCLIC_ANIMATIONS) {
      if (isAniFrame && !this._noCyclicAni) {
        window.requestAnimationFrame(() => this.draw(true));
      }
    } else {
      if (this._animationRunning) {
        window.requestAnimationFrame(() => this.draw());
      }
    }

    if (undo) this._gameBoard.undo();
  }

  /**
   * Draw the part of the board without moving objects (such as snakes or blocks) that is in front
   * of the moving objects
   * @param {GameState} state the (old) game state
   * @param {CanvasRenderingContext2D} con the context of the canvas
   * @param {number} bSize the size of a single grid cell
   * @param {Function} bCoord a function that takes the x and y coordinates of a grid cell in the game
   * state array as parameters and returns an array with the corresponding x and y coordinates of the
   * center of the grid cell on the canvas
   * @param {number} globalTime a number between 0 and 1 that is used for cyclic animations (3s cycle)
   * @param {number} globalSlowTime a number between 0 and 1 that is used for cyclic animations (10s cycle)
   */
  drawBoardFront(state, con, bSize, bCoord, globalTime, globalSlowTime) {
    for (let sx=0; sx<state.width; sx++) {
      for (let sy=0; sy<state.height; sy++) {
        const [bx, by] = bCoord(sx, sy);
        const val = state.getVal(sx, sy);
        const adjVals = [state.getVal(sx - 1, sy, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx - 1, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx - 1, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY)];
        // 0 left, 1 right, 2 top, 3 bottom, 4 top left, 5 top right, 6 bottom right, 7 bottom left
        if (val == OBSTACLE) {
          drawObstacle(con, bx, by, adjVals, bSize, sx, sy);
        } else if (val == SPIKE) {
          drawSpike(con, bx, by, adjVals, bSize);
        } else if (val == FRUIT) {
          // fruit is behind moving objects
        } else if (val == PORTAL) { // half in front, half in back
          // portal position is taken from game state
        } else if (val == TARGET) {
          // target is behind moving objects
        }
      }
    }
    for (let i=0; i<this._state.portalPos.length; i++) {
      const [px, py] = bCoord(this._state.portalPos[i][0], this._state.portalPos[i][1]);
      drawPortalFront(con, px, py, bSize, globalSlowTime);
    }
    // draw grass on top
    for (let sx=0; sx<state.width; sx++) {
      for (let sy=0; sy<state.height; sy++) {
        const [bx, by] = bCoord(sx, sy);
        const val = state.getVal(sx, sy);
        const adjVals = [state.getVal(sx - 1, sy, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx - 1, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx - 1, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY)];
        // 0 left, 1 right, 2 top, 3 bottom, 4 top left, 5 top right, 6 bottom right, 7 bottom left
        let noShrub = false;
        if (sy - 1 >= 0 && (this._fruitPortalTargetArr[sx][sy - 1] == FRUIT
          || this._fruitPortalTargetArr[sx][sy - 1] == PORTAL
          || this._fruitPortalTargetArr[sx][sy - 1] == SPIKE)) noShrub = true;
        if (val == OBSTACLE) {
          drawGrass(con, bx, by, adjVals, bSize, sx, sy, globalTime, noShrub);
        }
      }
    }
  }

  /**
   * Draw the part of the board without moving objects (such as snakes or blocks) that is behind
   * of the moving objects
   * @param {GameState} state the (old) game state
   * @param {CanvasRenderingContext2D} con the context of the canvas
   * @param {number} bSize the size of a single grid cell
   * @param {Function} bCoord a function that takes the x and y coordinates of a grid cell in the game
   * state array as parameters and returns an array with the corresponding x and y coordinates of the
   * center of the grid cell on the canvas
   * @param {number} globalTime a number between 0 and 1 that is used for cyclic animations (3s cycle)
   * @param {number} globalSlowTime a number between 0 and 1 that is used for cyclic animations (10s cycle)
   * @param {number} fruitProg a number indicating how many fruits are present on the board
   */
  drawBoardBack(state, con, bSize, bCoord, globalTime, globalSlowTime, fruitProg) {
    for (let i=0; i<this._state.portalPos.length; i++) {
      const [px, py] = bCoord(this._state.portalPos[i][0], this._state.portalPos[i][1]);
      drawPortalBack(con, px, py, bSize, globalTime);
    }
    const [tx, ty] = bCoord(this._state.target[0], this._state.target[1]);
    drawTarget(con, this._canvas, tx, ty, bSize, globalSlowTime, fruitProg);
    for (let sx=0; sx<state.width; sx++) {
      for (let sy=0; sy<state.height; sy++) {
        const [bx, by] = bCoord(sx, sy);
        const val = state.getVal(sx, sy);
        const adjVals = [state.getVal(sx - 1, sy, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx - 1, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy - 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx + 1, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY),
          state.getVal(sx - 1, sy + 1, this._fallThrough ? WRAP_AROUND : EMPTY)];
        // 0 left, 1 right, 2 top, 3 bottom, 4 top left, 5 top right, 6 bottom right, 7 bottom left
        if (val == OBSTACLE) {
          // obstacles are in front of objects
        } else if (val == SPIKE) {
          // spikes are in front of objects
        } else if (val == FRUIT) {
          con.fillStyle = 'rgba(255, 0, 0, 1)';
          con.beginPath();
          con.arc(bx, by, bSize / 2.5, 0, 2 * Math.PI);
          con.closePath();
          con.fill();
        } else if (val == PORTAL) { // half in front, half in back
          // portal position is taken from game state
        } else if (val == TARGET) {
          // target position is taken from game state
        }
      }
    }
  }

  /**
   * Draw a single snake
   * @param {GameState} state the (old) game state
   * @param {CanvasRenderingContext2D} con the context of the canvas
   * @param {number} bSize the size of a single grid cell
   * @param {Function} bCoord a function that takes the x and y coordinates of a grid cell in the game
   * state array as parameters and returns an array with the corresponding x and y coordinates of the
   * center of the grid cell on the canvas
   * @param {Queue} partQ a queue with the body parts of the snake
   * @param {string} color the color of the snake
   * @param {number[]} offset the offset the snake should be moved by
   * @param {number[][]} borderArr an array that will be modified to reflect whether a snake is close
   * to the game board border
   * @param {number} [mvSnProg] if not -1, either between 0 and 1, specifying the progress of the first
   * movement of the snake's head or 2, specifying that the snake already moved its head (if it is -1,
   * this snake only falls but was not actively moved by the player)
   */
  drawSnake(state, con, bSize, bCoord, partQ, color, offset, borderArr, mvSnProg = -1) {
    con.fillStyle = color;
    let len = partQ.length;
    if (mvSnProg == 2 && !this._aniAteFruit) len--;
    for (let i=len-1; i>=0; i--) {
      const [x, y] = partQ.get(i);
      let off = offset;
      if (i != 0 && mvSnProg >= 0 && mvSnProg <= 1) {
        if (i == len - 1 && !this._aniAteFruit) {
          let [nx, ny] = partQ.get(i-1);
          if (this._fallThrough) {
            [nx, ny] = this._checkPosChange([x, y], [nx, ny]);
          }
          off = [(nx - x) * mvSnProg, (ny - y) * mvSnProg];
        } else off = [0, 0];
      }
      const [ox, oy, drawAt] = this._getAllOffsets(state, x, y, off, borderArr);
      for (let k=0; k<drawAt.length; k++) {
        const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
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
  }

  /**
   * Draw a single block
   * @param {GameState} state the (old) game state
   * @param {CanvasRenderingContext2D} con the context of the canvas
   * @param {number} bSize the size of a single grid cell
   * @param {Function} bCoord a function that takes the x and y coordinates of a grid cell in the game
   * state array as parameters and returns an array with the corresponding x and y coordinates of the
   * center of the grid cell on the canvas
   * @param {Queue} partQ a queue with the parts of the block
   * @param {string} color the color of the block
   * @param {number[]} offset the offset the block should be moved by
   * @param {number[][]} borderArr an array that will be modified to reflect whether a block is close
   * to the game board border
   */
  drawBlock(state, con, bSize, bCoord, partQ, color, offset, borderArr) {
    con.fillStyle = color;
    for (let i=0; i<partQ.length; i++) {
      const [x, y] = partQ.get(i);
      const [ox, oy, drawAt] = this._getAllOffsets(state, x, y, offset, borderArr);
      for (let k=0; k<drawAt.length; k++) {
        const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
        con.fillRect(bx - bSize / 2, by - bSize / 2, bSize, bSize);
      }
    }
  }

  /**
   * Get all offsets a single cell of a snake or a block should be drawn on. This is necessary if the
   * fallThrough option is enabled: in this case, parts of objects that overlap the game board border
   * have to be drawn on the other side of the board as well.
   * @param {GameState} state the (old) game state
   * @param {number} x the x coordinate of the cell in the game state array
   * @param {number} y the y coordinate of the cell in the game state array
   * @param {number[]} off the offset the part of the object should be moved by
   * @param {number[][]} borderArr an array that will be modified to reflect whether an object is close
   * to the game board border
   */
  _getAllOffsets(state, x, y, off, borderArr) {
    let [ox, oy] = [x + off[0], y + off[1]];
    const drawAt = [[0, 0]]; // if the part is at the border of the board, draw it on the other side of
    // the board as well (in case of this._fallThrough) -- this array contains additional offsets to add
    if (this._fallThrough) {
      while (ox < 0) ox += state.width; while (oy < 0) oy += state.height;
      ox %= state.width; oy %= state.height;
      if (state.width - ox < 1) drawAt.push([-state.width, 0]);
      if (state.height - oy < 1) drawAt.push([0, -state.height]);
      if (state.width - ox < 1 && state.height - oy < 1) drawAt.push([-state.width, -state.height]);
    }
    for (let i=0; i<drawAt.length; i++) { // update borderArr
      const [cx, cy] = [ox + drawAt[i][0], oy + drawAt[i][1]];
      const lowx = Math.floor(cx); const lowxf = 1 - cx + lowx;
      const highx = Math.ceil(cx); const highxf = 1 - highx + cx;
      const lowy = Math.floor(cy); const lowyf = 1 - cy + lowy;
      const highy = Math.ceil(cy); const highyf = 1 - highy + cy;
      const setN = (xcoord, ycoord, val) => {
        borderArr[xcoord][ycoord] += val;
        borderArr[xcoord][ycoord] = Math.min(1, borderArr[xcoord][ycoord]);
      };
      const setX = (xcoord, val) => {
        if (lowy >= 0) setN(xcoord, lowy, val * lowyf);
        if (highy < state.height) setN(xcoord, highy, val * highyf);
      };
      const setY = (ycoord, val) => {
        if (lowx >= 0) setN(lowx, ycoord, val * lowxf);
        if (highx < state.width) setN(highx, ycoord, val * highxf);
      };
      const distArr = [Math.abs(cx + 0.5), Math.abs(cy + 0.5),
        Math.abs(state.width - 0.5 - cx), Math.abs(state.height - 0.5 - cy)]; // left, top, right, bottom
      const valArr = [];
      for (let i=0; i<distArr.length; i++) {
        if (distArr[i] <= 0.5) valArr.push(1);
        else if (distArr[i] <= 1.5) valArr.push(1.5 - distArr[i]);
        else valArr.push(0);
      }
      setX(0, valArr[0]);
      setY(0, valArr[1]);
      setX(state.width - 1, valArr[2]);
      setY(state.height - 1, valArr[3]);
    }
    return [ox, oy, drawAt];
  }

  /**
   * Adapt the nextPos array, if necessary (if the fallThrough option is enabled, snakes that move
   * through the border of the board shouldn't be animated as being ported across the whole board, they
   * should just move as usual -- this can require an adaption of the nextPos array).
   * @param {number[]} lastPos the last position of the object
   * @param {number[]} nextPos the new position of the object
   * @return {number[]} the adapted nextPos array
   */
  _checkPosChange(lastPos, nextPos) {
    if (Math.abs(nextPos[0] - lastPos[0]) > 1) {
      nextPos = nextPos.slice();
      if (nextPos[0] - lastPos[0] > 0) nextPos[0] = lastPos[0] - 1;
      else nextPos[0] = lastPos[0] + 1;
    }
    if (Math.abs(nextPos[1] - lastPos[1]) > 1) {
      nextPos = nextPos.slice();
      if (nextPos[1] - lastPos[1] > 0) nextPos[1] = lastPos[1] - 1;
      else nextPos[1] = lastPos[1] + 1;
    }
    return nextPos;
  }
}
