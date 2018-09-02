
/**
 * The minimum size of the level editor
 * @type {number[]}
 */
const LE_MIN_SIZE = [300, 200];

/**
 * Delete mode
 * @type {number}
 */
const DELETE = -6;

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
    this._snakeMap = new Map();
    this._snakes = [];
    this._snakeToCharacter = [];
    this._blockMap = new Map();
    this._blocks = [];
    this._blockToCharacter = [];
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
          this._snakes.push(new Queue([[x, y]]));
          this._snakeMap.set(c, this._snakes.length - 1);
          this._snakeToCharacter.push(c);
          this._field[x][y] = SNAKE(this._snakeMap.get(c));
        } else if (c.search(/^[a-u]$/) != -1) { // block
          if (this._blockMap.has(c)) {
            this._blocks[this._blockMap.get(c)].pushBack([x, y]);
          } else {
            this._blocks.push(new Queue([[x, y]]));
            this._blockMap.set(c, this._blocks.length - 1);
            this._blockToCharacter.push(c);
          }
          this._field[x][y] = BLOCK(this._blockMap.get(c));
        } else {
          throw new Error(`Unexpected character ${c} at position (${x}, ${y})`);
        }
      }
    }
    for (let i=0; i<this._snakes.length; i++) {
      let [cx, cy] = this._snakes[i].getBack();
      while (true) {
        if (this.getStrVal(cx + 1, cy) == '<') {
          cx++; cx %= this._bWidth; this._snakes[i].pushBack([cx, cy]);
          this._field[cx][cy] = SNAKE(i);
        } else if (this.getStrVal(cx - 1, cy) == '>') {
          cx--; cx += this._bWidth; cx %= this._bWidth; this._snakes[i].pushBack([cx, cy]);
          this._field[cx][cy] = SNAKE(i);
        } else if (this.getStrVal(cx, cy + 1) == '^') {
          cy++; cy %= this._bHeight; this._snakes[i].pushBack([cx, cy]);
          this._field[cx][cy] = SNAKE(i);
        } else if (this.getStrVal(cx, cy - 1) == 'v') {
          cy--; cy += this._bHeight; cy %= this._bHeight; this._snakes[i].pushBack([cx, cy]);
          this._field[cx][cy] = SNAKE(i);
        } else {
          break;
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
    this.changeBoardSize = this.changeBoardSize.bind(this);
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.mouseFinalLeave = this.mouseFinalLeave.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseClick = this.mouseClick.bind(this);
    this.snakeMode = this.snakeMode.bind(this);
    this.blockMode = this.blockMode.bind(this);
    this.obstacleMode = this.obstacleMode.bind(this);
    this.spikeMode = this.spikeMode.bind(this);
    this.fruitMode = this.fruitMode.bind(this);
    this.portalMode = this.portalMode.bind(this);
    this.targetMode = this.targetMode.bind(this);
    this.deleteMode = this.deleteMode.bind(this);
    this.snakeColorSelect = this.snakeColorSelect.bind(this);
    this.blockColorSelect = this.blockColorSelect.bind(this);

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

    this._addMode = OBSTACLE;
    this._selectedSnake = 'R';
    this._selectedBlock = 'a';
    this._snakeDragMode = false;

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
    explDivTmp.innerHTML = 'Levels cannot be saved or played yet. The development is still in progress.';
    this._containerDiv.appendChild(explDivTmp);

    const menCont = document.createElement('div');
    menCont.setAttribute('class', 'lvl-edit-menu-outer');
    const menCont2 = document.createElement('div');
    menCont2.setAttribute('class', 'lvl-edit-menu-inner');
    const simpleActions = [
      ['Snake', () => this.snakeMode()],
      ['Block', () => this.blockMode()],
      ['Obstacle', () => this.obstacleMode()],
      ['Spike', () => this.spikeMode()],
      ['Fruit', () => this.fruitMode()],
      ['Portal', () => this.portalMode()],
      ['Target', () => this.targetMode()],
      ['Delete', () => this.deleteMode()]
    ];
    this._simpleActionDivs = [];
    for (let i=0; i<simpleActions.length; i++) {
      const dv = document.createElement('div');
      if (simpleActions[i][0] == 'Obstacle') dv.setAttribute('class', 'lvl-edit-menu-btn selected');
      else dv.setAttribute('class', 'lvl-edit-menu-btn');
      dv.innerHTML = simpleActions[i][0];
      dv.addEventListener('click', simpleActions[i][1]);
      menCont2.appendChild(dv);
      this._simpleActionDivs.push(dv);
    }
    menCont.appendChild(menCont2);
    this._containerDiv.appendChild(menCont);

    this._snakeColorCont = document.createElement('div');
    this._snakeColorCont.setAttribute('class', 'lvl-edit-color-outer');
    const snakeCont2 = document.createElement('div');
    snakeCont2.setAttribute('class', 'lvl-edit-color-inner');
    this._snakeColorDivs = [];
    for (const prop in COLOR_MAP) {
      if (COLOR_MAP.hasOwnProperty(prop)) {
        const dv = document.createElement('div');
        if (prop == this._selectedSnake) dv.setAttribute('class', 'lvl-edit-color-btn selected');
        else dv.setAttribute('class', 'lvl-edit-color-btn');
        dv.innerHTML = prop;
        const idx = this._snakeColorDivs.length;
        dv.addEventListener('click', () => this.snakeColorSelect(prop, idx));
        dv.style.backgroundColor = COLOR_MAP[prop];
        snakeCont2.appendChild(dv);
        this._snakeColorDivs.push(dv);
      }
    }
    this._snakeColorCont.appendChild(snakeCont2);
    this._containerDiv.appendChild(this._snakeColorCont);
    this._snakeColorCont.style.display = 'none';

    this._blockColorCont = document.createElement('div');
    this._blockColorCont.setAttribute('class', 'lvl-edit-color-outer');
    const blockCont2 = document.createElement('div');
    this._blockColorDivs = [];
    for (const prop in BLOCK_COLOR_MAP) {
      if (BLOCK_COLOR_MAP.hasOwnProperty(prop)) {
        const dv = document.createElement('div');
        if (prop == this._selectedBlock.toUpperCase()) dv.setAttribute('class', 'lvl-edit-color-btn selected');
        else dv.setAttribute('class', 'lvl-edit-color-btn');
        dv.innerHTML = prop;
        const idx = this._blockColorDivs.length;
        dv.addEventListener('click', () => this.blockColorSelect(prop.toLowerCase(), idx));
        dv.style.backgroundColor = BLOCK_COLOR_MAP[prop];
        blockCont2.appendChild(dv);
        this._blockColorDivs.push(dv);
      }
    }
    blockCont2.setAttribute('class', 'lvl-edit-color-inner');
    this._blockColorCont.appendChild(blockCont2);
    this._containerDiv.appendChild(this._blockColorCont);
    this._blockColorCont.style.display = 'none';

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
      this._pmButtons[i][1].addEventListener('click', () => this.changeBoardSize(i, 0));
      this._pmButtons[i][2] = document.createElement('div');
      innerDiv2.innerHTML = '<span>-</span>';
      this._pmButtons[i][2].setAttribute('class', 'inner');
      this._pmButtons[i][2].appendChild(innerDiv2);
      this._pmButtons[i][2].addEventListener('click', () => this.changeBoardSize(i, 1));
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
   * Set the selected simple button
   * @param {number} idx the index of the selected button
   */
  setSelectedSimpleButton(idx) {
    this._snakeDragMode = false;
    for (let i=0; i<this._simpleActionDivs.length; i++) {
      if (i == idx) this._simpleActionDivs[i].setAttribute('class', 'lvl-edit-menu-btn selected');
      else this._simpleActionDivs[i].setAttribute('class', 'lvl-edit-menu-btn');
    }
    this._snakeColorCont.style.display = 'none';
    this._blockColorCont.style.display = 'none';
  }

  /**
   * Set the selected snake color select button
   * @param {number} idx the index of the selected button
   */
  setSelectedSnakeButton(idx) {
    for (let i=0; i<this._snakeColorDivs.length; i++) {
      if (i == idx) this._snakeColorDivs[i].setAttribute('class', 'lvl-edit-color-btn selected');
      else this._snakeColorDivs[i].setAttribute('class', 'lvl-edit-color-btn');
    }
  }

  /**
   * Set the selected block color select button
   * @param {number} idx the index of the selected button
   */
  setSelectedBlockButton(idx) {
    for (let i=0; i<this._blockColorDivs.length; i++) {
      if (i == idx) this._blockColorDivs[i].setAttribute('class', 'lvl-edit-color-btn selected');
      else this._blockColorDivs[i].setAttribute('class', 'lvl-edit-color-btn');
    }
  }

  /**
   * Change the board size
   * @param {number} side 0: top, 1: left, 2: right, 3: bottom
   * @param {number} dir 0: add, 1: subtract
   */
  changeBoardSize(side, dir) {
    let shift = [0, 0];
    let nWidth = this._bWidth, nHeight = this._bHeight;
    if (dir == 1) {
      if ((side == 0 || side == 3) && this._bHeight <= 1) return;
      if ((side == 1 || side == 2) && this._bWidth <= 1) return;
      if (side == 0) { nHeight--; shift = [0, -1]; }
      else if (side == 1) { nWidth--; shift = [-1, 0]; }
      else if (side == 2) { nWidth--; }
      else { nHeight--; }
    } else {
      if (side == 0) { nHeight++; shift = [0, 1]; }
      else if (side == 1) { nWidth++; shift = [1, 0]; }
      else if (side == 2) { nWidth++; }
      else { nHeight++; }
    }

    if (this._target[0] >= 0) {
      this._target[0] += shift[0];
      this._target[1] += shift[1];
    }
    for (let i=0; i<this._portalPos.length; i++) {
      if (this._portalPos[i][0] >= 0) {
        this._portalPos[i][0] += shift[0];
        this._portalPos[i][1] += shift[1];
      }
    }
    for (let i=0; i<this._fruits; i++) {
      this._fruitPos[i][0] += shift[0];
      this._fruitPos[i][1] += shift[1];
    }
    for (let i=this._snakes.length-1; i>=0; i--) {
      for (let k=this._snakes[i].length-1; k>=0; k--) {
        const [x, y] = this._snakes[i].get(k);
        const [nx, ny] = [x + shift[0], y + shift[1]];
        if (nx >= nWidth || ny >= nHeight || nx < 0 || ny < 0) this.removeSnakePart(i, x, y);
      }
    }
    for (let i=this._blocks.length-1; i>=0; i--) {
      for (let k=this._blocks[i].length-1; k>=0; k--) {
        const [x, y] = this._blocks[i].get(k);
        const [nx, ny] = [x + shift[0], y + shift[1]];
        if (nx >= nWidth || ny >= nHeight || nx < 0 || ny < 0) this.removeBlockPart(i, x, y);
      }
    }
    for (let i=0; i<this._snakes.length; i++) {
      const nQueue = new Queue();
      for (let k=0; k<this._snakes[i].length; k++) {
        const [x, y] = this._snakes[i].get(k);
        nQueue.pushBack([x + shift[0], y + shift[1]]);
      }
      this._snakes[i] = nQueue;
    }
    for (let i=0; i<this._blocks.length; i++) {
      const nQueue = new Queue();
      for (let k=0; k<this._blocks[i].length; k++) {
        const [x, y] = this._blocks[i].get(k);
        nQueue.pushBack([x + shift[0], y + shift[1]]);
      }
      this._blocks[i] = nQueue;
    }

    if (this._target[0] >= nWidth || this._target[1] >= nHeight
        || this._target[0] < 0 || this._target[1] < 0) this._target = [-1, -1];
    for (let i=this._portalPos.length-1; i>=0; i--)
      if (this._portalPos[i][0] >= nWidth || this._portalPos[i][1] >= nHeight
         || this._portalPos[i][0] < 0 || this._portalPos[i][1] < 0) this._portalPos.splice(i, 1);
    if (this._portalPos.length == 1) this._portalPos.push([-1, -1]);
    for (let i=this._fruitPos.length-1; i>=0; i--)
      if (this._fruitPos[i][0] >= nWidth || this._fruitPos[i][1] >= nHeight
         || this._fruitPos[i][0] < 0 || this._fruitPos[i][1] < 0) this._fruitPos.splice(i, 1);
    this._fruits = this._fruitPos.length;

    if (dir == 1) {
      if (side == 0) { // top
        this._lines.shift();
        for (let i=0; i<this._bWidth; i++)
          this._field[i].shift();
        this._bHeight--;
      } else if (side == 1) { // left
        this._field.shift();
        for (let i=0; i<this._bHeight; i++)
          this._lines[i] = this._lines[i].substring(1, this._bWidth);
        this._bWidth--;
      } else if (side == 2) { // right
        this._field.pop();
        for (let i=0; i<this._bHeight; i++)
          this._lines[i] = this._lines[i].substring(0, this._bWidth - 1);
        this._bWidth--;
      } else { // bottom
        this._lines.pop();
        for (let i=0; i<this._bWidth; i++)
          this._field[i].pop();
        this._bHeight--;
      }
    } else {
      if (side == 0) { // top
        let newLine = '';
        for (let i=this._bHeight; i>=1; i--) {
          for (let k=0; k<this._bWidth; k++) {
            if (i == 1) newLine += '.';
            this._field[k][i] = this._field[k][i-1];
          }
        }
        this._bHeight++;
        this._lines.splice(0, 0, newLine);
      } else if (side == 1) { // left
        this._field[this._bWidth] = [];
        for (let i=this._bWidth; i>=1; i--) {
          for (let k=0; k<this._bHeight; k++)
            this._field[i][k] = this._field[i-1][k];
        }
        for (let i=0; i<this._bHeight; i++) {
          this._field[0][i] = EMPTY;
          this._lines[i] = '.' + this._lines[i];
        }
        this._bWidth++;
      } else if (side == 2) { // right
        this._field[this._bWidth] = [];
        for (let i=0; i<this._bHeight; i++) {
          this._field[this._bWidth][i] = EMPTY;
          this._lines[i] = this._lines[i] + '.';
        }
        this._bWidth++;
      } else { // bottom
        let newLine = '';
        for (let i=0; i<this._bWidth; i++) {
          this._field[i][this._bHeight] = EMPTY;
          newLine += '.';
        }
        this._bHeight++;
        this._lines.push(newLine);
      }
    }

    this.adaptBoardDiv();
  }

  /**
   * Should be called when the mouse enters a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   */
  mouseEnter(x, y) {
    if (this._snakeDragMode && this._field[x][y] == EMPTY) {
      const idx = this._snakes.length - 1;
      const [lx, ly] = this._snakes[idx].getFront();
      const diff = Math.abs(lx - x) + Math.abs(ly - y);
      if (diff != 1) {
        this._snakeDragMode = false;
        return;
      }
      if (lx > x) this.setStrVal(lx, ly, '<');
      else if (lx < x) this.setStrVal(lx, ly, '>');
      else if (ly > y) this.setStrVal(lx, ly, '^');
      else this.setStrVal(lx, ly, 'v');
      this._snakes[idx].pushFront([x, y]);
      this._field[x][y] = SNAKE(idx);
      this.setStrVal(x, y, this._selectedSnake);
      this.adaptBoardDiv();
    } else if (this._snakeDragMode) {
      const idx = this._snakes.length - 1;
      const [lx, ly] = this._snakes[idx].getFront();
      if (lx == x && ly == y) return;
      this._snakeDragMode = false;
    } else this._snakeDragMode = false;
  }
  
  /**
   * Should be called when the mouse leaves a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   */
  mouseLeave(x, y) {

  }
  
  /**
   * Should be called when the mouse leaves the board
   */
  mouseFinalLeave() {
    this._snakeDragMode = false;
  }

  /**
   * Should be called when the mouse is pressed down in a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   */
  mouseDown(x, y) {
    if (this._addMode == SNAKE(0) && this._field[x][y] == EMPTY) {
      if (this._snakeMap.has(this._selectedSnake)) this.removeSnakeWithCharacter(this._selectedSnake);
      this._snakeDragMode = true;
      const idx = this._snakes.length;
      this._snakeMap.set(this._selectedSnake, idx);
      this._snakeToCharacter.push(this._selectedSnake);
      this._snakes[idx] = new Queue([[x, y]]);
      this._field[x][y] = SNAKE(idx);
      this.setStrVal(x, y, this._selectedSnake);
      this.adaptBoardDiv();
    }
  }
  
  /**
   * Should be called when the mouse is released in a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   */
  mouseUp(x, y) {
    this._snakeDragMode = false;
  }
  
  /**
   * Should be called when the user clicks on a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   * @param {boolean} [rightClick] if set to true: indicates that the right mouse button was used
   */
  mouseClick(x, y, rightClick = false) {
    let redraw = false;

    if (rightClick || this._addMode == DELETE) { // delete
      if (this._field[x][y] != EMPTY) {
        if (this._target[0] == x && this._target[1] == y) {
          this._target = [-1, -1];
          if (this._field[x][y] == TARGET) {
            this._field[x][y] = EMPTY;
            this.setStrVal(x, y, '.');
          }
          redraw = true;
        }
        for (let i=0; i<this._portalPos.length; i++) {
          if (this._portalPos[i][0] == x && this._portalPos[i][1] == y) {
            this._portalPos.splice(i, 1);
            if (this._field[x][y] == PORTAL) {
              this._field[x][y] = EMPTY;
              this.setStrVal(x, y, '.');
            }
            redraw = true;
            break;
          }
        }
        for (let i=0; i<this._fruitPos.length; i++) {
          if (this._fruitPos[i][0] == x && this._fruitPos[i][1] == y) {
            this._fruitPos.splice(i, 1);
            if (this._field[x][y] == FRUIT) {
              this._field[x][y] = EMPTY;
              this.setStrVal(x, y, '.');
            }
            redraw = true;
            break;
          }
        }
        this._fruits = this._fruitPos.length;
        if (this._field[x][y] == OBSTACLE || this._field[x][y] == SPIKE) {
          this._field[x][y] = EMPTY;
          this.setStrVal(x, y, '.');
          redraw = true;
        } else if (this._field[x][y] >= 32) { // block
          const blockIdx = GET_BLOCK(this._field[x][y]);
          this.removeBlockPart(blockIdx, x, y);
          redraw = true;
        } else if (this._field[x][y] > 0) { // snake
          const snakeIdx = GET_SNAKE(this._field[x][y]);
          this.removeSnakePart(snakeIdx, x, y);
          redraw = true;
        }
      }

    } else { // add
      if (this._field[x][y] == EMPTY) {
        if (this._addMode == OBSTACLE) {
          this._field[x][y] = OBSTACLE;
          this.setStrVal(x, y, '#');
          redraw = true;
        } else if (this._addMode == SPIKE) {
          this._field[x][y] = SPIKE;
          this.setStrVal(x, y, '|');
          redraw = true;
        } else if (this._addMode == FRUIT) {
          this._field[x][y] = FRUIT;
          this.setStrVal(x, y, '@');
          this._fruits++;
          this._fruitPos.push([x, y]);
          redraw = true;
        } else if (this._addMode == PORTAL) {
          this._field[x][y] = PORTAL;
          this.setStrVal(x, y, '*');
          if (this._portalPos.length == 0) {
            this._portalPos.push([x, y]);
            this._portalPos.push([-1, -1]);
          } else if (this._portalPos.length == 1) {
            this._portalPos.push([x, y]);
          } else if (this._portalPos.length == 2) {
            const [ox, oy] = this._portalPos[1];
            if (ox >= 0 && oy >= 0 && this._field[ox][oy] == PORTAL) {
              this._field[ox][oy] = EMPTY;
              this.setStrVal(ox, oy, '.');
            }
            this._portalPos[1] = [x, y];
          }
          redraw = true;
        } else if (this._addMode == TARGET) {
          const [ox, oy] = this._target;
          if (ox >= 0 && oy >= 0 && this._field[ox][oy] == TARGET) {
            this._field[ox][oy] = EMPTY;
            this.setStrVal(ox, oy, '.');
          }
          this._field[x][y] = TARGET;
          this.setStrVal(x, y, 'X');
          this._target = [x, y];
          redraw = true;
        } else if (this._addMode == BLOCK(0)) {
          if (this._blockMap.has(this._selectedBlock)) {
            this._blocks[this._blockMap.get(this._selectedBlock)].pushBack([x, y]);
          } else {
            this._blocks.push(new Queue([[x, y]]));
            this._blockMap.set(this._selectedBlock, this._blocks.length - 1);
            this._blockToCharacter.push(this._selectedBlock);
          }
          this._field[x][y] = BLOCK(this._blockMap.get(this._selectedBlock));
          this.setStrVal(x, y, this._selectedBlock);
          redraw = true;
        }
      }
    }
    for (let i=this._portalPos.length-1; i>=0; i--)
      if (this._portalPos[i][0] >= this._bWidth || this._portalPos[i][1] >= this._bHeight
         || this._portalPos[i][0] < 0 || this._portalPos[i][1] < 0) this._portalPos.splice(i, 1);
    if (this._portalPos.length == 1) this._portalPos.push([-1, -1]);
    if (redraw)
      this.adaptBoardDiv();
  }
  
  /**
   * Remove a part of a block
   * @param {number} idx the index of the block
   * @param {number} x the x coordinate of the part to remove
   * @param {number} y the y coordinate of the part to remove
   */
  removeBlockPart(idx, x, y) {
    if (this._blocks[idx].length == 1) this.removeBlockAtIdx(idx);
    else {
      const nQueue = new Queue();
      for (let i=0; i<this._blocks[idx].length; i++) {
        const [nx, ny] = this._blocks[idx].get(i);
        if (nx != x || ny != y) nQueue.pushBack([nx, ny]);
      }
      this._blocks[idx] = nQueue;
      this._field[x][y] = EMPTY;
      this.setStrVal(x, y, '.');
      this.checkTargetPortalReinsertion();
    }
  }

  /**
   * Remove a part of a snake (everything from that part to the end of the snake will be removed)
   * @param {number} idx the index of the snake
   * @param {number} x the x coordinate of the part to remove
   * @param {number} y the y coordinate of the part to remove
   */
  removeSnakePart(idx, x, y) {
    if (this._snakes[idx].length == 1) this.removeSnakeAtIdx(idx);
    else {
      const nQueue = new Queue(); let mode = 0;
      const remQueue = new Queue();
      for (let i=0; i<this._snakes[idx].length; i++) {
        const [nx, ny] = this._snakes[idx].get(i);
        if (mode == 1 || (nx == x && ny == y)) {
          mode = 1; remQueue.pushBack([nx, ny]);
        } else nQueue.pushBack([nx, ny]);
      }
      if (nQueue.length == 0) this.removeSnakeAtIdx(idx);
      else {
        this._snakes[idx] = nQueue;
        for (let i=0; i<remQueue.length; i++) {
          const [bx, by] = remQueue.get(i);
          this._field[bx][by] = EMPTY;
          this.setStrVal(bx, by, '.');
        }
        this.checkTargetPortalReinsertion();
      }
    }
  }

  /**
   * Remove the block corresponding to a certain character from the board
   * @param {string} c the character
   */
  removeBlockWithCharacter(c) {
    if (!this._blockMap.has(c)) return;
    this.removeBlockAtIdx(this._blockMap.get(c));
  }

  /**
   * Remove the block at a certain index from the board
   * @param {number} idx the 0-based index
   */
  removeBlockAtIdx(idx) {
    const oc = this._blockToCharacter[idx];
    const qu = this._blocks[idx];
    for (let i=0; i<qu.length; i++) {
      const [x, y] = qu.get(i);
      this.setStrVal(x, y, '.');
      this._field[x][y] = EMPTY;
    }
    for (let i=idx; i<(this._blocks.length-1); i++) {
      this._blocks[i] = this._blocks[i+1];
      this._blockToCharacter[i] = this._blockToCharacter[i+1];
      this._blockMap.set(this._blockToCharacter[i], i);
      for (let k=0; k<this._blocks[i].length; k++) {
        const [x, y] = this._blocks[i].get(k);
        this._field[x][y] = BLOCK(i);
      }
    }
    this._blocks.pop();
    this._blockToCharacter.pop();
    this._blockMap.delete(oc);
    this.checkTargetPortalReinsertion();
  }

  /**
   * Remove the snake corresponding to a certain character from the board
   * @param {string} c the character
   */
  removeSnakeWithCharacter(c) {
    if (!this._snakeMap.has(c)) return;
    this.removeSnakeAtIdx(this._snakeMap.get(c));
  }

  /**
   * Remove the snake at a certain index from the board
   * @param {number} idx the 0-based index
   */
  removeSnakeAtIdx(idx) {
    const oc = this._snakeToCharacter[idx];
    const qu = this._snakes[idx];
    for (let i=0; i<qu.length; i++) {
      const [x, y] = qu.get(i);
      this.setStrVal(x, y, '.');
      this._field[x][y] = EMPTY;
    }
    for (let i=idx; i<(this._snakes.length-1); i++) {
      this._snakes[i] = this._snakes[i+1];
      this._snakeToCharacter[i] = this._snakeToCharacter[i+1];
      this._snakeMap.set(this._snakeToCharacter[i], i);
      for (let k=0; k<this._snakes[i].length; k++) {
        const [x, y] = this._snakes[i].get(k);
        this._field[x][y] = SNAKE(i);
      }
    }
    this._snakes.pop();
    this._snakeToCharacter.pop();
    this._snakeMap.delete(oc);
    this.checkTargetPortalReinsertion();
  }

  /**
   * After a snake or block was removed, the target or portals might have to be reinserted
   */
  checkTargetPortalReinsertion() {
    if (this._target[0] >= 0 && this._field[this._target[0]][this._target[1]] == EMPTY) {
      this._field[this._target[0]][this._target[1]] = TARGET;
      this.setStrVal(this._target[0], this._target[1], 'X');
    }
    for (let i=0; i<this._portalPos.length; i++) {
      if (this._portalPos[i][0] >= 0 && this._field[this._portalPos[i][0]][this._portalPos[i][1]] == EMPTY) {
        this._field[this._portalPos[i][0]][this._portalPos[i][1]] = PORTAL;
        this.setStrVal(this._portalPos[i][0], this._portalPos[i][1], '*');
      }
    }
  }

  /**
   * Set the character value of a cell in the field
   * @param {number} x the x coordinate (from the top left corner)
   * @param {number} y the y coordinate (from the top left corner)
   * @param {string} val the new character value
   */
  setStrVal(x, y, val) {
    if (x < 0 || y < 0 || x >= this._bWidth || y >= this._bHeight) return;
    this._lines[y] = `${this._lines[y].substring(0, x)}${val}${this._lines[y].substring(x + 1, this._lines[y].length)}`;
  }

  /**
   * Get the value at a specific position on the field (read value from the string representation)
   * @param {number} x the x coordinate (from the top left corner)
   * @param {number} y the y coordinate (from the top left corner)
   * @return {string} the field value (from the string representation) at the given position
   */
  getStrVal(x, y) {
    if (x < 0 || y < 0 || x >= this._bWidth || y >= this._bHeight) return;
    return this._lines[y][x];
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
    this._boardSquareContainer.addEventListener('mouseleave', this.mouseFinalLeave);
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
        this._boardSquares[i][k].addEventListener('mouseenter', () => this.mouseEnter(i, k));
        this._boardSquares[i][k].addEventListener('mouseleave', () => this.mouseLeave(i, k));
        this._boardSquares[i][k].addEventListener('mousedown', () => this.mouseDown(i, k));
        this._boardSquares[i][k].addEventListener('mouseup', () => this.mouseUp(i, k));
        this._boardSquares[i][k].addEventListener('click', evt => { if (evt.button != 2) this.mouseClick(i, k); });
        this._boardSquares[i][k].addEventListener('contextmenu', evt => { evt.preventDefault(); this.mouseClick(i, k, true); });
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
   * Select the snake color
   * @param {string} c the character corresponding to the selected snake color
   * @param {number} idx the index of the corresponding button
   */
  snakeColorSelect(c, idx) {
    this._selectedSnake = c;
    this.setSelectedSnakeButton(idx);
  }

  /**
   * Select the block color
   * @param {string} c the character corresponding to the selected block color
   * @param {number} idx the index of the corresponding button
   */
  blockColorSelect(c, idx) {
    this._selectedBlock = c;
    this.setSelectedBlockButton(idx);
  }

  /**
   * Set the add mode to snake
   */
  snakeMode() {
    this._addMode = SNAKE(0);
    this.setSelectedSimpleButton(0);
    this._snakeColorCont.style.display = 'inline-block';
  }

  /**
   * Set the add mode to block
   */
  blockMode() {
    this._addMode = BLOCK(0);
    this.setSelectedSimpleButton(1);
    this._blockColorCont.style.display = 'inline-block';
  }

  /**
   * Set the add mode to obstacle
   */
  obstacleMode() {
    this._addMode = OBSTACLE;
    this.setSelectedSimpleButton(2);
  }

  /**
   * Set the add mode to obstacle
   */
  spikeMode() {
    this._addMode = SPIKE;
    this.setSelectedSimpleButton(3);
  }

  /**
   * Set the add mode to obstacle
   */
  fruitMode() {
    this._addMode = FRUIT;
    this.setSelectedSimpleButton(4);
  }

  /**
   * Set the add mode to obstacle
   */
  portalMode() {
    this._addMode = PORTAL;
    this.setSelectedSimpleButton(5);
  }

  /**
   * Set the add mode to obstacle
   */
  targetMode() {
    this._addMode = TARGET;
    this.setSelectedSimpleButton(6);
  }

  /**
   * Set the add mode to delete
   */
  deleteMode() {
    this._addMode = DELETE;
    this.setSelectedSimpleButton(7);
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
