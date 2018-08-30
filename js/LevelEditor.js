
/**
 * The minimum size of the level editor
 * @type {number[]}
 */
const LE_MIN_SIZE = [300, 200];

/**
 * The default game state
 * @type {string}
 */
const DEFAULT_GAME_STATE =
`10 10
..........
..........
......X...
..........
..........
.....@....
..>R.|#...
..######..
..........
..........`;

/**
 * A level editor
 */
class LevelEditor {
  /**
   * Create a new level editor
   * @param {HTMLElement} parentElem the parent element the editor should be added to
   * @param {LevelSelector} levelSel the parent level selector
   * @param {string} [gameState] the current game state that can be edited
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
   */
  constructor(parentElem, levelSel, gameState = DEFAULT_GAME_STATE, fallThrough = false, changeGravity = false, options = {}) {
    this._parent = parentElem;
    this._fallThrough = fallThrough;
    this._changeGravity = changeGravity;
    const { allowMovingWithoutSpace = false, allowTailBiting = false } = options;
    this._options = { allowMovingWithoutSpace, allowTailBiting };
    this._isShutDown = false;
    this._levelSel = levelSel;

    this._target = [-1, -1]; this._portalPos = [];
    this._lines = gameState.split(/\r?\n/g);
    if (this._lines[0].search(/^[0-9]+ [0-9]+$/) != -1) {
      this._lines = this._lines.slice(1);
    }
    if (this._lines[this._lines.length - 1]
        .search(/^[0-9]+ [0-9]+ (won|lost|not over)(?: [0-9]+ [0-9]+ [0-9]+ [0-9]+)?$/) != -1) {
      const lastline = this._lines[this._lines.length - 1];
      this._lines = this._lines.slice(0, this._lines.length - 1);
      const res = /^([0-9]+) ([0-9]+) (won|lost|not over)(?: ([0-9]+) ([0-9]+) ([0-9]+) ([0-9]+))?$/
        .exec(lastline);
      this._target = [parseInt(res[1]), parseInt(res[2])];
      if ((typeof res[4] === 'string') && res[4].length > 0) {
        this._portalPos.push([parseInt(res[4]), parseInt(res[5])]);
        this._portalPos.push([parseInt(res[6]), parseInt(res[7])]);
      }
    }
    this._bHeight = this._lines.length;
    this._bWidth = this._lines[0].length;
    this._field = []; this._fruitPos = []; this._fruits = 0;
    for (let x=0; x<this._bWidth; x++) {
      this._field[x] = [];
      for (let y=0; y<this._bHeight; y++) {
        this._field[x][y] = 0;
        const c = this._lines[y][x];
        if (c == 'X' || c == '$' || c == '?') { // target
          this._target = [x, y]; this._field[x][y] = TARGET;
        } else if (c == '@') { // fruit
          this._fruits++; this._field[x][y] = FRUIT; this._fruitPos.push([x, y]);
        } else if (c == '#') { // obstacle
          this._field[x][y] = OBSTACLE;
        } else if (c == '|') { // spike
          this._field[x][y] = SPIKE;
        } else if (c == '.') { // empty
          this._field[x][y] = EMPTY;
        } else if (c == '*') { // portal
          if (this._portalPos.length < 2) this._portalPos.push([x, y]); this._field[x][y] = PORTAL;
        } else if (c == '<' || c == '>' || c == 'v' || c == '^') { // snake body

        } else if (c.search(/^[A-U]$/) != -1) { // snake head
          /*this.snakes.push(new Queue([[x, y]]));
          this.snakeMap.set(c, this.snakes.length - 1);
          this.snakeToCharacter.push(c);*/
          //this._field[x][y] = SNAKE(this.snakeMap.get(c));
        } else if (c.search(/^[a-u]$/) != -1) { // block
          /*if (this.blockMap.has(c)) {
            this.blocks[this.blockMap.get(c)].pushBack([x, y]);
          } else {
            this.blocks.push(new Queue([[x, y]]));
            this.blockMap.set(c, this.blocks.length - 1);
            this.blockToCharacter.push(c);
          }*/
          //this._field[x][y] = BLOCK(this.blockMap.get(c));
        } else {
          throw new Error(`Unexpected character ${c} at position (${x}, ${y})`);
        }
      }
    }

    if (this._target[0] >= this._bWidth || this._target[1] >= this._bHeight) this._target = [-1, -1];
    for (let i=this._portalPos.length-1; i>=0; i--)
      if (this._portalPos[i][0] >= this._bWidth || this._portalPos[i][1] >= this._bHeight) this._portalPos.splice(i, 1);
    if (this._portalPos.length == 1) this._portalPos.push([-1, -1]);

    this._smallMountains = 7;
    this._mediumMountains = 5;
    this._largeMountains = 4;
    this._mountainArr = generateMountainArr(this._smallMountains, this._mediumMountains, this._largeMountains);
    const [clouds, cloudPositions] = generateCloudArr();
    this._clouds = clouds;
    this._cloudPositions = cloudPositions;
    
    this.resize = this.resize.bind(this);
    this.mainMenu = this.mainMenu.bind(this);

    this._parentDiv = document.createElement('div');
    this._parentDiv.style.position = 'absolute';
    this._parentDiv.style.left = '0px';
    this._parentDiv.style.top = '0px';
    this._parentDiv.style.zIndex = '15';
    this._parentDiv.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    this._parentDiv.style.overflow = 'auto';
    this._parentDiv.style.fontFamily = '\'Fredoka One\'';
    this._parentDiv.style.display = 'none';
    this._parentDiv.setAttribute('class', 'lvl-edit-outer-container');
    this._parent.appendChild(this._parentDiv);

    window.addEventListener('resize', this.resize);
    this._cDrawer = null;
    this.resize();
    this.rebuildHTML();
  }
  
  _getGameState() {
    if (this._isShutDown) return new GameState('2 2\n>R\n#X');
    return new GameState(`${this._height} ${this._width}\n${this._lines.join('\n')}\n${
      this._target[0] == -1 ? '0 0' : `${this._target[0]} ${this._target[1]}`
    } not over${
      this._portalPos.length == 0 ? '' : (
        ` ${this._portalPos[0][0]} ${this._portalPos[0][1]} ${
          this._portalPos[1][0] == -1 ? '0 0' : `${this._portalPos[1][0]} ${this._portalPos[1][1]}`
        }`
      )
    }`);
  }

  _getDontDraws() {
    if (this._isShutDown) return [false, false];
    return [
      this._target[0] == -1 ? true : false,
      this._portalPos.length == 0 ? false : (
        this._portalPos[1][0] == -1 ? true : false
      )
    ];
  }

  /**
   * Show this level editor
   */
  show() {
    if (this._isShutDown) return;
    this._parentDiv.style.display = 'block';
  }
  
  /**
   * Hide this level editor
   */
  hide() {
    if (this._isShutDown) return;
    this._parentDiv.style.display = 'none';
  }

  /**
   * Return to the main menu
   */
  mainMenu() {
    this._levelSel.closeEditor();
  }

  /**
   * Create the HTML structure for this level selector
   */
  rebuildHTML() {
    if (this._isShutDown) return;
    const toRainbow = text => {
      let ret = '';
      let cIdx = 0;
      for (let i=0; i<text.length; i++) {
        if (text[i] === ' ' || text[i] === '\t' || text[i] === '\r' || text[i] === '\n') ret += text[i];
        else {
          ret += `<span class="s${(cIdx + 1)}">${text[i]}</span>`;
          cIdx++; cIdx %= 7;
        }
      }
      return ret;
    };

    this._parentDiv.innerHTML = '';
    this._containerDiv = document.createElement('div');
    this._parentDiv.appendChild(this._containerDiv);
    this._containerDiv.setAttribute('class', 'lvl-edit-inner-container');
    const h1 = document.createElement('h1');
    h1.innerHTML = toRainbow('Snakebird');
    this._containerDiv.appendChild(h1);

    const mainMenuButtons = [
      ['Back to Main Menu', () => this.mainMenu()]
    ];
    for (let i=0; i<mainMenuButtons.length; i++) {
      let aMenu;
      if (typeof mainMenuButtons[i][1] === 'string') {
        aMenu = document.createElement('a');
        aMenu.setAttribute('href', mainMenuButtons[i][1]);
      }
      const menButton = document.createElement('input');
      menButton.setAttribute('type', 'button');
      menButton.setAttribute('value', mainMenuButtons[i][0]);
      menButton.setAttribute('class', 'lvl-col-button');
      if (typeof mainMenuButtons[i][1] === 'string') {
        aMenu.appendChild(menButton);
        this._containerDiv.appendChild(aMenu);
      } else {
        menButton.addEventListener('click', mainMenuButtons[i][1]);
        this._containerDiv.appendChild(menButton);
      }
    }

    const h2 = document.createElement('h2');
    h2.innerHTML = 'Level Editor';
    this._containerDiv.appendChild(h2);

    const explDivTmp = document.createElement('div');
    explDivTmp.setAttribute('class', 'bordered-text');
    explDivTmp.innerHTML = 'The level editor cannot be used yet. Its development is still in progress.';
    this._containerDiv.appendChild(explDivTmp);

    this._pmButtons = [];
    for (let i=0; i<4; i++) { // top, left, right, bottom
      this._pmButtons[i] = [];
      this._pmButtons[i][0] = document.createElement('div');
      const innerDiv1 = document.createElement('div');
      innerDiv1.setAttribute('class', 'lvl-edit-pm-inner');
      const innerDiv2 = document.createElement('div');
      innerDiv2.setAttribute('class', 'lvl-edit-pm-inner');
      this._pmButtons[i][1] = document.createElement('div');
      innerDiv1.innerHTML = '<span>+</span>';
      this._pmButtons[i][1].setAttribute('class', 'inner');
      this._pmButtons[i][1].appendChild(innerDiv1);
      this._pmButtons[i][2] = document.createElement('div');
      innerDiv2.innerHTML = '<span>-</span>';
      this._pmButtons[i][2].setAttribute('class', 'inner');
      this._pmButtons[i][2].appendChild(innerDiv2);
      this._pmButtons[i][0].appendChild(this._pmButtons[i][1]);
      this._pmButtons[i][0].appendChild(this._pmButtons[i][2]);
      if (i == 0) this._pmButtons[i][0].setAttribute('class', 'lvl-edit-pm top');
      else if (i == 1) this._pmButtons[i][0].setAttribute('class', 'lvl-edit-pm left');
      else if (i == 2) this._pmButtons[i][0].setAttribute('class', 'lvl-edit-pm right');
      else this._pmButtons[i][0].setAttribute('class', 'lvl-edit-pm bottom');
    }
    this._containerDiv.appendChild(this._pmButtons[0][0]);
    this._containerDiv.appendChild(this._pmButtons[1][0]);
    this._boardDiv = document.createElement('div');
    this._boardDiv.style.display = 'inline-block';
    this._boardDiv.setAttribute('class', 'lvl-edit-board-container');
    this._containerDiv.appendChild(this._boardDiv);
    this._containerDiv.appendChild(this._pmButtons[2][0]);
    this._containerDiv.appendChild(this._pmButtons[3][0]);

    this.adaptBoardDiv();
  }
  
  /**
   * Adapt the board div to the current game state
   */
  adaptBoardDiv() {
    if (this._isShutDown) return;

    const SQUARE_SZ = 40;
    this._boardDiv.innerHTML = '';
    this._actWidth = (SQUARE_SZ + 1) * this._bWidth + 1;
    this._actHeight = (SQUARE_SZ + 1) * this._bHeight + 1;
    this._boardDiv.style.width = `${this._actWidth}px`;
    this._boardDiv.style.minWidth = `${this._actWidth}px`;
    this._boardDiv.style.maxWidth = `${this._actWidth}px`;
    this._boardDiv.style.height = `${this._actHeight}px`;
    this._boardDiv.style.minHeight = `${this._actHeight}px`;
    this._boardDiv.style.maxHeight = `${this._actHeight}px`;
    this._pmButtons[0][0].style.width = `${this._actWidth}px`;
    this._pmButtons[0][0].style.minWidth = `${this._actWidth}px`;
    this._pmButtons[0][0].style.maxWidth = `${this._actWidth}px`;
    this._pmButtons[3][0].style.width = `${this._actWidth}px`;
    this._pmButtons[3][0].style.minWidth = `${this._actWidth}px`;
    this._pmButtons[3][0].style.maxWidth = `${this._actWidth}px`;
    this._pmButtons[1][0].style.height = `${this._actHeight}px`;
    this._pmButtons[1][0].style.minHeight = `${this._actHeight}px`;
    this._pmButtons[1][0].style.maxHeight = `${this._actHeight}px`;
    this._pmButtons[2][0].style.height = `${this._actHeight}px`;
    this._pmButtons[2][0].style.minHeight = `${this._actHeight}px`;
    this._pmButtons[2][0].style.maxHeight = `${this._actHeight}px`;

    this._boardSquareContainer = document.createElement('div');
    this._boardSquareContainer.setAttribute('class', 'lvl-edit-board');
    this._boardSquares = [];
    this._boardRows = [];
    for (let k=0; k<this._bHeight; k++) {
      this._boardRows[k] = document.createElement('div');
      this._boardRows[k].setAttribute('class', 'lvl-edit-row');
      for (let i=0; i<this._bWidth; i++) {
        if (k == 0) this._boardSquares[i] = [];
        this._boardSquares[i][k] = document.createElement('div');
        this._boardSquares[i][k].setAttribute('class', 'lvl-edit-square');
        this._boardSquares[i][k].style.width = `${SQUARE_SZ}px`;
        this._boardSquares[i][k].style.minWidth = `${SQUARE_SZ}px`;
        this._boardSquares[i][k].style.maxWidth = `${SQUARE_SZ}px`;
        this._boardSquares[i][k].style.height = `${SQUARE_SZ}px`;
        this._boardSquares[i][k].style.minHeight = `${SQUARE_SZ}px`;
        this._boardSquares[i][k].style.maxHeight = `${SQUARE_SZ}px`;
        this._boardRows[k].appendChild(this._boardSquares[i][k]);
      }
      this._boardSquareContainer.appendChild(this._boardRows[k]);
    }
    this._boardDiv.appendChild(this._boardSquareContainer);

    this._boardCan = document.createElement('canvas');
    this._boardCan.width = this._actWidth;
    this._boardCan.height = this._actHeight;
    this._boardCan.setAttribute('class', 'lvl-edit-canvas');
    this._boardDiv.appendChild(this._boardCan);

    this._bgCan = document.createElement('canvas');
    this._bgCan.width = this._actWidth;
    this._bgCan.height = this._actHeight;
    this._bgCan.setAttribute('class', 'lvl-edit-bg-canvas');
    this._boardDiv.appendChild(this._bgCan);

    const opts = Object.assign({}, this._options); const dd = this._getDontDraws();
    opts.dontDrawTarget = dd[0]; opts.dontDraw2ndPortal = dd[1]; opts.dontUseMargin = true;
    this._cDrawer = new GameDrawer(this._boardCan, 0, 0, this._actWidth, this._actHeight, this._getGameState(), null, this._fallThrough,
      this._changeGravity, opts, true, true);

    this._actualClouds = calcActClouds(this._actWidth, this._actHeight, this._clouds, this._cloudPositions);
    drawCloudsAndMountains(this._bgCan.getContext('2d'), this._actWidth, this._actHeight, this._actualClouds, this._cloudPositions,
      this._mountainArr, this._smallMountains, this._mediumMountains);
  }

  /**
   * This method will adapt the level selector size to the window size
   */
  resize() {
    if (this._isShutDown) return;
    this._width = Math.max(window.innerWidth, LE_MIN_SIZE[0]);
    this._height = Math.max(window.innerHeight, LE_MIN_SIZE[1]);

    this._parentDiv.style.width = `${this._width}px`;
    this._parentDiv.style.minWidth = `${this._width}px`;
    this._parentDiv.style.maxWidth = `${this._width}px`;
    this._parentDiv.style.height = `${this._height}px`;
    this._parentDiv.style.minHeight = `${this._height}px`;
    this._parentDiv.style.maxHeight = `${this._height}px`;
  }

  /**
   * Shut this level editor down -- that is, remove all level editor elements from the parent element
   */
  shutDown() {
    if (this._cDrawer != null) this._cDrawer.shutDown();
    this._parent.removeChild(this._parentDiv);
    this._isShutDown = true;
  }
}
