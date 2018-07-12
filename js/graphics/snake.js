
/**
 * Draw a single snake
 * @param {GameDrawer} gd the game drawer calling this method
 * @param {GameState} state the (old) game state
 * @param {CanvasRenderingContext2D} con the context of the canvas
 * @param {HTMLElement} can the canvas the target should be drawn on
 * @param {number} bSize the size of a single grid cell
 * @param {Function} bCoord a function that takes the x and y coordinates of a grid cell in the game
 * state array as parameters and returns an array with the corresponding x and y coordinates of the
 * center of the grid cell on the canvas
 * @param {Queue} partQ a queue with the body parts of the snake
 * @param {string} color the color of the snake
 * @param {number[]} offset the offset the snake should be moved by
 * @param {number[][]} borderArr an array that will be modified to reflect whether a snake is close
 * to the game board border
 * @param {number} globalSlowTime a number between 0 and 1 that is used for cyclic animations
 * @param {Function} [zoom] a function that applies a zoom and a translation to the context
 * @param {number} [mvSnProg] if not -1, either between 0 and 1, specifying the progress of the first
 * movement of the snake's head or 2, specifying that the snake already moved its head (if it is -1,
 * this snake only falls but was not actively moved by the player)
 */
function drawSnakebird(gd, state, con, can, bSize, bCoord, partQ, color, offset, borderArr, globalSlowTime, zoom, mvSnProg = -1) {
  const con2 = getHiddenContext(can);
  if (typeof zoom === 'function') zoom(con2);
  const lightColor = lighten(color);
  let len = partQ.length;
  if (mvSnProg == 2 && !gd._aniAteFruit) len--;

  for (let i=len-1; i>=0; i--) { // draw colored snake
    const [lastPos, nextPos] = getPosDiff(partQ, i, len);
    const nextNextPos = i > 0 ? getPosDiff(partQ, i - 1, len)[1] : nextPos;
    if (i % 2 == 0) con2.fillStyle = color;
    else con2.fillStyle = lightColor;
    const [x, y] = partQ.get(i);
    const off = calcOffset(offset, i, mvSnProg, gd, len, partQ, x, y);
    const [ox, oy, drawAt] = gd._getAllOffsets(state, x, y, off);
    for (let k=0; k<drawAt.length; k++) {
      const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
      con2.fillRect(bx - bSize / 2, by - bSize / 2, bSize, bSize);
      if (i == 0) {
        con2.fillStyle = 'rgba(255, 255, 255, 1)';
        con2.beginPath();
        con2.arc(bx, by, bSize / 3, 0, 2 * Math.PI);
        con2.closePath();
        con2.fill();
        con2.fillStyle = color;
      }
    }
  }

  const con3 = getHiddenContext(can, true, 1);
  if (typeof zoom === 'function') zoom(con3);
  con3.fillStyle = 'rgba(255, 255, 255, 1)';
  con3.beginPath();
  for (let i=len-1; i>=0; i--) { // draw snake with rounded corners
    const [lastPos, nextPos] = getPosDiff(partQ, i, len);
    const lA = (lastPos == 0 || nextPos == 0) ? -1 : 0; // left add
    const tA = (lastPos == 1 || nextPos == 1) ? -1 : 0; // top add
    const rA = (lastPos == 2 || nextPos == 2) ? 1 : 0; // right add
    const bA = (lastPos == 3 || nextPos == 3) ? 1 : 0; // bottom add
    const [x, y] = partQ.get(i);
    const off = calcOffset(offset, i, mvSnProg, gd, len, partQ, x, y);
    const [ox, oy, drawAt] = gd._getAllOffsets(state, x, y, off, borderArr);
    for (let k=0; k<drawAt.length; k++) {
      const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
      // con3.beginPath();
      // con3.moveTo(bx, by - bSize / 2 + tA);
      // con3.closePath();
      // con3.fill();
      con3.fillRect(bx - bSize / 2, by - bSize / 2, bSize, bSize);
    }
  }
  con3.closePath();
  con3.fill();

  if (typeof zoom === 'function') con2.restore();
  con2.globalCompositeOperation = 'destination-in';
  drawHiddenCanvas(con2, 1); // draw snake with rounded corners
  con2.globalCompositeOperation = 'source-over';
  drawHiddenCanvas(con, 0, zoom); // draw snake on main canvas

  if (typeof zoom === 'function') con3.restore();
}

/**
 * Calculates the offset for a given body part of the snake (if the snake is currently actively moving; not only falling)
 * @param {number[]} off the current offset
 * @param {number} i the loop counter (indicating the index of the body part)
 * @param {number} mvSnProg if not -1, either between 0 and 1, specifying the progress of the first
 * movement of the snake's head or 2, specifying that the snake already moved its head (if it is -1,
 * this snake only falls but was not actively moved by the player)
 * @param {number} len the length of the snake
 * @param {Queue} partQ a queue with the body parts of the snake
 * @param {number} x the x coordinate of the current body part
 * @param {number} y the y coordinate of the current body part
 * @return {number[]} the new calculated offset
 */
function calcOffset(off, i, mvSnProg, gd, len, partQ, x, y) {
  if (i != 0 && mvSnProg >= 0 && mvSnProg <= 1) {
    if (i == len - 1 && !gd._aniAteFruit) {
      let [nx, ny] = partQ.get(i-1);
      if (gd._fallThrough) {
        [nx, ny] = gd._checkPosChange([x, y], [nx, ny]);
      }
      off = [(nx - x) * mvSnProg, (ny - y) * mvSnProg];
    } else off = [0, 0];
  }
  return off;
}

/**
 * Get the directions of the two adjacent body parts for a specific body part
 * @param {Queue} partQ a queue with the body parts of the snake
 * @param {number} idx the index of the body part
 * @param {number} len the length of the snake
 * @return {number[]} an array containing [position of last body part, position of next body part] - where the next body part is the one that is closer
 * to the snake head. The position is given as one of 0: left, 1: top, 2: right, 3: bottom
 */
function getPosDiff(partQ, idx, len) {
  const [x, y] = partQ.get(idx);
  let lpdiff = [-1, 0], npdiff = [1, 0];
  if (idx > 0 && idx < len - 1) {
    lpdiff = [partQ.get(idx+1)[0] - x, partQ.get(idx+1)[1] - y];
    npdiff = [partQ.get(idx-1)[0] - x, partQ.get(idx-1)[1] - y];
  } else if (idx == 0 && idx < len - 1) {
    lpdiff = [partQ.get(idx+1)[0] - x, partQ.get(idx+1)[1] - y];
    npdiff = [-lpdiff[0], -lpdiff[1]];
  } else if (idx == len - 1 && idx > 0) {
    npdiff = [partQ.get(idx-1)[0] - x, partQ.get(idx-1)[1] - y];
    lpdiff = [-npdiff[0], -npdiff[1]];
  }
  const lastPos = lpdiff[0] == -1 ? 0 : (lpdiff[0] == 1 ? 2 : (lpdiff[1] == -1 ? 1 : 3)); // 0: left, 1: top, 2: right, 3: bottom
  const nextPos = npdiff[0] == -1 ? 0 : (npdiff[0] == 1 ? 2 : (npdiff[1] == -1 ? 1 : 3)); // 0: left, 1: top, 2: right, 3: bottom
  return [lastPos, nextPos];
}
