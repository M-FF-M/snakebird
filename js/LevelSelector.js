
/**
 * The minimum size of the level selector
 * @type {number[]}
 */
const LS_MIN_SIZE = [300, 200];

/**
 * A collection of levels
 */
class LevelCollection {
  /**
   * Create a new level collection
   * @param {string} name the name of the collection
   * @param {object[]} levels the levels of this collection
   */
  constructor(name, levels) {
    /**
     * The name of this level collection
     * @type {string}
     */
    this.name = name;
    /**
     * An array with the level objects belonging to this collection
     * @type {object[]}
     */
    this.levels = levels;
  }
}

/**
 * A class for displaying all available levels and let the user play them
 */
class LevelSelector {
  /**
   * Create a new level selector
   * @param {HTMLElement} parentElem the parent element the level selector should be added to
   * @param {LevelCollection[]} levelCollections an array with level collections
   */
  constructor(parentElem, levelCollections) {
    this.resize = this.resize.bind(this);
    this.openLevel = this.openLevel.bind(this);
    this.levelWon = this.levelWon.bind(this);
    this.returnToMainMenu = this.returnToMainMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.cyclicAnis = this.cyclicAnis.bind(this);
    this.anis = this.anis.bind(this);
    this._parent = parentElem;
    this._lvlCollections = levelCollections;

    this._parentDiv = document.createElement('div');
    this._parentDiv.style.position = 'absolute';
    this._parentDiv.style.left = '0px';
    this._parentDiv.style.top = '0px';
    this._parentDiv.style.zIndex = '10';
    this._parentDiv.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    this._parentDiv.style.overflow = 'auto';
    this._parentDiv.style.fontFamily = '\'Fredoka One\'';
    this._parentDiv.setAttribute('class', 'lvl-sel-outer-container');
    this._parent.appendChild(this._parentDiv);

    this._menuParentDiv = document.createElement('div');
    this._menuParentDiv.style.position = 'absolute';
    this._menuParentDiv.style.left = '0px';
    this._menuParentDiv.style.top = '0px';
    this._menuParentDiv.style.zIndex = '11';
    this._menuParentDiv.style.backgroundImage = 'linear-gradient(rgba(255, 255, 255, 1) 10%, rgba(255, 255, 255, 0) 90%)';
    this._menuParentDiv.style.overflow = 'auto';
    this._menuParentDiv.style.fontFamily = '\'Fredoka One\'';
    this._menuParentDiv.style.display = 'none';
    this._menuParentDiv.setAttribute('class', 'lvl-menu-outer-container');
    this._parent.appendChild(this._menuParentDiv);

    window.addEventListener('resize', this.resize);
    this._cGameBoard = null;
    this.resize();
    this.rebuildHTML();
  }
  
  /**
   * Create the HTML structure for this level selector
   */
  rebuildHTML() {
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
    this._containerDiv.setAttribute('class', 'lvl-sel-inner-container');
    const h1 = document.createElement('h1');
    h1.innerHTML = toRainbow('Snakebird');
    this._containerDiv.appendChild(h1);
    const mainMenuButtons = [
      ['Level Collections', '#cols'],
      ['Instructions', '#instr'],
      ['Controls', '#controls'],
      ['Credits', '#creds']
    ];
    for (let i=0; i<mainMenuButtons.length; i++) {
      const aMenu = document.createElement('a');
      aMenu.setAttribute('href', mainMenuButtons[i][1]);
      const menButton = document.createElement('input');
      menButton.setAttribute('type', 'button');
      menButton.setAttribute('value', mainMenuButtons[i][0]);
      menButton.setAttribute('class', 'lvl-col-button');
      aMenu.appendChild(menButton);
      this._containerDiv.appendChild(aMenu);
    }

    const aCols = document.createElement('a');
    aCols.setAttribute('id', 'cols');
    this._containerDiv.appendChild(aCols);
    const h2L = document.createElement('h2');
    h2L.innerHTML = 'Level Collections';
    this._containerDiv.appendChild(h2L);
    for (let i=0; i<this._lvlCollections.length; i++) {
      const a = document.createElement('a');
      a.setAttribute('href', `#col${i}`);
      const button = document.createElement('input');
      button.setAttribute('type', 'button');
      button.setAttribute('value', this._lvlCollections[i].name);
      button.setAttribute('class', 'lvl-col-button');
      a.appendChild(button);
      this._containerDiv.appendChild(a);
    }
    for (let i=0; i<this._lvlCollections.length; i++) {
      const a = document.createElement('a');
      a.setAttribute('id', `col${i}`);
      this._containerDiv.appendChild(a);
      const h2 = document.createElement('h2');
      h2.innerHTML = this._lvlCollections[i].name;
      this._containerDiv.appendChild(h2);
      const table = document.createElement('table');
      table.setAttribute('class', 'lvl-sel-collection');
      const hTR = document.createElement('tr');
      hTR.innerHTML = '<th>Level</th><th colspan="4">Peculiarities</th>';
      table.appendChild(hTR);
      for (let k=0; k<this._lvlCollections[i].levels.length; k++) {
        const tr = document.createElement('tr');
        const opt1 = this._lvlCollections[i].levels[k].fallThrough;
        const opt2 = this._lvlCollections[i].levels[k].changeGravity;
        const opt3 = this._lvlCollections[i].levels[k].options && this._lvlCollections[i].levels[k].options.allowMovingWithoutSpace;
        const opt4 = this._lvlCollections[i].levels[k].options && this._lvlCollections[i].levels[k].options.allowTailBiting;
        let pecTDs = `<td class="icon-td">${
          opt1 ? '<img title="Wrap-Around" class="info-icon" src="css/fall-through.svg"/>' : ''
        }</td><td class="icon-td">${
          opt2 ? '<img title="Gravity Change" class="info-icon" src="css/gravity.svg"/>' : ''
        }</td><td class="icon-td">${
          opt3 ? '<img title="No Space Movement" class="info-icon" src="css/no-space.svg"/>' : ''
        }</td><td class="icon-td">${
          opt4 ? '<img title="Tail Biting" class="info-icon" src="css/tail-biting.svg"/>' : ''
        }</td>`;
        if (!opt1 && !opt2 && !opt3 && !opt4) pecTDs = '<td colspan="4">none</td>';
        tr.innerHTML = `<td>${this._lvlCollections[i].levels[k].name}</td>${pecTDs}`;
        table.appendChild(tr);
        tr.addEventListener('click', () => this.openLevel(i, k));
      }
      this._containerDiv.appendChild(table);
    }

    const aInstr = document.createElement('a');
    aInstr.setAttribute('id', 'instr');
    this._containerDiv.appendChild(aInstr);
    const h2Instr = document.createElement('h2');
    h2Instr.innerHTML = 'Instructions';
    this._containerDiv.appendChild(h2Instr);
    const explDivInstr = document.createElement('div');
    explDivInstr.setAttribute('class', 'bordered-text');
    explDivInstr.innerHTML = 'In order to complete a level, all fruits on the game board must be eaten by '
      + 'any of the snakebirds. Once the snakebirds are sated, they all have to leave the board by moving '
      + 'their head onto the rainbow-colored spinning disk.';
    this._containerDiv.appendChild(explDivInstr);
    const explDivInstr2 = document.createElement('div');
    explDivInstr2.setAttribute('class', 'bordered-text');
    explDivInstr2.innerHTML = 'This task can be simplified by blocks of various shapes that can be moved '
      + 'around the board as well as portals that can be used by both snakebirds and blocks.';
    this._containerDiv.appendChild(explDivInstr2);
    const explDivInstr3 = document.createElement('div');
    explDivInstr3.setAttribute('class', 'bordered-text');
    explDivInstr3.innerHTML = 'In addition, this version of Snakebird supports two other special features: '
      + 'levels where snakebirds and blocks that move out of the board appear again on the other side and '
      + 'levels where eating of a fruit causes gravity to change direction (in clockwise order).';
    this._containerDiv.appendChild(explDivInstr3);

    const aContr = document.createElement('a');
    aContr.setAttribute('id', 'controls');
    this._containerDiv.appendChild(aContr);
    const h2Contr = document.createElement('h2');
    h2Contr.innerHTML = 'Controls';
    this._containerDiv.appendChild(h2Contr);
    const explDiv = document.createElement('div');
    explDiv.setAttribute('class', 'bordered-text');
    explDiv.innerHTML = 'Please be aware that key combinations involving [ctrl] do not work in all browsers! '
      + 'In particular, [ctrl] + [r] may cause a full page reload instead of only restarting the level. '
      + 'Therefore, the [shift] combinations might be preferable.';
    this._containerDiv.appendChild(explDiv);

    const contrTable = document.createElement('table');
    contrTable.setAttribute('class', 'controls-table');
    contrTable.innerHTML = `
      <tr><th>[Key] / Mouse Action</th><th>Purpose</th></tr>
      <tr><td>Mouse click</td><td>Select snakebird</td></tr>
      <tr><td>[a], [left arrow]</td><td>Move left</td></tr>
      <tr><td>[w], [up arrow]</td><td>Move up</td></tr>
      <tr><td>[d], [right arrow]</td><td>Move right</td></tr>
      <tr><td>[s], [down arrow]</td><td>Move down</td></tr>
      <tr><td>[+], [-], scroll</td><td>Zoom view</td></tr>
      <tr><td>Drag mouse</td><td>Move view</td></tr>
      <tr><td>[m], [escape]</td><td>Open menu</td></tr>
      <tr><td>[ctrl] + [z], [shift] + [z]</td><td>Undo</td></tr>
      <tr><td>[ctrl] + [y], [shift] + [y]</td><td>Redo</td></tr>
      <tr><td>[ctrl] + [r], [shift] + [r]</td><td>Restart</td></tr>
    `;
    this._containerDiv.appendChild(contrTable);

    const aCreds = document.createElement('a');
    aCreds.setAttribute('id', 'creds');
    this._containerDiv.appendChild(aCreds);
    const h2Creds = document.createElement('h2');
    h2Creds.innerHTML = 'Credits';
    this._containerDiv.appendChild(h2Creds);
    const explDivCreds = document.createElement('div');
    explDivCreds.setAttribute('class', 'bordered-text');
    explDivCreds.innerHTML = 'JavaScript version developed by Fabian Michel<br />June to August 2018<br />Published under the MIT license';
    this._containerDiv.appendChild(explDivCreds);
    const explDivCreds2 = document.createElement('div');
    explDivCreds2.setAttribute('class', 'bordered-text');
    explDivCreds2.innerHTML = 'Original game by Noumenon Games<br />All Snakebird Original levels by Noumenon Games';
    this._containerDiv.appendChild(explDivCreds2);

    this._menuParentDiv.innerHTML = '';
    this._menuContainerDiv = document.createElement('div');
    this._menuParentDiv.appendChild(this._menuContainerDiv);
    this._menuContainerDiv.setAttribute('class', 'lvl-menu-inner-container');
    const menuH1 = document.createElement('h1');
    menuH1.innerHTML = toRainbow('Snakebird');
    this._menuContainerDiv.appendChild(menuH1);
    const menuActions = [
      ['Continue', () => this.closeMenu()],
      ['Quit', () => this.returnToMainMenu()]
    ];
    for (let i=0; i<menuActions.length; i++) {
      const button = document.createElement('input');
      button.setAttribute('type', 'button');
      button.setAttribute('value', menuActions[i][0]);
      button.setAttribute('class', 'lvl-menu-button');
      button.addEventListener('click', menuActions[i][1]);
      this._menuContainerDiv.appendChild(button);
    }
    
    const menuH2 = document.createElement('h2');
    menuH2.innerHTML = 'Settings';
    this._menuContainerDiv.appendChild(menuH2);
    const toggleActions = [
      ['Cyclic animations', checked => this.cyclicAnis(checked), !STORAGE.get('noCyclicAni')],
      ['Movement animations', checked => this.anis(checked), !STORAGE.get('noAni')]
    ];
    for (let i=0; i<toggleActions.length; i++) {
      const checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      checkbox.setAttribute('id', `menu-checkbox-${i}`);
      checkbox.setAttribute('value', toggleActions[i][0]);
      if (toggleActions[i][2]) checkbox.setAttribute('checked', 'true');
      checkbox.setAttribute('class', 'lvl-menu-checkbox');
      checkbox.addEventListener('change', () => toggleActions[i][1](checkbox.checked));
      this._menuContainerDiv.appendChild(checkbox);
      const label = document.createElement('label');
      label.setAttribute('for', `menu-checkbox-${i}`);
      label.setAttribute('class', 'lvl-menu-checkbox-label');
      label.innerHTML = toggleActions[i][0];
      this._menuContainerDiv.appendChild(label);
    }
  }

  /**
   * Whether cyclic animations should be played
   * @param {boolean} value if set to true, cyclic animations will be played
   */
  cyclicAnis(value) {
    STORAGE.set('noCyclicAni', !value);
    this._updateAniVars();
  }

  /**
   * Whether movement animations should be played
   * @param {boolean} value if set to true, movement animations will be played
   */
  anis(value) {
    STORAGE.set('noAni', !value);
    this._updateAniVars();
  }

  _updateAniVars() {
    if (this._cGameBoard != null) this._cGameBoard.setAniVars(STORAGE.get('noCyclicAni'), STORAGE.get('noAni'));
  }

  /**
   * Redraw the current game board
   */
  redraw() {
    if (this._cGameBoard != null) this._cGameBoard.redraw();
  }

  /**
   * Open a level
   * @param {number} col the index of the level collection
   * @param {number} idx the index of the level in the collection
   */
  openLevel(col, idx) {
    this._parentDiv.style.display = 'none';
    this._cGameBoard = fromLevelDescription(document.body, this._lvlCollections[col].levels[idx], STORAGE.get('noCyclicAni'), STORAGE.get('noAni'));
    this._cGameBoard.addEventListener('game won', () => this.levelWon());
    this._cGameBoard.addEventListener('open menu', () => this.openMenu());
  }

  /**
   * Open the level pause menu
   */
  openMenu() {
    this._menuParentDiv.style.display = 'block';
  }

  /**
   * Close the level pause menu
   */
  closeMenu() {
    this._menuParentDiv.style.display = 'none';
    if (this._cGameBoard != null) this._cGameBoard.menuClosed();
  }

  /**
   * Should be called when the user aborts the level
   */
  returnToMainMenu() {
    this.closeMenu();
    this.levelFinished();
  }

  /**
   * Should be called when the level was won
   * @param {number} moves the number of moves needed
   * @param {number} undoneMoves the number of moves that were undone
   */
  levelWon(moves, undoneMoves) {
    this.levelFinished();
  }

  /**
   * Should be called when the user exited the level (won or aborted)
   */
  levelFinished() {
    this._cGameBoard.shutDown();
    this._parentDiv.style.display = 'block';
    this._cGameBoard = null;
  }

  /**
   * This method will adapt the level selector size to the window size
   */
  resize() {
    this._width = Math.max(window.innerWidth, LS_MIN_SIZE[0]);
    this._height = Math.max(window.innerHeight, LS_MIN_SIZE[1]);

    this._parentDiv.style.width = `${this._width}px`;
    this._parentDiv.style.minWidth = `${this._width}px`;
    this._parentDiv.style.maxWidth = `${this._width}px`;
    this._parentDiv.style.height = `${this._height}px`;
    this._parentDiv.style.minHeight = `${this._height}px`;
    this._parentDiv.style.maxHeight = `${this._height}px`;
    
    this._menuParentDiv.style.width = `${this._width}px`;
    this._menuParentDiv.style.minWidth = `${this._width}px`;
    this._menuParentDiv.style.maxWidth = `${this._width}px`;
    this._menuParentDiv.style.height = `${this._height}px`;
    this._menuParentDiv.style.minHeight = `${this._height}px`;
    this._menuParentDiv.style.maxHeight = `${this._height}px`;
  }

  /**
   * Shut this level selector down -- that is, remove all level selector elements from the parent element
   */
  shutDown() {
    if (this._cGameBoard != null) this._cGameBoard.shutDown();
    this._parent.removeChild(this._parentDiv);
  }
}
