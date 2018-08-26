
/**
 * Generate an array with points on the mountain's polygon border
 * @param {number} numOfPoints the number of points the polygon should be made of
 * @param {number} [size] 0: small, 1: medium, 2: large
 * @return {number[][]} the array with mountain points
 */
function generateMountain(numOfPoints, size = 1) {
  const width = size == 2 ? 0.8 + Math.random() * 0.4 : (size == 1 ? 0.7 + Math.random() * 0.3 : 0.6 + Math.random() * 0.2);
  const height = size == 2 ? 0.8 + Math.random() * 0.4 : (size == 1 ? 0.6 + Math.random() * 0.3 : 0.5 + Math.random() * 0.2);
  const ret = [];
  for (let i=0; i<(numOfPoints + 2); i++) {
    let x = 2 * (i - 1) / (numOfPoints + 2) - 1;
    let y = 1 - Math.abs(x * x * x);
    if (i == 0) x = -1; if (i == numOfPoints + 1) x = 1;
    if (i == 0 || i == numOfPoints + 1) y = 0;
    else { x *= width /** (0.98 + Math.random() * 0.04)*/; y *= height /** (0.93 + Math.random() * 0.14)*/; }
    if (i < numOfPoints + 1) ret.push([x, y, (0.35 + Math.random() * 0.2) * Math.PI, (-0.35 - Math.random() * 0.2) * Math.PI]);
    else ret.push([x, y]);
  }
  return ret;
}

/**
 * Draw a mountain path on the canvas (beginPath() and closePath() are called, but not fill())
 * @param {CanvasRenderingContext2D} con the context of the canvas the path be drawn on
 * @param {number[][]} pointArr an array returned by generateMountain()
 * @param {number} x a x offset to move the points by
 * @param {number} y a y offset to move the points by
 * @param {number} width the width of the mountain in pixels
 * @param {number} height the height of the mounatin in pixels
 */
function drawMountainPath(con, pointArr, x, y, width, height) {
  width /= 2;
  con.beginPath();
  con.moveTo(x + pointArr[0][0] * width, y - pointArr[0][1] * height);
  for (let i=0; i<pointArr.length - 1; i++) {
    bezierCurve(con, x + pointArr[i][0] * width, y - pointArr[i][1] * height,
      x + pointArr[i + 1][0] * width, y - pointArr[i + 1][1] * height, pointArr[i][2], pointArr[i][3]);
  }
  con.closePath();
}
