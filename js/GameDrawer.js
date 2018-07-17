
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
const COLOR_MAP = { // R, G, B colors are the as in the the real game
  A: 'rgba(233, 30, 99, 1)', B: 'rgba(0, 75, 244, 1)', C: 'rgba(156, 39, 176, 1)',
  D: 'rgba(103, 58, 183, 1)', E: 'rgba(63, 81, 181, 1)', F: 'rgba(3, 169, 244, 1)',
  G: 'rgba(24, 210, 37, 1)', H: 'rgba(0, 150, 136, 1)', I: 'rgba(76, 175, 80, 1)',
  J: 'rgba(0, 188, 212, 1)', K: 'rgba(139, 195, 74, 1)', L: 'rgba(205, 220, 57, 1)',
  M: 'rgba(255, 235, 59, 1)', N: 'rgba(255, 193, 7, 1)', O: 'rgba(255, 152, 0, 1)',
  P: 'rgba(255, 87, 34, 1)', Q: 'rgba(121, 85, 72, 1)', R: 'rgba(253, 12, 13, 1)',
  S: 'rgba(102, 0, 51, 1)', T: 'rgba(0, 51, 102, 1)', U: 'rgba(102, 153, 0, 1)'
};

/**
 * Specifies the color of a block with a given character
 * @type {object}
 */
const BLOCK_COLOR_MAP = { // A, B, C, D, E colors are the same as in the real game
  A: 'rgba(219, 215, 49, 1)', B: 'rgba(219, 190, 45, 1)', C: 'rgba(220, 159, 45, 1)',
  D: 'rgba(222, 121, 44, 1)', E: 'rgba(175, 222, 252, 1)', F: 'rgba(3, 169, 244, 1)',
  G: 'rgba(24, 210, 37, 1)', H: 'rgba(0, 150, 136, 1)', I: 'rgba(76, 175, 80, 1)',
  J: 'rgba(0, 188, 212, 1)', K: 'rgba(139, 195, 74, 1)', L: 'rgba(205, 220, 57, 1)',
  M: 'rgba(255, 235, 59, 1)', N: 'rgba(255, 193, 7, 1)', O: 'rgba(255, 152, 0, 1)',
  P: 'rgba(255, 87, 34, 1)', Q: 'rgba(121, 85, 72, 1)', R: 'rgba(253, 12, 13, 1)',
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
   * @param {boolean} [changeGravity] whether to change the direction of gravity in clockwise order
   * when the snake eats a fruit
   * @param {boolean} [noCyclicAni] whether or not to animate grass, clouds etc.
   * @param {boolean} [noAni] whether or not to animate falling snakes
   */
  constructor(canvas, x, y, width, height, gameState, gameBoard, fallThrough = false,
      changeGravity = false, noCyclicAni = false, noAni = false) {
    this.draw = this.draw.bind(this);
    this.click = this.click.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this._applyZoom = this._applyZoom.bind(this);
    this._mouseDownTime = 0;
    this._lastMouseCoords = [0, 0];
    this._mouseIsDown = false;
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
    this._zoomLevel = 1;
    this._isZooming = false;
    this._destZoomLvl = 1;
    this._oldZoom = 1;
    this._destCenterCoords = [0.5, 0.5];
    this._oldCenterCoords = [0.5, 0.5];
    this._zoomStartTime = 0;
    this._centerCoords = [0.5, 0.5];
    this._fallThrough = fallThrough;
    this._changeGravity = changeGravity;
    this._currentGravity = DOWN;
    this._blockInfoMap = new Map();
    this._calcBlockInfoArr();
    this._clickListeners = [];
    this._absoluteClickListeners = [];
    this._mouseMoveListeners = [];
    this._calcFruitPortalTargetArr();
    this._canvas.addEventListener('click', this.click);
    this._canvas.addEventListener('mousedown', this.mouseDown);
    this._canvas.addEventListener('mouseup', this.mouseUp);
    this._canvas.addEventListener('mousemove', this.mouseMove);
    this._canvas.addEventListener('mouseleave', this.mouseLeave);
    this.draw();
  }

  _calcBlockInfoArr() {
    this._blockInfoMap = new Map();
    for (let i=0; i<this._blockQueues.length; i++) {
      this._blockInfoMap.set(this._state.blockToCharacter[i], calculateGraphicsInfo(this._blockQueues[i]));
    }
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
   * @return {GameState} the new game state (or null if the move was invalid)
   */
  tryMove(snake, direction, gravity = DOWN) {
    this._currentGravity = gravity;
    if (!this._animationRunning && this._state.snakeMap.has(snake) && !this._state.gameEnded) {
      const moveRes = gameTransition(this._state, snake, direction, this._fallThrough, this._state.gravity, true, this._changeGravity);
      if (moveRes !== null) {
        this._aniSnakeMoveInd = this._state.snakeMap.get(snake);
        this._aniAteFruit = moveRes[0];
        const cp = this._snakeQueues[this._aniSnakeMoveInd].getFront();
        this._snakeQueues[this._aniSnakeMoveInd].pushFront([cp[0] + direction[0], cp[1] + direction[1]]);
        this._aniEnd = moveRes[1];
        // if (this._aniEnd < 0) console.log('Lost!');
        // else if (this._aniEnd > 0) console.log('Won!');
        this._aniArray = convertToFullArray(moveRes[2], this._state.snakes.length);
        this._newState = moveRes[3];
        this._aniLength = this._aniArray.length - 1;
        this._animationRunning = true;
        this._aniStartTime = (new Date()).getTime();
        this.draw();
        return this._newState;
      }
    }
    return null;
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
    this._calcBlockInfoArr();
    this._calcFruitPortalTargetArr();
    this._checkZoomAndCenter();
    this.draw();
  }

  /**
   * Add an event listener to this game drawer
   * @param {string} type a string specifying the type of event the listener should listen to. Currently,
   * only 'click', 'absolute click' and 'mousemove' is supported - 'click' listens for clicks on grid
   * cells, 'absolute click' for general clicks on the canvas. The respective event handlers will be
   * called with the coordinates of the grid cell and the absolute mouse coordinates, respectively.
   * The event handler for 'mousemove' will be called with the event object itself.
   * @param {Function} listener the event listener that will be called when the specified event occurred
   */
  addEventListener(type, listener) {
    if (type === 'click') {
      this._clickListeners.push(listener);
    } else if (type === 'absolute click') {
      this._absoluteClickListeners.push(listener);
    } else if (type === 'mousemove') {
      this._mouseMoveListeners.push(listener);
    }
  }

  /**
   * This method should be called when a 'click' event was detetcted
   * @param {object} event the event object
   */
  click(event) {
    if ((new Date()).getTime() - this._mouseDownTime < 250) {
      if (!this._animationRunning) {
        let [xp, yp] = [event.clientX, event.clientY];
        const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();
        const [cenx, ceny] = [ax + 0.5 * w, ay + 0.5 * h];
        xp -= cenx; yp -= ceny; xp /= this._zoomLevel * w; yp /= this._zoomLevel * h;
        xp += this._centerCoords[0]; yp += this._centerCoords[1];
        if (xp >= 0 && yp >= 0 && xp < 1 && yp < 1) {
          const [xb, yb] = [Math.floor(w * xp / bSize), Math.floor(h * yp / bSize)];
          for (let i=0; i<this._clickListeners.length; i++) {
            this._clickListeners[i](xb, yb);
          }
        }
      }
      for (let i=0; i<this._absoluteClickListeners.length; i++)
        this._absoluteClickListeners[i](event.clientX, event.clientY);
    }
  }

  /**
   * This method should be called when a 'mousedown' event was detetcted
   * @param {object} event the event object
   */
  mouseDown(event) {
    this._mouseDownTime = (new Date()).getTime();
    this._mouseIsDown = true;
    this._lastMouseCoords = [event.clientX, event.clientY];
  }

  /**
   * This method should be called when a 'mouseup' event was detetcted
   * @param {object} event the event object
   */
  mouseUp(event) {
    if ((new Date()).getTime() - this._mouseDownTime >= 250) {
      this._translate(event.clientX, event.clientY);
    }
    this._mouseIsDown = false;
  }

  /**
   * This method should be called when a 'mouseleave' event was detetcted
   * @param {object} event the event object
   */
  mouseLeave(event) {
    if (this._mouseIsDown && ((new Date()).getTime() - this._mouseDownTime >= 250)) {
      this._translate(event.clientX, event.clientY);
    }
    this._mouseIsDown = false;
  }

  /**
   * This method should be called when a 'mousemove' event was detetcted
   * @param {object} event the event object
   */
  mouseMove(event) {
    if (this._mouseIsDown && ((new Date()).getTime() - this._mouseDownTime >= 250)) {
      this._translate(event.clientX, event.clientY);
    }
    this._lastMouseCoords = [event.clientX, event.clientY];
    for (let i=0; i<this._mouseMoveListeners.length; i++)
      this._mouseMoveListeners[i](event);
  }

  _translate(nx, ny) {
    if (!this._isZooming) {
      const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();
      const dx = this._lastMouseCoords[0] - nx;
      const dy = this._lastMouseCoords[1] - ny;
      this._centerCoords[0] += (dx / w) / this._zoomLevel;
      this._centerCoords[1] += (dy / h) / this._zoomLevel;
      this._checkZoomAndCenter();
      this.draw();
    }
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
   * Apply the current zoom to a canvas (once all draw operations were finished, you should call
   * con.restore())
   * @param {CanvasRenderingContext2D} con the context to apply the zoom on
   */
  _applyZoom(con) {
    const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();
    con.save();
    if (this._zoomLevel > 1) {
      con.translate(ax + 0.5 * w, ay + 0.5 * h);
      con.scale(this._zoomLevel, this._zoomLevel);
      con.translate(- ax - this._centerCoords[0] * w, - ay - this._centerCoords[1] * h);
    }
  }

  /**
   * Checks whether zoom and center variables are valid (not out of bounds)
   */
  _checkZoomAndCenter() {
    const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();
    if (this._zoomLevel * bSize > 200) this._zoomLevel = 200 / bSize;
    if (this._zoomLevel <= 1) {
      this._zoomLevel = 1;
      this._centerCoords = [0.5, 0.5];
    } else {
      const lx = 0.5 - this._centerCoords[0] * this._zoomLevel;
      const rx = 0.5 + (1 - this._centerCoords[0]) * this._zoomLevel;
      if (lx > 0) this._centerCoords[0] = 0.5 / this._zoomLevel;
      else if (rx < 1) this._centerCoords[0] = (- 0.5 + this._zoomLevel) / this._zoomLevel;
      const ty = 0.5 - this._centerCoords[1] * this._zoomLevel;
      const by = 0.5 + (1 - this._centerCoords[1]) * this._zoomLevel;
      if (ty > 0) this._centerCoords[1] = 0.5 / this._zoomLevel;
      else if (by < 1) this._centerCoords[1] = (- 0.5 + this._zoomLevel) / this._zoomLevel;
    }
  }

  /**
   * Zoom in
   */
  zoomIn() {
    if (!this._isZooming) {
      this._oldCenterCoords = this._centerCoords.slice();
      this._oldZoom = this._zoomLevel;
      this._zoomLevel *= 1.5;
      this._checkZoomAndCenter();
      this._destZoomLvl = this._zoomLevel;
      this._zoomLevel = this._oldZoom;
      this._destCenterCoords = this._centerCoords;
      this._centerCoords = this._oldCenterCoords;
      if (this._destZoomLvl != this._oldZoom) {
        this._isZooming = true;
        this._zoomStartTime = (new Date()).getTime();
        this.draw();
      }
    }
  }

  /**
   * Zoom out
   */
  zoomOut() {
    if (!this._isZooming) {
      this._oldCenterCoords = this._centerCoords.slice();
      this._oldZoom = this._zoomLevel;
      this._zoomLevel /= 1.5;
      this._checkZoomAndCenter();
      this._destZoomLvl = this._zoomLevel;
      this._zoomLevel = this._oldZoom;
      this._destCenterCoords = this._centerCoords;
      this._centerCoords = this._oldCenterCoords;
      if (this._destZoomLvl != this._oldZoom) {
        this._isZooming = true;
        this._zoomStartTime = (new Date()).getTime();
        this.draw();
      }
    }
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
    con.clearRect(0, 0, this._canvas.width, this._canvas.height);
    if (this._isZooming) {
      let tP = (new Date()).getTime() - this._zoomStartTime;
      if (tP >= STEP_LENGTH || this._noAni) {
        this._isZooming = false;
        this._zoomLevel = this._destZoomLvl;
        this._centerCoords = this._destCenterCoords;
      } else {
        tP /= STEP_LENGTH;
        this._zoomLevel = (1 - tP) * this._oldZoom + tP * this._destZoomLvl;
        this._centerCoords = [(1 - tP) * this._oldCenterCoords[0] + tP * this._destCenterCoords[0],
          (1 - tP) * this._oldCenterCoords[1] + tP * this._destCenterCoords[1]];
      }
    }
    this._applyZoom(con);
    let state = this._state;
    const [w, h, ax, ay, bSize, bCoord] = this.getDimVars();

    let removedFruitPos = [-1, -1];
    let globalTime = ((new Date()).getTime() % 3000) / 3000;
    let globalSlowTime = ((new Date()).getTime() % 10000) / 10000;
    if (this._noCyclicAni) globalTime = globalSlowTime = 0;

    const drawSnake = []; const snakeDeathProg = []; const snakePortation = [];
    const snakeOffsets = [];
    for (let i=0; i<state.snakes.length; i++) {
      drawSnake[i] = true; snakeDeathProg[i] = 0; snakePortation[i] = [false];
      snakeOffsets.push([0, 0]);
    }
    const drawBlock = []; const blockDeathProg = []; const blockPortation = [];
    const blockOffsets = [];
    for (let i=0; i<state.blocks.length; i++) {
      drawBlock[i] = true; blockDeathProg[i] = 0; blockPortation[i] = [false];
      blockOffsets.push([0, 0]);
    }
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
        if (this._aniAteFruit) {
          removedFruitPos = [this._aniArray[1][this._aniSnakeMoveInd][0], this._aniArray[1][this._aniSnakeMoveInd][1]];
        }
        for (let i=0; i<this._aniArray[cStep].length; i++) {
          const isSnake = i < snakeOffsets.length; const ib = isSnake ? i : i - snakeOffsets.length;
          const initialPos = isSnake ? snakes[ib].getFront() : blocks[ib].getFront();
          const lastPos = this._aniArray[cStep][i];
          let nextPos = this._aniArray[cStep + 1][i];
          if ((nextPos.length == 3 && nextPos[2] == 1) || (this._aniEnd == -1 && cStep == this._aniLength - 1)) {
            if (isSnake) snakeDeathProg[ib] = cStepT * (2 / 3) + (1 / 3);
            else blockDeathProg[ib] = cStepT * (2 / 3) + (1 / 3);
          }
          if (nextPos[0] < -10 && nextPos[1] < -10) {
            if (isSnake) drawSnake[ib] = false;
            else drawBlock[ib] = false;
          }
          if (this._fallThrough && lastPos.length != 6 && lastPos.length != 7) {
            nextPos = this._checkPosChange(lastPos, nextPos);
          }
          if (lastPos.length == 6 || lastPos.length == 7) { // portation
            let oPos = lastPos;
            let progr = cStepT * 0.5 + 0.25;
            if (cStep == this._aniLength - 1) { // end of portation cannot be animated in next frame (because there are no more frames)
              progr = cStepT * (2 / 3) + (1 / 3);
              if (cStepT > 0.25) oPos = nextPos;
            } else { // end of portation can be animated in next frame
              if (cStepT > 0.5) oPos = nextPos;
            }
            if (isSnake) snakePortation[ib] = [true, progr, lastPos[0], lastPos[1], lastPos[2], lastPos[3],
              state.portalPos[lastPos[4]][0], state.portalPos[lastPos[4]][1], state.portalPos[lastPos[5]][0], state.portalPos[lastPos[5]][1]];
            else blockPortation[ib] = [true, progr, lastPos[0], lastPos[1], lastPos[2], lastPos[3],
              state.portalPos[lastPos[4]][0], state.portalPos[lastPos[4]][1], state.portalPos[lastPos[5]][0], state.portalPos[lastPos[5]][1]];
            if (isSnake) snakeOffsets[ib] = [oPos[0] - initialPos[0], oPos[1] - initialPos[1]];
            else blockOffsets[ib] = [oPos[0] - initialPos[0], oPos[1] - initialPos[1]];
            continue;
          }
          if (cStep < this._aniLength - 1 && cStepT >= 0.5) {
            const nextNextPos = this._aniArray[cStep + 2][i];
            if (nextPos.length == 6 || nextPos.length == 7) { // portation during next step
              let progr = (cStepT - 0.5) / 2; // end of portation can be animated in next frame
              if (cStep == this._aniLength - 2) progr = (cStepT - 0.5) / 1.5; // end of portation cannot be animated in next frame (because there are no more frames)
              if (isSnake) snakePortation[ib] = [true, progr, nextPos[0], nextPos[1], nextPos[2], nextPos[3],
                state.portalPos[nextPos[4]][0], state.portalPos[nextPos[4]][1], state.portalPos[nextPos[5]][0], state.portalPos[nextPos[5]][1]];
              else blockPortation[ib] = [true, progr, nextPos[0], nextPos[1], nextPos[2], nextPos[3],
                state.portalPos[nextPos[4]][0], state.portalPos[nextPos[4]][1], state.portalPos[nextPos[5]][0], state.portalPos[nextPos[5]][1]];
            }
            if ((nextNextPos.length == 3 && nextNextPos[2] == 1) || (this._aniEnd == -1 && cStep + 1 == this._aniLength - 1)) {
              if (isSnake) snakeDeathProg[ib] = (cStepT - 0.5) / 1.5;
              else blockDeathProg[ib] = (cStepT - 0.5) / 1.5;
            }
          }
          if (cStep > 0 && cStepT <= 0.5) {
            const lastLastPos = this._aniArray[cStep - 1][i];
            if (lastLastPos.length == 6 || lastLastPos.length == 7) { // portation during last step
              let progr = 0.75 + cStepT / 2; // end of portation can be animated in next (= this) frame
              if (isSnake) snakePortation[ib] = [true, progr, lastLastPos[0], lastLastPos[1], lastLastPos[2], lastLastPos[3],
                state.portalPos[lastLastPos[4]][0], state.portalPos[lastLastPos[4]][1], state.portalPos[lastLastPos[5]][0], state.portalPos[lastLastPos[5]][1]];
              else blockPortation[ib] = [true, progr, lastLastPos[0], lastLastPos[1], lastLastPos[2], lastLastPos[3],
                state.portalPos[lastLastPos[4]][0], state.portalPos[lastLastPos[4]][1], state.portalPos[lastLastPos[5]][0], state.portalPos[lastLastPos[5]][1]];
            }
          }
          const cPos = [(1 - cStepT) * lastPos[0] + cStepT * nextPos[0],
            (1 - cStepT) * lastPos[1] + cStepT * nextPos[1]];
          if (isSnake) snakeOffsets[ib] = [cPos[0] - initialPos[0], cPos[1] - initialPos[1]];
          else blockOffsets[ib] = [cPos[0] - initialPos[0], cPos[1] - initialPos[1]];
        }
      }
    }

    const [snakes, blocks] = [this._snakeQueues, this._blockQueues];

    let fruitProg = this._state.fruits; let removedFruitProg = 1;
    if (this._animationRunning && this._aniAteFruit && cStep == 0) {
      fruitProg -= cStepT;
      removedFruitProg -= cStepT;
    } else if (this._animationRunning && this._aniAteFruit) {
      fruitProg--; removedFruitProg = 0;
    }

    const borderArr = [];
    for (let i=0; i<this._state.width; i++) {
      borderArr[i] = [];
      for (let k=0; k<this._state.height; k++)
        borderArr[i][k] = 0;
    }
    this.drawBoardBack(state, con, bSize, bCoord, globalTime, globalSlowTime, fruitProg);
    for (let i=0; i<blocks.length; i++) {
      if (drawBlock[i]) {
        drawBlockBack(state, con, bSize, bCoord, blocks[i],
          BLOCK_COLOR_MAP[state.blockToCharacter[i].toUpperCase()], blockOffsets[i], borderArr, this,
          this._blockInfoMap.get(state.blockToCharacter[i]), this._fallThrough, blockDeathProg[i], blockPortation[i]);
      }
    }
    for (let i=0; i<blocks.length; i++) {
      if (drawBlock[i]) {
        drawBlockFront(state, con, bSize, bCoord, blocks[i],
          BLOCK_COLOR_MAP[state.blockToCharacter[i].toUpperCase()], blockOffsets[i], borderArr, this,
          this._blockInfoMap.get(state.blockToCharacter[i]), this._fallThrough, blockDeathProg[i], blockPortation[i]);
      }
    }
    for (let i=0; i<snakes.length; i++) {
      if (drawSnake[i]) {
        if (this._animationRunning && i == this._aniSnakeMoveInd)
          drawSnakebird(this, state, con, this._canvas, bSize, bCoord, snakes[i], COLOR_MAP[state.snakeToCharacter[i]],
            snakeOffsets[i], borderArr, globalSlowTime, this._applyZoom, cStep == 0 ? cStepT : 2, this._fallThrough,
            snakeDeathProg[i], snakePortation[i]);
        else
          drawSnakebird(this, state, con, this._canvas, bSize, bCoord, snakes[i], COLOR_MAP[state.snakeToCharacter[i]],
            snakeOffsets[i], borderArr, globalSlowTime, this._applyZoom, -1, this._fallThrough,
            snakeDeathProg[i], snakePortation[i]);
      }
    }

    this.drawBoardFront(state, con, bSize, bCoord, globalTime, globalSlowTime, removedFruitPos, removedFruitProg);

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
    this._applyZoom(con2);
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
    this._applyZoom(con3);
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

    con2.restore();
    con2.globalCompositeOperation = 'destination-in'; // combine hidden canvases
    drawHiddenCanvas(con2, 1);
    con2.globalCompositeOperation = 'source-over';
    drawHiddenCanvas(con, 0, this._applyZoom); // draw border on actual canvas

    con.restore();
    con3.restore();

    // check if target is visible
    let [atx, aty] = [
      ((state.target[0] + 0.5) / state.width - this._centerCoords[0]) * w * this._zoomLevel + ax + 0.5 * w,
      ((state.target[1] + 0.5) / state.height - this._centerCoords[1]) * h * this._zoomLevel + ay + 0.5 * h];
    if (atx < this._x || aty < this._y || atx - this._x >= this._width || aty - this._y >= this._height) {
      const bbSize = bSize * this._zoomLevel;
      const [otx, oty] = [atx, aty];
      if (atx < this._x + bbSize * (0.5 * SQRT_2)) atx = this._x + bbSize * (0.5 * SQRT_2);
      if (aty < this._y + bbSize * (0.5 * SQRT_2)) aty = this._y + bbSize * (0.5 * SQRT_2);
      if (atx - this._x > this._width - bbSize * (0.5 * SQRT_2)) atx = this._x + this._width - bbSize * (0.5 * SQRT_2);
      if (aty - this._y > this._height - bbSize * (0.5 * SQRT_2)) aty = this._y + this._height - bbSize * (0.5 * SQRT_2);
      const ang = Math.atan2(oty - aty, otx - atx);
      const angA = ang + 0.25 * Math.PI; const angB = ang - 0.25 * Math.PI;
      const middlex = Math.cos(ang); const middley = Math.sin(ang);
      let osc = Math.sin(Math.PI * (globalTime % 0.5) / 0.5); osc *= osc;
      const [addx, addy] = [-osc * middlex * bbSize * 0.2, -osc * middley * bbSize * 0.2];
      con.fillStyle = 'rgba(255, 255, 255, 1)';
      con.beginPath();
      con.arc(atx + addx, aty + addy, bbSize * 0.4, 0, 2 * Math.PI);
      con.closePath();
      con.fill();
      con.beginPath();
      con.moveTo(atx + addx, aty + addy);
      con.lineTo(atx + addx + Math.cos(angA) * bbSize * 0.4, aty + addy + Math.sin(angA) * bbSize * 0.4);
      con.lineTo(atx + addx + middlex * bbSize * 0.4 * SQRT_2, aty + addy + middley * bbSize * 0.4 * SQRT_2);
      con.lineTo(atx + addx + Math.cos(angB) * bbSize * 0.4, aty + addy + Math.sin(angB) * bbSize * 0.4);
      con.lineTo(atx + addx, aty + addy);
      con.closePath();
      con.fill();
      drawTarget(con, this._canvas, atx + addx, aty + addy, bbSize / 4, globalSlowTime, fruitProg);
    }

    this._gameBoard.drawBackground(!this._noCyclicAni);

    if (!TURN_OFF_CYCLIC_ANIMATIONS) {
      if (isAniFrame && !this._noCyclicAni) {
        window.requestAnimationFrame(() => this.draw(true));
      } else if (this._noCyclicAni && !this._noAni && (this._animationRunning || this._isZooming)) {
        window.requestAnimationFrame(() => this.draw());
      }
    } else {
      if (this._animationRunning || this._isZooming) {
        window.requestAnimationFrame(() => this.draw());
      }
    }

    if (undo) this._gameBoard.finalUndo();
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
   * @param {number[]} removedFruitPos an array indicating the position of the fruit that was removed
   * @param {number} removedFruitProg a number indicating how the removed fruit should be scaled
   */
  drawBoardFront(state, con, bSize, bCoord, globalTime, globalSlowTime, removedFruitPos, removedFruitProg) {
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
          let type = 0;
          for (let i=0; i<state.fruitPos.length; i++) {
            if (this._state.fruitPos[i][0] == sx && this._state.fruitPos[i][1] == sy) {
              type = i;
              break;
            }
          }
          let startidx = 0; const [ffx, ffy] = [this._state.fruitPos[0][0] % 3, this._state.fruitPos[0][1] % 3];
          if (ffx == 0 && ffy == 0) startidx = 1;
          else if (ffx == 1 && ffy == 0) startidx = 2;
          else if (ffx == 2 && ffy == 0) startidx = 3;
          else if (ffx == 0 && ffy == 1) startidx = 4;
          else if (ffx == 1 && ffy == 1) startidx = 5;
          else if (ffx == 2 && ffy == 1) startidx = 6;
          else if (ffx == 0 && ffy == 2) startidx = 3;
          else if (ffx == 1 && ffy == 2) startidx = 5;
          type += startidx;
          let sc = 1;
          if (sx == removedFruitPos[0] && sy == removedFruitPos[1]) sc = removedFruitProg;
          drawFruit(con, bx, by, bSize, globalTime, type, sc);
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
    drawTarget(con, this._canvas, tx, ty, bSize, globalSlowTime, fruitProg, this._applyZoom);
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
          // fruits are in front of moving objects
        } else if (val == PORTAL) { // half in front, half in back
          // portal position is taken from game state
        } else if (val == TARGET) {
          // target position is taken from game state
        }
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
   * @param {number[][]} [borderArr] an array that will be modified to reflect whether an object is close
   * to the game board border
   * @param {boolean} [allOffsets] whether just to give all offsets
   * @return {number[][]} an array [ox, oy, drawAt] where ox, oy represent the actual coordinates to
   * draw the block / snake at and drawAt contains additional offsets indicating where to draw the snake /
   * block in addition to ox, oy (the offsets are relative to ox, oy)
   */
  _getAllOffsets(state, x, y, off, borderArr, allOffsets = false) {
    let [ox, oy] = [x + off[0], y + off[1]];
    const drawAt = [[0, 0]]; // if the part is at the border of the board, draw it on the other side of
    // the board as well (in case of this._fallThrough) -- this array contains additional offsets to add
    if (this._fallThrough) {
      if (!allOffsets) {
        while (ox < 0) ox += state.width; while (oy < 0) oy += state.height;
        ox %= state.width; oy %= state.height;
      }
      if (state.width - ox < 1 || allOffsets) drawAt.push([-state.width, 0]);
      if (state.height - oy < 1 || allOffsets) drawAt.push([0, -state.height]);
      if ((state.width - ox < 1 && state.height - oy < 1) || allOffsets) drawAt.push([-state.width, -state.height]);
      if (allOffsets) {
        drawAt.push([state.width, 0]);
        drawAt.push([0, state.height]);
        drawAt.push([state.width, state.height]);
      }
    }
    if (borderArr) { // if a border array was passed
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
        const distArrOrig = [cx + 0.5, cy + 0.5, state.width - 0.5 - cx, state.height - 0.5 - cy]; // left, top, right, bottom
        const distArr = [Math.abs(cx + 0.5), Math.abs(cy + 0.5),
          Math.abs(state.width - 0.5 - cx), Math.abs(state.height - 0.5 - cy)]; // left, top, right, bottom
        const valArr = [];
        for (let i=0; i<distArr.length; i++) {
          if (distArr[i] <= 0.5 && distArrOrig[i] > -0.5 + 1e-6) valArr.push(1);
          else if (distArr[i] <= 1.5 && distArrOrig[i] > -0.5 + 1e-6) valArr.push(1.5 - distArr[i]);
          else valArr.push(0);
        }
        setX(0, valArr[0]);
        setY(0, valArr[1]);
        setX(state.width - 1, valArr[2]);
        setY(state.height - 1, valArr[3]);
      }
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
