
/**
 * Draw the front part of a block
 * @param {GameState} state the (old) game state
 * @param {CanvasRenderingContext2D} con the context of the canvas
 * @param {number} bSize the size of a single grid cell
 * @param {Function} bCoord a function that takes the x and y coordinates of a grid cell in the game
 * state array as parameters and returns an array with the corresponding x and y coordinates of the
 * center of the grid cell on the canvas
 * @param {Queue} partQ a queue with the parts of the block
 * @param {string} color the color of the block
 * @param {number[]} offset the offset the block should be moved by
 * @param {number[][]} borderArr an array that will be modified to reflect whether a block is close
 * to the game board border
 * @param {GameDrawer} gd the game drawer calling this method
 * @param {object} infoObj an info object returned by calculateGraphicsInfo()
 * @param {boolean} [dashed] if set to true, only a dashed outline will be drawn (intended for use with failed portations)
 * @param {boolean} [fallThrough] if set to true, snakes that fall out of the board will appear again on the other side of the board
 * @param {number} [disProgr] a number between 0 and 1 indicating the disappearing progress (1 = block disappeared)
 * @param {any[]} [portation] an array indicating portation: [isBeingPorted, progr, startHeadX, startHeadY, endHeadX, endHeadY, port1X, port1Y, port2X, port2Y]
 * @param {number} [blockX] the x coordinate of the position blocking the portation (necessary when used with dashed option)
 * @param {number} [blockY] the y coordinate of the position blocking the portation
 */
function drawBlockFront(state, con, bSize, bCoord, partQ, color, offset, borderArr, gd,
    infoObj, dashed = false, fallThrough = false, disProgr = 0, portation = [false], blockX = 0, blockY = 0) {
  const [x0, y0] = [...partQ.get(0)];
  for (let i=0; i<partQ.length; i++) {
    const [x, y] = partQ.get(i);
    gd._getAllOffsets(state, x, y, offset, borderArr);
  } // necessary for correctly filling borderArr
  const readVal = (x, y) => {
    if (x < 0 || y < 0 || x >= infoObj.info.length || y >= infoObj.info[0].length) return 0;
    return infoObj.info[x][y];
  };
  const drawArr = []; const drawArr_1 = []; const [x02, y02] = infoObj.arrToBlockCoords(x0 + infoObj.head[0], y0 + infoObj.head[1]);
  for (let ax=0; ax<infoObj.info.length; ax++) {
    for (let ay=0; ay<infoObj.info[ax].length; ay++) {
      let [x, y] = infoObj.arrToBlockCoords(x0 + ax, y0 + ay);
      drawArr.push([[ax, ay], gd._getAllOffsets(state, x, y, offset, undefined, fallThrough)]);
      drawArr_1.push([x, y]);
    }
  }
  const pA = [];
  let trans = portation[0] ? (portation[1] <= 0.5 ? (0.5 - portation[1]) / 0.5 : (portation[1] - 0.5) / 0.5) : 1;
  trans = 1 - ((1 - trans) * (1 - trans));
  for (let k=0; k<drawArr[0][1][2].length; k++) {
    if (disProgr > 0 && !dashed) {
      con.save();
      const [xc, yc] = infoObj.arrToBlockCoords(infoObj.centroid[0] + drawArr[0][1][2][k][0], infoObj.centroid[1] + drawArr[0][1][2][k][1]);
      const [axc, ayc] = bCoord(xc + x0 + offset[0], yc + y0 + offset[1]);
      con.translate(axc, ayc);
      con.scale(1 - disProgr, 1 - disProgr);
      con.rotate((disProgr * 0.2) * Math.PI);
      con.translate(-axc, -ayc);
    }
    pA[k] = [];
    for (let i=0; i<drawArr_1.length; i++) pA[k].push([drawArr_1[i][0] + drawArr[0][1][2][k][0] + offset[0],
      drawArr_1[i][1] + drawArr[0][1][2][k][1] + offset[1]]);
    scaleCon(con, state, portation, pA[k], pA[k].length, bCoord, x02 + drawArr[0][1][2][k][0] + offset[0], y02 + drawArr[0][1][2][k][1] + offset[1]);
    for (let q=0; q<drawArr.length; q++) {
      const [[ax, ay], [ox, oy, drawAt]] = drawArr[q];
      if (readVal(ax, ay) == 1) { // foreground
        con.fillStyle = transparentize(color, (1 - disProgr) * trans);
        const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
        if (!dashed) {
          if (readVal(ax - 1, ay) != 1) // no foreground part
            con.fillRect(bx - bSize / 2, by - bSize / 6 - 1, bSize / 3, bSize / 3 + 2);
          if (readVal(ax + 1, ay) != 1) // no foreground part
            con.fillRect(bx + bSize / 6, by - bSize / 6 - 1, bSize / 3, bSize / 3 + 2);
          if (readVal(ax, ay - 1) != 1) // no foreground part
            con.fillRect(bx - bSize / 6 - 1, by - bSize / 2, bSize / 3 + 2, bSize / 3);
          if (readVal(ax, ay + 1) != 1) // no foreground part
            con.fillRect(bx - bSize / 6 - 1, by + bSize / 6, bSize / 3 + 2, bSize / 3);

          // straight connections
          // bottom left connection
          if (readVal(ax - 1, ay) != 1 && readVal(ax, ay + 1) == 1)
            con.fillRect(bx - bSize / 2, by + bSize / 6, bSize / 3, bSize / 3 + 1);
          if (readVal(ax - 1, ay) == 1 && readVal(ax, ay + 1) != 1)
            con.fillRect(bx - bSize / 2 - 1, by + bSize / 6, bSize / 3 + 1, bSize / 3);
          // bottom right connection
          if (readVal(ax + 1, ay) != 1 && readVal(ax, ay + 1) == 1)
            con.fillRect(bx + bSize / 6, by + bSize / 6, bSize / 3, bSize / 3 + 1);
          if (readVal(ax + 1, ay) == 1 && readVal(ax, ay + 1) != 1)
            con.fillRect(bx + bSize / 6, by + bSize / 6, bSize / 3 + 1, bSize / 3);
          // top right connection
          if (readVal(ax + 1, ay) != 1 && readVal(ax, ay - 1) == 1)
            con.fillRect(bx + bSize / 6, by - bSize / 2 - 1, bSize / 3, bSize / 3 + 1);
          if (readVal(ax + 1, ay) == 1 && readVal(ax, ay - 1) != 1)
            con.fillRect(bx + bSize / 6, by - bSize / 2, bSize / 3 + 1, bSize / 3);
          // top left connection
          if (readVal(ax - 1, ay) != 1 && readVal(ax, ay - 1) == 1)
            con.fillRect(bx - bSize / 2, by - bSize / 2 - 1, bSize / 3, bSize / 3 + 1);
          if (readVal(ax - 1, ay) == 1 && readVal(ax, ay - 1) != 1)
            con.fillRect(bx - bSize / 2 - 1, by - bSize / 2, bSize / 3 + 1, bSize / 3);
        } else {
          con.strokeStyle = transparentize(color, (1 - disProgr) * trans);
          con.lineCap = 'butt'; con.lineWidth = Math.ceil(bSize / 6);
          const drawLines = (x1, y1, x2, y2, x3, y3, x4, y4) => {
            con.beginPath(); con.moveTo(x1, y1); con.lineTo(x2, y2); con.closePath(); con.stroke();
            if (typeof x3 === 'number')
              { con.beginPath(); con.moveTo(x3, y3); con.lineTo(x4, y4); con.closePath(); con.stroke(); }
          };

          // straight connections
          // bottom left connection
          if (readVal(ax - 1, ay) != 1 && readVal(ax, ay + 1) == 1)
            drawLines(bx - bSize / 2, by + bSize / 6, bx - bSize / 6, by + bSize / 6,
                      bx - bSize / 2, by + bSize / 2, bx - bSize / 6, by + bSize / 2);
          if (readVal(ax - 1, ay) == 1 && readVal(ax, ay + 1) != 1)
            drawLines(bx - bSize / 6, by + bSize / 6, bx - bSize / 6, by + bSize / 2);
          // bottom right connection
          if (readVal(ax + 1, ay) != 1 && readVal(ax, ay + 1) == 1)
            drawLines(bx + bSize / 6, by + bSize / 6, bx + bSize / 2, by + bSize / 6,
                      bx + bSize / 6, by + bSize / 2, bx + bSize / 2, by + bSize / 2);
          if (readVal(ax + 1, ay) == 1 && readVal(ax, ay + 1) != 1)
            drawLines(bx + bSize / 6, by + bSize / 6, bx + bSize / 6, by + bSize / 2,
                      bx + bSize / 2, by + bSize / 6, bx + bSize / 2, by + bSize / 2);
          // top right connection
          if (readVal(ax + 1, ay) != 1 && readVal(ax, ay - 1) == 1)
            drawLines(bx + bSize / 6, by - bSize / 6, bx + bSize / 2, by - bSize / 6);
          if (readVal(ax + 1, ay) == 1 && readVal(ax, ay - 1) != 1)
            drawLines(bx + bSize / 6, by - bSize / 2, bx + bSize / 6, by - bSize / 6,
                      bx + bSize / 2, by - bSize / 2, bx + bSize / 2, by - bSize / 6);
          // top left connection
          if (readVal(ax - 1, ay) != 1 && readVal(ax, ay - 1) == 1)
            drawLines(bx - bSize / 2, by - bSize / 6, bx - bSize / 6, by - bSize / 6);
          if (readVal(ax - 1, ay) == 1 && readVal(ax, ay - 1) != 1)
            drawLines(bx - bSize / 6, by - bSize / 2, bx - bSize / 6, by - bSize / 6);
        }

        // corners
        const drawCorner = (x, y, rounded) => { // rounded: 0: top left, 1: top right, 2: bottom right, 3: bottom left
          con.save();
          if (rounded == 1) {
            con.translate(x, y);
            con.rotate(0.5 * Math.PI);
            con.translate(-x, -y);
          } else if (rounded == 2) {
            con.translate(x, y);
            con.rotate(Math.PI);
            con.translate(-x, -y);
          } else if (rounded == 3) {
            con.translate(x, y);
            con.rotate(1.5 * Math.PI);
            con.translate(-x, -y);
          }
          if (!dashed) {
            con.beginPath();
            con.moveTo(x - bSize / 6, y + bSize / 6 + 1);
            con.lineTo(x - bSize / 6, y);
            con.arc(x, y, bSize / 6, Math.PI, 1.5 * Math.PI);
            con.lineTo(x + bSize / 6 + 1, y - bSize / 6);
            con.lineTo(x + bSize / 6 + 1, y + bSize / 6);
            con.lineTo(x + bSize / 6, y + bSize / 6);
            con.lineTo(x + bSize / 6, y + bSize / 6 + 1);
            con.lineTo(x - bSize / 6, y + bSize / 6 + 1);
            con.closePath();
            con.fill();
          } else {
            con.strokeStyle = transparentize(color, (1 - disProgr) * trans);
            con.lineCap = 'butt'; con.lineWidth = Math.ceil(bSize / 6);
            con.beginPath();
            con.moveTo(x + bSize / 6, y - bSize / 6);
            con.lineTo(x + bSize / 6, y + bSize / 6);
            con.closePath(); con.stroke();
            con.beginPath();
            con.moveTo(x + bSize / 6, y + bSize / 6);
            con.lineTo(x - bSize / 6, y + bSize / 6);
            con.closePath(); con.stroke();
          }
          if (!dashed) {
            con.fillStyle = transparentize(lighten(color), (1 - disProgr) * trans);
            con.beginPath();
            con.moveTo(x, y + bSize / 12);
            con.arc(x, y, bSize / 12, 0, 2 * Math.PI);
            con.closePath();
            con.fill();
          }
          con.fillStyle = transparentize(color, (1 - disProgr) * trans);
          con.restore();
        };
        // bottom left corner
        if (readVal(ax - 1, ay) != 1 && readVal(ax, ay + 1) != 1)
          drawCorner(bx - bSize / 3, by + bSize / 3, 3);
        if (readVal(ax - 1, ay) == 1 && readVal(ax, ay + 1) == 1 && readVal(ax - 1, ay + 1) != 1)
          drawCorner(bx - bSize / 3, by + bSize / 3, 1);
        // bottom right corner
        if (readVal(ax + 1, ay) != 1 && readVal(ax, ay + 1) != 1)
          drawCorner(bx + bSize / 3, by + bSize / 3, 2);
        if (readVal(ax + 1, ay) == 1 && readVal(ax, ay + 1) == 1 && readVal(ax + 1, ay + 1) != 1)
          drawCorner(bx + bSize / 3, by + bSize / 3, 0);
        // top right corner
        if (readVal(ax + 1, ay) != 1 && readVal(ax, ay - 1) != 1)
          drawCorner(bx + bSize / 3, by - bSize / 3, 1);
        if (readVal(ax + 1, ay) == 1 && readVal(ax, ay - 1) == 1 && readVal(ax + 1, ay - 1) != 1)
          drawCorner(bx + bSize / 3, by - bSize / 3, 3);
        // top left corner
        if (readVal(ax - 1, ay) != 1 && readVal(ax, ay - 1) != 1)
          drawCorner(bx - bSize / 3, by - bSize / 3, 0);
        if (readVal(ax - 1, ay) == 1 && readVal(ax, ay - 1) == 1 && readVal(ax - 1, ay - 1) != 1)
          drawCorner(bx - bSize / 3, by - bSize / 3, 2);
      }
      if (dashed) {
        con.strokeStyle = transparentize('rgba(204, 0, 0, 1)', (1 - disProgr) * trans); con.lineWidth = Math.ceil(bSize / 6); con.lineCap = 'butt';
        const [bx, by] = bCoord(blockX + drawAt[k][0], blockY + drawAt[k][1]);
        con.beginPath(); con.moveTo(bx - bSize / 2, by - bSize / 2);
        con.lineTo(bx + bSize / 2, by + bSize / 2); con.closePath(); con.stroke();
        con.beginPath(); con.moveTo(bx + bSize / 2, by - bSize / 2);
        con.lineTo(bx - bSize / 2, by + bSize / 2); con.closePath(); con.stroke();
      }
    }
    restoreCon(con, portation);
    if (disProgr > 0 && !dashed) con.restore();
  }
}

/**
 * Draw the back part of a block
 * @param {GameState} state the (old) game state
 * @param {CanvasRenderingContext2D} con the context of the canvas
 * @param {number} bSize the size of a single grid cell
 * @param {Function} bCoord a function that takes the x and y coordinates of a grid cell in the game
 * state array as parameters and returns an array with the corresponding x and y coordinates of the
 * center of the grid cell on the canvas
 * @param {Queue} partQ a queue with the parts of the block
 * @param {string} color the color of the block
 * @param {number[]} offset the offset the block should be moved by
 * @param {number[][]} borderArr an array that will be modified to reflect whether a block is close
 * to the game board border
 * @param {GameDrawer} gd the game drawer calling this method
 * @param {object} infoObj an info object returned by calculateGraphicsInfo()
 * @param {boolean} [fallThrough] if set to true, snakes that fall out of the board will appear again on the other side of the board
 * @param {number} [disProgr] a number between 0 and 1 indicating the disappearing progress (1 = block disappeared)
 * @param {any[]} [portation] an array indicating portation: [isBeingPorted, progr, startHeadX, startHeadY, endHeadX, endHeadY, port1X, port1Y, port2X, port2Y]
 */
function drawBlockBack(state, con, bSize, bCoord, partQ, color, offset, borderArr, gd,
    infoObj, fallThrough = false, disProgr = 0, portation = [false]) {
  const [x0, y0] = [...partQ.get(0)];
  const readVal = (x, y) => {
    if (x < 0 || y < 0 || x >= infoObj.info.length || y >= infoObj.info[0].length) return 0;
    return infoObj.info[x][y];
  };
  const drawArr = []; const drawArr_1 = []; const [x02, y02] = infoObj.arrToBlockCoords(x0 + infoObj.head[0], y0 + infoObj.head[1]);
  for (let ax=0; ax<infoObj.info.length; ax++) {
    for (let ay=0; ay<infoObj.info[ax].length; ay++) {
      let [x, y] = infoObj.arrToBlockCoords(x0 + ax, y0 + ay);
      drawArr.push([[ax, ay], gd._getAllOffsets(state, x, y, offset, undefined, fallThrough)]);
      drawArr_1.push([x, y]);
    }
  }
  const pA = [];
  let trans = portation[0] ? (portation[1] <= 0.5 ? (0.5 - portation[1]) / 0.5 : (portation[1] - 0.5) / 0.5) : 1;
  trans = 1 - ((1 - trans) * (1 - trans));
  for (let k=0; k<drawArr[0][1][2].length; k++) {
    if (disProgr > 0) {
      con.save();
      const [xc, yc] = infoObj.arrToBlockCoords(infoObj.centroid[0] + drawArr[0][1][2][k][0], infoObj.centroid[1] + drawArr[0][1][2][k][1]);
      const [axc, ayc] = bCoord(xc + x0 + offset[0], yc + y0 + offset[1]);
      con.translate(axc, ayc);
      con.scale(1 - disProgr, 1 - disProgr);
      con.rotate((disProgr * 0.2) * Math.PI);
      con.translate(-axc, -ayc);
    }
    pA[k] = [];
    for (let i=0; i<drawArr_1.length; i++) pA[k].push([drawArr_1[i][0] + drawArr[0][1][2][k][0] + offset[0],
      drawArr_1[i][1] + drawArr[0][1][2][k][1] + offset[1]]);
    scaleCon(con, state, portation, pA[k], pA[k].length, bCoord, x02 + drawArr[0][1][2][k][0] + offset[0], y02 + drawArr[0][1][2][k][1] + offset[1]);
    for (let q=0; q<drawArr.length; q++) {
      const [[ax, ay], [ox, oy, drawAt]] = drawArr[q];
      if (readVal(ax, ay) == 2) { // background
        con.fillStyle = transparentize(darken(color, 0.2), (1 - disProgr) * trans);
        const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
        con.fillRect(bx - bSize / 6, by - bSize / 6, bSize / 3, bSize / 3);
        if (readVal(ax - 1, ay) != 0) // some kind of block part (fore- or background)
          con.fillRect(bx - bSize / 2 - 1, by - bSize / 6, bSize / 3 + 2, bSize / 3);
        if (readVal(ax + 1, ay) != 0) // some kind of block part (fore- or background)
          con.fillRect(bx + bSize / 6 - 1, by - bSize / 6, bSize / 3 + 2, bSize / 3);
        if (readVal(ax, ay - 1) != 0) // some kind of block part (fore- or background)
          con.fillRect(bx - bSize / 6, by - bSize / 2 - 1, bSize / 3, bSize / 3 + 2);
        if (readVal(ax, ay + 1) != 0) // some kind of block part (fore- or background)
          con.fillRect(bx - bSize / 6, by + bSize / 6 - 1, bSize / 3, bSize / 3 + 2);
      }
    }
    restoreCon(con, portation);
    if (disProgr > 0) con.restore();
  }
}
