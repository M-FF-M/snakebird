
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
 * @param {boolean} [fallThrough] if set to true, snakes that fall out of the board will appear again on the other side of the board
 * @param {number} [disProgr] a number between 0 and 1 indicating the disappearing progress (1 = snake disappeared)
 * @param {any[]} [portation] an array indicating portation: [isBeingPorted, progr, startHeadX, startHeadY, endHeadX, endHeadY, port1X, port1Y, port2X, port2Y]
 * @param {number} [targetProgr] a number between 0 and 1 indicating the disappearing progress when the snake reached the taregt (1 = snake disappeared)
 */
function drawSnakebird(gd, state, con, can, bSize, bCoord, partQ, color, offset, borderArr, globalSlowTime, zoom, mvSnProg = -1, fallThrough = false,
    disProgr = 0, portation = [false], targetProgr = 0) {
  let gdAniAteFruit = gd._aniAteFruit;
  disProgr *= disProgr;
  const con2 = getHiddenContext(can);
  if (typeof zoom === 'function') zoom(con2);
  const lightColor = lighten(color, 0.3);
  let len = partQ.length;
  if (mvSnProg == 2 && !gdAniAteFruit) len--;

  let colorSwitch = false; let noHead = false; const oldLen = len;
  if (targetProgr > 0) {
    const nPartQ = new Queue();
    for (let i=0; i<partQ.length; i++) nPartQ.pushBack(partQ.get(i));
    partQ = nPartQ;
    mvSnProg = (targetProgr * len) % 1;
    len = Math.ceil((1 - targetProgr) * len);
    colorSwitch = (oldLen - len) % 2 ? true : false;
    if (oldLen - len >= 1) noHead = true;
    gdAniAteFruit = false;
  }

  const origOffset = offset;
  if (targetProgr == 0 || len > 1) {
    for (let i=len-1; i>=0; i--) {
      const [x, y] = partQ.get(i);
      const off = calcOffset(offset, i, mvSnProg, gd, len, partQ, x, y, gdAniAteFruit, targetProgr == 0, targetProgr > 0 ? origOffset : [0, 0]);
      gd._getAllOffsets(state, x, y, off, borderArr);
    } // necessary for correctly filling borderArr
  }

  const [orig_0x, orig_0y] = partQ.get(0);
  const origOff = calcOffset(origOffset, 0, -1, gd, len, partQ, orig_0x, orig_0y, gdAniAteFruit);
  const [orig_0ox, orig_0oy, orig_0drawAt] = gd._getAllOffsets(state, orig_0x, orig_0y, origOff, undefined, fallThrough);
  if (targetProgr > 0) {
    const fPos = partQ.getFront();
    const [lastPos] = getPosDiff(partQ, 0, oldLen); // 0: left, 1: top, 2: right, 3: bottom
    if (lastPos == 0) partQ.pushFront([fPos[0] + 1, fPos[1]]);
    else if (lastPos == 1) partQ.pushFront([fPos[0], fPos[1] + 1]);
    else if (lastPos == 2) partQ.pushFront([fPos[0] - 1, fPos[1]]);
    else partQ.pushFront([fPos[0], fPos[1] - 1]);
    len++;
  }

  const drawArrA = []; const drawArrA_1 = [];
  const drawArrB = [];

  let lx, ly;
  for (let i=len-1; i>=0; i--) { // prepare colored snake array
    const [lastPos, nextPos] = getPosDiff(partQ, i, len); // 0: left, 1: top, 2: right, 3: bottom
    const lastLastPos = i < len-1 ? getPosDiff(partQ, i + 1, len)[0] : lastPos;
    let [x, y] = partQ.get(i);
    if (fallThrough) {
      if (i < len-1) {
        const xd = x - lx, yd = y - ly;
        if (xd >= 2) x -= state.width;
        if (xd <= -2) x += state.width;
        if (yd >= 2) y -= state.height;
        if (yd <= -2) y += state.height;
      }
      lx = x; ly = y;
    }
    const off = calcOffset(offset, i, mvSnProg, gd, len, partQ, x, y, gdAniAteFruit, false, targetProgr > 0 ? origOffset : [0, 0]);
    const [ox, oy, drawAt] = gd._getAllOffsets(state, x, y, off, undefined, fallThrough);
    drawArrA.push([[i, lastLastPos, lastPos, nextPos], [ox, oy, drawAt]]);
    drawArrA_1.push([x, y]);
  }
  drawArrA_1.reverse();

  for (let i=len-1; i>=0; i--) { // prepare snake with rounded corners array
    const [lastPos, nextPos] = getPosDiff(partQ, i, len); // 0: left, 1: top, 2: right, 3: bottom
    const lA = (lastPos == 0 || nextPos == 0) ? -1 : 0; // left add
    const tA = (lastPos == 1 || nextPos == 1) ? -1 : 0; // top add
    const rA = (lastPos == 2 || nextPos == 2) ? 1 : 0; // right add
    const bA = (lastPos == 3 || nextPos == 3) ? 1 : 0; // bottom add
    let [x, y] = partQ.get(i);
    if (fallThrough) {
      if (i < len-1) {
        const xd = x - lx, yd = y - ly;
        if (xd >= 2) x -= state.width;
        if (xd <= -2) x += state.width;
        if (yd >= 2) y -= state.height;
        if (yd <= -2) y += state.height;
      }
      lx = x; ly = y;
    }
    const off = calcOffset(offset, i, mvSnProg, gd, len, partQ, x, y, gdAniAteFruit, true, targetProgr > 0 ? origOffset : [0, 0]);
    const [ox, oy, drawAt] = gd._getAllOffsets(state, x, y, off, undefined, fallThrough);
    drawArrB.push([[i, lastPos, nextPos, lA, tA, rA, bA], [ox, oy, drawAt]]);
  }


  const pA = [];
  let trans = portation[0] ? (portation[1] <= 0.5 ? (0.5 - portation[1]) / 0.5 : (portation[1] - 0.5) / 0.5) : 1;
  trans = 1 - ((1 - trans) * (1 - trans));
  for (let k=0; k<drawArrA[0][1][2].length; k++) { // draw colored snake
    pA[k] = [];
    for (let i=0; i<drawArrA_1.length; i++) pA[k].push([drawArrA_1[i][0] + drawArrA[0][1][2][k][0] + offset[0], drawArrA_1[i][1] + drawArrA[0][1][2][k][1] + offset[1]]);
    scaleCon(con2, state, portation, pA[k], len, bCoord);
    for (let q=0; q<drawArrA.length; q++) {
      if (targetProgr > 0 && len == 2 && q == 0) continue;
      const [[i, lastLastPos, lastPos, nextPos], [ox, oy, drawAt]] = drawArrA[q];
      if ((i % 2 == 0 && !colorSwitch) || (i % 2 == 1 && colorSwitch)) con2.fillStyle = transparentize(color, trans * (1 - disProgr));
      else con2.fillStyle = transparentize(lightColor, trans * (1 - disProgr));
      let [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
      if (mvSnProg >= 0 && mvSnProg <= 1) { // draw active snake movement
        let [[fsx1, fsy1, fsx2, fsy2], [fmx1, fmy1, fmx2, fmy2], [fex1, fey1, fex2, fey2],
          [lsx1, lsy1, lsx2, lsy2], [lmx1, lmy1, lmx2, lmy2], [lex1, ley1, lex2, ley2], [cx, cy]]
          = getEndMoves(lastLastPos, lastPos, nextPos, bx, by, bSize, mvSnProg);
        if (i == 0 && targetProgr > 0) [fex1, fey1, fex2, fey2] = [fmx1, fmy1, fmx2, fmy2] = [fsx1, fsy1, fsx2, fsy2];
        if (mvSnProg <= 0.5) { // first half of animation
          const t = mvSnProg / 0.5;
          con2.beginPath();
          con2.moveTo((1 - t) * fsx1 + t * fmx1, (1 - t) * fsy1 + t * fmy1);
          con2.lineTo((1 - t) * fsx2 + t * fmx2, (1 - t) * fsy2 + t * fmy2);
          con2.lineTo(lmx1, lmy1);
          con2.lineTo((1 - t) * lsx1 + t * lmx1, (1 - t) * lsy1 + t * lmy1);
          if (i == len - 1) con2.lineTo((1 - t) * lsx2 + t * lmx2, (1 - t) * lsy2 + t * lmy2);
          else blockEndPath(con2, (1 - t) * lsx1 + t * lmx1, (1 - t) * lsy1 + t * lmy1, (1 - t) * lsx2 + t * lmx2, (1 - t) * lsy2 + t * lmy2);
          con2.lineTo(lmx2, lmy2);
          con2.lineTo((1 - t) * fsx1 + t * fmx1, (1 - t) * fsy1 + t * fmy1);
          con2.closePath();
          con2.fill();
        } else { // second half of animation
          const t = (mvSnProg - 0.5) / 0.5;
          con2.beginPath();
          con2.moveTo((1 - t) * fmx1 + t * fex1, (1 - t) * fmy1 + t * fey1);
          con2.lineTo((1 - t) * fmx2 + t * fex2, (1 - t) * fmy2 + t * fey2);
          con2.lineTo(fmx2, fmy2);
          con2.lineTo((1 - t) * lmx1 + t * lex1, (1 - t) * lmy1 + t * ley1);
          if (i == len - 1) con2.lineTo((1 - t) * lmx2 + t * lex2, (1 - t) * lmy2 + t * ley2);
          else blockEndPath(con2, (1 - t) * lmx1 + t * lex1, (1 - t) * lmy1 + t * ley1, (1 - t) * lmx2 + t * lex2, (1 - t) * lmy2 + t * ley2);
          con2.lineTo(fmx1, fmy1);
          con2.lineTo((1 - t) * fmx1 + t * fex1, (1 - t) * fmy1 + t * fey1);
          con2.closePath();
          con2.fill();
        }
      } else { // draw snake (without active movement)
        con2.beginPath();
        con2.moveTo(bx - bSize / 2, by - bSize / 2);
        if (lastPos != 1 || i == len - 1) con2.lineTo(bx + bSize / 2, by - bSize / 2);
        else blockEndPath(con2, bx - bSize / 2, by - bSize / 2, bx + bSize / 2, by - bSize / 2);
        if (lastPos != 2 || i == len - 1) con2.lineTo(bx + bSize / 2, by + bSize / 2);
        else blockEndPath(con2, bx + bSize / 2, by - bSize / 2, bx + bSize / 2, by + bSize / 2);
        if (lastPos != 3 || i == len - 1) con2.lineTo(bx - bSize / 2, by + bSize / 2);
        else blockEndPath(con2, bx + bSize / 2, by + bSize / 2, bx - bSize / 2, by + bSize / 2);
        if (lastPos != 0 || i == len - 1) con2.lineTo(bx - bSize / 2, by - bSize / 2);
        else blockEndPath(con2, bx - bSize / 2, by + bSize / 2, bx - bSize / 2, by - bSize / 2);
        con2.closePath();
        con2.fill();
      }
    }
    restoreCon(con2, portation);
  }

  let con3 = getHiddenContext(can, true, 1);
  if (typeof zoom === 'function') zoom(con3);
  con3.fillStyle = 'rgba(255, 255, 255, 1)';
  for (let k=0; k<drawArrB[0][1][2].length; k++) { // draw snake with rounded corners
    scaleCon(con3, state, portation, pA[k], len, bCoord);
    for (let q=0; q<(targetProgr > 0 ? drawArrB.length - 1 : drawArrB.length); q++) {
      const [[i, lastPos, nextPos, lA, tA, rA, bA], [ox, oy, drawAt]] = drawArrB[q];
      const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
      con3.beginPath();
      con3.moveTo(bx, by - bSize / 2 + tA);
      if ((i == 0 && i == len-1)
          || (mvSnProg >= 0.5 && mvSnProg <= 1 && !gdAniAteFruit && i == len - 2 && nextPos != 1 && nextPos != 2)
          || (mvSnProg >= 0.5 && mvSnProg <= 1 && !gdAniAteFruit && i == len - 1)
          || ((mvSnProg >= 0 && mvSnProg <= 0.5 || targetProgr > 0) && i == 1 && lastPos != 1 && lastPos != 2)
          || (mvSnProg >= 0 && mvSnProg <= 0.5 && i == 0)
          || (i == len-1 && nextPos != 1 && nextPos != 2)
          || (i == 0 && lastPos != 1 && lastPos != 2)
          || (lastPos != 1 && lastPos != 2 && nextPos != 1 && nextPos != 2)) // draw top right rounded corner
        con3.arc(bx + bSize / 4 + rA, by - bSize / 4 + tA, bSize / 4, 1.5 * Math.PI, 2 * Math.PI);
      else
        con3.lineTo(bx + bSize / 2 + rA, by - bSize / 2 + tA);
      if ((i == 0 && i == len-1)
          || (mvSnProg >= 0.5 && mvSnProg <= 1 && !gdAniAteFruit && i == len - 2 && nextPos != 2 && nextPos != 3)
          || (mvSnProg >= 0.5 && mvSnProg <= 1 && !gdAniAteFruit && i == len - 1)
          || ((mvSnProg >= 0 && mvSnProg <= 0.5 || targetProgr > 0) && i == 1 && lastPos != 2 && lastPos != 3)
          || (mvSnProg >= 0 && mvSnProg <= 0.5 && i == 0)
          || (i == len-1 && nextPos != 2 && nextPos != 3)
          || (i == 0 && lastPos != 2 && lastPos != 3)
          || (lastPos != 2 && lastPos != 3 && nextPos != 2 && nextPos != 3)) // draw bottom right rounded corner
        con3.arc(bx + bSize / 4 + rA, by + bSize / 4 + bA, bSize / 4, 0, 0.5 * Math.PI);
      else
        con3.lineTo(bx + bSize / 2 + rA, by + bSize / 2 + bA);
      if ((i == 0 && i == len-1)
          || (mvSnProg >= 0.5 && mvSnProg <= 1 && !gdAniAteFruit && i == len - 2 && nextPos != 3 && nextPos != 0)
          || (mvSnProg >= 0.5 && mvSnProg <= 1 && !gdAniAteFruit && i == len - 1)
          || ((mvSnProg >= 0 && mvSnProg <= 0.5 || targetProgr > 0) && i == 1 && lastPos != 3 && lastPos != 0)
          || (mvSnProg >= 0 && mvSnProg <= 0.5 && i == 0)
          || (i == len-1 && nextPos != 3 && nextPos != 0)
          || (i == 0 && lastPos != 3 && lastPos != 0)
          || (lastPos != 3 && lastPos != 0 && nextPos != 3 && nextPos != 0)) // draw bottom left rounded corner
        con3.arc(bx - bSize / 4 + lA, by + bSize / 4 + bA, bSize / 4, 0.5 * Math.PI, 1 * Math.PI);
      else
        con3.lineTo(bx - bSize / 2 + lA, by + bSize / 2 + bA);
      if ((i == 0 && i == len-1)
          || (mvSnProg >= 0.5 && mvSnProg <= 1 && !gdAniAteFruit && i == len - 2 && nextPos != 0 && nextPos != 1)
          || (mvSnProg >= 0.5 && mvSnProg <= 1 && !gdAniAteFruit && i == len - 1)
          || ((mvSnProg >= 0 && mvSnProg <= 0.5 || targetProgr > 0) && i == 1 && lastPos != 0 && lastPos != 1)
          || (mvSnProg >= 0 && mvSnProg <= 0.5 && i == 0)
          || (i == len-1 && nextPos != 0 && nextPos != 1)
          || (i == 0 && lastPos != 0 && lastPos != 1)
          || (lastPos != 0 && lastPos != 1 && nextPos != 0 && nextPos != 1)) // draw top left rounded corner
        con3.arc(bx - bSize / 4 + lA, by - bSize / 4 + tA, bSize / 4, 1 * Math.PI, 1.5 * Math.PI);
      else
        con3.lineTo(bx - bSize / 2 + lA, by - bSize / 2 + tA);
      con3.lineTo(bx, by - bSize / 2 + tA);
      con3.closePath();
      con3.fill();
    }
    restoreCon(con3, portation);
  }

  if (typeof zoom === 'function') con2.restore();
  con2.globalCompositeOperation = 'destination-in';
  drawHiddenCanvas(con2, 1); // draw snake with rounded corners
  con2.globalCompositeOperation = 'source-over';

  if (typeof zoom === 'function') zoom(con2);
  for (let k=0; k<drawArrA[0][1][2].length; k++) { // draw snake head
    pA[k] = [];
    for (let i=0; i<drawArrA_1.length; i++) pA[k].push([drawArrA_1[i][0] + drawArrA[0][1][2][k][0] + offset[0], drawArrA_1[i][1] + drawArrA[0][1][2][k][1] + offset[1]]);
    scaleCon(con2, state, portation, pA[k], len, bCoord);

    const [[i, lastLastPos, lastPos, nextPos], [ox, oy, drawAt]] = drawArrA[ drawArrA.length - 1 ];
    let [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
    if (mvSnProg >= 0 && mvSnProg <= 1) { // draw active snake movement
      let [[fsx1, fsy1, fsx2, fsy2], [fmx1, fmy1, fmx2, fmy2], [fex1, fey1, fex2, fey2],
        [lsx1, lsy1, lsx2, lsy2], [lmx1, lmy1, lmx2, lmy2], [lex1, ley1, lex2, ley2], [cx, cy]]
        = getEndMoves(lastLastPos, lastPos, nextPos, bx, by, bSize, mvSnProg);
      if (!noHead) { // snake head indicator
        let targetTrans = 1;
        if (targetProgr > 0) { [cx, cy] = bCoord(orig_0ox + orig_0drawAt[k][0], orig_0oy + orig_0drawAt[k][1]); targetTrans = 1 - mvSnProg; }
        con2.fillStyle = transparentize('rgba(255, 255, 255, 1)', trans * (1 - disProgr) * targetTrans);
        con2.beginPath();
        con2.arc(cx, cy, bSize / 3, 0, 2 * Math.PI);
        con2.closePath();
        con2.fill();
        con2.fillStyle = transparentize(color, trans * (1 - disProgr));
      }
    } else { // draw snake (without active movement)
      if (!noHead) { // snake head indicator
        let targetTrans = 1;
        if (targetProgr > 0) { [bx, by] = bCoord(orig_0ox + orig_0drawAt[k][0], orig_0oy + orig_0drawAt[k][1]); targetTrans = 1 - mvSnProg; }
        con2.fillStyle = transparentize('rgba(255, 255, 255, 1)', trans * (1 - disProgr) * targetTrans);
        con2.beginPath();
        con2.arc(bx, by, bSize / 3, 0, 2 * Math.PI);
        con2.closePath();
        con2.fill();
        con2.fillStyle = transparentize(color, trans * (1 - disProgr));
      }
    }
    restoreCon(con2, portation);
  }
  if (typeof zoom === 'function') con2.restore();

  if (typeof zoom === 'function') con3.restore();
  if (disProgr > 0) {
    con3 = getHiddenContext(can, true, 1);
    if (typeof zoom === 'function') zoom(con3);
    con3.fillStyle = 'rgba(255, 255, 255, 1)';
    for (let k=0; k<drawArrB[0][1][2].length; k++) { // let snake disappear
      for (let q=0; q<drawArrB.length; q++) {
        const [[i, lastPos, nextPos, lA, tA, rA, bA], [ox, oy, drawAt]] = drawArrB[q];
        const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
        if (i % 7 == 0) { fillPartCircle(con3, bx - 0.15 * bSize, by - 0.1 * bSize, bSize, 1.7 * (1 - disProgr), -0.1, 0.05);
          fillPartCircle(con3, bx + 0.3 * bSize, by + 0.4 * bSize, bSize, 0.7 * (1 - disProgr), 0, -0.1); }
        
        if (i % 7 == 1) { fillPartCircle(con3, bx - 0.3 * bSize, by, bSize, 0.7 * (1 - disProgr), -0.05, 0.05);
          fillPartCircle(con3, bx + 0.2 * bSize, by - 0.2 * bSize, bSize, 1.3 * (1 - disProgr), 0, -0.05);
          fillPartCircle(con3, bx + 0.25 * bSize, by + 0.3 * bSize, bSize, 0.9 * (1 - disProgr), 0.05, -0.1); }
        
        if (i % 7 == 2) { fillPartCircle(con3, bx, by - 0.1 * bSize, bSize, 1.9 * (1 - disProgr), -0.05, -0.05);
          fillPartCircle(con3, bx + 0.1 * bSize, by + 0.4 * bSize, bSize, 0.8 * (1 - disProgr), 0.1, -0.05); }
        
        if (i % 7 == 3) { fillPartCircle(con3, bx + 0.1 * bSize, by - 0.1 * bSize, bSize, 1.6 * (1 - disProgr), 0.05, -0.05);
          fillPartCircle(con3, bx - 0.3 * bSize, by + 0.4 * bSize, bSize, 0.5 * (1 - disProgr), -0.1, 0.1); }
        
        if (i % 7 == 4) { fillPartCircle(con3, bx, by + 0.2 * bSize, bSize, 1.8 * (1 - disProgr), 0.05, -0.1);
          fillPartCircle(con3, bx - 0.4 * bSize, by - 0.35 * bSize, bSize, 0.5 * (1 - disProgr), 0.1, 0.05);
          fillPartCircle(con3, bx + 0.3 * bSize, by - 0.3 * bSize, bSize, 0.7 * (1 - disProgr), 0.1, -0.05); }
        
        if (i % 7 == 5) { fillPartCircle(con3, bx, by, bSize, 1.8 * (1 - disProgr), 0.1, 0.05); }
        
        if (i % 7 == 6) { fillPartCircle(con3, bx - 0.2 * bSize, by + 0.2 * bSize, bSize, 1.9 * (1 - disProgr), -0.05, 0.1);
          fillPartCircle(con3, bx, by - 0.3 * bSize, bSize, 0.9 * (1 - disProgr), -0.1, -0.05);
          fillPartCircle(con3, bx + 0.3 * bSize, by, bSize, 0.6 * (1 - disProgr), 0.05, -0.05); }
      }
    }

    con2.globalCompositeOperation = 'destination-in';
    drawHiddenCanvas(con2, 1); // draw snake with rounded corners
    con2.globalCompositeOperation = 'source-over';
  }
  drawHiddenCanvas(con, 0, zoom); // draw snake on main canvas

  if (typeof zoom === 'function') con3.restore();
}

/**
 * Draw a (not quite perfect) circle
 * @param {CanvasRenderingContext2D} con the context of the canvas
 * @param {number} bx the x coordinate of the circle center
 * @param {number} by the y coordinate of the circle center
 * @param {number} bSize the size of a single grid cell
 * @param {number} scale a scaling factor
 * @param {number} angA an angle to rotate the top tangent of the circle by (0.5 = 90 degrees)
 * @param {number} angB an angle to rotate the bottom tangent of the circle by (0.5 = 90 degrees)
 */
function fillPartCircle(con, bx, by, bSize, scale, angA, angB) {
  con.beginPath();
  con.moveTo(bx, by - scale * bSize / 2);
  bezierCurve(con, bx, by - scale * bSize / 2, bx, by + scale * bSize / 2, angA * Math.PI, angB * Math.PI, SQRT_2, SQRT_2);
  bezierCurve(con, bx, by + scale * bSize / 2, bx, by - scale * bSize / 2, angB * Math.PI, angA * Math.PI, SQRT_2, SQRT_2);
  con.closePath();
  con.fill();
}

/**
 * Calculate how the end parts of a snake block should move when the snake is moving
 * @param {number} lastLastPos the original end position (0: left, 1: top, 2: right, 3: bottom)
 * @param {number} lastPos the new end position (0: left, 1: top, 2: right, 3: bottom)
 * @param {number} nextPos the new end position of the other end (the end that is closer to the snake head) (0: left, 1: top, 2: right, 3: bottom)
 * @param {number} bx the x coordinate of the center of the grid cell
 * @param {number} by the y coordinate of the center of the grid cell
 * @param {number} bSize the size of a single grid cell
 * @param {number} mvSnProg a number between 0 and 1 indicating the movement progress of the snake
 * @return {number[][]} an array describing how the end lines should move: [[fsx1, fsy1, fsx2, fsy2], [fmx1, fmy1, fmx2, fmy2], [fex1, fey1, fex2, fey2],
 * [lsx1, lsy1, lsx2, lsy2], [lmx1, lmy1, lmx2, lmy2], [lex1, ley1, lex2, ley2], [cx, cy]] where f indicates the "front" line (closer to the snake head), l the
 * "end" line, s the start positions when the animation begins, m the positions after half the animation and e the final position after the animation
 * completed and cx, cy represent the current center coordinates of the snake block
 */
function getEndMoves(lastLastPos, lastPos, nextPos, bx, by, bSize, mvSnProg) {
  const [xAdd, yAdd] = lastPos == 0 ? [-bSize, 0] : (lastPos == 1 ? [0, -bSize] : (lastPos == 2 ? [bSize, 0] : [0, bSize]));
  const [llx1, lly1, llx2, lly2] = getEndLineCoords(lastLastPos, bx + xAdd, by + yAdd, bSize);
  const [lx1, ly1, lx2, ly2] = getEndLineCoords(lastPos, bx, by, bSize);
  const [lnx1, lny1, lnx2, lny2] = getEndLineCoords((lastPos + 2) % 4, bx + xAdd, by + yAdd, bSize);
  const [nx1, ny1, nx2, ny2] = getEndLineCoords(nextPos, bx, by, bSize);
  let [cx, cy] = [bx, by];
  if (nextPos == 0) cx += (1 - mvSnProg) * bSize;
  else if (nextPos == 1) cy += (1 - mvSnProg) * bSize;
  else if (nextPos == 2) cx -= (1 - mvSnProg) * bSize;
  else if (nextPos == 3) cy -= (1 - mvSnProg) * bSize;
  let lmx1, lmy1, lmx2, lmy2;
  let fmx1, fmy1, fmx2, fmy2;
  if (lastPos == lastLastPos) {
    lmx1 = 0.5 * llx1 + 0.5 * lx1; lmy1 = 0.5 * lly1 + 0.5 * ly1;
    lmx2 = 0.5 * llx2 + 0.5 * lx2; lmy2 = 0.5 * lly2 + 0.5 * ly2;
  } else if (Math.abs(llx1 - lx1) < 1e-6 && Math.abs(lly1 - ly1) < 1e-6) {
    lmx1 = llx1; lmy1 = lly1;
    if (lastLastPos == 0 || lastLastPos == 2) { lmx2 = lx2; lmy2 = lly2; }
    else { lmx2 = llx2; lmy2 = ly2; }
  } else {
    lmx2 = llx2; lmy2 = lly2;
    if (lastLastPos == 0 || lastLastPos == 2) { lmx1 = lx1; lmy1 = lly1; }
    else { lmx1 = llx1; lmy1 = ly1; }
  }
  if (Math.abs(nextPos - lastPos) == 2) {
    fmx1 = 0.5 * lnx1 + 0.5 * nx1; fmy1 = 0.5 * lny1 + 0.5 * ny1;
    fmx2 = 0.5 * lnx2 + 0.5 * nx2; fmy2 = 0.5 * lny2 + 0.5 * ny2;
  } else if (Math.abs(lnx1 - nx1) < 1e-6 && Math.abs(lny1 - ny1) < 1e-6) {
    fmx1 = lnx1; fmy1 = lny1;
    if (lastPos == 0 || lastPos == 2) { fmx2 = nx2; fmy2 = lny2; }
    else { fmx2 = lnx2; fmy2 = ny2; }
  } else {
    fmx2 = lnx2; fmy2 = lny2;
    if (lastPos == 0 || lastPos == 2) { fmx1 = nx1; fmy1 = lny1; }
    else { fmx1 = lnx1; fmy1 = ny1; }
  }
  return [[lnx1, lny1, lnx2, lny2], [fmx1, fmy1, fmx2, fmy2], [nx1, ny1, nx2, ny2],
    [llx1, lly1, llx2, lly2], [lmx1, lmy1, lmx2, lmy2], [lx1, ly1, lx2, ly2], [cx, cy]];
}

/**
 * Calculate the coordinates of an end line of a snake block
 * @param {number} pos the position of the end line (0: left, 1: top, 2: right, 3: bottom)
 * @param {number} bx the x coordinate of the center of the grid cell
 * @param {number} by the y coordinate of the center of the grid cell
 * @param {number} bSize the size of a single grid cell
 * @return {number[]} an array containing the x and y coordinates of the start and end point of the line: [x1, y1, x2, y2]
 */
function getEndLineCoords(pos, bx, by, bSize) {
  if (pos == 0)
    return [bx - bSize / 2, by + bSize / 2, bx - bSize / 2, by - bSize / 2];
  else if (pos == 1)
    return [bx - bSize / 2, by - bSize / 2, bx + bSize / 2, by - bSize / 2];
  else if (pos == 2)
    return [bx + bSize / 2, by - bSize / 2, bx + bSize / 2, by + bSize / 2];
  else
    return [bx + bSize / 2, by + bSize / 2, bx - bSize / 2, by + bSize / 2];
}

/**
 * Draw the curved end path of the block
 * @param {CanvasRenderingContext2D} con the context of the canvas
 * @param {number} sx the start x coordinate
 * @param {number} sy the start y coordinate
 * @param {number} tx the destination x coordinate
 * @param {number} ty the destination y coordinate
 * 
 */
function blockEndPath(con, sx, sy, tx, ty) {
  con.lineTo(sx, sy);
  bezierCurve(con, sx, sy, 0.7 * sx + 0.3 * tx, 0.7 * sy + 0.3 * ty, 0.4 * Math.PI, -0.4 * Math.PI, 0.8, 0.8);
  bezierCurve(con, 0.7 * sx + 0.3 * tx, 0.7 * sy + 0.3 * ty, 0.3 * sx + 0.7 * tx, 0.3 * sy + 0.7 * ty, 0, 0, 0.7, 0.7);
  bezierCurve(con, 0.3 * sx + 0.7 * tx, 0.3 * sy + 0.7 * ty, tx, ty, 0.4 * Math.PI, -0.4 * Math.PI, 0.8, 0.8);
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
 * @param {boolean} gdAniAteFruit whether the moving snake ate a fruit
 * @param {boolean} [specialHeadTreatment] whether to calculate special head offset coordinates based on the progress of the snake movement
 * @param {number[]} [additionalOffset] an additional offset to add in all cases
 * @return {number[]} the new calculated offset
 */
function calcOffset(off, i, mvSnProg, gd, len, partQ, x, y, gdAniAteFruit, specialHeadTreatment = true, additionalOffset = [0, 0]) {
  if ((i != 0 || !specialHeadTreatment) && mvSnProg >= 0 && mvSnProg <= 1) {
    if (i == len - 1 && !gdAniAteFruit) {
      let [nx, ny] = partQ.get(i-1);
      if (gd._fallThrough) {
        [nx, ny] = gd._checkPosChange([x, y], [nx, ny]);
      }
      off = [(nx - x) * mvSnProg, (ny - y) * mvSnProg];
    } else off = [0, 0];
  }
  return [off[0] + additionalOffset[0], off[1] + additionalOffset[1]];
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
  const lastPos = (lpdiff[0] == -1 || lpdiff[0] >= 2) ? 0
    : ((lpdiff[0] == 1 || lpdiff[0] <= -2) ? 2
    : ((lpdiff[1] == -1 || lpdiff[1] >= 2) ? 1 : 3)); // 0: left, 1: top, 2: right, 3: bottom
  const nextPos = (npdiff[0] == -1 || npdiff[0] >= 2) ? 0
    : ((npdiff[0] == 1 || npdiff[0] <= -2) ? 2
    : ((npdiff[1] == -1 || npdiff[1] >= 2) ? 1 : 3)); // 0: left, 1: top, 2: right, 3: bottom
  return [lastPos, nextPos];
}
