
/**
 * Scale the canvas context appropriately if a snake or block is being ported
 * @param {CanvasRenderingContext2D} con the context of the canvas
 * @param {GameState} state the (old) game state
 * @param {any[]} portation the portation array: [isBeingPorted, progr, startHeadX, startHeadY, endHeadX, endHeadY, port1X, port1Y, port2X, port2Y]
 * @param {number[][]} partQ the body part array
 * @param {number} len the number of body parts
 * @param {Function} bCoord a function that takes the x and y coordinates of a grid cell in the game
 * state array as parameters and returns an array with the corresponding x and y coordinates of the
 * center of the grid cell on the canvas
 * @param {number} [x0] the x coordinate of the snake head
 * @param {number} [y0] the y coordinate of the snake head
 */
function scaleCon(con, state, portation, partQ, len, bCoord, x0, y0) {
  if (portation[0]) { // [isBeingPorted, progr, startHeadX, startHeadY, endHeadX, endHeadY, port1X, port1Y, port2X, port2Y]
    const sP = portation[1] > 0.5 ? true : false;
    let portOffset = [0, 0];
    if (typeof x0 === 'undefined') {
      x0 = partQ[0][0];
      y0 = partQ[0][1];
    }
    for (let i=0; i<len; i++) {
      const [dx, dy] = partQ[i];
      const [px, py] = [(dx - x0 + (sP ? portation[4] : portation[2]) + 2 * state.width) % state.width,
        (dy - y0 + (sP ? portation[5] : portation[3]) + 2 * state.height) % state.height];
      if (sP) {
        if (px == portation[8] && py == portation[9]) {
          portOffset = [dx - px, dy - py];
          break;
        }
      } else {
        if (px == portation[6] && py == portation[7]) {
          portOffset = [dx - px, dy - py];
          break;
        }
      }
    }
    con.save();
    const [axc, ayc] = bCoord((sP ? portation[8] : portation[6]) + portOffset[0], (sP ? portation[9] : portation[7]) + portOffset[1]);
    con.translate(axc, ayc);
    if (sP) con.scale((portation[1] - 0.5) / 0.5, (portation[1] - 0.5) / 0.5);
    else con.scale((0.5 - portation[1]) / 0.5, (0.5 - portation[1]) / 0.5);
    con.translate(-axc, -ayc);
  }
}

/**
 * Restore the context after a portation scaling
 * @param {CanvasRenderingContext2D} con the context of the canvas
 * @param {any[]} portation the portation array: [isBeingPorted, progr, startHeadX, startHeadY, endHeadX, endHeadY, port1X, port1Y, port2X, port2Y]
 */
function restoreCon(con, portation) {
  if (portation[0]) con.restore();
}
