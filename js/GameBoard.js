
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
   * @param {boolean} [noCyclicAni] whether or not to animate grass, clouds etc.
   * @param {boolean} [noAni] whether or not to animate falling snakes
   */
  constructor(parentElem, gameState, fallThrough = false, noCyclicAni = false, noAni = false) {
    this.resize = this.resize.bind(this);
    this.click = this.click.bind(this);
    this.canvasClick = this.canvasClick.bind(this);
    this.press = this.press.bind(this);
    this.mouseMoved = this.mouseMoved.bind(this);
    this.mouseWheel = this.mouseWheel.bind(this);
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
    this._undoButtonPos = [];
    this._redoButtonPos = [];
    this._undoHover = false;
    this._redoHover = false;
    this._stateStack = [gameState.clone()];
    this._stateStackIdx = 0;
    this._fallThrough = fallThrough;
    this._state = gameState;
    this._noCyclicAni = noCyclicAni;
    this._noAni = noAni;
    this._parent = parentElem;
    this._clouds = [];
    this._cloudPositions = [];
    this._actualClouds = [];
    for (let i=0; i<12; i++) {
      this._clouds.push(generateCloud(0.7 + Math.random() * 0.6, 12 + Math.floor(Math.random() * 7)));
      let randPosX = 0, randPosY = 0;
      if (i < 6) {
        randPosX = (i + 0.5) / 6 + (Math.random() * 0.125 - 0.01625);
        randPosY = 0.2 + Math.random() * 0.4;
      } else {
        randPosX = (i - 5.5) / 6 + (Math.random() * 0.125 - 0.01625);
        randPosY = 0.1 + Math.random() * 0.3;
      }
      this._cloudPositions.push([randPosX, randPosY]);
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
      this._height - INFO_LINE_HEIGHT, this._state, this, this._fallThrough, this._noCyclicAni,
      this._noAni);
    this._drawer.draw(true);
    this._activeSnake = this._state.snakeToCharacter[0];
    this._drawer.addEventListener('click', this.click);
    this._drawer.addEventListener('absolute click', this.canvasClick);
    this._drawer.addEventListener('mousemove', this.mouseMoved);
    window.addEventListener('resize', this.resize);
    window.addEventListener('keypress', this.press);
    window.addEventListener('wheel', this.mouseWheel);
    this.drawInfoLine();
  }

  /**
   * Redraw the game board
   */
  redraw() {
    this._drawer.draw();
    this.drawInfoLine();
    this.drawBackground(!this._noCyclicAni);
  }

  /**
   * Draw the information bar
   */
  drawInfoLine() {
    const cx = this._width / 2; const cy = INFO_LINE_HEIGHT / 2;
    const con = this._canvasArr[2].getContext('2d');
    con.clearRect(0, 0, this._width, INFO_LINE_HEIGHT);
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
  }

  /**
   * Should be called when the canvas is clicked
   * @param {number} x the x coordinate of the mouse
   * @param {number} y the y coordinate of the mouse
   */
  canvasClick(x, y) {
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
    if (oUH != this._undoHover || oRH != this._redoHover) this.drawInfoLine();
  }

  _recalcClouds() {
    const sz = Math.max(this._width, this._height);
    for (let i=0; i<this._clouds.length; i++) {
      this._actualClouds.push(moveCloudArr(scaleCloudArr(this._clouds[i], sz / 5),
        0, this._cloudPositions[i][1] * this._height));
    }
  }

  /**
   * Draw the background
   * @param {boolean} [animate] whether or not to animate the clouds
   */
  drawBackground(animate = true) {
    const cloud_sz = 1.3 * Math.max(this._width, this._height) / 10;
    if (this._actualClouds.length == 0) this._recalcClouds();
    const con = this._canvasArr[0].getContext('2d');
    con.clearRect(0, 0, this._width, this._height);
    let bgGrad = con.createLinearGradient(0, 0, 0, this._height);
    bgGrad.addColorStop(0, 'rgba(76, 174, 236, 1)');
    bgGrad.addColorStop(1, 'rgba(149, 217, 247, 1)');
    con.fillStyle = bgGrad;
    con.fillRect(0, 0, this._width, this._height);

    let aMove = ( ((new Date()).getTime() % 50000) / 50000 ) * (this._width + 2 * cloud_sz);
    let bMove = ( ((new Date()).getTime() % 80000) / 80000 ) * (this._width + 2 * cloud_sz);
    if (!animate) aMove = bMove = 0;

    for (let i=0; i<this._actualClouds.length; i++) {
      let xp = this._cloudPositions[i][0] * (this._width + 2 * cloud_sz);
      if (i < 6) con.fillStyle = 'rgba(211, 239, 250, 1)';
      else con.fillStyle = 'rgba(255, 255, 255, 1)';
      if (i < 6) xp += bMove;
      else xp += aMove;
      xp %= this._width + 2 * cloud_sz; xp -= cloud_sz;
      drawCloudPath(con, this._actualClouds[i], xp);
      con.fill();
    }
  }

  /**
   * Restart with the initial state
   */
  restart() {
    this._stateStackIdx = 0;
    this._state = this._stateStack[this._stateStackIdx].clone();
    this._drawer.setState(this._state);
    this.extraMoveCounter += this.moveCounter;
    this.moveCounter = 0;
    this.drawInfoLine();
  }

  /**
   * Undo the last move
   */
  undo() {
    if (this._stateStackIdx > 0) {
      this._stateStackIdx--;
      this._state = this._stateStack[this._stateStackIdx].clone();
      this._drawer.setState(this._state);
      this.moveCounter--;
      this.extraMoveCounter++;
      this.drawInfoLine();
    }
  }

  /**
   * Redo the last undone move
   */
  redo() {
    if (this._stateStackIdx < this._stateStack.length - 1) {
      this._stateStackIdx++;
      this._state = this._stateStack[this._stateStackIdx].clone();
      this._drawer.setState(this._state);
      this.moveCounter++;
      this.extraMoveCounter--;
      this.drawInfoLine();
    }
  }

  /**
   * Shut this game board down -- that is, remove all game board elements from the parent element
   */
  shutDown() {
    for (let i=0; i<3; i++)
      this._parent.removeChild(this._canvasArr[i]);
  }

  /**
   * This method will adapt the game board size to the window size
   */
  resize() {
    this._actualClouds = [];
    this._width = Math.max(window.innerWidth, MIN_SIZE[0]);
    this._height = Math.max(window.innerHeight, MIN_SIZE[1]);
    for (let i=0; i<3; i++) {
      this._canvasArr[i].width = this._width;
      this._canvasArr[i].height = this._height;
    }
    this._drawer.resize(0, INFO_LINE_HEIGHT, this._width, this._height - INFO_LINE_HEIGHT);
    this.drawInfoLine();
    this.drawBackground(!this._noCyclicAni);
  }

  /**
   * This method should be called when a cell on the game board is clicked
   * @param {number} x the x coordinate of the clicked cell in the game state array
   * @param {number} y the y coordinate of the clicked cell in the game state array
   */
  click(x, y) {
    const val = this._state.getVal(x, y);
    if (val > 0 && val < 32) {
      const sn = GET_SNAKE(val);
      this._activeSnake = this._state.snakeToCharacter[sn];
    }
  }

  /**
   * This method should be called when a the mouse wheel was turned
   * @param {object} event the event object
   */
  mouseWheel(event) {
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
    }
    if (check && oldState !== this._state.toString()) {
      while (this._stateStackIdx != this._stateStack.length - 1) this._stateStack.pop();
      this._stateStackIdx++;
      this._stateStack.push( this._state.clone() );
      this.moveCounter++;
      this.drawInfoLine();
    }
  }
}
