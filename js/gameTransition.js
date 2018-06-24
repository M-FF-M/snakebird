
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
 * Calculate the transition from one game state to another when one snake is moved in a specific
 * direction
 * @param {GameState} gameState the original game state
 * @param {string|number} snake the snake to move. Can either be the character or the number
 * corresponding to the snake. If snake is null, no snake will be moved and only the falling
 * of the objects will be simulated.
 * @param {number[]} direction the direction of the snake movement  (one of LEFT, RIGHT, UP, DOWN)
 * @param {boolean} [fallThrough] if set to true, snakes and objects that fall out of the board
 * will appear again at the top
 * @param {number[]} [gravity] the direction of gravity (one of LEFT, RIGHT, UP, DOWN)
 * @param {boolean} [moveInfo] whether to include detailed move info in the response (see description
 * below; if set to false, the method will return the GameState object which is normally returned
 * at index 3 of the return array)
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
 *   If the dimension is not 2, one of the following is indicated:
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
    moveInfo = true) {
  gameState = gameState.clone(); // clone state to be able to modify it
  let ateFruit = false; // whether or not the snake ate a fruit
  // at the beginning, all snakes and blocks are assumed to be movable
  const snakesStatic = []; for (let i=0; i<gameState.snakes.length; i++) snakesStatic[i] = false;
  const blocksStatic = []; for (let i=0; i<gameState.blocks.length; i++) blocksStatic[i] = false;
  const retArr = []; // the result array
  // insert current positions into retArr
  const curPos = [];
  for (let i=0; i<snakesStatic.length + blocksStatic.length; i++) {
    const isSnake = i < snakesStatic.length; const idx = isSnake ? i : i - snakesStatic.length;
    const cs = isSnake ? gameState.snakes[idx] : gameState.blocks[idx]; // body part queue
    curPos[i] = [cs.getFront()[0], cs.getFront()[1]];
  }
  retArr.push(curPos);
  if (snake !== null) {

  }
  const alreadySeen = new Map(); // saves which positions have already been encountered
  alreadySeen.set(gameState.toString(), true);
  let loopCounter = 0; // preventing infinite loops
  while (true) {
    const res = move(gameState, alreadySeen, snakesStatic, blocksStatic, gravity, fallThrough);
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
    if (++loopCounter >= 1000) throw new Error('Detected endless loop in gameTransition()!');
  }
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
 * @param {boolean} [fallThrough] if set to true, snakes and objects that fall out of the board
 * will appear again at the top
 * @return {any[]} an array with the following information:
 * - at index 0: one of MOVED, GAME_WON, ALL_STATIC, ENDLESS_LOOP, OUT_OF_BOARD_ONTO_SPIKE
 * - at index 1 (in case of MOVED, GAME_WON, OUT_OF_BOARD_ONTO_SPIKE): one entry of the array that is
 *   returned by gameTransition() at index 2
 * - at index 2 (in case of MOVED, GAME_WON, OUT_OF_BOARD_ONTO_SPIKE): an array of block indices of
 *   blocks that fell out of the board
 * - at index 3 (in case of OUT_OF_BOARD_ONTO_SPIKE): an array of snake indices of snakes that died
 */
function move(gameState, alreadySeen, snakesStatic, blocksStatic, dir = DOWN, fallThrough = false) {
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

  // build graph
  for (let i=0; i<gameState.snakes.length + gameState.blocks.length; i++) {
    let ib = i, cSnake = true;
    if (i >= gameState.snakes.length) {
      ib -= gameState.snakes.length;
      cSnake = false;
    }
    if (cSnake && snakesStatic[ib] || !cSnake && blocksStatic[ib]) continue; // object is already static
    const cs = cSnake ? gameState.snakes[ib] : gameState.blocks[ib]; // body part queue
    for (let k=0; k<cs.length; k++) {
      const [x, y] = cs.get(k); // coordinates of body part
      const val = gameState.getVal(xb(x), yb(y),
        fallThrough ? WRAP_AROUND : BLOCK_LEFT_RIGHT(dir)); // value at new position
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

    if (isNowStatic) { // object cannot fall anymore
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
            deadArr.push(idx); snakesStatic[idx] = true; fellOffBoardOnSpike = true;
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
            if (diffx == 1) nval1 = '<';
            else if (diffx == -1) nval1 = '>';
            else if (diffy == 1) nval1 = '^';
            else if (diffy == -1) nval1 = 'v';
            gameState.setStrVal(pos[0], pos[1], nval1); // set appropriate character
          }
          const nval2 = isSnake ? SNAKE(idx) : BLOCK(idx); // appropriate new field value
          gameState.setVal(pos[0], pos[1], nval2);
          lastx = pos[0]; lasty = pos[1];
        }

        if (deleteAgain) { // delete object from board
          for (let q=0; q<cs.length; q++) {
            const pos = cs.get(q);
            if (pos[0] < 0 || pos[1] < 0 || pos[0] >= gameState.width || pos[1] >= gameState.height
                || gameState.getVal(pos[0], pos[1]) <= 0)
              continue;
            gameState.setStrVal(pos[0], pos[1], '.');
            gameState.setVal(pos[0], pos[1], EMPTY);
          }
        }
      }
    }
  }

  // move objects that touch a portal
  for (let i=0; i<gameState.snakes.length + gameState.blocks.length; i++) {
    const isSnake = i < gameState.snakes.length;
    const idx = isSnake ? i : i - gameState.snakes.length;
    if (!checkPortation[i] || isSnake && deadArr.includes(idx) || !isSnake && objOutArr.includes(idx)
        || isSnake && targetInds.includes(idx))
      continue; // continue for objects that don't touch portals or objects that fell out of the board
    const src = portationInds[i][0], tgt = portationInds[i][1]; // source and destination portal index
    const dx = gameState.portalPos[tgt][0] - gameState.portalPos[src][0]; // x portation distance
    const dy = gameState.portalPos[tgt][1] - gameState.portalPos[src][1]; // y portation distance
    const cs = isSnake ? gameState.snakes[idx] : gameState.blocks[idx]; // body part queue
    let canBePorted = true; // whether the object can be ported
    const portationBlockPos = []; // if not: the position of the cell blocking the portation
    let portedOntoTarget = false; // whether the snake head was ported directly onto the target
    let portedOutOfBoard = false; // whether the object was ported out of the board
    for (let q=0; q<cs.length; q++) {
      let [x, y] = cs.get(q);
      x += dx; y += dy; // new position of current body part
      const val = gameState.getVal(x, y,
        fallThrough ? WRAP_AROUND : BLOCK_LEFT_RIGHT(dir)); // value at new position
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
        fellOnTarget = true; targetInds.push(idx);
      }
      if (x < 0 || x >= gameState.width || y < 0 || y >= gameState.height) portedOutOfBoard = true;
    }
    // add information to retArr
    retArr[i].push(retArr[i][0] + dx); // new position
    retArr[i].push(retArr[i][1] + dy);
    retArr[i].push(src); retArr[i].push(tgt); // source and destination portal index
    if (canBePorted) {
      // delete from old position
      for (let q=0; q<cs.length; q++) {
        let [x, y] = cs.get(q);
        gameState.setStrVal(x, y, '.');
        gameState.setVal(x, y, EMPTY);
      }
      if (portedOutOfBoard) {
        if (isSnake) { deadArr.push(idx); snakesStatic[idx] = true; fellOffBoardOnSpike = true; }
        else { objOutArr.push(idx); blocksStatic[idx] = true; } // block / snake out of board
        // retArr[i].push(1); this will be done automatically (see below, deadArr loop)
      } else if (portedOntoTarget) {
        // retArr[i].push(2); this will be done automatically (see below, targetInds loop)
      } else {
        // insert at new position
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
            if (diffx == 1) nval1 = '<';
            else if (diffx == -1) nval1 = '>';
            else if (diffy == 1) nval1 = '^';
            else if (diffy == -1) nval1 = 'v';
            gameState.setStrVal(pos[0], pos[1], nval1); // set appropriate character
          }
          const nval2 = isSnake ? SNAKE(idx) : BLOCK(idx); // appropriate new field value
          gameState.setVal(pos[0], pos[1], nval2);
          lastx = pos[0]; lasty = pos[1];
        }
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
  for (let i=0; i<targetInds.length; i++) {
    const targetInd = targetInds[i];
    if (targetInd != -1 && !deadArr.includes(targetInd)) { // delete snake that reached the target
      retArr[targetInd].push(2); // indicate that the snake reached the target cell in the return array
      const snChar = gameState.snakeToCharacter[targetInd]; // target snake character
      for (let i=targetInd; i<gameState.snakes.length - 1; i++) {
        gameState.snakes[i] = gameState.snakes[i + 1]; // delete from snakes array
        gameState.snakeToCharacter[i] = gameState.snakeToCharacter[i + 1]; // delete from snakeToCharacter array
        gameState.snakeMap[ gameState.snakeToCharacter[i] ] = i; // update snakeMap
        snakesStatic[i] = snakesStatic[i + 1];
        const cs = gameState.snakes[i];
        for (let q=0; q<cs.length; q++) {
          const pos = cs.get(q);
          gameState.setVal(pos[0], pos[1], SNAKE(i)); // update gameState.field
        }
      }
      gameState.snakes.pop();
      gameState.snakeToCharacter.pop();
      gameState.snakeMap.delete(snChar);
      snakesStatic.pop();
    }
  }

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
    if (gameState.getVal(gameState.target[0], gameState.target[1]) == EMPTY
        || gameState.getVal(gameState.target[0], gameState.target[1]) == TARGET)
      gameState.setStrVal(gameState.target[0], gameState.target[1], '?');
    return [OUT_OF_BOARD_ONTO_SPIKE, retArr, objOutArr, deadArr];
  }
  if (fellOnTarget && snakesStatic.length == 0) {
    gameState.gameEnded = true;
    gameState.gameWon = true;
    if (gameState.getVal(gameState.target[0], gameState.target[1]) == EMPTY
        || gameState.getVal(gameState.target[0], gameState.target[1]) == TARGET)
      gameState.setStrVal(gameState.target[0], gameState.target[1], '$');
    return [GAME_WON, retArr, objOutArr];
  }
  return [MOVED, retArr, objOutArr];
}
