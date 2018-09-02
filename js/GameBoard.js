
/**
 * The height of the information bar above the game board (in pixels)
 * @type {number}
 */
const INFO_LINE_HEIGHT = 40;

/**
 * The minimum size of the game board
 * @type {number[]}
 */
const MIN_SIZE = [300, 200];

/**
 * The duration of the start animation in milliseconds
 * @type {number}
 */
const START_ANIMATION = 1000;

/**
 * Create a game board from a level description
 * @param {HTMLElement} parentElem the parent element the game board should be added to
 * @param {object} obj a level description object
 * @param {boolean} [noCyclicAni] whether or not to animate grass, clouds etc.
 * @param {boolean} [noAni] whether or not to animate falling snakes
 * @return {GameBoard} the correspoinding game board
 */
function fromLevelDescription(parentElem, obj, noCyclicAni = false, noAni = false) {
  const st = new GameState(obj.board);
  return new GameBoard(parentElem, st, obj.fallThrough ? true : false, obj.changeGravity ? true : false,
    obj.options || {}, noCyclicAni, noAni);
}

/**
 * Generate an array with random mountains
 * @param {number} small the number of small mountains
 * @param {number} medium the number of medium-sized mountains
 * @param {number} large the number of large mountains
 * @return {any[]} an array with the mountain information
 */
function generateMountainArr(small, medium, large) {
  const mountainArr = [];
  for (let i=0; i<small + medium + large; i++) {
    let randPosX = 0;
    let randVar = 0.25;
    if (i < small) randVar = 0.125;
    if (i < small) randPosX = (i + 0.5) / small + (Math.random() * randVar - randVar * 0.5);
    else if (i < small + medium)
      randPosX = (i - small + 0.5) / medium + (Math.random() * randVar - randVar * 0.5);
    else randPosX = (i - small - medium + 0.5) / large + (Math.random() * randVar - randVar * 0.5);
    mountainArr.push([randPosX, generateMountain(5 + Math.floor(Math.random() * 5), i >= 7)]);
  }
  return mountainArr;
}

/**
 * Generate an array with random clouds
 * @return {any[]} an array with the cloud information
 */
function generateCloudArr() {
  const clouds = [], cloudPositions = [];
  for (let i=0; i<12; i++) {
    clouds.push(generateCloud(0.7 + Math.random() * 0.6, 12 + Math.floor(Math.random() * 7)));
    let randPosX = 0, randPosY = 0;
    if (i < 6) {
      randPosX = (i + 0.5) / 6 + (Math.random() * 0.125 - 0.01625);
      randPosY = 0.2 + Math.random() * 0.4;
    } else {
      randPosX = (i - 5.5) / 6 + (Math.random() * 0.125 - 0.01625);
      randPosY = 0.1 + Math.random() * 0.3;
    }
    cloudPositions.push([randPosX, randPosY]);
  }
  return [clouds, cloudPositions];
}

/**
 * Calculate the cloud array necessary for drawing the clouds
 * @param {number} width the width of the canvas
 * @param {number} height the height of the canvas
 * @param {any[]} clouds array returned by generateCloudArr() at index 0
 * @param {any[]} cloudPositions array returned by generateCloudArr() at index 1
 * @return {any[]} an array with the cloud information
 */
function calcActClouds(width, height, clouds, cloudPositions) {
  const actualClouds = [];
  const sz = Math.max(width, height);
  for (let i=0; i<clouds.length; i++) {
    actualClouds.push(moveCloudArr(scaleCloudArr(clouds[i], sz / 5),
      0, cloudPositions[i][1] * height));
  }
  return actualClouds;
}

/**
 * Draw clouds and mountains
 * @param {CanvasRenderingContext2D} con the context of the canvas the clouds should be drawn on
 * @param {number} width the width of the canvas
 * @param {number} height the height of the canvas
 * @param {any[]} actualClouds array returned by calcActClouds()
 * @param {any[]} cloudPositions array returned by generateCloudArr() at index 1
 * @param {any[]} mountainArr array returned by generateMountainArr()
 * @param {number} small the number of small mountains
 * @param {number} medium the number of medium-sized mountains
 * @param {boolean} [animate] whether or not to animate the clouds
 */
function drawCloudsAndMountains(con, width, height, actualClouds, cloudPositions, mountainArr, small, medium, animate = false) {
  const cloud_sz = 1.3 * Math.max(width, height) / 10;
  con.clearRect(0, 0, width, height);
  let bgGrad = con.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, 'rgba(76, 174, 236, 1)');
  bgGrad.addColorStop(1, 'rgba(188, 232, 251, 1)');
  con.fillStyle = bgGrad;
  con.fillRect(0, 0, width, height);

  let aMove = ( ((new Date()).getTime() % 50000) / 50000 ) * (width + 2 * cloud_sz);
  let bMove = ( ((new Date()).getTime() % 80000) / 80000 ) * (width + 2 * cloud_sz);
  if (!animate) aMove = bMove = 0;

  for (let i=0; i<actualClouds.length; i++) {
    let xp = cloudPositions[i][0] * (width + 2 * cloud_sz);
    if (i < 6) con.fillStyle = 'rgba(211, 239, 250, 1)';
    else con.fillStyle = 'rgba(255, 255, 255, 1)';
    if (i < 6) xp += bMove;
    else xp += aMove;
    xp %= width + 2 * cloud_sz; xp -= cloud_sz;
    drawCloudPath(con, actualClouds[i], xp);
    con.fill();
  }

  const mountain_sz = Math.max(width, height) / 6;
  const yp = height;
  for (let i=0; i<mountainArr.length; i++) {
    const xp = mountainArr[i][0] * width;
    if (i < small) con.fillStyle = 'rgba(143, 213, 247, 1)';
    else if (i < small + medium) con.fillStyle = 'rgba(120, 199, 243, 1)';
    else con.fillStyle = 'rgba(76, 176, 241, 1)';
    drawMountainPath(con, mountainArr[i][1], xp, yp, mountain_sz, mountain_sz * 1.3);
    con.fill();
  }
}

/**
 * Represents a snake bird game board
 */
class GameBoard {
  /**
   * Create a new game board
   * @param {HTMLElement} parentElem the parent element the game board should be added to
   * @param {GameState} gameState the current game state (the initial game state)
   * @param {boolean} [fallThrough] if set to true, snakes and objects that fall out of the board
   * will appear again at the top (and if they leave the board through the left border, they appear
   * again at the right side of the board)
   * @param {boolean} [changeGravity] whether to change the direction of gravity in clockwise order
   * when the snake eats a fruit
   * @param {object} [options] additional options to be taken into account when calculating the next state
   * @param {boolean} [options.allowMovingWithoutSpace] if set to true, a snake can move without space
   * if the object blocking its path is moved at the same time
   * @param {boolean} [options.allowTailBiting] if allowMovingWithoutSpace is set to true, but this
   * parameter is set to false, a snake can move without space if it is not blocking itself
   * @param {boolean} [noCyclicAni] whether or not to animate grass, clouds etc.
   * @param {boolean} [noAni] whether or not to animate falling snakes
   */
  constructor(parentElem, gameState, fallThrough = false, changeGravity = false, options = {}, noCyclicAni = false, noAni = false) {
    const { allowMovingWithoutSpace = false, allowTailBiting = false } = options;
    this._options = { allowMovingWithoutSpace, allowTailBiting };
    this.resize = this.resize.bind(this);
    this.click = this.click.bind(this);
    this.canvasClick = this.canvasClick.bind(this);
    this.press = this.press.bind(this);
    this.mouseMoved = this.mouseMoved.bind(this);
    this.mouseWheel = this.mouseWheel.bind(this);
    this.drawForeground = this.drawForeground.bind(this);
    /**
     * Counts the number of moves needed to reach the current state
     * @type {number}
     */
    this.moveCounter = 0;
    /**
     * Counts the number of extra moves needed (moves that were undone again) to reach the current state
     * @type {number}
     */
    this.extraMoveCounter = 0;
    this._isShutDown = false; // if set to true, this game board shouldn't do anything anymore
    this._noOps = true; // if set to true, do not process any user input
    this._gameStartTime = (new Date()).getTime();
    this._gameWon = false; this._gameWonTime = 0;
    this._undoButtonPos = [];
    this._redoButtonPos = [];
    this._undoHover = false;
    this._redoHover = false;
    this._stateStack = [gameState.clone()];
    this._stateStackIdx = 0;
    this._fallThrough = fallThrough;
    this._changeGravity = changeGravity;
    this._initialState = gameState.toString();
    this._state = gameState;
    this._noCyclicAni = noCyclicAni;
    this._noAni = noAni;
    this._parent = parentElem;
    this._wonListeners = [];
    this._menuOpenListeners = [];
    const [clouds, cloudPositions] = generateCloudArr();
    this._clouds = clouds;
    this._cloudPositions = cloudPositions;
    this._actualClouds = [];
    this._smallMountains = 7;
    this._mediumMountains = 5;
    this._largeMountains = 4;
    this._mountainArr = generateMountainArr(this._smallMountains, this._mediumMountains, this._largeMountains);
    this._cloudOverlayPoints = 8;
    this._cloudOverlayArr = []; // [angle, radScale, leftAng, rightAng, leftSc, rightSc]
    for (let i=0; i<4; i++) {
      this._cloudOverlayArr[i] = [];
      for (let k=0; k<this._cloudOverlayPoints; k++) {
        if (k == 0) this._cloudOverlayArr[i].push([-0.005 * Math.PI, 1]);
        else {
          let angle = (k / (this._cloudOverlayPoints - 1)) * 0.5 * Math.PI;
          if (k < this._cloudOverlayPoints - 1) angle += (0.02 * Math.random() - 0.01) * Math.PI;
          let radScale = 1;
          if (k < this._cloudOverlayPoints - 1) radScale += Math.random() * 0.2 - 0.1;
          const lAng = (0.2 * Math.random() - 0.05) * Math.PI;
          const rAng = (-0.2 * Math.random() + 0.05) * Math.PI;
          const lScale = 0.8 + Math.random() * 0.4;
          const rScale = 0.8 + Math.random() * 0.4;
          this._cloudOverlayArr[i].push([angle, radScale, lAng, rAng, lScale, rScale]);
        }
      }
    }
    this._canvasArr = [];
    this._width = Math.max(window.innerWidth, MIN_SIZE[0]);
    this._height = Math.max(window.innerHeight, MIN_SIZE[1]);
    for (let i=0; i<3; i++) {
      this._canvasArr[i] = document.createElement('canvas');
      this._canvasArr[i].style.position = 'absolute';
      this._canvasArr[i].style.left = '0px';
      this._canvasArr[i].style.top = '0px';
      this._canvasArr[i].width = this._width;
      this._canvasArr[i].height = this._height;
      this._canvasArr[i].style.zIndex = i;
      if (i == 2)
        this._canvasArr[i].style.pointerEvents = 'none';
      this._parent.appendChild(this._canvasArr[i]);
    }
    this._drawer = new GameDrawer(this._canvasArr[1], 0, INFO_LINE_HEIGHT, this._width,
      this._height - INFO_LINE_HEIGHT, this._state, this, this._fallThrough, this._changeGravity,
      this._options, this._noCyclicAni, this._noAni);
    this._drawer.draw(true);
    this._activeSnake = this._state.snakeToCharacter[0];
    this._drawer.setActiveSnake(this._activeSnake);
    this._drawer.addEventListener('click', this.click);
    this._drawer.addEventListener('absolute click', this.canvasClick);
    this._drawer.addEventListener('mousemove', this.mouseMoved);
    window.addEventListener('resize', this.resize);
    window.addEventListener('keyup', this.press);
    window.addEventListener('wheel', this.mouseWheel);
    this.drawForeground(true);
  }

  /**
   * Set the animation variables
   * @param {boolean} [noCyclicAni] whether or not to animate grass, clouds etc.
   * @param {boolean} [noAni] whether or not to animate falling snakes
   */
  setAniVars(noCyclicAni = false, noAni = false) {
    this._drawer.setAniVars(noCyclicAni, noAni);
  }

  /**
   * Add an event listener to this game board
   * @param {string} type a string specifying the type of event the listener should listen to. Currently,
   * only 'game won' and 'open menu' are supported - 'game won' listeners are evoked when the user finished
   * and won the level; 'open menu' when the user opens the menu by pressing 'Escape' or 'm'.
   * @param {Function} listener the event listener that will be called when the specified event occurred
   */
  addEventListener(type, listener) {
    if (this._isShutDown) return;
    if (type === 'game won') {
      this._wonListeners.push(listener);
    } else if (type === 'open menu') {
      this._menuOpenListeners.push(listener);
    }
  }

  /**
   * Should be called when the user completed the level
   */
  gameWon() {
    if (this._isShutDown) return;
    this._gameWon = true; this._gameWonTime = (new Date()).getTime();
    this._noOps = true;
    this.drawForeground(true);
  }

  /**
   * Redraw the game board
   */
  redraw() {
    if (this._isShutDown) return;
    this._drawer.draw();
    this.drawForeground();
    this.drawBackground(!this._noCyclicAni);
  }

  /**
   * Draw the information bar and any other overlays
   * @param {boolean} [animate] if set to true, the call is treated as an animation frame
   */
  drawForeground(animate = false) {
    if (this._isShutDown) return;
    const cx = this._width / 2; const cy = INFO_LINE_HEIGHT / 2;
    const con = this._canvasArr[2].getContext('2d');
    con.clearRect(0, 0, this._width, this._height);
    con.font = `${Math.ceil(INFO_LINE_HEIGHT / 2)}px \'Fredoka One\'`;
    con.fillStyle = 'rgba(255, 255, 255, 1)';
    con.textAlign = 'center';
    con.textBaseline = 'middle';
    let moveTxt = `${this.moveCounter} move${(this.moveCounter == 1 ? '' : 's')}`;
    let buttonDist = 5.5;
    if (this._width >= INFO_LINE_HEIGHT * 15) {
      moveTxt += ` / ${this.extraMoveCounter} move${(this.extraMoveCounter == 1 ? '' : 's')} undone`;
      if (this._width > INFO_LINE_HEIGHT * 18)
        buttonDist = 7;
    } else {
      if (this._width < INFO_LINE_HEIGHT * 10) buttonDist = 2.5;
      else buttonDist = 3;
    }
    borderedText(con, moveTxt, cx, cy, 'rgba(255, 255, 255, 1)', 'rgba(55, 117, 161, 1)',
      INFO_LINE_HEIGHT / 20);
    if (this._stateStackIdx > 0) { // draw undo button
      let bcolor = 'rgba(78, 141, 188, 1)';
      if (this._undoHover) bcolor = 'rgba(78, 168, 188, 1)';
      this._undoButtonPos = drawButton(con, cx - INFO_LINE_HEIGHT * buttonDist, cy, INFO_LINE_HEIGHT * 0.8,
        bcolor, 'rgba(55, 117, 161, 1)', '< Undo');
    } else {
      this._undoButtonPos = []; this._undoHover = false;
    }
    if (this._stateStackIdx < this._stateStack.length - 1) { // draw redo button
      let bcolor = 'rgba(78, 141, 188, 1)';
      if (this._redoHover) bcolor = 'rgba(78, 168, 188, 1)';
      this._redoButtonPos = drawButton(con, cx + INFO_LINE_HEIGHT * buttonDist, cy, INFO_LINE_HEIGHT * 0.8,
        bcolor, 'rgba(55, 117, 161, 1)', 'Redo >');
    } else {
      this._redoButtonPos = []; this._redoHover = false;
    }
    if (!FONTS_WERE_LOADED) {
      con.font = `${Math.ceil(INFO_LINE_HEIGHT / 4)}px \'Fredoka One\'`;
      con.fillText('(loading fonts)', cx, cy + 0.7 * INFO_LINE_HEIGHT / 2);
    }

    let continueAnimation = false; let drawCloudOverlay = 0; let gameWonTextProgr = 0; let callWonListeners = false;
    const cTime = (new Date()).getTime();
    if (this._gameWon) {
      const timePassed = cTime - this._gameWonTime;
      if (timePassed < 3 * START_ANIMATION) {
        continueAnimation = true;
        if (timePassed < START_ANIMATION) gameWonTextProgr = timePassed / START_ANIMATION;
        else gameWonTextProgr = 1;
        if (timePassed > 2 * START_ANIMATION) drawCloudOverlay = (timePassed - 2 * START_ANIMATION) / START_ANIMATION;
      } else {
        drawCloudOverlay = 1;
        callWonListeners = true;
      }
    } else {
      const timePassed = cTime - this._gameStartTime;
      if (timePassed < START_ANIMATION) {
        continueAnimation = true;
        drawCloudOverlay = 1 - timePassed / START_ANIMATION;
      } else {
        this._noOps = false;
      }
    }
    if (gameWonTextProgr > 0) {
      const fontSize = Math.min(this._width * 0.15, this._height * 0.5);
      borderedTextAppear(con, 'Well done!', this._width / 2, this._height / 2, 'rgba(255, 255, 255, 1)', 'rgba(255, 153, 51, 1)',
        fontSize, '\'Fredoka One\'', gameWonTextProgr);
    }
    if (drawCloudOverlay > 0) {
      con.fillStyle = 'rgba(255, 255, 255, 1)';
      const circleRad = 1.2 * Math.sqrt(this._width * this._width / 4 + this._height * this._height / 4);
      const cCircleRad = (1 - drawCloudOverlay) * circleRad;
      for (let i=0; i<4; i++) { // [angle, radScale, leftAng, rightAng, leftSc, rightSc]
        con.beginPath();
        if (i == 0) // top right
          con.moveTo(this._width / 2 + 2 * circleRad, this._height / 2 + 5);
        else if (i == 1) // top left
          con.moveTo(this._width / 2 + 5, this._height / 2 - 2 * circleRad);
        else if (i == 2) // bottom left
          con.moveTo(this._width / 2 - 2 * circleRad, this._height / 2 - 5);
        else // bottom right
          con.moveTo(this._width / 2 - 5, this._height / 2 + 2 * circleRad);
        let lx, ly;
        for (let k=0; k<this._cloudOverlayPoints; k++) {
          const [cAng, cRad] = [-i * 0.5 * Math.PI - this._cloudOverlayArr[i][k][0], this._cloudOverlayArr[i][k][1]];
          const [x, y] = [this._width / 2 + Math.cos(cAng) * cCircleRad * cRad, this._height / 2 + Math.sin(cAng) * cCircleRad * cRad];
          if (k == 0) con.lineTo(x, y);
          else bezierCurve(con, lx, ly, x, y, this._cloudOverlayArr[i][k][2], this._cloudOverlayArr[i][k][3],
            this._cloudOverlayArr[i][k][4], this._cloudOverlayArr[i][k][5]);
          [lx, ly] = [x, y];
        }
        if (i == 0) { // top right
          con.lineTo(this._width / 2 - 5, this._height / 2 - 2 * circleRad);
          con.lineTo(this._width / 2 + 2 * circleRad, this._height / 2 - 2 * circleRad);
          con.lineTo(this._width / 2 + 2 * circleRad, this._height / 2 + 5);
        } else if (i == 1) { // top left
          con.lineTo(this._width / 2 - 2 * circleRad, this._height / 2 + 5);
          con.lineTo(this._width / 2 - 2 * circleRad, this._height / 2 - 2 * circleRad);
          con.lineTo(this._width / 2 + 5, this._height / 2 - 2 * circleRad);
        } else if (i == 2) { // bottom left
          con.lineTo(this._width / 2 + 5, this._height / 2 + 2 * circleRad);
          con.lineTo(this._width / 2 - 2 * circleRad, this._height / 2 + 2 * circleRad);
          con.lineTo(this._width / 2 - 2 * circleRad, this._height / 2 - 5);
        } else { // bottom right
          con.lineTo(this._width / 2 + 2 * circleRad, this._height / 2 - 5);
          con.lineTo(this._width / 2 + 2 * circleRad, this._height / 2 + 2 * circleRad);
          con.lineTo(this._width / 2 - 5, this._height / 2 + 2 * circleRad);
        }
        con.closePath();
        con.fill();
      }
    }
    if (continueAnimation && animate)
      window.requestAnimationFrame(() => this.drawForeground(true));

    if (callWonListeners) {
      for (let i=0; i<this._wonListeners.length; i++)
        this._wonListeners[i](this.moveCounter, this.extraMoveCounter);
    }
  }

  /**
   * Should be called when the canvas is clicked
   * @param {number} x the x coordinate of the mouse
   * @param {number} y the y coordinate of the mouse
   */
  canvasClick(x, y) {
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (this._undoButtonPos.length > 0) {
      const [xa, ya] = [x - this._undoButtonPos[0], y - this._undoButtonPos[1]];
      if (xa >= 0 && ya >= 0 && xa <= this._undoButtonPos[2] && ya <= this._undoButtonPos[3])
        this.undo();
    }
    if (this._redoButtonPos.length > 0) {
      const [xa, ya] = [x - this._redoButtonPos[0], y - this._redoButtonPos[1]];
      if (xa >= 0 && ya >= 0 && xa <= this._redoButtonPos[2] && ya <= this._redoButtonPos[3])
        this.redo();
    }
  }

  /**
   * Should be called when the mouse was moved
   * @param {object} event the event object
   */
  mouseMoved(event) {
    if (this._isShutDown) return;
    if (this._noOps) return;
    const [x, y] = [event.clientX, event.clientY];
    const oUH = this._undoHover;
    const oRH = this._redoHover;
    if (this._undoButtonPos.length > 0) {
      const [xa, ya] = [x - this._undoButtonPos[0], y - this._undoButtonPos[1]];
      if (xa >= 0 && ya >= 0 && xa <= this._undoButtonPos[2] && ya <= this._undoButtonPos[3])
        this._undoHover = true;
      else
        this._undoHover = false;
    } else this._undoHover = false;
    if (this._redoButtonPos.length > 0) {
      const [xa, ya] = [x - this._redoButtonPos[0], y - this._redoButtonPos[1]];
      if (xa >= 0 && ya >= 0 && xa <= this._redoButtonPos[2] && ya <= this._redoButtonPos[3])
        this._redoHover = true;
      else
        this._redoHover = false;
    } else this._redoHover = false;
    if (oUH != this._undoHover || oRH != this._redoHover) this.drawForeground();
  }

  _recalcClouds() {
    if (this._isShutDown) return;
    this._actualClouds = calcActClouds(this._width, this._height, this._clouds, this._cloudPositions);
  }

  /**
   * Draw the background
   * @param {boolean} [animate] whether or not to animate the clouds
   */
  drawBackground(animate = true) {
    if (this._isShutDown) return;
    if (this._actualClouds.length == 0) this._recalcClouds();
    const con = this._canvasArr[0].getContext('2d');
    drawCloudsAndMountains(con, this._width, this._height, this._actualClouds, this._cloudPositions, this._mountainArr,
      this._smallMountains, this._mediumMountains, animate);
  }

  /**
   * Restart with the initial state
   */
  restart() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    this._stateStackIdx = 0;
    this._state = this._stateStack[this._stateStackIdx].clone();
    this._drawer.setState(this._state);
    this.extraMoveCounter += this.moveCounter;
    this.moveCounter = 0;
    this.drawForeground();
  }

  /**
   * Undo the last move irrevocably
   */
  finalUndo() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (this._stateStackIdx > 0) {
      this.undo();
      this._stateStack.pop();
      this.drawForeground();
    }
  }

  /**
   * Undo the last move
   */
  undo() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (this._stateStackIdx > 0) {
      this._stateStackIdx--;
      this._state = this._stateStack[this._stateStackIdx].clone();
      this._drawer.setState(this._state);
      this.moveCounter--;
      this.extraMoveCounter++;
      this.drawForeground();
    }
  }

  /**
   * Redo the last undone move
   */
  redo() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (this._stateStackIdx < this._stateStack.length - 1) {
      this._stateStackIdx++;
      this._state = this._stateStack[this._stateStackIdx].clone();
      this._drawer.setState(this._state);
      this.moveCounter++;
      this.extraMoveCounter--;
      this.drawForeground();
    }
  }

  /**
   * Shut this game board down -- that is, remove all game board elements from the parent element
   */
  shutDown() {
    this._drawer.shutDown();
    for (let i=0; i<3; i++)
      this._parent.removeChild(this._canvasArr[i]);
    this._isShutDown = true;
  }

  /**
   * This method will adapt the game board size to the window size
   */
  resize() {
    if (this._isShutDown) return;
    this._actualClouds = [];
    this._width = Math.max(window.innerWidth, MIN_SIZE[0]);
    this._height = Math.max(window.innerHeight, MIN_SIZE[1]);
    for (let i=0; i<3; i++) {
      this._canvasArr[i].width = this._width;
      this._canvasArr[i].height = this._height;
    }
    this._drawer.resize(0, INFO_LINE_HEIGHT, this._width, this._height - INFO_LINE_HEIGHT);
    this.drawForeground();
    this.drawBackground(!this._noCyclicAni);
  }

  /**
   * This method should be called when a cell on the game board is clicked
   * @param {number} x the x coordinate of the clicked cell in the game state array
   * @param {number} y the y coordinate of the clicked cell in the game state array
   */
  click(x, y) {
    if (this._isShutDown) return;
    if (this._noOps) return;
    const val = this._state.getVal(x, y);
    if (val > 0 && val < 32) {
      const sn = GET_SNAKE(val);
      this._activeSnake = this._state.snakeToCharacter[sn];
      this._drawer.setActiveSnake(this._activeSnake);
      if (this._noCyclicAni) this._drawer.draw();
    }
  }

  /**
   * This method should be called when a the mouse wheel was turned
   * @param {object} event the event object
   */
  mouseWheel(event) {
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (event.deltaY < 0) {
      event.preventDefault();
      this._drawer.zoomIn();
    } else if (event.deltaY > 0) {
      event.preventDefault();
      this._drawer.zoomOut();
    }
  }

  /**
   * This method should be called when a key was pressed
   * @param {object} event the event object
   */
  press(event) {
    if (this._isShutDown) return;
    if (this._noOps) return;
    const key = event.key.toLowerCase();
    const oldState = this._state.toString(); let check = false;
    if (key === 'a' || key === 'arrowleft') {
      event.preventDefault();
      this._state = this._drawer.tryMove(this._activeSnake, LEFT) || this._state; check = true;
    } else if (key === 'd' || key === 'arrowright') {
      event.preventDefault();
      this._state = this._drawer.tryMove(this._activeSnake, RIGHT) || this._state; check = true;
    } else if (key === 'w' || key === 'arrowup') {
      event.preventDefault();
      this._state = this._drawer.tryMove(this._activeSnake, UP) || this._state; check = true;
    } else if (key === 's' || key === 'arrowdown') {
      event.preventDefault();
      this._state = this._drawer.tryMove(this._activeSnake, DOWN) || this._state; check = true;
    } else if (key === 'z' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.undo();
    } else if (key === 'y' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.redo();
    } else if (key === 'r' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.restart();
    } else if (key === '+') {
      event.preventDefault();
      this._drawer.zoomIn();
    } else if (key === '-') {
      event.preventDefault();
      this._drawer.zoomOut();
    } else if (key === 'escape' || key === 'm') {
      for (let i=0; i<this._menuOpenListeners.length; i++)
        this._menuOpenListeners[i](this._initialState, this._state.toString(), this._fallThrough, this._changeGravity, this._options);
      this._noOps = true;
    }
    if (check && oldState !== this._state.toString()) {
      while (this._stateStackIdx != this._stateStack.length - 1) this._stateStack.pop();
      this._stateStackIdx++;
      this._stateStack.push( this._state.clone() );
      this.moveCounter++;
      this.drawForeground();
    }
  }

  /**
   * Should be called when the menu is closed
   */
  menuClosed() {
    this._noOps = false;
  }
}
