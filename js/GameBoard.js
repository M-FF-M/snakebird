
class GameBoard {
  constructor(parentElem, gameState) {
    this.resize = this.resize.bind(this);
    this.click = this.click.bind(this);
    this.press = this.press.bind(this);
    this._canvas = document.createElement('canvas');
    this._canvas.style.position = 'absolute';
    this._canvas.style.left = '0px';
    this._canvas.style.top = '0px';
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
    this._state = gameState;
    parentElem.appendChild(this._canvas);
    this._drawer = new GameDrawer(this._canvas, 0, 0, this._canvas.width, this._canvas.height, this._state);
    this._drawer.draw();
    this._activeSnake = this._state.snakeToCharacter[0];
    this._drawer.addEventListener('click', this.click);
    window.addEventListener('resize', this.resize);
    window.addEventListener('keypress', this.press);
  }

  resize() {
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
    this._drawer.resize(0, 0, this._canvas.width, this._canvas.height);
  }

  click(x, y) {
    const val = this._state.getVal(x, y);
    if (val > 0 && val < 32) {
      const sn = GET_SNAKE(val);
      this._activeSnake = this._state.snakeToCharacter[sn];
    }
  }

  press(event) {
    const key = event.key.toLowerCase();
    // let moveRes = null;
    if (key === 'a' || key === 'arrowleft') {
      this._state = this._drawer.tryMove(this._activeSnake, LEFT);
      // moveRes = gameTransition(this._state, this._activeSnake, LEFT);
    } else if (key === 'd' || key === 'arrowright') {
      this._state = this._drawer.tryMove(this._activeSnake, RIGHT);
      // moveRes = gameTransition(this._state, this._activeSnake, RIGHT);
    } else if (key === 'w' || key === 'arrowup') {
      this._state = this._drawer.tryMove(this._activeSnake, UP);
      // moveRes = gameTransition(this._state, this._activeSnake, UP);
    } else if (key === 's' || key === 'arrowdown') {
      this._state = this._drawer.tryMove(this._activeSnake, DOWN);
      // moveRes = gameTransition(this._state, this._activeSnake, DOWN);
    }
    /* if (moveRes !== null) {
      this._state = moveRes[3];
      this._drawer = new GameDrawer(this._canvas, 0, 0, this._canvas.width, this._canvas.height, this._state);
      this._drawer.draw();
    } */
  }
}
