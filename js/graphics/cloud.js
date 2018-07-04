
/**
 * The squareroot of 2
 * @type {number}
 */
const SQRT_2 = Math.sqrt(2);

/**
 * The basic function for calculating the top coordinates of the cloud
 * @param {number} x the x coordinate to calulate the y coordinate for (between -1 and 1)
 */
function baseFct(x) {
  const cosVal = Math.cos(0.5 * Math.PI * x);
  return 0.1 * (Math.sqrt(1.5 - x * x) - 0.5 * SQRT_2) + 0.35 * (cosVal * cosVal * cosVal);
}

/**
 * The add function for changing the shape of the cloud
 * @param {number} x the x coordinate to calulate the y coordinate for (between -1 and 1)
 * @param {number[]} randVec a random vector with 3 entries, values should be between -0.1 and 0.1
 */
function addFct(x, randVec) {
  const aVal = Math.sin(Math.PI * x);
  const bVal = Math.sin(Math.PI * x);
  const cVal = Math.sin(Math.PI * x);
  return randVec[0] * aVal * aVal + randVec[1] * bVal * bVal
    + randVec[2] * cVal * cVal;
}

/**
 * Calculate the y coordinate for a given x coordinate and random vector
 * @param {number} x the x coordinate to calulate the y coordinate for (between -1 and 1)
 * @param {number[]} randVec a random vector with 3 entries, values should be between -0.1 and 0.1
 */
function cloudY(x, randVec) {
  return 2 * (baseFct(x) + addFct(x, randVec));
}

/**
 * Calculates the length of the cloudY function on the interval [-1, 1]
 * @param {number[]} randVec a random vector with 3 entries, values should be between -0.1 and 0.1
 * @return {object} call getX on the object with a value t between 0 and 1 to get the x coordinate
 * where the length of the graph reaches t * total length in the interval [-1, 1]
 */
function calcLen(randVec) {
  let ct = 0; let cx = -1; let lastsave = 0; const tArr = [];
  while (cx < 1) {
    const lx = cx;
    cx += 0.01;
    const ly = cloudY(lx, randVec);
    const cy = cloudY(cx, randVec);
    const d = Math.sqrt((cx - lx) * (cx - lx) + (cy - ly) * (cy - ly));
    const lt = ct;
    ct += d;
    while (ct - lastsave >= 0.02) {
      tArr.push(cx);
      lastsave += 0.02;
    }
  }
  return {
    getX: t => {
      const idx = Math.ceil( t * tArr.length ) - 1;
      if (idx < 0) return -1; if (idx >= tArr.length) return 1;
      return tArr[idx];
    }
  };
}

/**
 * Generate an array with points on the cloud's polygon border
 * @param {number} width the width of the cloud in pixels
 * @param {number} numOfPoints the number of points the polygon should be made of
 * @return {number[][]} the array with cloud points
 */
function generateCloud(width, numOfPoints) {
  const randVec = [Math.random() * 0.05 - 0.025, Math.random() * 0.05 - 0.025, Math.random() * 0.05 - 0.025];
  const l = calcLen(randVec);
  const topPoints = Math.ceil( numOfPoints * 0.75 );
  const bottomPoints = numOfPoints - topPoints;
  const height = width * 0.5;
  const topXCoords = [];
  const bottomXCoords = [];
  const bottomPointDist = width / (bottomPoints + 1);
  const LEFT_RIGHT_VAR_FACTOR = 0.3;
  for (let i=0; i<topPoints; i++)
    if (i == 0 || i == topPoints-1)
      topXCoords.push(l.getX(i / (topPoints - 1)) * width / 2);
    else
      topXCoords.push(l.getX((i + LEFT_RIGHT_VAR_FACTOR * (2 * Math.random()  - 1)) / (topPoints - 1)) * width / 2);
  for (let i=0; i<bottomPoints; i++) bottomXCoords.push(- width / 2 + (i + 1) * bottomPointDist);
  for (let i=0; i<bottomPoints; i++)
    bottomXCoords[i] += bottomPointDist * LEFT_RIGHT_VAR_FACTOR * (2 * Math.random()  - 1);
  const retArr = [];
  for (let i=0; i<topPoints; i++)
    retArr.push(
      [topXCoords[i], height * (-cloudY(2 * i / (topPoints - 1) - 1, randVec) + 0.5),
      Math.random() + 0.8, (Math.random() * 0.2 - 0.1) * Math.PI]
    );
  for (let i=bottomPoints-1; i>=0; i--)
    retArr.push(
      [bottomXCoords[i], height * (0.2 * baseFct(2 * i / (bottomPoints - 1) - 1) + 0.6),
      Math.random() * 0.2 + 0.2, (Math.random() * 0.2 - 0.1) * Math.PI]
    );
  return retArr;
}

/**
 * Scale the array with cloud points
 * @param {numnber[][]} inArr an array returned by generateCloud()
 * @param {number} sc the scaling factor
 * @return {number[][]} the adapted array
 */
function scaleCloudArr(inArr, sc) {
  const retArr = [];
  for (let i=0; i<inArr.length; i++) {
    retArr.push([inArr[i][0] * sc, inArr[i][1] * sc, inArr[i][2], inArr[i][3]]);
  }
  return retArr;
}

/**
 * Move the array with cloud points
 * @param {number[][]} inArr an array returned by generateCloud()
 * @param {number} dx the x offset to move the points by
 * @param {number} dy the y offset to move the points by
 * @return {number[][]} the adapted array
 */
function moveCloudArr(inArr, dx, dy) {
  const retArr = [];
  for (let i=0; i<inArr.length; i++) {
    retArr.push([inArr[i][0] + dx, inArr[i][1] + dy, inArr[i][2], inArr[i][3]]);
  }
  return retArr;
}

/**
 * Draw a cloud path on the canvas (beginPath() and closePath() are called, but not fill())
 * @param {CanvasRenderingContext2D} con the context of the canvas the path be drawn on
 * @param {number[][]} pointArr an array returned by generateCloud()
 * @param {number} [ox] a x offset to move the points by
 * @param {number} [oy] a y offset to move the points by
 */
function drawCloudPath(con, pointArr, ox = 0, oy = 0) {
  con.beginPath();
  con.moveTo(pointArr[0][0] + ox, pointArr[0][1] + oy);
  let firstCP, ccp;
  let startedBot = false, nextIsSmooth = false;
  for (let i=0; i<pointArr.length; i++) {
    const last = pointArr[i];
    const current = pointArr[(i + 1) % pointArr.length];
    const next = pointArr[(i + 2) % pointArr.length];
    if (nextIsSmooth) {
      const n_ccp = getControlVec(last[0], last[1], current[0], current[1], next[0], next[1],
        current[3], current[2]);
      smoothBezierCurveVec(current[0] + ox, current[1] + oy, n_ccp[0], n_ccp[1], n_ccp[2]);
      ccp = n_ccp;
      nextIsSmooth = false;
    } else if (i == 0) {
      ccp = getControlVec(last[0], last[1], current[0], current[1], next[0], next[1],
        current[3], current[2], true);
      firstCP = bezierCurveVec(con, last[0] + ox, last[1] + oy, current[0] + ox, current[1] + oy,
        ccp[3], ccp[4], ccp[0], ccp[1], ccp[5], ccp[2]);
    } else if (i == pointArr.length - 1) {
      const fVars = firstCP.getControlPoints();
      bezierCurveVec(con, last[0] + ox, last[1] + oy, current[0] + ox, current[1] + oy,
        ccp[0], ccp[1], -fVars[0], -fVars[1], ccp[2], fVars[4]);
    } else if (!startedBot && next[0] < current[0]) {
      startedBot = true;
      const n_ccp = getControlVec(next[0], next[1], last[0], last[1], current[0], current[1],
        current[3], current[2], true);
      bezierCurveVec(con, last[0] + ox, last[1] + oy, current[0] + ox, current[1] + oy,
        ccp[0], ccp[1], n_ccp[6], n_ccp[7], ccp[2], n_ccp[8]);
      ccp = n_ccp.slice(6, 9);
      nextIsSmooth = true;
    } else {
      const n_ccp = getControlVec(last[0], last[1], current[0], current[1], next[0], next[1],
        current[3], current[2]);
      bezierCurveVec(con, last[0] + ox, last[1] + oy, current[0] + ox, current[1] + oy,
        ccp[0], ccp[1], n_ccp[0], n_ccp[1], ccp[2], n_ccp[2]);
      ccp = n_ccp;
    }
  }
  con.closePath();
}
