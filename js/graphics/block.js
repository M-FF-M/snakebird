
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
 */
function drawBlockFront(state, con, bSize, bCoord, partQ, color, offset, borderArr, gd,
    infoObj) {
  const [x0, y0] = [...partQ.get(0)];
  for (let i=0; i<partQ.length; i++) {
    const [x, y] = partQ.get(i);
    gd._getAllOffsets(state, x, y, offset, borderArr);
  } // necessary for correctly filling borderArr
  const readVal = (x, y) => {
    if (x < 0 || y < 0 || x >= infoObj.info.length || y >= infoObj.info[0].length) return 0;
    return infoObj.info[x][y];
  };
  for (let ax=0; ax<infoObj.info.length; ax++) {
    for (let ay=0; ay<infoObj.info[ax].length; ay++) {
      const [x, y] = infoObj.arrToBlockCoords(x0 + ax, y0 + ay);
      const [ox, oy, drawAt] = gd._getAllOffsets(state, x, y, offset);
      if (readVal(ax, ay) == 1) { // foreground
        con.fillStyle = color;
        for (let k=0; k<drawAt.length; k++) {
          const [bx, by] = bCoord(ox + drawAt[k][0], oy + drawAt[k][1]);
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
            con.fillStyle = lighten(color);
            con.beginPath();
            con.moveTo(x, y + bSize / 12);
            con.arc(x, y, bSize / 12, 0, 2 * Math.PI);
            con.closePath();
            con.fill();
            con.fillStyle = color;
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
      }
    }
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
 */
function drawBlockBack(state, con, bSize, bCoord, partQ, color, offset, borderArr, gd,
    infoObj) {
  const [x0, y0] = [...partQ.get(0)];
  const readVal = (x, y) => {
    if (x < 0 || y < 0 || x >= infoObj.info.length || y >= infoObj.info[0].length) return 0;
    return infoObj.info[x][y];
  };
  for (let ax=0; ax<infoObj.info.length; ax++) {
    for (let ay=0; ay<infoObj.info[ax].length; ay++) {
      const [x, y] = infoObj.arrToBlockCoords(x0 + ax, y0 + ay);
      const [ox, oy, drawAt] = gd._getAllOffsets(state, x, y, offset);
      if (readVal(ax, ay) == 2) { // background
        con.fillStyle = darken(color, 0.2);
        for (let k=0; k<drawAt.length; k++) {
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
    }
  }
}
