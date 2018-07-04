
/**
 * Calculates the portal size for a given time x, between 0 and 4
 * @param {number} x the time
 * @return {number} the scaling factor
 */
function portalSizeFct(x) {
  return Math.cos(0.15 * Math.PI * (x - 0.7));
}

/**
 * Draws a portal on the given canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the portal should be drawn on
 * @param {number} bx the x coordinate of the center of the grid cell
 * @param {number} by the y coordinate of the center of the grid cell
 * @param {number} bSize the width and height of the grid cell
 * @param {number} globalTime a number between 0 and 1 that is used for cyclic animations
 * @param {number} [scale] an optional factor for scaling the portal
 */
function drawPortalBack(con, bx, by, bSize, globalTime, scale = 1) {
  const oscA = Math.sin(globalTime * 2 * Math.PI);
  const oscB = oscA * 0.025;
  const oscC = 1 + oscA * 0.1;
  const colorArr = ['rgba(98, 255, 97, 1)', 'rgba(81, 233, 239, 1)', 'rgba(94, 161, 248, 1)',
    'rgba(181, 106, 245, 1)', 'rgba(248, 80, 127, 1)', 'rgba(255, 145, 84, 1)', 'rgba(253, 233, 88, 1)'];
  const colors = [colorArr[0], colorArr[1], colorArr[2], colorArr[3]];
  const sizes = [1, 0.8, 0.6, 0.4];
  const colorStep =  1 / colorArr.length;
  const fColor = Math.floor(globalTime * colorArr.length);
  for (let i=0; i<colors.length; i++) colors[i] = colorArr[(fColor - i + colorArr.length) % colorArr.length];
  const fColorT = (globalTime - fColor * colorStep) / colorStep;
  for (let i=0; i<sizes.length; i++) sizes[i] = portalSizeFct(i + fColorT) * oscC;
  for (let i=0; i<sizes.length; i++) {
    if (sizes[i] == 0) continue;
    con.fillStyle = colors[i];
    con.beginPath();
    con.moveTo(bx, by - sizes[i] * scale * 0.8 * bSize / 2);
    bezierCurve(con, bx, by - sizes[i] * scale * 0.8 * bSize / 2, bx, by + sizes[i] * scale * 0.8 * bSize / 2,
      (0 + oscB) * Math.PI, (0 + oscB) * Math.PI, SQRT_2, SQRT_2);
    bezierCurve(con, bx, by + sizes[i] * scale * 0.8 * bSize / 2, bx, by - sizes[i] * scale * 0.8 * bSize / 2,
      (0 + oscB) * Math.PI, (0 + oscB) * Math.PI, SQRT_2, SQRT_2);
    con.closePath();
    con.fill();
  }
}

/**
 * Draws the glittering a portal causes on the given canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the glittering should be drawn on
 * @param {number} bx the x coordinate of the center of the grid cell
 * @param {number} by the y coordinate of the center of the grid cell
 * @param {number} bSize the width and height of the grid cell
 * @param {number} globalSlowTime a number between 0 and 1 that is used for cyclic animations
 */
function drawPortalFront(con, bx, by, bSize, globalSlowTime) {
  globalSlowTime = (globalSlowTime * 2) % 1;
  const glPos = [];
  const glSize = [];
  if (globalSlowTime < 0.4) {
    const prog = globalSlowTime / 0.4; const sProg = Math.sin(Math.PI * prog);
    glPos.push([-1, -1]);
    glSize.push(sProg * sProg * 0.7);
  }
  if (globalSlowTime > 0.2 && globalSlowTime < 0.5) {
    const prog = (globalSlowTime - 0.2) / 0.3; const sProg = Math.sin(Math.PI * prog);
    glPos.push([0.5, -0.1]);
    glSize.push(sProg * sProg * 0.4);
  }
  if (globalSlowTime > 0.3 && globalSlowTime < 0.8) {
    const prog = (globalSlowTime - 0.3) / 0.5; const sProg = Math.sin(Math.PI * prog);
    glPos.push([-0.7, 0.8]);
    glSize.push(sProg * sProg * 0.9);
  }
  if (globalSlowTime > 0.7) {
    const prog = (globalSlowTime - 0.7) / 0.3; const sProg = Math.sin(Math.PI * prog);
    glPos.push([0.9, 0.6]);
    glSize.push(sProg * sProg * 0.6);
  }
  for (let i=0; i<glPos.length; i++) {
    drawGlitter(con, bx + glPos[i][0] * bSize / 5, by + glPos[i][1] * bSize / 5, glSize[i] * bSize / 4);
  }
}

/**
 * Draws a glittering start on the given canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the glittering should be drawn on
 * @param {number} x the x coordinate of the star
 * @param {number} y the y coordinate of the star
 * @param {number} size the size of the star
 * @param {string} [color] the color of the star
 */
function drawGlitter(con, x, y, size, color = 'rgba(255, 255, 255, 1)') {
  con.fillStyle = color;
  con.beginPath();
  con.moveTo(x - size * 0.1, y - size * 0.1);
  con.lineTo(x, y - size);
  con.lineTo(x + size * 0.1, y - size * 0.1);
  con.lineTo(x + size, y);
  con.lineTo(x + size * 0.1, y + size * 0.1);
  con.lineTo(x, y + size);
  con.lineTo(x - size * 0.1, y + size * 0.1);
  con.lineTo(x - size, y);
  con.lineTo(x - size * 0.1, y - size * 0.1);
  con.closePath();
  con.fill();
}
