
/**
 * Stopped search because there are no new options anymore
 * @type {number}
 */
const NOT_POSSIBLE = 0;
/**
 * Stopped search because the time limit was reached
 * @type {number}
 */
const TIME_LIMIT = 1;
/**
 * Stopped search because the depth limit was reached
 * @type {number}
 */
const DEPTH_LIMIT = 2;
/**
 * Stopped search because a solution was found
 * @type {number}
 */
const FOUND_SOLUTION = 3;

/**
 * Solve a level with a given description
 * @param {object} obj a level description object
 * @param {number} [maxTime] the maximum running time in milliseconds
 * @param {number} [maxDepth] the maximum move depth
 * @return {any[]} an array: [solver, [retVal, statesSeen, lastDepth, solMoves, solMoveIdx]] where:
 * - solver is an instance of GameSolver for the given level
 * - retVal is one of NOT_POSSIBLE, TIME_LIMIT, DEPTH_LIMIT, FOUND_SOLUTION
 * - statesSeen contains the number of states that were visited
 * - lastDepth contains the move depth of the last state that was visited
 * - solMoves contains the number of moves needed to solve this state (in case of FOUND_SOLUTION)
 * - solMoveIdx contains the last move that was made as an index of movesArray (making reconstruction
 *   possible) (in case of FOUND_SOLUTION)
 */
function solveFromLevelDescription(obj, maxTime = 10000, maxDepth = Infinity) {
  const solver = new GameSolver(new GameState(obj.board));
  return [solver, solver.solve(obj.fallThrough ? true : false, obj.changeGravity ? true : false,
    obj.options || {}, maxTime, maxDepth)];
}

/**
 * This class tries to solve Snakebird games by brute force
 */
class GameSolver {
  /**
   * Create a new GameSolver for a given state
   * @param {GameState} iState the game state
   */
  constructor(iState) {
    /**
     * The initial game state
     * @type {GameState}
     */
    this.initialState = iState;
    /**
     * Saves positions that have already been encountered. In addition, the position is mapped to
     * an entry in movesArray, which makes solution reconstruction possible.
     * @type {Map<string,number>}
     */
    this.alreadySeen = new Map();
    /**
     * Saves moves: at index i, it contains an array [snake, direction, parent], where
     * snake is the character of the snake that was moved, direction is one of LEFT, RIGHT, UP, DOWN
     * and parent is an index in the same array, indicating the previous move that was made (if parent
     * is -1, this was one of the initial moves)
     * @type {any[][]}
     */
    this.movesArray = [];
    /**
     * A queue with currently active states
     * @type {Queue}
     */
    this.stateQueue = new Queue();
    this.addToStateQueue(this.initialState, -1, 0);
  }

  /**
   * Add a state to the state queue. The method will only add states that haven't been encountered before.
   * @param {GameState} state the game state
   * @param {number} moveIdx an index in movesArray, representing the last move that was made
   * @param {number} moveDepth the depth of the move referenced by moveIdx
   * @return {boolean} true if the state was not encountered before
   */
  addToStateQueue(state, moveIdx, moveDepth) {
    if (state === null) return;
    const str = state.toString();
    if (!this.alreadySeen.has(str)) {
      this.alreadySeen.set(str, moveIdx);
      if (!state.gameEnded)
        this.stateQueue.pushBack([state, moveIdx, moveDepth]);
      return true;
    }
    return false;
  }

  /**
   * Attempt to solve the game state
   * @param {boolean} [fallThrough] if set to true, snakes and objects that fall out of the board
   * will appear again at the top
   * @param {boolean} [changeGravity] whether to change the direction of gravity in clockwise order
   * when the snake eats a fruit
   * @param {object} [options] additional options to be taken into account when calculating the next state
   * @param {boolean} [options.allowMovingWithoutSpace] if set to true, a snake can move without space
   * if the object blocking its path is moved at the same time
   * @param {boolean} [options.allowTailBiting] if allowMovingWithoutSpace is set to true, but this
   * parameter is set to false, a snake can move without space if it is not blocking itself
   * @param {number} [maxTime] the maximum running time in milliseconds
   * @param {number} [maxDepth] the maximum move depth
   * @return {number[]} an array: [retVal, statesSeen, lastDepth, solMoves, solMoveIdx] where:
   * - retVal is one of NOT_POSSIBLE, TIME_LIMIT, DEPTH_LIMIT, FOUND_SOLUTION
   * - statesSeen contains the number of states that were visited
   * - lastDepth contains the move depth of the last state that was visited
   * - solMoves contains the number of moves needed to solve this state (in case of FOUND_SOLUTION)
   * - solMoveIdx contains the last move that was made as an index of movesArray (making reconstruction
   *   possible) (in case of FOUND_SOLUTION)
   */
  solve(fallThrough = false, changeGravity = false, options = {}, maxTime = 10000, maxDepth = Infinity) {
    const { allowMovingWithoutSpace = false, allowTailBiting = false } = options;
    options = { allowMovingWithoutSpace, allowTailBiting };
    const posMove = [LEFT, RIGHT, UP, DOWN];
    const startTime = (new Date()).getTime();
    let retVal = NOT_POSSIBLE; let solMoves = -1; let lastDepth = -1; let solMoveIdx = -1; let statesSeen = 0;
    while (!this.stateQueue.isEmpty() && retVal != FOUND_SOLUTION) { // as long as there are states and no solution was found
      const [cState, pIdx, mDepth] = this.stateQueue.popFront();
      if (mDepth + 1 > maxDepth) {
        retVal = DEPTH_LIMIT;
        break;
      }
      for (let i=0; i<cState.snakes.length && retVal != FOUND_SOLUTION; i++) { // all snakes can be moved
        for (let k=0; k<posMove.length && retVal != FOUND_SOLUTION; k++) { // every snake can be moved in every direction
          let nState = cState.clone();
          nState = gameTransition(nState, i, posMove[k], fallThrough, nState.gravity, false, changeGravity, options); // calculate next state
          if (nState !== null) { // move was valid
            lastDepth = mDepth + 1;
            if (this.addToStateQueue(nState, this.movesArray.length, mDepth + 1)) { // returns true if state wasn't seen before
              this.movesArray.push([cState.snakeToCharacter[i], posMove[k], pIdx]); // save move
              statesSeen++;
            }
            if (nState.gameEnded && nState.gameWon) { // found solution
              retVal = FOUND_SOLUTION;
              solMoves = mDepth + 1;
              solMoveIdx = this.movesArray.length - 1;
            }
          }
        }
      }
      if ((new Date()).getTime() - startTime > maxTime) {
        retVal = TIME_LIMIT;
        break;
      }
    }
    return [retVal, statesSeen, lastDepth, solMoves, solMoveIdx];
  }
}
