
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
   * @param {string} [name] the name of the opened level
   */
  constructor(parentElem, levelSel, gameState = DEFAULT_GAME_STATE, fallThrough = false, changeGravity = false, options = {}, name = '') {
    this._parent = parentElem;
    this._isShutDown = false;
    this._levelSel = levelSel;
    this._cLvlName = name;
    this._noOps = true;

    this._loadLevel(gameState, fallThrough, changeGravity, options);
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
    this.press = this.press.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.saveLevel = this.saveLevel.bind(this);
    this.playLevel = this.playLevel.bind(this);
    this.openLevel = this.openLevel.bind(this);

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
    this._overlay = null;

    window.addEventListener('resize', this.resize);
    this._cDrawer = null;
    this.resize();
    window.addEventListener('keyup', this.press);
    this.rebuildHTML();
  }
  
  _loadLevel(gameState = DEFAULT_GAME_STATE, fallThrough = false, changeGravity = false, options = {}, resetLvlStack = true) {
    if (this._isShutDown) return;
    this._fallThrough = fallThrough;
    this._changeGravity = changeGravity;
    const { allowMovingWithoutSpace = false, allowTailBiting = false } = options;
    this._options = { allowMovingWithoutSpace, allowTailBiting };
    if (this._checkboxes && this._checkboxes.length == 4) {
      this._checkboxes[0].checked = this._fallThrough;
      this._checkboxes[1].checked = this._changeGravity;
      this._checkboxes[2].checked = this._options.allowMovingWithoutSpace;
      this._checkboxes[3].checked = this._options.allowTailBiting;
    }

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
    
    if (resetLvlStack) {
      this._lvlStack = [this._getStateString(true)];
      this._cLvl = 0;
    }
  }

  _getStateString(overflow = false) {
    if (this._isShutDown) return '2 2\n>R\n#X';
    return `${this._bHeight} ${this._bWidth}\n${this._lines.join('\n')}\n${
      this._target[0] == -1 ? (overflow ? `${this._bWidth} ${this._bHeight}` : '0 0') : `${this._target[0]} ${this._target[1]}`
    } not over${
      this._portalPos.length == 0 ? '' : (
        ` ${this._portalPos[0][0]} ${this._portalPos[0][1]} ${
          this._portalPos[1][0] == -1 ? (overflow ? `${this._bWidth} ${this._bHeight}` : '0 0') : `${this._portalPos[1][0]} ${this._portalPos[1][1]}`
        }`
      )
    }`;
  }

  _getGameState() {
    if (this._isShutDown) return new GameState('2 2\n>R\n#X');
    return new GameState(this._getStateString());
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
    this._noOps = false;
  }
  
  /**
   * Hide this level editor
   */
  hide() {
    if (this._isShutDown) return;
    this._parentDiv.style.display = 'none';
    this._noOps = true;
  }

  /**
   * Return to the main menu
   */
  mainMenu() {
    if (this._isShutDown) return;
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
    explDivTmp.innerHTML = 'Caution: unsaved levels will be lost irrevocably. No warnings will be displayed!';
    this._containerDiv.appendChild(explDivTmp);

    const instrTextDiv = document.createElement('div');
    instrTextDiv.setAttribute('class', 'bordered-text');
    instrTextDiv.innerHTML = 'Use the menu below to select what you want to add to the level. If you select snake or block, another '
      + 'menu will pop up, enabling you to choose the color of the snakebird / block. Drag the mouse to add snakebirds, click to add '
      + 'the other stuff.';
    this._containerDiv.appendChild(instrTextDiv);

    const instrTextDiv2 = document.createElement('div');
    instrTextDiv2.setAttribute('class', 'bordered-text');
    instrTextDiv2.innerHTML = 'Note that snakebirds and portals or targets may not be layered on top of each other, even though such a '
      + 'state could be a valid game state (however, none of the available levels start in a state where a snakebird is on top of a '
      + 'portal or target).';
    this._containerDiv.appendChild(instrTextDiv2);

    const instrTextDiv3 = document.createElement('div');
    instrTextDiv3.setAttribute('class', 'bordered-text');
    instrTextDiv3.innerHTML = 'To delete objects from the board, either select delete from the menu or right click on the object you '
      + 'would like to remove.';
    this._containerDiv.appendChild(instrTextDiv3);

    const editorActions = [
      ['undo.svg', 'Undo', () => this.undo()],
      ['redo.svg', 'Redo', () => this.redo()],
      ['save.svg', 'Save', () => this.saveLevel()],
      ['play.svg', 'Play', () => this.playLevel()],
      ['open.svg', 'Open', () => this.openLevel()]
    ];
    const editCont = document.createElement('div');
    editCont.setAttribute('class', 'lvl-edit-menu-outer');
    const editCont2 = document.createElement('div');
    editCont2.setAttribute('class', 'lvl-edit-menu-inner');
    for (let i=0; i<editorActions.length; i++) {
      const dv = document.createElement('div');
      dv.setAttribute('class', 'lvl-edit-menu-btn');
      dv.innerHTML = `<img src="css/${editorActions[i][0]}" />${editorActions[i][1]}`;
      dv.addEventListener('click', editorActions[i][2]);
      editCont2.appendChild(dv);
      if (editorActions[i][1] == 'Undo') this._undoButton = dv;
      if (editorActions[i][1] == 'Redo') this._redoButton = dv;
    }
    editCont.appendChild(editCont2);
    this._containerDiv.appendChild(editCont);
    this._containerDiv.appendChild(document.createElement('br'));

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
    this._containerDiv.appendChild(document.createElement('br'));

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

    const span = document.createElement('span');
    span.setAttribute('class', 'lvl-edit-board-pm-container');
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
    span.appendChild(this._pmButtons[0][0]);
    span.appendChild(this._pmButtons[1][0]);
    this._boardDiv = document.createElement('div');
    this._boardDiv.style.display = 'inline-block';
    this._boardDiv.setAttribute('class', 'lvl-edit-board-container');
    span.appendChild(this._boardDiv);
    span.appendChild(this._pmButtons[2][0]);
    span.appendChild(this._pmButtons[3][0]);
    this._containerDiv.appendChild(span);

    const toggleActions = [
      ['Wrap-Around (snakebirds appear again on the other side)', val => this._fallThrough = val, this._fallThrough],
      ['Change gravity (when a fruit is eaten)', val => this._changeGravity = val, this._changeGravity],
      ['Allow moving without space', val => this._options.allowMovingWithoutSpace = val, this._options.allowMovingWithoutSpace],
      ['Allow tail biting', val => this._options.allowTailBiting = val, this._options.allowTailBiting]
    ];
    this._checkboxes = [];
    for (let i=0; i<toggleActions.length; i++) {
      const checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      checkbox.setAttribute('id', `lvl-edit-checkbox-${i}`);
      checkbox.setAttribute('value', toggleActions[i][0]);
      if (toggleActions[i][2]) checkbox.setAttribute('checked', 'true');
      checkbox.setAttribute('class', 'lvl-menu-checkbox');
      checkbox.addEventListener('change', () => toggleActions[i][1](checkbox.checked));
      this._containerDiv.appendChild(checkbox);
      const label = document.createElement('label');
      label.setAttribute('for', `lvl-edit-checkbox-${i}`);
      if (i == 0) label.setAttribute('class', 'lvl-menu-checkbox-label top-margin');
      else label.setAttribute('class', 'lvl-menu-checkbox-label');
      label.innerHTML = toggleActions[i][0];
      this._containerDiv.appendChild(label);
      this._checkboxes.push(checkbox);
    }

    this.adaptBoardDiv();
    this._updateUndoRedoButtons();
  }
  
  /**
   * This method should be called when a key was pressed
   * @param {object} event the event object
   */
  press(event) {
    if (this._isShutDown) return;
    if (this._noOps) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.undo();
    } else if (key === 'y' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.redo();
    } else if (key === 's' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.saveLevel();
    } else if (key === 'o' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.openLevel();
    } else if (key === 'p' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.playLevel();
    }
  }

  _updateUndoRedoButtons() {
    if (this._isShutDown) return;
    if (!this._undoButton) return;
    const [u, r] = [this._cLvl > 0, this._cLvl < this._lvlStack.length - 1];
    if (u) this._undoButton.setAttribute('class', 'lvl-edit-menu-btn');
    else this._undoButton.setAttribute('class', 'lvl-edit-menu-btn disabled');
    if (r) this._redoButton.setAttribute('class', 'lvl-edit-menu-btn');
    else this._redoButton.setAttribute('class', 'lvl-edit-menu-btn disabled');
  }

  /**
   * Undo the last change
   */
  undo() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (this._cLvl > 0) {
      this._cLvl--;
      this._loadLevel(this._lvlStack[this._cLvl], this._fallThrough, this._changeGravity, this._options, false);
      this.adaptBoardDiv();
    }
    this._updateUndoRedoButtons();
  }

  /**
   * Redo the last undone change
   */
  redo() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (this._cLvl < this._lvlStack.length - 1) {
      this._cLvl++;
      this._loadLevel(this._lvlStack[this._cLvl], this._fallThrough, this._changeGravity, this._options, false);
      this.adaptBoardDiv();
    }
    this._updateUndoRedoButtons();
  }

  _checkLevelValidity() {
    if (this._isShutDown) return;
    this._notFinishedDescr = ''; this._isNotFinished = false;
    if (this._target[0] < 0) {
      this._isNotFinished = true;
      this._notFinishedDescr = 'The target hasn\'t been added yet.';
    }
    if (!this._isNotFinished && this._portalPos.length == 2) {
      if (this._portalPos[1][0] < 0) {
        this._isNotFinished = true;
        this._notFinishedDescr = 'Only one of two portals has been added.';
      }
    }
    if (!this._isNotFinished && this._snakes.length == 0) {
      this._isNotFinished = true;
      this._notFinishedDescr = 'There are no snakebirds yet.';
    }
    if (!this._isNotFinished) {
      const cState = this._getGameState();
      const res = gameTransition(cState, null, DOWN, this._fallThrough, DOWN, true, this._changeGravity, this._options);
      const nState = res[3];
      if (res[1] == -2) {
        this._isNotFinished = true;
        this._notFinishedDescr = 'The current state immediately leads to the death of a snake. This is not a valid initial level state.';
      } else if (res[1] == -1) {
        this._isNotFinished = true;
        this._notFinishedDescr = 'The current state immediately leads to an endless loop. This is not a valid initial level state.';
      } else if (res[1] == 1) {
        this._isNotFinished = true;
        this._notFinishedDescr = 'The current state immediately leads to the game being won. This is not a valid initial level state.';
      }
      if (!this._isNotFinished) {
        if (cState.toString() != nState.toString()) {
          this._isNotFinished = true;
          this._notFinishedDescr = 'Not all snakebirds and blocks are on solid ground. This is not a valid initial level state.';
        }
      }
    }
  }

  _showOverlay(heading, txt = '', closeButton = false) {
    if (this._isShutDown) return;
    this._noOps = true;
    this._overlay = document.createElement('div');
    this._overlay.setAttribute('class', 'lvl-edit-overlay');
    this._overlay.style.zIndex = '30';
    this._overlay.style.position = 'absolute';
    this._overlay.style.left = '0px';
    this._overlay.style.top = '0px';
    this._overlay.style.overflow = 'auto';
    this._overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.75)';
    this._overlay.style.fontFamily = '\'Fredoka One\'';

    const innerOverlay = document.createElement('div');
    innerOverlay.setAttribute('class', 'lvl-edit-overlay-inner');

    const h2 = document.createElement('h2');
    h2.innerHTML = heading;
    innerOverlay.appendChild(h2);

    if (txt.length > 0) {
      const hintDiv = document.createElement('div');
      hintDiv.setAttribute('class', 'bordered-text');
      hintDiv.innerHTML = txt;
      innerOverlay.appendChild(hintDiv);
    }

    if (closeButton) {
      const inp = document.createElement('input');
      inp.setAttribute('type', 'button');
      inp.setAttribute('value', 'Close');
      inp.addEventListener('click', () => this._hideOverlay());
      innerOverlay.appendChild(inp);
    }

    this._overlay.appendChild(innerOverlay);
    document.body.appendChild(this._overlay);
    this.resize();

    return innerOverlay;
  }

  _hideOverlay() {
    if (this._isShutDown) return;
    this._noOps = false;
    this._overlay.style.display = 'none';
    if (typeof this._pureJSCheckbox === 'object')
      this._pureJSCheckbox.setAttribute('id', `blub-${Math.random()}`);
  }

  /**
   * Save the level
   */
  saveLevel() {
    if (this._isShutDown) return;
    this._myLevels = STORAGE.get('myLevels');
    this._levelNamesArr = [];
    this._levelNames = {};
    for (let i=0; i<this._myLevels.length; i++) {
      this._levelNames[this._myLevels[i].name] = true;
      this._levelNamesArr.push(this._myLevels[i].name);
    }
    this._checkLevelValidity();

    let addTxt = '';
    if (this._isNotFinished) {
      addTxt = 'The level you are about to save is not finished yet. '
        + this._notFinishedDescr
        + ' You can still save the level, but you cannot play it.';
    }
    const innerOverlay = this._showOverlay('Save Level', addTxt);

    const label = document.createElement('label');
    label.setAttribute('for', 'level-name-input');
    label.setAttribute('class', 'text-field-label');
    label.innerHTML = 'Name:';
    innerOverlay.appendChild(label);

    const txtInp = document.createElement('input');
    txtInp.setAttribute('type', 'text');
    txtInp.setAttribute('id', 'level-name-input');
    txtInp.setAttribute('value', this._cLvlName);
    txtInp.addEventListener('input', () => this._updateLvlName(txtInp.value));
    innerOverlay.appendChild(txtInp);

    this._nameHintDiv = document.createElement('div');
    this._nameHintDiv.setAttribute('class', 'bordered-text');
    this._nameHintDiv.innerHTML = this._getNameHint();
    innerOverlay.appendChild(this._nameHintDiv);

    const inp1 = document.createElement('input');
    inp1.setAttribute('type', 'button');
    inp1.setAttribute('value', 'Cancel');
    inp1.addEventListener('click', () => this._hideOverlay());
    innerOverlay.appendChild(inp1);

    const inp2 = document.createElement('input');
    inp2.setAttribute('type', 'button');
    inp2.setAttribute('value', 'Save');
    inp2.addEventListener('click', () => this._completeSave());
    innerOverlay.appendChild(inp2);
    
    const lvlLinkH2 = document.createElement('h2');
    lvlLinkH2.innerHTML = 'Share Level Link';
    innerOverlay.appendChild(lvlLinkH2);
    
    this._shareLinkInp = document.createElement('input');
    this._shareLinkInp.setAttribute('type', 'text');
    this._shareLinkInp.setAttribute('id', 'level-share-link');
    this._shareLinkInp.setAttribute('class', 'long');
    this._shareLinkInp.setAttribute('readonly', 'readonly');
    this._shareLinkInp.setAttribute('value', '');
    this._shareLinkInp.addEventListener('click', () => this._shareLinkInp.select());
    innerOverlay.appendChild(this._shareLinkInp);

    const dskH2 = document.createElement('h2');
    dskH2.innerHTML = 'Save on Disk';
    innerOverlay.appendChild(dskH2);

    this._saveAsJS = false;
    this._pureJSCheckbox = document.createElement('input');
    this._pureJSCheckbox.setAttribute('type', 'checkbox');
    this._pureJSCheckbox.setAttribute('id', 'lvl-edit-checkbox-pure-js');
    this._pureJSCheckbox.setAttribute('value', 'Save pure JS (no JSON)');
    this._pureJSCheckbox.setAttribute('class', 'lvl-menu-checkbox');
    this._pureJSCheckbox.addEventListener('change', () => this._saveAsJS = this._pureJSCheckbox.checked);
    innerOverlay.appendChild(this._pureJSCheckbox);
    const checkboxLabel = document.createElement('label');
    checkboxLabel.setAttribute('for', 'lvl-edit-checkbox-pure-js');
    checkboxLabel.setAttribute('class', 'lvl-menu-checkbox-label');
    checkboxLabel.innerHTML = 'Save pure JS (no JSON)';
    innerOverlay.appendChild(checkboxLabel);
    
    const partSaveInp = document.createElement('input');
    partSaveInp.setAttribute('type', 'button');
    partSaveInp.setAttribute('value', 'Save current level');
    partSaveInp.addEventListener('click', () => this._saveCurrent());
    innerOverlay.appendChild(partSaveInp);

    const fullSaveInp = document.createElement('input');
    fullSaveInp.setAttribute('type', 'button');
    fullSaveInp.setAttribute('value', 'Save copy of local storage');
    fullSaveInp.addEventListener('click', () => this._saveLocalStorage());
    innerOverlay.appendChild(fullSaveInp);

    this._updateLvlLink();
  }

  _updateLvlName(newName) {
    if (this._isShutDown) return;
    this._cLvlName = newName;
    this._nameHintDiv.innerHTML = this._getNameHint();
    this._updateLvlLink();
  }

  _updateLvlLink() {
    if (this._isShutDown) return;
    let baseLink = /^([^#?]*)/.exec(location.href)[1];
    if (baseLink.search(/^file:\/\/\//) != -1) baseLink = 'https://m-ff-m.github.io/snakebird/';
    const lvlObj = {
      name: this._cLvlName,
      fallThrough: this._fallThrough,
      changeGravity: this._changeGravity,
      options: this._options,
      board: this._getStateString(true),
      notFinished:  this._isNotFinished
    };
    const link = `${baseLink}?${encodeURIComponent(JSON.stringify(lvlObj))}`;
    this._shareLinkInp.setAttribute('value', link);
  }

  _getNameHint() {
    if (this._isShutDown) return;
    if (this._cLvlName == '') return 'Name must not be empty!';
    if (this._levelNames[this._cLvlName]) return 'Name has already been used. The existing level will be overwritten when you press save.';
    return 'Name hasn\'t been used yet.';
  }

  _getLvlString(lvlObj) {
    if (this._isShutDown) return '{}';
    if (this._saveAsJS) {
      let ret = '{';
      ret += `\n  name: ${JSON.stringify(lvlObj.name)}`;
      if (lvlObj.fallThrough) ret += ',\n  fallThrough: true';
      if (lvlObj.changeGravity) ret += ',\n  changeGravity: true';
      if (lvlObj.options && (lvlObj.options.allowMovingWithoutSpace || lvlObj.options.allowTailBiting)) {
        ret += ',\n  options: {';
        if (lvlObj.options.allowMovingWithoutSpace) {
          ret += ' allowMovingWithoutSpace: true';
          if (lvlObj.options.allowTailBiting) ret += ',';
          else ret += ' ';
        }
        if (lvlObj.options.allowTailBiting) ret += ' allowTailBiting: true ';
        ret += '}';
      }
      ret += `,\n  board: \`${lvlObj.board}\``;
      if (lvlObj.notFinished) ret += ',\n  notFinished: true';
      ret += '\n}';
      return ret;
    } else return JSON.stringify(lvlObj);
  }

  _saveCurrent() {
    if (this._isShutDown) return;
    let saveStr = this._getLvlString({
      name: this._cLvlName,
      fallThrough: this._fallThrough,
      changeGravity: this._changeGravity,
      options: this._options,
      board: this._getStateString(true),
      notFinished:  this._isNotFinished
    });
    if (this._saveAsJS) saveStr = `const myLevel = ${saveStr};`;
    const fs = new MFFileSaver();
    fs.saveFile(saveStr, `myLevel.js${ this._saveAsJS ? '' : 'on' }`);
  }

  _saveLocalStorage() {
    if (this._isShutDown) return;
    this._myLevels = STORAGE.get('myLevels');
    let saveStr = '';
    if (this._saveAsJS) {
      saveStr = 'const myLevels = [\n';
      for (let i=0; i<this._myLevels.length; i++) {
        if (i > 0) saveStr += ',\n\n';
        saveStr += this._getLvlString(this._myLevels[i]);
      }
      saveStr += '\n];';
    } else saveStr = JSON.stringify(this._myLevels);
    const fs = new MFFileSaver();
    fs.saveFile(saveStr, `myLevels.js${ this._saveAsJS ? '' : 'on' }`);
  }

  _completeSave() {
    if (this._isShutDown) return;
    if (this._cLvlName != '') {
      let idx = this._myLevels.length;
      for (let i=0; i<this._myLevels.length; i++) {
        if (this._myLevels[i].name == this._cLvlName) {
          idx = i;
          break;
        }
      }
      this._myLevels[idx] = {
        name: this._cLvlName,
        fallThrough: this._fallThrough,
        changeGravity: this._changeGravity,
        options: this._options,
        board: this._getStateString(true),
        notFinished:  this._isNotFinished
      };
      STORAGE.set('myLevels', this._myLevels);
      this._hideOverlay();
      this._levelSel.rebuildHTML();
    }
  }

  /**
   * Play the level
   */
  playLevel() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    this._checkLevelValidity();
    if (this._isNotFinished) {
      const innerOverlay = this._showOverlay('Level not finished', 'The level cannot be played yet. ' + this._notFinishedDescr, true);
    } else {
      this.mainMenu();
      this._levelSel.openRawLevel(this._getGameState(), this._fallThrough, this._changeGravity, this._options, this._cLvlName);
    }
  }

  /**
   * Open a level
   */
  openLevel() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    
    const innerOverlay = this._showOverlay('Open Level', 'Select a level to open from one of the options below.');

    const inp1 = document.createElement('input');
    inp1.setAttribute('type', 'button');
    inp1.setAttribute('value', 'Cancel');
    inp1.addEventListener('click', () => this._hideOverlay());
    innerOverlay.appendChild(inp1);

    this._myLevels = STORAGE.get('myLevels');
    if (this._myLevels.length > 0) {
      const myH = document.createElement('h2');
      myH.innerHTML = 'My Levels';
      innerOverlay.appendChild(myH);
      const table = document.createElement('table');
      table.setAttribute('class', 'lvl-sel-collection');
      const hTR = document.createElement('tr');
      hTR.innerHTML = '<th></th><th>Level</th><th colspan="4">Peculiarities</th>';
      table.appendChild(hTR);
      for (let k=0; k<this._myLevels.length; k++) {
        const tr = document.createElement('tr');
        const opt1 = this._myLevels[k].fallThrough;
        const opt2 = this._myLevels[k].changeGravity;
        const opt3 = this._myLevels[k].options && this._myLevels[k].options.allowMovingWithoutSpace;
        const opt4 = this._myLevels[k].options && this._myLevels[k].options.allowTailBiting;
        const delTD = document.createElement('td');
        delTD.setAttribute('class', 'icon-td');
        delTD.innerHTML = '<img title="Delete" class="info-icon" src="css/delete.svg"/>';
        delTD.addEventListener('click', () => this._deleteLvl(k));
        tr.appendChild(delTD);
        const { name = '', board, fallThrough = false, changeGravity = false, options = {} } = this._myLevels[k];
        const { allowMovingWithoutSpace = false, allowTailBiting = false } = options;
        for (let i=0; i<5; i++) {
          const ctd = document.createElement('td');
          if (i == 0) ctd.innerHTML = MFhtmlescape(this._myLevels[k].name);
          else {
            if (i == 1 && !opt1 && !opt2 && !opt3 && !opt4) {
              ctd.setAttribute('colspan', '4');
              ctd.innerHTML = 'none';
              tr.appendChild(ctd);
              ctd.addEventListener('click', () =>
                this._completeOpen(name, board, fallThrough, changeGravity, { allowMovingWithoutSpace, allowTailBiting }));
              break;
            }
            ctd.setAttribute('class', 'icon-td');
            let iHTML = '';
            if (i == 1 && opt1) iHTML = '<img title="Wrap-Around" class="info-icon" src="css/fall-through.svg"/>';
            else if (i == 2 && opt2) iHTML = '<img title="Gravity Change" class="info-icon" src="css/gravity.svg"/>';
            else if (i == 3 && opt3) iHTML = '<img title="No Space Movement" class="info-icon" src="css/no-space.svg"/>';
            else if (i == 4 && opt4) iHTML = '<img title="Tail Biting" class="info-icon" src="css/tail-biting.svg"/>';
            ctd.innerHTML = iHTML;
          }
          tr.appendChild(ctd);
          ctd.addEventListener('click', () =>
            this._completeOpen(name, board, fallThrough, changeGravity, { allowMovingWithoutSpace, allowTailBiting }));
        }
        table.appendChild(tr);
      }
      innerOverlay.appendChild(table);
    }

    const lnkH = document.createElement('h2');
    lnkH.innerHTML = 'Snakefall Level Link';
    innerOverlay.appendChild(lnkH);
    const lnkInp = document.createElement('input');
    lnkInp.setAttribute('type', 'text');
    lnkInp.addEventListener('input', () => this._checkSnakefallLink(lnkInp.value));
    lnkInp.setAttribute('class', 'long');
    innerOverlay.appendChild(lnkInp);

    this._linkHintDiv = document.createElement('div');
    this._linkHintDiv.setAttribute('class', 'bordered-text');
    this._linkHintDiv.innerHTML = '';
    innerOverlay.appendChild(this._linkHintDiv);

    const inp2 = document.createElement('input');
    inp2.setAttribute('type', 'button');
    inp2.setAttribute('value', 'OK');
    inp2.addEventListener('click', () => this._loadSnakefallLevel());
    innerOverlay.appendChild(inp2);

    this._checkSnakefallLink('');

    const dskH = document.createElement('h2');
    dskH.innerHTML = 'Open from Disk';
    innerOverlay.appendChild(dskH);
    this._openFileSelector = new MFFileSelector(innerOverlay);
    this._openFileSelector.addEventListener('load', obj => this._openFileLoaded(obj));

    this._cOpenedLevels = [];
    this._fileHintDiv = document.createElement('div');
    this._fileHintDiv.setAttribute('class', 'bordered-text');
    this._fileHintDiv.innerHTML = '';
    this._fileHintDiv.style.display = 'none';
    this._fileHintDiv.style.marginTop = '1em';
    innerOverlay.appendChild(this._fileHintDiv);

    this._fileLoadSubmit = document.createElement('input');
    this._fileLoadSubmit.setAttribute('type', 'button');
    this._fileLoadSubmit.setAttribute('value', 'Load Level(s)');
    this._fileLoadSubmit.addEventListener('click', () => this._completeFileLoad());
    innerOverlay.appendChild(this._fileLoadSubmit);

    const inp3 = document.createElement('input');
    inp3.setAttribute('type', 'button');
    inp3.setAttribute('value', 'Cancel');
    inp3.addEventListener('click', () => this._hideOverlay());
    innerOverlay.appendChild(inp3);
  }

  _completeFileLoad() {
    if (this._isShutDown) return;
    if (this._cOpenedLevels.length > 0) {
      this._hideOverlay();
      this._myLevels = STORAGE.get('myLevels');
      this._levelNamesArr = [];
      this._levelNames = {};
      for (let i=0; i<this._myLevels.length; i++) {
        this._levelNames[this._myLevels[i].name] = true;
        this._levelNamesArr.push(this._myLevels[i].name);
      }
      const innerOverlay = this._showOverlay('Open Level', 'Click on a level below to load it. The following levels have been loaded from the file:');
  
      const table = document.createElement('table');
      table.setAttribute('class', 'lvl-sel-collection');
      const hTR = document.createElement('tr');
      hTR.innerHTML = '<th></th><th>Level</th><th colspan="4">Peculiarities</th>';
      table.appendChild(hTR);
      for (let k=0; k<this._cOpenedLevels.length; k++) {
        const tr = document.createElement('tr');
        const opt1 = this._cOpenedLevels[k].fallThrough;
        const opt2 = this._cOpenedLevels[k].changeGravity;
        const opt3 = this._cOpenedLevels[k].options && this._cOpenedLevels[k].options.allowMovingWithoutSpace;
        const opt4 = this._cOpenedLevels[k].options && this._cOpenedLevels[k].options.allowTailBiting;
        const duplTD = document.createElement('td');
        duplTD.setAttribute('class', 'icon-td');
        duplTD.innerHTML = this._levelNames[this._cOpenedLevels[k].name] ?
          '<img title="Duplicate name" class="info-icon" src="css/duplicate.svg"/>' : '';
        tr.appendChild(duplTD);
        const { name = '', board, fallThrough = false, changeGravity = false, options = {} } = this._cOpenedLevels[k];
        const { allowMovingWithoutSpace = false, allowTailBiting = false } = options;
        for (let i=0; i<5; i++) {
          const ctd = document.createElement('td');
          if (i == 0) ctd.innerHTML = MFhtmlescape(this._cOpenedLevels[k].name);
          else {
            if (i == 1 && !opt1 && !opt2 && !opt3 && !opt4) {
              ctd.setAttribute('colspan', '4');
              ctd.innerHTML = 'none';
              tr.appendChild(ctd);
              break;
            }
            ctd.setAttribute('class', 'icon-td');
            let iHTML = '';
            if (i == 1 && opt1) iHTML = '<img title="Wrap-Around" class="info-icon" src="css/fall-through.svg"/>';
            else if (i == 2 && opt2) iHTML = '<img title="Gravity Change" class="info-icon" src="css/gravity.svg"/>';
            else if (i == 3 && opt3) iHTML = '<img title="No Space Movement" class="info-icon" src="css/no-space.svg"/>';
            else if (i == 4 && opt4) iHTML = '<img title="Tail Biting" class="info-icon" src="css/tail-biting.svg"/>';
            ctd.innerHTML = iHTML;
          }
          tr.appendChild(ctd);
        }
        table.appendChild(tr);
        tr.addEventListener('click', () =>
          this._completeOpen(name, board, fallThrough, changeGravity, { allowMovingWithoutSpace, allowTailBiting }));
      }
      innerOverlay.appendChild(table);

      const inp1 = document.createElement('input');
      inp1.setAttribute('type', 'button');
      inp1.setAttribute('value', 'Cancel');
      inp1.addEventListener('click', () => this._hideOverlay());
      innerOverlay.appendChild(inp1);

      const inp2 = document.createElement('input');
      inp2.setAttribute('type', 'button');
      inp2.setAttribute('value', 'Save to Local Storage (Overwrite Duplicates)');
      inp2.addEventListener('click', () => this._saveOpenedOverwrite());
      innerOverlay.appendChild(inp2);

      const inp3 = document.createElement('input');
      inp3.setAttribute('type', 'button');
      inp3.setAttribute('value', 'Save to Local Storage (Skip Duplicates)');
      inp3.addEventListener('click', () => this._saveOpenedSkip());
      innerOverlay.appendChild(inp3);
    }
  }

  _saveOpenedOverwrite() {
    if (this._isShutDown) return;
    this._hideOverlay();
    for (let k=0; k<this._cOpenedLevels.length; k++) {
      let idx = this._myLevels.length;
      for (let i=0; i<this._myLevels.length; i++) {
        if (this._myLevels[i].name == this._cOpenedLevels[k].name) {
          idx = i;
          break;
        }
      }
      this._myLevels[idx] = this._cOpenedLevels[k];
    }
    STORAGE.set('myLevels', this._myLevels);
    this._levelSel.rebuildHTML();
  }

  _saveOpenedSkip() {
    if (this._isShutDown) return;
    this._hideOverlay();
    for (let k=0; k<this._cOpenedLevels.length; k++) {
      if (!this._levelNames[this._cOpenedLevels[k].name])
        this._myLevels.push(this._cOpenedLevels[k]);
    }
    STORAGE.set('myLevels', this._myLevels);
    this._levelSel.rebuildHTML();
  }

  _openFileLoaded(obj) {
    if (this._isShutDown) return;
    this._fileHintDiv.style.display = 'block';
    let cont = obj.content;
    let hintStr = '';
    this._cOpenedLevels = [];
    const boardRegex = combineRegex([[BOARD_REGEX, '']]);
    try {
      if (cont.search(new RegExp(SINGLE_LEVEL_MATCH)) != -1) {
        hintStr = 'This file contains a single level.';
        let lvlVar = null;
        if (cont.search(new RegExp(`^${LVL_VAR_REGEX}`)) != -1) {
          if (cont.search(new RegExp(SINGLE_LEVEL_MATCH_JS)) != -1) {
            cont = cont.replace(/^\s*(?:let|const|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=/, 'lvlVar =');
            eval(cont);
          } else {
            hintStr += ' Pure JS format was detected. However, the file contents were invalid.';
          }
        } else {
          if (cont.search(new RegExp(SINGLE_LEVEL_MATCH_JSON)) != -1) {
            lvlVar = JSON.parse(cont);
          } else {
            hintStr += ' JSON format was detected. However, the file contents were invalid.';
          }
        }
        if (lvlVar && (typeof lvlVar === 'object')) {
          if (lvlVar.board.search(new RegExp(boardRegex)) != -1) {
            if (lvlVar.name == '') lvlVar.name = 'Unnamed';
            this._cOpenedLevels.push(lvlVar);
            hintStr += ' It seems to be valid.';
          } else {
            hintStr += ' However, the board description is invalid.';
          }
        }
      } else if (cont.search(new RegExp(MULTI_LEVEL_MATCH)) != -1) {
        hintStr = 'This file contains multiple levels.';
        let lvlVar = null;
        if (cont.search(new RegExp(`^${LVL_VAR_REGEX}`)) != -1) {
          if (cont.search(new RegExp(MULTI_LEVEL_MATCH_JS)) != -1) {
            cont = cont.replace(/^\s*(?:let|const|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=/, 'lvlVar =');
            eval(cont);
          } else {
            hintStr += ' Pure JS format was detected. However, the file contents were invalid.';
          }
        } else {
          if (cont.search(new RegExp(MULTI_LEVEL_MATCH_JSON)) != -1) {
            lvlVar = JSON.parse(cont);
          } else {
            hintStr += ' JSON format was detected. However, the file contents were invalid.';
          }
        }
        if (lvlVar && (typeof lvlVar === 'object') && (lvlVar instanceof Array)) {
          let correctLvls = 0; let incorrectLvls = 0;
          for (let i=0; i<lvlVar.length; i++) {
            if (typeof lvlVar[i] === 'object') {
              if (lvlVar[i].board.search(new RegExp(boardRegex)) != -1) {
                if (lvlVar[i].name == '') lvlVar[i].name = 'Unnamed';
                this._cOpenedLevels.push(lvlVar[i]);
                correctLvls++;
              } else incorrectLvls++;
            } else incorrectLvls++;
          }
          if (correctLvls == 0 && incorrectLvls == 0) {
            hintStr = 'This file contains 0 levels.';
          } else if (correctLvls > 0 && incorrectLvls == 0) {
            hintStr += ` It seems to contain ${correctLvls} valid level(s).`;
          } else if (correctLvls == 0 && incorrectLvls > 0) {
            hintStr += ` It seems to contain ${incorrectLvls} level(s) with invalid board descriptions.`;
          } else {
            hintStr += ` It seems to contain ${correctLvls} valid level(s) and ${incorrectLvls} level(s) with invalid board descriptions.`;
          }
        }
      } else {
        hintStr = 'This is not a valid level file.';
      }
    } catch (exc) {
      if (hintStr != '') hintStr += ' ';
      hintStr += 'File parsing failed.';
      console.warn('Caught exception while trying to parse file from disk!');
      console.log(exc);
    }
    this._fileHintDiv.innerHTML = hintStr;
  }

  _checkSnakefallLink(val) {
    if (this._isShutDown) return;
    try {
      this._snakefallLevel = parseSnakefallLevel(val);
      this._linkHintDiv.innerHTML = 'This is a valid Snakefall level.';
    } catch (exc) {
      this._linkHintDiv.innerHTML = `This is not a valid Snakefall level (error message: ${exc.message}).`;
      this._snakefallLevel = undefined;
    }
  }

  _loadSnakefallLevel() {
    if (this._isShutDown) return;
    if (this._snakefallLevel) {
      this._hideOverlay();
      this._cLvlName = 'Snakefall Level';
      this._loadLevel(this._snakefallLevel, false, false, { allowMovingWithoutSpace: true, allowTailBiting: false });
      this.adaptBoardDiv();
      this._updateUndoRedoButtons();
    }
  }

  _deleteLvl(idx) {
    if (this._isShutDown) return;
    this._hideOverlay();
    const lvlName = this._myLevels[idx].name;
    const innerOverlay = this._showOverlay('Delete Level', `Are you sure you want to delete the following level: ${lvlName}?`);

    const inp1 = document.createElement('input');
    inp1.setAttribute('type', 'button');
    inp1.setAttribute('value', 'Yes');
    inp1.addEventListener('click', () => this._completeDelete(idx));
    innerOverlay.appendChild(inp1);

    const inp2 = document.createElement('input');
    inp2.setAttribute('type', 'button');
    inp2.setAttribute('value', 'No');
    inp2.addEventListener('click', () => this._hideOverlay());
    innerOverlay.appendChild(inp2);
  }

  _completeDelete(idx) {
    if (this._isShutDown) return;
    this._hideOverlay();
    this._myLevels.splice(idx, 1);
    STORAGE.set('myLevels', this._myLevels);
    this._levelSel.rebuildHTML();
  }

  _completeOpen(name, board, fallThrough, changeGravity, options) {
    if (this._isShutDown) return;
    this._hideOverlay();
    this._cLvlName = name;
    this._loadLevel(board, fallThrough, changeGravity, options);
    this.adaptBoardDiv();
    this._updateUndoRedoButtons();
  }

  /**
   * Check whether to add the current state to the level stack
   */
  _checkLvlStack() {
    if (this._isShutDown) return;
    const lastState = this._lvlStack[this._cLvl];
    const cState = this._getStateString(true);
    if (lastState !== cState) {
      while (this._cLvl < this._lvlStack.length - 1) this._lvlStack.pop();
      this._cLvl++;
      this._lvlStack.push(cState);
    }
    this._updateUndoRedoButtons();
  }

  /**
   * Set the selected simple button
   * @param {number} idx the index of the selected button
   */
  setSelectedSimpleButton(idx) {
    if (this._isShutDown) return;
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
    if (this._isShutDown) return;
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
    if (this._isShutDown) return;
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
    if (this._isShutDown) return;
    if (this._noOps) return;
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
    this._checkLvlStack();
  }

  /**
   * Should be called when the mouse enters a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   */
  mouseEnter(x, y) {
    if (this._isShutDown) return;
    if (this._noOps) return;
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
      this._checkLvlStack();
      this._snakeDragMode = false;
    } else this._snakeDragMode = false;
  }
  
  /**
   * Should be called when the mouse leaves a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   */
  mouseLeave(x, y) {
    if (this._isShutDown) return;
    if (this._noOps) return;
  }
  
  /**
   * Should be called when the mouse leaves the board
   */
  mouseFinalLeave() {
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (this._snakeDragMode) this._checkLvlStack();
    this._snakeDragMode = false;
  }

  /**
   * Should be called when the mouse is pressed down in a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   */
  mouseDown(x, y) {
    if (this._isShutDown) return;
    if (this._noOps) return;
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
    if (this._isShutDown) return;
    if (this._noOps) return;
    if (this._snakeDragMode) this._checkLvlStack();
    this._snakeDragMode = false;
  }
  
  /**
   * Should be called when the user clicks on a cell
   * @param {number} x the x coordinate of the cell
   * @param {number} y the y coordinate of the cell
   * @param {boolean} [rightClick] if set to true: indicates that the right mouse button was used
   */
  mouseClick(x, y, rightClick = false) {
    if (this._isShutDown) return;
    if (this._noOps) return;
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
      
    this._checkLvlStack();
  }
  
  /**
   * Remove a part of a block
   * @param {number} idx the index of the block
   * @param {number} x the x coordinate of the part to remove
   * @param {number} y the y coordinate of the part to remove
   */
  removeBlockPart(idx, x, y) {
    if (this._isShutDown) return;
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
    if (this._isShutDown) return;
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
    if (this._isShutDown) return;
    if (!this._blockMap.has(c)) return;
    this.removeBlockAtIdx(this._blockMap.get(c));
  }

  /**
   * Remove the block at a certain index from the board
   * @param {number} idx the 0-based index
   */
  removeBlockAtIdx(idx) {
    if (this._isShutDown) return;
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
    if (this._isShutDown) return;
    if (!this._snakeMap.has(c)) return;
    this.removeSnakeAtIdx(this._snakeMap.get(c));
  }

  /**
   * Remove the snake at a certain index from the board
   * @param {number} idx the 0-based index
   */
  removeSnakeAtIdx(idx) {
    if (this._isShutDown) return;
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
    if (this._isShutDown) return;
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
    if (this._isShutDown) return;
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
    if (this._isShutDown) return '.';
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

    if (this._overlay != null) {
      this._overlay.style.width = `${this._width}px`;
      this._overlay.style.minWidth = `${this._width}px`;
      this._overlay.style.maxWidth = `${this._width}px`;
      this._overlay.style.height = `${this._height}px`;
      this._overlay.style.minHeight = `${this._height}px`;
      this._overlay.style.maxHeight = `${this._height}px`;
    }
  }

  /**
   * Select the snake color
   * @param {string} c the character corresponding to the selected snake color
   * @param {number} idx the index of the corresponding button
   */
  snakeColorSelect(c, idx) {
    if (this._isShutDown) return;
    this._selectedSnake = c;
    this.setSelectedSnakeButton(idx);
  }

  /**
   * Select the block color
   * @param {string} c the character corresponding to the selected block color
   * @param {number} idx the index of the corresponding button
   */
  blockColorSelect(c, idx) {
    if (this._isShutDown) return;
    this._selectedBlock = c;
    this.setSelectedBlockButton(idx);
  }

  /**
   * Set the add mode to snake
   */
  snakeMode() {
    if (this._isShutDown) return;
    this._addMode = SNAKE(0);
    this.setSelectedSimpleButton(0);
    this._snakeColorCont.style.display = 'inline-block';
  }

  /**
   * Set the add mode to block
   */
  blockMode() {
    if (this._isShutDown) return;
    this._addMode = BLOCK(0);
    this.setSelectedSimpleButton(1);
    this._blockColorCont.style.display = 'inline-block';
  }

  /**
   * Set the add mode to obstacle
   */
  obstacleMode() {
    if (this._isShutDown) return;
    this._addMode = OBSTACLE;
    this.setSelectedSimpleButton(2);
  }

  /**
   * Set the add mode to obstacle
   */
  spikeMode() {
    if (this._isShutDown) return;
    this._addMode = SPIKE;
    this.setSelectedSimpleButton(3);
  }

  /**
   * Set the add mode to obstacle
   */
  fruitMode() {
    if (this._isShutDown) return;
    this._addMode = FRUIT;
    this.setSelectedSimpleButton(4);
  }

  /**
   * Set the add mode to obstacle
   */
  portalMode() {
    if (this._isShutDown) return;
    this._addMode = PORTAL;
    this.setSelectedSimpleButton(5);
  }

  /**
   * Set the add mode to obstacle
   */
  targetMode() {
    if (this._isShutDown) return;
    this._addMode = TARGET;
    this.setSelectedSimpleButton(6);
  }

  /**
   * Set the add mode to delete
   */
  deleteMode() {
    if (this._isShutDown) return;
    this._addMode = DELETE;
    this.setSelectedSimpleButton(7);
  }

  /**
   * Shut this level editor down -- that is, remove all level editor elements from the parent element
   */
  shutDown() {
    if (!this._isShutDown) {
      if (this._overlay) this._hideOverlay();
      if (this._cDrawer != null) this._cDrawer.shutDown();
      this._parent.removeChild(this._parentDiv);
    }
    this._isShutDown = true;
  }
}
