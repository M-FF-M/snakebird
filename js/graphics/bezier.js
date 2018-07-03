
let BEZIER_LAST_X = 0;
let BEZIER_LAST_Y = 0;
let BEZIER_LAST_OX = 0;
let BEZIER_LAST_OY = 0;
let BEZIER_LAST_SC = 1;
let BEZIER_LAST_CON = null;

/**
 * Draw a bezier curve on the canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the curve should be drawn on
 * @param {number} sx the x coordinate of the starting point
 * @param {number} sy the y coordinate of the starting point
 * @param {number} dx the x coordinate of the end point
 * @param {number} dy the y coordinate of the end point
 * @param {number} angA the angle of the first control point vector with respect to the line
 * orthogonal to the line between (sx,sy) and (dx,dy)
 * @param {number} angB the angle of the second control point vector with respect to the line
 * orthogonal to the line between (sx,sy) and (dx,dy)
 * @param {number} [scaleA] the length of the first control point vector
 * @param {number} [scaleB] the length of the second control point vector
 * @return {object} an object that allows chaining of bezier curve functions without having to specify
 * the rendering context and starting point again
 */
function bezierCurve(con, sx, sy, dx, dy, angA = 0, angB = 0, scaleA = 1, scaleB = 1) {
  const dist = Math.sqrt((dx - sx) * (dx - sx) + (dy - sy) * (dy - sy));
  const ang = Math.atan2(dy - sy, dx - sx) - 0.5 * Math.PI;
  angA += ang; angB += ang;
  return bezierCurveVec(con, sx, sy, dx, dy, Math.cos(angA), Math.sin(angA),
    Math.cos(angB), Math.sin(angB), scaleA * dist * 0.5, scaleB * dist * 0.5);
}

/**
 * Draw a new bezier curve on the canvas (with a smooth connection to the last one)
 * @param {number} ndx the x coordinate of the end point
 * @param {number} ndy the y coordinate of the end point
 * @param {number} [angB] the angle of the offset vector of the new second control point
 * @param {number} [nScaleB] the length of the offset vector
 * @param {number} [nScaleA] the amount to scale the last offset vector by (the one that is responsible
 * for the smooth connection)
 * @return {object} an object that allows chaining of bezier curve functions without having to specify
 * the rendering context and starting point again
 */
function smoothBezierCurve(ndx, ndy, angB = 0, nScaleB = 1, nScaleA = BEZIER_LAST_SC) {
  return bezierCurveHalfVec(BEZIER_LAST_CON, BEZIER_LAST_X, BEZIER_LAST_Y, ndx, ndy,
    -BEZIER_LAST_OX, -BEZIER_LAST_OY, angB, nScaleA, nScaleB);
}

/**
 * Draw a new bezier curve on the canvas (with a smooth connection to the last one)
 * @param {number} ndx the x coordinate of the end point
 * @param {number} ndy the y coordinate of the end point
 * @param {number} nc2x the x coordinate of the offset (form the end point) of the second control point
 * @param {number} nc2y the y coordinate of the offset (form the end point) of the second control point
 * @param {number} [nScaleB] the amount to scale the offset vector by
 * @param {number} [nScaleA] the amount to scale the last offset vector by (the one that is responsible
 * for the smooth connection)
 * @return {object} an object that allows chaining of bezier curve functions without having to specify
 * the rendering context and starting point again
 */
function smoothBezierCurveVec(ndx, ndy, nc2x, nc2y, nScaleB = 1, nScaleA = BEZIER_LAST_SC) {
  return bezierCurveVec(BEZIER_LAST_CON, BEZIER_LAST_X, BEZIER_LAST_Y, ndx, ndy,
    -BEZIER_LAST_OX, -BEZIER_LAST_OY, nc2x, nc2y, nScaleA, nScaleB);
}

/**
 * Draw a bezier curve on the canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the curve should be drawn on
 * @param {number} sx the x coordinate of the starting point
 * @param {number} sy the y coordinate of the starting point
 * @param {number} dx the x coordinate of the end point
 * @param {number} dy the y coordinate of the end point
 * @param {number} c1x the x coordinate of the offset (form the starting point) of the first control point
 * @param {number} c1y the y coordinate of the offset (form the starting point) of the first control point
 * @param {number} angB the angle of the second control point vector with respect to the line
 * orthogonal to the line between (sx,sy) and (dx,dy)
 * @param {number} [scaleA] the amount to scale the first offset vector by
 * @param {number} [scaleB] the length of the second control point vector
 * @return {object} an object that allows chaining of bezier curve functions without having to specify
 * the rendering context and starting point again
 */
function bezierCurveHalfVec(con, sx, sy, dx, dy, c1x, c1y, angB = 0, scaleA = 1, scaleB = 1) {
  const dist = Math.sqrt((dx - sx) * (dx - sx) + (dy - sy) * (dy - sy));
  const ang = Math.atan2(dy - sy, dx - sx) - 0.5 * Math.PI;
  angB += ang;
  return bezierCurveVec(con, sx, sy, dx, dy, c1x, c1y,
    Math.cos(angB), Math.sin(angB), scaleA, scaleB * dist * 0.5);
}

/**
 * Get the control point vector for three consecutive points (plus two control points for the left and
 * right side)
 * @param {number} lx the x coordinate of the last point
 * @param {number} ly the y coordinate of the last point
 * @param {number} x the x coordinate of the current point
 * @param {number} y the y coordinate of the current point
 * @param {number} nx the x coordinate of the next point
 * @param {number} ny the y coordinate of the next point
 * @param {number} [ang] an angle to rotate the control point vector by
 * @param {number} [scale] an amount to scale the control point vector by
 * @param {boolean} [calcAll] whether to also calculate left and right control points
 * @param {number} [angA] an angle to rotate the left control point vector by
 * @param {number} [angB] an angle to rotate the right control point vector by
 * @param {number} [scaleA] an amount to scale the left control point vector by
 * @param {number} [scaleB] an amount to scale the right control point vector by
 * @return {number[]} [the x coordinate of the vector, the y coordinate of the vector, the length,
 * the same for the left and right control points]
 */
function getControlVec(lx, ly, x, y, nx, ny, ang = 0, scale = 1, calcAll = false, angA = 0, angB = 0, 
    scaleA = 1, scaleB = 1) {
  const distA = Math.sqrt((x - lx) * (x - lx) + (y - ly) * (y - ly));
  const distB = Math.sqrt((nx - x) * (nx - x) + (ny - y) * (ny - y));
  const dist = 0.5 * (distA + distB);
  const angAct = Math.atan2(ny - ly, nx - lx) - 0.5 * Math.PI;
  let angActA, angActB;
  if (calcAll) {
    angActA = Math.atan2(y - ly, x - lx) - 0.5 * Math.PI;
    angActB = Math.atan2(ny - y, nx - x) - 0.5 * Math.PI;
  }
  ang += angAct; if (calcAll) { angA += angActA; angB += angActB; }
  if (!calcAll) return [Math.cos(ang), Math.sin(ang), scale * dist * 0.5];
  return [Math.cos(ang), Math.sin(ang), scale * dist * 0.5,
    Math.cos(angA), Math.sin(angA), scaleA * distA * 0.5,
    Math.cos(angB), Math.sin(angB), scaleB * distB * 0.5];
}

/**
 * Draw a bezier curve on the canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the curve should be drawn on
 * @param {number} sx the x coordinate of the starting point
 * @param {number} sy the y coordinate of the starting point
 * @param {number} dx the x coordinate of the end point
 * @param {number} dy the y coordinate of the end point
 * @param {number} c1x the x coordinate of the offset (form the starting point) of the first control point
 * @param {number} c1y the y coordinate of the offset (form the starting point) of the first control point
 * @param {number} c2x the x coordinate of the offset (form the end point) of the second control point
 * @param {number} c2y the y coordinate of the offset (form the end point) of the second control point
 * @param {number} [scaleA] the amount to scale the first offset vector by
 * @param {number} [scaleB] the amount to scale the second offset vector by
 * @return {object} an object that allows chaining of bezier curve functions without having to specify
 * the rendering context and starting point again
 */
function bezierCurveVec(con, sx, sy, dx, dy, c1x, c1y, c2x, c2y, scaleA = 1, scaleB = 1) {
  con.bezierCurveTo(sx + c1x * scaleA, sy + c1y * scaleA,
    dx + c2x * scaleB, dy + c2y * scaleB,
    dx, dy);
  BEZIER_LAST_X = dx; BEZIER_LAST_Y = dy;
  BEZIER_LAST_OX = c2x; BEZIER_LAST_OY = c2y;
  BEZIER_LAST_SC = scaleB; BEZIER_LAST_CON = con;
  return {
    /**
     * Returns an array with the vectors pointing to the control points
     * @return {number[]} [c1x, c1y, c2x, c2y, scaleA, scaleB]
     */
    getControlPoints: () => {
      return [c1x, c1y, c2x, c2y, scaleA, scaleB];
    },

    /**
     * Draw a new bezier curve on the canvas (with a smooth connection to the last one)
     * @param {number} ndx the x coordinate of the end point
     * @param {number} ndy the y coordinate of the end point
     * @param {number} nc2x the x coordinate of the offset (form the end point) of the second control point
     * @param {number} nc2y the y coordinate of the offset (form the end point) of the second control point
     * @param {number} [nScaleB] the amount to scale the offset vector by
     * @param {number} [nScaleA] the amount to scale the last offset vector by (the one that is responsible
     * for the smooth connection)
     * @return {object} an object that allows chaining of bezier curve functions without having to specify
     * the rendering context and starting point again
     */
    smoothBezierCurveVec: (ndx, ndy, nc2x, nc2y, nScaleB = 1, nScaleA = scaleB) => {
      return bezierCurveVec(con, dx, dy, ndx, ndy, -c2x, -c2y, nc2x, nc2y, nScaleA, nScaleB);
    },

    /**
     * Draw a new bezier curve on the canvas (with a smooth connection to the last one)
     * @param {number} ndx the x coordinate of the end point
     * @param {number} ndy the y coordinate of the end point
     * @param {number} [angB] the angle of the offset vector of the new second control point
     * @param {number} [nScaleB] the length of the offset vector
     * @param {number} [nScaleA] the amount to scale the last offset vector by (the one that is responsible
     * for the smooth connection)
     * @return {object} an object that allows chaining of bezier curve functions without having to specify
     * the rendering context and starting point again
     */
    smoothBezierCurve: (ndx, ndy, angB = 0, nScaleB = 1, nScaleA = scaleB) => {
      return bezierCurveHalfVec(con, dx, dy, ndx, ndy, -c2x, -c2y, angB, nScaleA, nScaleB);
    },

    /**
     * Draw a new bezier curve on the canvas (starting from the end of the last one)
     * @param {number} ndx the x coordinate of the end point
     * @param {number} ndy the y coordinate of the end point
     * @param {number} nc1x the x coordinate of the offset (form the starting point) of the first control point
     * @param {number} nc1y the y coordinate of the offset (form the starting point) of the first control point
     * @param {number} nc2x the x coordinate of the offset (form the end point) of the second control point
     * @param {number} nc2y the y coordinate of the offset (form the end point) of the second control point
     * @param {number} [nScaleA] the amount to scale the first offset vector by
     * @param {number} [nScaleB] the amount to scale the second offset vector by
     * @return {object} an object that allows chaining of bezier curve functions without having to specify
     * the rendering context and starting point again
     */
    bezierCurveVec: (ndx, ndy, nc1x, nc1y, nc2x, nc2y, nScaleA = 1, nScaleB = 1) => {
      return bezierCurveVec(con, dx, dy, ndx, ndy, nc1x, nc1y, nc2x, nc2y, nScaleA, nScaleB);
    },
    
    /**
     * Draw a new bezier curve on the canvas (starting from the end of the last one)
     * @param {number} ndx the x coordinate of the end point
     * @param {number} ndy the y coordinate of the end point
     * @param {number} angA the angle of the first control point vector with respect to the line
     * orthogonal to the line between (dx,dy) and (ndx,ndy)
     * @param {number} angB the angle of the second control point vector with respect to the line
     * orthogonal to the line between (dx,dy) and (ndx,ndy)
     * @param {number} [nScaleA] the length of the first control point vector
     * @param {number} [nScaleB] the length of the second control point vector
     * @return {object} an object that allows chaining of bezier curve functions without having to specify
     * the rendering context and starting point again
     */
    bezierCurve: (ndx, ndy, angA = 0, angB = 0, nScaleA = 1, nScaleB = 1) => {
      return bezierCurve(con, dx, dy, ndx, ndy, angA, angB, nScaleA, nScaleB);
    }
  };
}
