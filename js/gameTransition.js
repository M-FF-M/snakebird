
/**
 * Indicates movement to the left
 * @type {number[]}
 */
const LEFT = [-1, 0];
/**
 * Indicates movement to the right
 * @type {number[]}
 */
const RIGHT = [1, 0];
/**
 * Indicates upward movement
 * @type {number[]}
 */
const UP = [0, -1];
/**
 * Indicates downward movement
 * @type {number[]}
 */
const DOWN = [0, 1];
/**
 * Indicates that the objects moved
 * @type {number}
 */
const MOVED = 2;
/**
 * Indicates that the game was won
 * @type {number}
 */
const GAME_WON = 1;
/**
 * Indicates that all objects came to rest
 * @type {number}
 */
const ALL_STATIC = 0;
/**
 * Indicates that the objects were caught in an endless loop
 * @type {number}
 */
const ENDLESS_LOOP = -1;
/**
 * Indicates that a snake fell out of the board or onto a spike
 * @type {number}
 */
const OUT_OF_BOARD_ONTO_SPIKE = -2;

/**
 * Converts the array returned by gameTransition() at index 2 into an array where snakes
 * are not deleted after reaching the target and where the time that is required for
 * portation and target reached animations is taken into account
 * @param {number[][]} resArr the array returned by gameTransition() at index 2
 * @param {number} snakeNum the number of snakes (in the original game state)
 * @return {number[][]} the modified array
 */
function convertToFullArray(resArr, snakeNum) {
  const retArr = [];
  const numObj = resArr[0].length;
  const objRemAt = [];
  for (let i=0; i<resArr.length; i++) {
    const ri = retArr.length;
    retArr.push([]); let duplicateNum = 0;
    const duplArr = [];
    for (let k=0, cidx=0; k<numObj; k++, cidx++) {
      if (objRemAt.includes(k)) {
        retArr[ri].push([-500, -500]);
        duplArr.push([-500, -500]);
        if (k < snakeNum) cidx--;
      } else {
        const posArr = resArr[i][cidx];
        retArr[ri].push(posArr.slice());
        if (posArr.length == 3) {
          objRemAt.push(k);
          duplArr.push(posArr.slice(0, 2));
          if (posArr[2] == 2 && duplicateNum == 0) duplicateNum = 1;
        }
        else if (posArr.length == 2) duplArr.push(posArr.slice(0, 2));
        else if (posArr.length == 6) {
          if (duplicateNum == 0) duplicateNum = 1;
          duplArr.push(posArr.slice(2, 4));
        }
        else if (posArr.length == 7) {
          duplicateNum = 2;
          duplArr.push(posArr.slice(2, 4));
        }
      }
    }
    for (let q=0; q<duplicateNum; q++) retArr.push(duplArr);
  }
  return retArr;
}

/**
 * Calculate the transition from one game state to another when one snake is moved in a specific
 * direction
 * @param {GameState} gameState the original game state
 * @param {string|number} snake the snake to move. Can either be the character or the number
 * corresponding to the snake. If snake is null, no snake will be moved and only the falling
 * of the objects will be simulated.
 * @param {number[]} direction the direction of the snake movement  (one of LEFT, RIGHT, UP, DOWN)
 * @param {boolean} [fallThrough] if set to true, snakes and objects that fall out of the board
 * will appear again at the top (and if they leave the board through the left border, they appear
 * again at the right side of the board)
 * @param {number[]} [gravity] the direction of gravity (one of LEFT, RIGHT, UP, DOWN)
 * @param {boolean} [moveInfo] whether to include detailed move info in the response (see description
 * below; if set to false, the method will return the GameState object which is normally returned
 * at index 3 of the return array)
 * @param {boolean} [changeGravity] whether to change the direction of gravity in clockwise order
 * when the snake eats a fruit
 * @param {object} [options] additional options to be taken into account when calculating the next state
 * @param {boolean} [options.allowMovingWithoutSpace] if set to true, a snake can move without space
 * if the object blocking its path is moved at the same time
 * @param {boolean} [options.allowTailBiting] if allowMovingWithoutSpace is set to true, but this
 * parameter is set to false, a snake can move without space if it is not blocking itself
 * @return {any[]} will return null if the move was invalid. If the move was valid the array will
 * contain:
 * - at index 0: a boolean -- indicating whether or not the snake ate a fruit.
 * - at index 1: a number which will be -1 if the game was lost due to an endless loop, -2 if it
 *   was lost due to a snake falling out of the board or onto a spike, 1 if the game was
 *   won and 0 if the game is not over yet
 * - at index 2: an array of type number[time][numObj][2]. time - 1 is the length it takes for
 *   all objects to come to rest or be caught in an infinite loop (falling down one step takes one
 *   time unit) (the first entry contains the current object positions). numObj is the number of
 *   objects on the field (that is, number of snakes plus number of blocks). Note that snakes that
 *   fell onto the target will be removed *immediately*. That is, if one snake fell onto the target
 *   while the other snakes continue to fall, that snake will not be included in the following
 *   steps -- numObj will decreas. The last dimension is 2 for the two coordinates of the object.
 *   If the dimension is not 2, one of the following is indicated (note that own movement is not
 *   indicated -- to distinguish own movement and falling, one has to use the fact that the snake
 *   passed to this method moves exactly one field in the first step if the move was valid):
 *   - six entries: a portation -- third and fourth coordinate contain the position the object
 *     will be ported to, the fifth and sixth array entry will contain the index of the source and
 *     the destination portal in GameState.portalPos
 *   - seven entries: a portation onto the target or out of the board -- third and fourth coordinate
 *     contain the position the object will be ported to, the fifth and sixth array entry will contain
 *     the index of the source and the destination portal in GameState.portalPos, the seventh entry
 *     is 2 if the snake was ported onto the target and 1 if the object was ported out of the board
 *   - eight entries: a failed portation -- third and fourth coordinate contain the position the object
 *     would have been ported to, the fifth and sixth array entry will contain the index of the source and
 *     the destination portal in GameState.portalPos, the seventh and eighth entry contain the x and y
 *     coordinate of the cell that blocked the portation
 *   - three entries: an object disappeared because it fell out of the board or (in case it is a
 *     snake) fell onto a spike (third entry 1) or a snake entered the target cell (third entry 2)
 * - at index 3: the new game state (a GameState object).
 */
function gameTransition(gameState, snake, direction, fallThrough = false, gravity = DOWN,
    moveInfo = true, changeGravity = false, options = {}) {
  const { allowMovingWithoutSpace = false, allowTailBiting = false } = options;
  gameState = gameState.clone(); // clone state to be able to modify it
  let ateFruit = false; // whether or not the snake ate a fruit
  // at the beginning, all snakes and blocks are assumed to be movable
  const snakesStatic = []; for (let i=0; i<gameState.snakes.length; i++) snakesStatic[i] = false;
  const blocksStatic = []; for (let i=0; i<gameState.blocks.length; i++) blocksStatic[i] = false;
  const retArr = []; // the result array
  let blockOutArr = [];

  const addToBlockOut = arr => {
    for (const i of arr) {
      if (!blockOutArr.includes(i)) blockOutArr.push(i);
    }
  };

  const pushCurPos = () => {
    // insert current positions into retArr
    const curPos = [];
    for (let i=0; i<snakesStatic.length + blocksStatic.length; i++) {
      const isSnake = i < snakesStatic.length; const idx = isSnake ? i : i - snakesStatic.length;
      const cs = isSnake ? gameState.snakes[idx] : gameState.blocks[idx]; // body part queue
      curPos[i] = [cs.getFront()[0], cs.getFront()[1]];
    }
    retArr.push(curPos);
  };
  pushCurPos();

  if (snake !== null) {
    const moveSnake = (cs, nx, ny, snIdx, newSnIdx, ate, removeLast = true) => {
      retArr[retArr.length - 1][snIdx][0] += direction[0]; // update retArr: set new snake head position
      retArr[retArr.length - 1][snIdx][1] += direction[1];
      if (fallThrough) { // wrap position if necessary
        while (retArr[retArr.length - 1][snIdx][0] < 0) retArr[retArr.length - 1][snIdx][0] += gameState.width;
        while (retArr[retArr.length - 1][snIdx][1] < 0) retArr[retArr.length - 1][snIdx][1] += gameState.height;
        retArr[retArr.length - 1][snIdx][0] %= gameState.width;
        retArr[retArr.length - 1][snIdx][1] %= gameState.height;
      }
      if (!ate) {
        const lastpos = cs.popBack(); // the snake didn't eat a fruit --> remove last body part
        if (removeLast) {
          gameState.setStrVal(lastpos[0], lastpos[1], '.');
          gameState.setVal(lastpos[0], lastpos[1], EMPTY);
        }
      }
      if (cs.length > 0) { // update character value of second body part
        const firstpos = cs.getFront();
        let nval1 = '!';
        const diffx = firstpos[0] - nx, diffy = firstpos[1] - ny;
        if (diffx == 1 || diffx == 1 - gameState.width) nval1 = '<';
        else if (diffx == -1 || diffx == gameState.width - 1) nval1 = '>';
        else if (diffy == 1 || diffy == 1 - gameState.height) nval1 = '^';
        else if (diffy == -1 || diffy == gameState.height - 1) nval1 = 'v';
        gameState.setStrVal(firstpos[0], firstpos[1], nval1); // set appropriate character
      }
      cs.pushFront([nx, ny]); // prepend new head to all other body parts
      gameState.setStrVal(nx, ny, gameState.snakeToCharacter[newSnIdx]);
      gameState.setVal(nx, ny, SNAKE(newSnIdx));
    };

    const snIdx = (typeof snake === 'number') ? snake : gameState.snakeMap.get(snake);
    let nSnIdx = snIdx;
    const cs = gameState.snakes[snIdx]; const [x, y] = cs.getFront(); // coordinates of the head
    let [nx, ny] = [x + direction[0], y + direction[1]]; // new coordinates of the head
    if (fallThrough) { // wrap new position
      nx += gameState.width; nx %= gameState.width;
      ny += gameState.height; ny %= gameState.height;
    }
    if (nx < 0 || ny < 0 || nx >= gameState.width || ny >= gameState.height) return null;
    const val = gameState.getVal(nx, ny,
      fallThrough ? WRAP_AROUND : BLOCK_LEFT_RIGHT(gravity)); // value at new position
    if (val > 0) { // snake or block blocks the new position -- try to move them
      snakesStatic[snIdx] = true;
      if (val == SNAKE(snIdx) && !(allowMovingWithoutSpace && allowTailBiting)) return null;
      const val2 = val >= 32 ? GET_BLOCK(val) + snakesStatic.length : GET_SNAKE(val);
      if (allowMovingWithoutSpace) {
        const lastpos = cs.getBack(); // the snake didn't eat a fruit --> already remove last body part
                                      // to make room for other objects
        gameState.setStrVal(lastpos[0], lastpos[1], '.');
        gameState.setVal(lastpos[0], lastpos[1], EMPTY);
      }
      const res = move(gameState, new Map(), snakesStatic, blocksStatic, direction, gravity, fallThrough, val2);
      if (res[0] == ALL_STATIC) return null;
      if (gameState.getVal(nx, ny, fallThrough ? WRAP_AROUND : BLOCK_LEFT_RIGHT(gravity)) > 0) 
        return null; // new position is still blocked
      if (res[0] == ENDLESS_LOOP) throw new Error('There can\'t be an endless loop after the first move');
      if (res[0] == GAME_WON) throw new Error('The game can\'t have been won after one move when the first move was to move other objects');
      retArr.push(res[1]);
      nSnIdx = res[4][snIdx]; // the snake index might have changed due to a snake entering the target
      moveSnake(cs, nx, ny, snIdx, nSnIdx, false, !allowMovingWithoutSpace);
      if (res[0] == OUT_OF_BOARD_ONTO_SPIKE) {
        reinsertTargetAndPortals(gameState);
        if (moveInfo) return [ateFruit, OUT_OF_BOARD_ONTO_SPIKE, retArr, gameState];
        else return gameState;
      }
      addToBlockOut(res[2]);
      for (let i=0; i<blocksStatic.length; i++) // reset static array
        if (!res[2].includes(i)) blocksStatic[i] = false; // caution: array might contain blocks that fell out of the board
      for (let i=0; i<snakesStatic.length; i++) // reset static array
        snakesStatic[i] = false; // snakes that fell onto the target will have been removed from the array already
    } else if (val == EMPTY || val == TARGET || val == PORTAL) {
      pushCurPos();
      moveSnake(cs, nx, ny, snIdx, snIdx, false);
    } else if (val == FRUIT) {
      pushCurPos(); ateFruit = true; gameState.fruits--;
      moveSnake(cs, nx, ny, snIdx, snIdx, true);
    } else return null;
    let targetPort = false; // whether the snake was ported onto the target
    if (gameState.portalPos.length > 0) {
      let isOnPortal = false; let portalInd = -1;
      // check whether snake is on portal
      if (gameState.portalPos[0][0] == nx && gameState.portalPos[0][1] == ny) {
        isOnPortal = true; portalInd = 0;
      } else if (gameState.portalPos[1][0] == nx && gameState.portalPos[1][1] == ny) {
        isOnPortal = true; portalInd = 1;
      }
      if (isOnPortal) {
        const src = portalInd, tgt = 1 - portalInd; // source and destination portal index
        const [canBePorted, portationBlockPos, portedOntoTarget, portedOutOfBoard, dx, dy]
          = canObjectBePorted(gameState, src, tgt, cs, true, fallThrough, gravity);
        // add information to retArr
        retArr[retArr.length - 1][snIdx].push(retArr[retArr.length - 1][snIdx][0] + dx); // new position
        retArr[retArr.length - 1][snIdx].push(retArr[retArr.length - 1][snIdx][1] + dy);
        // source and destination portal index
        retArr[retArr.length - 1][snIdx].push(src); retArr[retArr.length - 1][snIdx].push(tgt);
        if (canBePorted) {
          deleteObject(gameState, cs); // delete from old position
          if (portedOutOfBoard) {
            retArr[retArr.length - 1][snIdx].push(2);
            gameState.gameEnded = true;
            gameState.gameWon = false;
            reinsertTargetAndPortals(gameState);
            updateTargetCharacter(gameState);
            if (moveInfo) return [ateFruit, OUT_OF_BOARD_ONTO_SPIKE, retArr, gameState];
            else return gameState;
          } else if (portedOntoTarget) {
            targetPort = true;
          } else {
            // insert at new position
            insertObjectAtPosition(gameState, cs, dx, dy, true, nSnIdx, fallThrough)
          }
        } else {
          retArr[retArr.length - 1][snIdx].push(portationBlockPos[0]); // portation blocking position
          retArr[retArr.length - 1][snIdx].push(portationBlockPos[1]);
        }
      }
    }
    if (nx == gameState.target[0] && ny == gameState.target[1] || targetPort) { // snake head on target
      if (gameState.fruits == 0) {
        retArr[retArr.length - 1][snIdx].push(2);
        deleteObject(gameState, cs);
        const origSnakeInds = []; // saves the original snake indices
        for (let i=0; i<gameState.snakes.length; i++) origSnakeInds[i] = i;
        removeSnakeFromField(gameState, origSnakeInds, snakesStatic, nSnIdx);
        if (snakesStatic.length == 0) {
          gameState.gameEnded = true;
          gameState.gameWon = true;
          reinsertTargetAndPortals(gameState);
          updateTargetCharacter(gameState);
          if (moveInfo) return [ateFruit, GAME_WON, retArr, gameState];
          else return gameState;
        }
      }
    }
    reinsertTargetAndPortals(gameState);
  }
  if (ateFruit && changeGravity) {
    if (gravity == DOWN) gravity = LEFT;
    else if (gravity == LEFT) gravity = UP;
    else if (gravity == UP) gravity = RIGHT;
    else if (gravity == RIGHT) gravity = DOWN;
    gameState.gravity = gravity;
  }
  const alreadySeen = new Map(); // saves which positions have already been encountered
  alreadySeen.set(gameState.toString(), true);
  let loopCounter = 0; // preventing infinite loops
  while (true) {
    const res = move(gameState, alreadySeen, snakesStatic, blocksStatic, gravity, gravity, fallThrough);
    if (res[0] == ALL_STATIC) break;
    if (res[0] == ENDLESS_LOOP) {
      if (moveInfo) return [ateFruit, ENDLESS_LOOP, retArr, gameState];
      else return gameState;
    }
    retArr.push(res[1]);
    if (res[0] == OUT_OF_BOARD_ONTO_SPIKE) {
      if (moveInfo) return [ateFruit, OUT_OF_BOARD_ONTO_SPIKE, retArr, gameState];
      else return gameState;
    }
    if (res[0] == GAME_WON) {
      if (moveInfo) return [ateFruit, GAME_WON, retArr, gameState];
      else return gameState;
    }
    addToBlockOut(res[2]);
    if (++loopCounter >= 1000) throw new Error('Detected endless loop in gameTransition()!');
  }
  blockOutArr = blockOutArr.sort((a, b) => b - a);
  const origBlockInds = []; for (let i=0; i<blocksStatic.length; i++) origBlockInds[i] = i;
  for (let i=0; i<blockOutArr.length; i++) // remove blocks that fell out of the board
    removeBlockFromField(gameState, origBlockInds, blocksStatic, blockOutArr[i])
  if (moveInfo) return [ateFruit, ALL_STATIC, retArr, gameState];
  else return gameState;
}

/**
 * Move objects and snakes one step
 * @param {GameState} gameState the game state (will be modified and contain the new game state
 * after method execution)
 * @param {Map<string,boolean>} alreadySeen contains the positions that have already been encountered
 * @param {boolean[]} snakesStatic whether or not the corresponding snake is static
 * @param {boolean[]} blocksStatic whether or not the corresponding block is static
 * @param {number[]} [dir] the movement's direction
 * @param {number[]} [grav] the direction of gravity
 * @param {boolean} [fallThrough] if set to true, snakes and objects that fall out of the board
 * will appear again at the top
 * @param {number} [onlyRelevantPart] if the method is called because a snake / block is blocking
 * the first move, this parameter should be set to the index of the blocking part in retArr. The
 * move() method will then handle everything correctly.
 * @return {any[]} an array with the following information:
 * - at index 0: one of MOVED, GAME_WON, ALL_STATIC, ENDLESS_LOOP, OUT_OF_BOARD_ONTO_SPIKE
 * - at index 1 (in case of MOVED, GAME_WON, OUT_OF_BOARD_ONTO_SPIKE): one entry of the array that is
 *   returned by gameTransition() at index 2
 * - at index 2 (in case of MOVED, GAME_WON, OUT_OF_BOARD_ONTO_SPIKE): an array of block indices of
 *   blocks that fell out of the board
 * - at index 3 (in case of OUT_OF_BOARD_ONTO_SPIKE): an array of snake indices of snakes that died
 * - at index 4 (in case of MOVED, GAME_WON, OUT_OF_BOARD_ONTO_SPIKE): an array mapping old snake
 *   indices to new snake indices (the new indices will only differ from the old ones if one of the
 *   snakes fell onto the target)
 */
function move(gameState, alreadySeen, snakesStatic, blocksStatic, dir = DOWN, grav = DOWN,
    fallThrough = false, onlyRelevantPart = -1) {
  // convert old x coordinate to new x coordinate (when falling)
  const xb = x => x + dir[0];
  // convert old y coordinate to new y coordinate (when falling)
  const yb = y => y + dir[1];
  // convert field value (with a snake or a block) to the corresponding index in the graph / retArr
  const getSnakeOrBlock = val => {
    if (val >= 32) return GET_BLOCK(val) + snakesStatic.length;
    else return GET_SNAKE(val);
  };
  // convert graph / retArr index back to [isSnake, index in gameState.snakes / gameState.blocks]
  const revertToSnakeOrBlock = val => {
    if (val >= snakesStatic.length) return [false, val - snakesStatic.length];
    else return [true, val];
  };
  // returns whether a field value corresponds to a static object that can't fall any further
  const isStatic = (val, spikeIsStatic = false) => {
    if (val == FRUIT || val == OBSTACLE) return true;
    if (spikeIsStatic && val == SPIKE) return true;
    if (val <= 0) return false;
    if (val >= 32) return blocksStatic[GET_BLOCK(val)];
    else return snakesStatic[GET_SNAKE(val)];
  };
  // graph representing the falling snakes and blocks
  const g = new Graph(snakesStatic.length + blocksStatic.length);

  // whether a snakes head was on the target (and there were no more fruits to eat)
  let snakeWasOnTarget = false; let snTargetInd = -1;

  // build graph
  for (let i=0; i<gameState.snakes.length + gameState.blocks.length; i++) {
    let ib = i, cSnake = true;
    if (i >= gameState.snakes.length) {
      ib -= gameState.snakes.length;
      cSnake = false;
    }
    if (cSnake && gameState.snakes[ib].getFront()[0] == gameState.target[0]
        && gameState.snakes[ib].getFront()[1] == gameState.target[1] && gameState.fruits == 0) {
      // snake's head already was on target and there are no fruits left
      snakeWasOnTarget = true;
      snTargetInd = ib;
    }
    if (cSnake && snakesStatic[ib] || !cSnake && blocksStatic[ib]) continue; // object is already static
    const cs = cSnake ? gameState.snakes[ib] : gameState.blocks[ib]; // body part queue
    for (let k=0; k<cs.length; k++) {
      const [x, y] = cs.get(k); // coordinates of body part
      const val = gameState.getVal(xb(x), yb(y),
        fallThrough ? WRAP_AROUND : BLOCK_LEFT_RIGHT(grav)); // value at new position
      if (isStatic(val, !cSnake)) { // if object is located on top of static object
        if (cSnake) snakesStatic[ib] = true;
        else blocksStatic[ib] = true;
        break;
      }
      // insert edge to object directly below
      if (cSnake) {
        if (val > 0 && val != SNAKE(ib)) g.insertEdge(i, getSnakeOrBlock(val));
      } else {
        if (val > 0 && val != BLOCK(ib)) g.insertEdge(i, getSnakeOrBlock(val));
      }
    }
  }

  const sccG = g.getSCCGraph(); // connect strongly connected components
  const nMap = sccG._nodeMap; // maps nodes in sccG to an array of indices in g
  sccG._nodeMap = new Map(); // reset map

  if (onlyRelevantPart >= 0) { // there is only one relevant component that should be moved
    let relComp = null; // the array with the nodes of the SCC with the relevant object
    for (let i=0; i<sccG.n; i++) {
      if (nMap.get(i).includes(onlyRelevantPart)) {
        relComp = nMap.get(i).slice(); // all the objects in this SCC should not be static
        // objects directly below this SCC shouldm't be static either: traverse the graph to find them
        const visited = new Map(); // nodes in the SCC graph that have already been visited
        const q = new Queue(); // queue with active nodes
        visited.set(i, true); // root is visited
        q.pushBack(i); // insert root into queue
        while (!q.isEmpty()) {
          const v = q.popFront(); // next active nodes
          for (const e of sccG.adjList[v]) { // children
            const u = e.v;
            if (!visited.has(u)) { // not yet visited
              q.pushBack(u);
              visited.set(u, true);
              for (const ind of nMap.get(u)) relComp.push(ind); // add all objects in this SCC to the array
            }
          }
        }
        break;
      }
    }
    if (relComp === null) throw new Error('move(): only relevant object could not be found in SCC graph');
    for (let i=0; i<snakesStatic.length + blocksStatic.length; i++) {
      if (!relComp.includes(i)) { // all nodes that are not part of the relevant component should stay static
        const isSnake = i < snakesStatic.length; const idx = isSnake ? i : i - snakesStatic.length;
        if (isSnake) snakesStatic[idx] = true;
        else blocksStatic[idx] = true;
      }
    }
  }

  const topSort = sccG.topSort().reverse(); // topological sort
  let allStatic = true; // true if all objects came to rest
  let fellOffBoardOnSpike = false; // true if one of the snakes fell out of the board or onto a spike
  const deadArr = []; // will contain the indices of the snakes that fell out of the board / onto a spike
  const objOutArr = []; // will contain the indices of the objects that fell out of the board
  let fellOnTarget = false; // true if one of the snakes fell onto the target
  let targetInds = []; // will contain the indices of the snakes that fell onto the target
  const portationInds = []; // will contain array with the source and destination portal indices
  const portalNum = []; // will contain the number of portals the object touches
  const checkPortation = []; // an array of booleans inidcating whether portation for the respective object should be performed
  const retArr = []; // return array (see esdoc comments)
  for (let i=0; i<gameState.snakes.length + gameState.blocks.length; i++) {
    checkPortation[i] = false;
    portalNum[i] = 0;
  }

  for (let i=0; i<topSort.length; i++) {

    // check if the object can fall
    let isNowStatic = false; // whether this object is static now
    // check whether object is already static
    for (let k=0; k<nMap.get(topSort[i]).length; k++) {
      const [isSnake, idx] = revertToSnakeOrBlock(nMap.get(topSort[i])[k]);
      if (isSnake) {
        if (snakesStatic[idx]) isNowStatic = true;
      } else {
        if (blocksStatic[idx]) isNowStatic = true;
      }
    }
    if (!isNowStatic) {
      for (const e of sccG.adjList[topSort[i]]) {
        const objs = nMap.get(e.v); // objects in child node
        for (let q=0; q<objs.length; q++) {
          const [isSnake2, idx2] = revertToSnakeOrBlock(objs[q]);
          if (isSnake2 && isStatic(SNAKE(idx2)) || !isSnake2 && isStatic(BLOCK(idx2))) {
            isNowStatic = true; // on top of static object
            break;
          }
        }
        if (isNowStatic) break;
      }
    }

    if (snakeWasOnTarget) { // don't move any other object -- this snake has to be removed first
      for (let k=0; k<nMap.get(topSort[i]).length; k++) {
        const [isSnake, idx] = revertToSnakeOrBlock(nMap.get(topSort[i])[k]);
        const origIdx = nMap.get(topSort[i])[k];
        const cs = isSnake ? gameState.snakes[idx] : gameState.blocks[idx]; // body part queue
        const pos = cs.getFront();
        retArr[origIdx] = [pos[0], pos[1]]; // save new (old) position
        if (isSnake) snakesStatic[idx] = false; // set all objects in this node to not static
        else blocksStatic[idx] = false;
      }
    } else if (isNowStatic) { // object cannot fall anymore
      for (let k=0; k<nMap.get(topSort[i]).length; k++) {
        const [isSnake, idx] = revertToSnakeOrBlock(nMap.get(topSort[i])[k]);
        if (isSnake) snakesStatic[idx] = true; // set all objects in this node to static
        else blocksStatic[idx] = true;
      }

    } else { // object can fall
      allStatic = false;
      const portIndex = []; // saves the indices of the portals the object touches
      // delete from old position and update position in queues
      for (let k=0; k<nMap.get(topSort[i]).length; k++) {
        const [isSnake, idx] = revertToSnakeOrBlock(nMap.get(topSort[i])[k]);
        const cs = isSnake ? gameState.snakes[idx] : gameState.blocks[idx]; // body part queue
        for (let q=0; q<cs.length; q++) {
          const pos = cs.get(q);
          gameState.setStrVal(pos[0], pos[1], '.'); // erase from old position
          gameState.setVal(pos[0], pos[1], EMPTY); // erase from old position
          if (gameState.portalPos.length > 0) {
            // save whether object was on portal
            if (gameState.portalPos[0][0] == pos[0] && gameState.portalPos[0][1] == pos[1]) {
              portIndex.push(0);
            } else if (gameState.portalPos[1][0] == pos[0] && gameState.portalPos[1][1] == pos[1]) {
              portIndex.push(1);
            }
          }
          pos[0] += dir[0]; pos[1] += dir[1]; // update position
          if (fallThrough) {
            pos[0] += gameState.width; pos[1] += gameState.height;
            pos[0] %= gameState.width; pos[1] %= gameState.height;
          }
        }
      }
      // insert at new position
      for (let k=0; k<nMap.get(topSort[i]).length; k++) {
        const [isSnake, idx] = revertToSnakeOrBlock(nMap.get(topSort[i])[k]);
        const origIdx = nMap.get(topSort[i])[k];
        const cs = isSnake ? gameState.snakes[idx] : gameState.blocks[idx]; // body part queue
        let lastx, lasty; // last body part x / y coordinate (to decide whether to use <,>,^ or v)
        let deleteAgain = false; // will be true if the object should be deleted again (e.g. out of board)
        for (let q=0; q<cs.length; q++) {
          const pos = cs.get(q);
          if (pos[0] < 0 || pos[1] < 0 || pos[0] >= gameState.width || pos[1] >= gameState.height) {
            if (q == 0) retArr[origIdx] = [pos[0], pos[1]]; // save new position
            deleteAgain = true; // object fell out of the board
            if (isSnake) { deadArr.push(idx); fellOffBoardOnSpike = true; }
            else { objOutArr.push(idx); }
            break;
          }
          const val = gameState.getVal(pos[0], pos[1]);
          if (val == SPIKE) {
            if (!isSnake) throw new Error('Block fell into spike. That shouldn\'t be possible!');
            if (q == 0) retArr[origIdx] = [pos[0], pos[1]]; // save new position
            deleteAgain = true; // snake fell onto spike
            deadArr.push(idx); fellOffBoardOnSpike = true;
            break;
          }
          if (gameState.target[0] == pos[0] && gameState.target[1] == pos[1] && isSnake && q == 0
              && gameState.fruits == 0) {
            retArr[origIdx] = [pos[0], pos[1]]; // save new position
            deleteAgain = true; // snake head on target
            fellOnTarget = true; targetInds.push(idx);
          }
          if (gameState.portalPos.length > 0) {
            let isNowOnPortal = false, nPortIndex = -1; // save whether object is on portal now
            if (gameState.portalPos[0][0] == pos[0] && gameState.portalPos[0][1] == pos[1]) {
              isNowOnPortal = true; nPortIndex = 0;
            } else if (gameState.portalPos[1][0] == pos[0] && gameState.portalPos[1][1] == pos[1]) {
              isNowOnPortal = true; nPortIndex = 1;
            }
            if (isNowOnPortal && !portIndex.includes(nPortIndex)) { // object on different portal than before
              portationInds[origIdx] = [nPortIndex, 1 - nPortIndex];
              checkPortation[origIdx] = true;
            }
            // don't move object if it touches both portals
            if (isNowOnPortal && ++portalNum[origIdx] >= 2) checkPortation[origIdx] = false;
          }
          if (q == 0 || !isSnake) { // snake head / block
            if (q == 0) retArr[origIdx] = [pos[0], pos[1]]; // save new position
            const nval1 = isSnake ? gameState.snakeToCharacter[idx] : gameState.blockToCharacter[idx];
            gameState.setStrVal(pos[0], pos[1], nval1); // set appropriate character
          } else {
            let nval1 = '!';
            const diffx = pos[0] - lastx, diffy = pos[1] - lasty;
            if (diffx == 1 || diffx == 1 - gameState.width) nval1 = '<';
            else if (diffx == -1 || diffx == gameState.width - 1) nval1 = '>';
            else if (diffy == 1 || diffy == 1 - gameState.height) nval1 = '^';
            else if (diffy == -1 || diffy == gameState.height - 1) nval1 = 'v';
            gameState.setStrVal(pos[0], pos[1], nval1); // set appropriate character
          }
          const nval2 = isSnake ? SNAKE(idx) : BLOCK(idx); // appropriate new field value
          gameState.setVal(pos[0], pos[1], nval2);
          lastx = pos[0]; lasty = pos[1];
        }

        if (deleteAgain) { // delete object from board
          deleteObject(gameState, cs);
        }
      }
    }
  }

  // a snake was on the target and isn't on the board anymore -- this might allow other objects to fall
  if (snakeWasOnTarget) {
    allStatic = false;
    fellOnTarget = true;
    targetInds.push(snTargetInd);
    deleteObject(gameState, gameState.snakes[snTargetInd]);
  }

  // move objects that touch a portal
  for (let i=0; i<gameState.snakes.length + gameState.blocks.length; i++) {
    const isSnake = i < gameState.snakes.length;
    const idx = isSnake ? i : i - gameState.snakes.length;
    if (!checkPortation[i] || isSnake && deadArr.includes(idx) || !isSnake && objOutArr.includes(idx)
        || isSnake && targetInds.includes(idx))
      continue; // continue for objects that don't touch portals or objects that fell out of the board
    const src = portationInds[i][0], tgt = portationInds[i][1]; // source and destination portal index
    const cs = isSnake ? gameState.snakes[idx] : gameState.blocks[idx]; // body part queue
    const [canBePorted, portationBlockPos, portedOntoTarget, portedOutOfBoard, dx, dy]
      = canObjectBePorted(gameState, src, tgt, cs, isSnake, fallThrough, grav);
    if (portedOntoTarget) {
      fellOnTarget = true; targetInds.push(idx);
    }
    // add information to retArr
    retArr[i].push(retArr[i][0] + dx); // new position
    retArr[i].push(retArr[i][1] + dy);
    retArr[i].push(src); retArr[i].push(tgt); // source and destination portal index
    if (canBePorted) {
      deleteObject(gameState, cs); // delete from old position
      if (portedOutOfBoard) {
        if (isSnake) { deadArr.push(idx); snakesStatic[idx] = true; fellOffBoardOnSpike = true; }
        else { objOutArr.push(idx); blocksStatic[idx] = true; } // block / snake out of board
        // retArr[i].push(1); this will be done automatically (see below, deadArr loop)
      } else if (portedOntoTarget) {
        // retArr[i].push(2); this will be done automatically (see below, targetInds loop)
      } else {
        // insert at new position
        insertObjectAtPosition(gameState, cs, dx, dy, isSnake, idx, fallThrough)
      }
    } else {
      retArr[i].push(portationBlockPos[0]); // portation blocking position
      retArr[i].push(portationBlockPos[1]);
    }
  }

  // mark dead snakes and disappearing objects in the return array
  for (let i=0; i<deadArr.length; i++) {
    retArr[ deadArr[i] ].push(1); snakesStatic[ deadArr[i] ] = true;
  }
  for (let i=0; i<objOutArr.length; i++) {
    retArr[ objOutArr[i] + snakesStatic.length ].push(1); blocksStatic[ objOutArr[i] ] = true;
  }

  // fill retArr with positions of static objects
  for (let i=0; i<gameState.snakes.length + gameState.blocks.length; i++) {
    if (typeof retArr[i] !== 'object') {
      const isSnake = i < gameState.snakes.length;
      const idx = isSnake ? i : i - gameState.snakes.length;
      const cs = isSnake ? gameState.snakes[idx] : gameState.blocks[idx]; // body part queue
      const [x, y] = cs.getFront();
      retArr[i] = [x, y];
    }
  }

  targetInds = targetInds.sort((a, b) => b - a);
  const origSnakeInds = []; // saves the original snake indices
  for (let i=0; i<gameState.snakes.length; i++) origSnakeInds[i] = i;
  for (let i=0; i<targetInds.length; i++) {
    const targetInd = targetInds[i];
    if (targetInd != -1 && !deadArr.includes(targetInd)) { // delete snake that reached the target
      retArr[targetInd].push(2); // indicate that the snake reached the target cell in the return array
      removeSnakeFromField(gameState, origSnakeInds, snakesStatic, targetInd, deadArr, targetInds);
    }
  }

  const newSnakeIndices = getNewSnakeIndices(gameState, origSnakeInds);
  reinsertTargetAndPortals(gameState);

  if (allStatic) return [ALL_STATIC];
  const nPos = gameState.toString();
  if (alreadySeen.has(nPos)) {
    gameState.gameEnded = true;
    gameState.gameWon = false;
    if (gameState.getVal(gameState.target[0], gameState.target[1]) == EMPTY
        || gameState.getVal(gameState.target[0], gameState.target[1]) == TARGET)
      gameState.setStrVal(gameState.target[0], gameState.target[1], '?');
    return [ENDLESS_LOOP];
  }
  alreadySeen.set(nPos, true);
  if (fellOffBoardOnSpike) {
    gameState.gameEnded = true;
    gameState.gameWon = false;
    updateTargetCharacter(gameState);
    return [OUT_OF_BOARD_ONTO_SPIKE, retArr, objOutArr, deadArr, newSnakeIndices];
  }
  if (fellOnTarget && snakesStatic.length == 0) {
    gameState.gameEnded = true;
    gameState.gameWon = true;
    updateTargetCharacter(gameState);
    return [GAME_WON, retArr, objOutArr, null, newSnakeIndices];
  }
  return [MOVED, retArr, objOutArr, null, newSnakeIndices];
}

/**
 * Check if a snake or object can be ported
 * @param {GameState} gameState the current game state
 * @param {number} src the source portal's index
 * @param {number} tgt the destination portal's index
 * @param {Queue} cs the queue with the body parts of the snake (or block)
 * @param {boolean} isSnake whether or not the object to check is a snake
 * @param {boolean} fallThrough if set to true, snakes and objects that fall out of the board
 * will appear again at the top
 * @param {number[]} grav the direction of gravity
 * @return {any[]} an array containing: [canBePorted, portationBlockPos, portedOntoTarget, portedOutOfBoard, dx, dy]
 * where:
 * - canBePorted is a boolean that will be true if the snake can be ported
 * - portationBlockPos is an array of two numbers that will contain the cell blocking the portation
 * - portedOntoTarget is a boolean that will be true if the snake was ported onto the target
 * - portedOutOfBoard is a boolean that will be true if the object was ported out of the board
 * - dx is a number: the horizontal portation distance
 * - dy is a number: the vertical portation distance
 */
function canObjectBePorted(gameState, src, tgt, cs, isSnake, fallThrough, grav) {
  const dx = gameState.portalPos[tgt][0] - gameState.portalPos[src][0]; // x portation distance
  const dy = gameState.portalPos[tgt][1] - gameState.portalPos[src][1]; // y portation distance
  let canBePorted = true; // whether the object can be ported
  const portationBlockPos = []; // if not: the position of the cell blocking the portation
  let portedOntoTarget = false; // whether the snake head was ported directly onto the target
  let portedOutOfBoard = false; // whether the object was ported out of the board
  for (let q=0; q<cs.length; q++) {
    let [x, y] = cs.get(q);
    x += dx; y += dy; // new position of current body part
    const val = gameState.getVal(x, y,
      fallThrough ? WRAP_AROUND : BLOCK_LEFT_RIGHT(grav)); // value at new position
    if (fallThrough) {
      x += gameState.width; x %= gameState.width;
      y += gameState.height; y %= gameState.height;
    }
    if (val > 0 || val == OBSTACLE || val == SPIKE || val == FRUIT) { // portation is blocked
      canBePorted = false; portationBlockPos.push(x); portationBlockPos.push(y);
      break;
    }
    if (gameState.target[0] == x && gameState.target[1] == y && isSnake && q == 0
        && gameState.fruits == 0) {
      portedOntoTarget = true; // snake head on target
    }
    if (x < 0 || x >= gameState.width || y < 0 || y >= gameState.height) portedOutOfBoard = true;
  }
  return [canBePorted, portationBlockPos, portedOntoTarget, portedOutOfBoard, dx, dy];
}

/**
 * Check if a snake or object can be ported
 * @param {GameState} gameState the current game state (will be modified)
 * @param {Queue} cs the queue with the body parts of the snake (or block) (will be modified)
 * @param {number} dx the horizontal distance the object should be moved by
 * @param {number} dy the vertical distance the object should be moved by
 * @param {boolean} isSnake whether or not the object to check is a snake
 * @param {number} idx the index of the object in the gameState.snakes / gameState.blocks array
 * @param {boolean} fallThrough if set to true, snakes and objects that fall out of the board
 * will appear again at the top
 */
function insertObjectAtPosition(gameState, cs, dx, dy, isSnake, idx, fallThrough) {
  let lastx, lasty; // last body part x / y coordinate (to decide whether to use <,>,^ or v)
  for (let q=0; q<cs.length; q++) {
    const pos = cs.get(q);
    pos[0] += dx; pos[1] += dy; // update position
    if (fallThrough) {
      pos[0] += gameState.width; pos[1] += gameState.height;
      pos[0] %= gameState.width; pos[1] %= gameState.height;
    }
    if (q == 0 || !isSnake) { // snake head / block
      const nval1 = isSnake ? gameState.snakeToCharacter[idx] : gameState.blockToCharacter[idx];
      gameState.setStrVal(pos[0], pos[1], nval1); // set appropriate character
    } else {
      let nval1 = '!';
      const diffx = pos[0] - lastx, diffy = pos[1] - lasty;
      if (diffx == 1 || diffx == 1 - gameState.width) nval1 = '<';
      else if (diffx == -1 || diffx == gameState.width - 1) nval1 = '>';
      else if (diffy == 1 || diffy == 1 - gameState.height) nval1 = '^';
      else if (diffy == -1 || diffy == gameState.height - 1) nval1 = 'v';
      gameState.setStrVal(pos[0], pos[1], nval1); // set appropriate character
    }
    const nval2 = isSnake ? SNAKE(idx) : BLOCK(idx); // appropriate new field value
    gameState.setVal(pos[0], pos[1], nval2);
    lastx = pos[0]; lasty = pos[1];
  }
}

/**
 * Remove a snake from all relevant arrays after it reached the target
 * @param {GameState} gameState the current game state (will be modified)
 * @param {number[]} origSnakeInds an array with original snake indices (will be modified)
 * @param {boolean[]} snakesStatic an array indicating which snakes are static (will be modified)
 * @param {number} remIdx the index of the snake to remove
 * @param {number[]} [deadArr] an array containing indices of dead snakes
 * @param {number[]} [targetInds] an array containing indices of snakes that reached the target
 */
function removeSnakeFromField(gameState, origSnakeInds, snakesStatic, remIdx, deadArr = null,
    targetInds = null) {
  const snChar = gameState.snakeToCharacter[remIdx]; // target snake character
  for (let i=remIdx; i<gameState.snakes.length - 1; i++) {
    gameState.snakes[i] = gameState.snakes[i + 1]; // delete from snakes array
    gameState.snakeToCharacter[i] = gameState.snakeToCharacter[i + 1]; // delete from snakeToCharacter array
    gameState.snakeMap.set(gameState.snakeToCharacter[i], i); // update snakeMap
    snakesStatic[i] = snakesStatic[i + 1];
    origSnakeInds[i] = origSnakeInds[i + 1];
    let presentCheck = true;
    if (deadArr !== null && targetInds !== null) 
      presentCheck = (!deadArr.includes(origSnakeInds[i]) && !targetInds.includes(origSnakeInds[i]));
    if (presentCheck) {
      // if snake is still present on the field: update gameState.field
      const cs = gameState.snakes[i];
      for (let q=0; q<cs.length; q++) {
        const pos = cs.get(q);
        if (pos[0] < 0 || pos[1] < 0 || pos[0] >= gameState.width || pos[1] >= gameState.height
            || gameState.getVal(pos[0], pos[1]) != SNAKE(i + 1))
          break; // apparently, this snake isn't present on the field, after all
        gameState.setVal(pos[0], pos[1], SNAKE(i)); // update gameState.field
      }
    }
  }
  gameState.snakes.pop();
  gameState.snakeToCharacter.pop();
  gameState.snakeMap.delete(snChar);
  snakesStatic.pop();
  origSnakeInds.pop();
}

/**
 * Remove a block from all relevant arrays after it fell out of the board
 * @param {GameState} gameState the current game state (will be modified)
 * @param {number[]} origBlockInds an array with original block indices (will be modified)
 * @param {boolean[]} blocksStatic an array indicating which blocks are static (will be modified)
 * @param {number} remIdx the index of the block to remove
 */
function removeBlockFromField(gameState, origBlockInds, blocksStatic, remIdx) {
  const blChar = gameState.blockToCharacter[remIdx]; // target block character
  for (let i=remIdx; i<gameState.blocks.length - 1; i++) {
    gameState.blocks[i] = gameState.blocks[i + 1]; // delete from blocks array
    gameState.blockToCharacter[i] = gameState.blockToCharacter[i + 1]; // delete from blockToCharacter array
    gameState.blockMap.set(gameState.blockToCharacter[i], i); // update blockMap
    blocksStatic[i] = blocksStatic[i + 1];
    origBlockInds[i] = origBlockInds[i + 1];
    // if block is still present on the field: update gameState.field
    const cs = gameState.blocks[i];
    for (let q=0; q<cs.length; q++) {
      const pos = cs.get(q);
      if (pos[0] < 0 || pos[1] < 0 || pos[0] >= gameState.width || pos[1] >= gameState.height
          || gameState.getVal(pos[0], pos[1]) != BLOCK(i + 1))
        break; // apparently, this block isn't present on the field, after all
      gameState.setVal(pos[0], pos[1], BLOCK(i)); // update gameState.field
    }
  }
  gameState.blocks.pop();
  gameState.blockToCharacter.pop();
  gameState.blockMap.delete(blChar);
  blocksStatic.pop();
  origBlockInds.pop();
}

/**
 * Reinsert portals and target into the game field (after they were hidden by a block or snake)
 * @param {GameState} gameState the current game state (will be modified)
 */
function reinsertTargetAndPortals(gameState) {
  // reinsert target into field
  if (gameState.getVal(gameState.target[0], gameState.target[1]) == EMPTY
      || gameState.getVal(gameState.target[0], gameState.target[1]) == TARGET) {
    if (gameState.fruits == 0)
      gameState.setVal(gameState.target[0], gameState.target[1], TARGET);
    gameState.setStrVal(gameState.target[0], gameState.target[1], 'X');
  }
  // reinsert portals into field
  if (gameState.portalPos.length > 0) {
    for (let i=0; i<gameState.portalPos.length; i++) {
      if (gameState.getVal(gameState.portalPos[i][0], gameState.portalPos[i][1]) == EMPTY) {
        gameState.setVal(gameState.portalPos[i][0], gameState.portalPos[i][1], PORTAL);
        gameState.setStrVal(gameState.portalPos[i][0], gameState.portalPos[i][1], '*');
      }
    }
  }
}

/**
 * Update the target character according to whether the game was won or lost
 * @param {GameState} gameState the current game state (will be modified)
 * 
 */
function updateTargetCharacter(gameState) {
  if (gameState.gameEnded) {
    if (gameState.gameWon) {
      if (gameState.getVal(gameState.target[0], gameState.target[1]) == EMPTY
          || gameState.getVal(gameState.target[0], gameState.target[1]) == TARGET)
        gameState.setStrVal(gameState.target[0], gameState.target[1], '$');
    } else {
      if (gameState.getVal(gameState.target[0], gameState.target[1]) == EMPTY
          || gameState.getVal(gameState.target[0], gameState.target[1]) == TARGET)
        gameState.setStrVal(gameState.target[0], gameState.target[1], '?');
    }
  }
}

/**
 * Get an array mapping old snake indices to new snake indices
 * @param {GameState} gameState the current game state
 * @param {number[]} origSnakeInds an array mapping new snake indices to old snake indices
 * @return {number[]} the array mapping old snake indices to new snake indices
 */
function getNewSnakeIndices(gameState, origSnakeInds) {
  const newSnakeIndices = []; // array mapping old snake indices to new snake indices
  for (let i=0; i<gameState.snakes.length; i++) newSnakeIndices[i] = -1;
  for (let i=0; i<origSnakeInds.length; i++) newSnakeIndices[ origSnakeInds[i] ] = i;
  return newSnakeIndices;
}

/**
 * Delete an object from the field
 * @param {GameState} gameState the current game state (will be modified)
 * @param {Queue} cs the queue with the body parts of the snake (or block)
 */
function deleteObject(gameState, cs) {
  for (let q=0; q<cs.length; q++) {
    const pos = cs.get(q);
    if (pos[0] < 0 || pos[1] < 0 || pos[0] >= gameState.width || pos[1] >= gameState.height
        || gameState.getVal(pos[0], pos[1]) <= 0)
      continue;
    gameState.setStrVal(pos[0], pos[1], '.');
    gameState.setVal(pos[0], pos[1], EMPTY);
  }
}
