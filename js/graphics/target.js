
/**
 * Draws the target on the given canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the target should be drawn on
 * @param {HTMLElement} can the canvas the target should be drawn on
 * @param {number} bx the x coordinate of the center of the grid cell
 * @param {number} by the y coordinate of the center of the grid cell
 * @param {number} bSize the width and height of the grid cell
 * @param {number} globalSlowTime a number between 0 and 1 that is used for cyclic animations
 * @param {number} fruits the number of remaining fruits (influences the size of the target). Transitions
 * can be animated via floating point values.
 */
function drawTarget(con, can, bx, by, bSize, globalSlowTime, fruits) {
  const osc = Math.sin(globalSlowTime * 2 * Math.PI) * 0.15;
  const colorArr = ['rgba(98, 255, 97, 1)', 'rgba(81, 233, 239, 1)', 'rgba(94, 161, 248, 1)',
    'rgba(181, 106, 245, 1)', 'rgba(248, 80, 127, 1)', 'rgba(255, 145, 84, 1)', 'rgba(253, 233, 88, 1)'];
  const sAng = (-0.5 + globalSlowTime * 2) * Math.PI; const angStep = 2 * Math.PI / colorArr.length;
  const con2 = getHiddenContext(can);
  for (let i=0; i<colorArr.length; i++) {
    const cAng = sAng + angStep * i;
    const nAng = sAng + angStep * (i + 1);
    const [fx, fy, sx, sy] = [bx + Math.cos(cAng) * bSize * 1.5, by + Math.sin(cAng) * bSize * 1.5,
      bx + Math.cos(nAng) * bSize * 1.5, by + Math.sin(nAng) * bSize * 1.5];
    con2.fillStyle = colorArr[i];
    con2.beginPath();
    con2.moveTo(bx, by);
    bezierCurve(con2, bx, by, fx, fy, 0.3 * Math.PI, -0.3 * Math.PI);
    con2.lineTo(sx, sy);
    bezierCurve(con2, sx, sy, bx, by, 0.7 * Math.PI, -0.7 * Math.PI);
    con2.closePath();
    con2.fill();
  }
  let sc = 1;
  if (fruits <= 1) sc = (1 - fruits) * 0.4 + 0.6;
  else sc = Math.pow(Math.E, -(fruits - 1)) * 0.3 + 0.3;
  const [x1, y1] = [bx, by - sc * bSize * 1.1];
  const [x2, y2] = [bx + sc * SQRT_2 * bSize * 0.55, by - sc * SQRT_2 * bSize * 0.55];
  const [x3, y3] = [bx + sc * bSize * 1.1, by];
  const [x4, y4] = [bx + sc * SQRT_2 * bSize * 0.55, by + sc * SQRT_2 * bSize * 0.55];
  const [x5, y5] = [bx, by + sc * bSize * 1.1];
  const [x6, y6] = [bx - sc * SQRT_2 * bSize * 0.55, by + sc * SQRT_2 * bSize * 0.55];
  const [x7, y7] = [bx - sc * bSize * 1.1, by];
  const [x8, y8] = [bx - sc * SQRT_2 * bSize * 0.55, by - sc * SQRT_2 * bSize * 0.55];
  con2.globalCompositeOperation = 'destination-in';
  con2.fillStyle = 'rgba(255, 255, 255, 1)';
  con2.beginPath();
  con2.moveTo(x1, y1);
  bezierCurve(con2, x1, y1, x2, y2, (0.5 - osc) * Math.PI, (-0.2 + osc) * Math.PI);
  bezierCurve(con2, x2, y2, x3, y3, (0.3 + osc) * Math.PI, (-0.4 + osc) * Math.PI);
  bezierCurve(con2, x3, y3, x4, y4, (0.2 + osc) * Math.PI, (-0.3 - osc) * Math.PI);
  bezierCurve(con2, x4, y4, x5, y5, (0.4 - osc) * Math.PI, (-0.1 + osc) * Math.PI);
  bezierCurve(con2, x5, y5, x6, y6, (0.5 + osc) * Math.PI, (-0.3 - osc) * Math.PI);
  bezierCurve(con2, x6, y6, x7, y7, (0.3 - osc) * Math.PI, (-0.2 - osc) * Math.PI);
  bezierCurve(con2, x7, y7, x8, y8, (0.6 - osc) * Math.PI, (-0.4 + osc) * Math.PI);
  bezierCurve(con2, x8, y8, x1, y1, (0.3 + osc) * Math.PI, (-0.2 - osc) * Math.PI);
  con2.closePath();
  con2.fill();
  con2.globalCompositeOperation = 'source-over';
  drawHiddenCanvas(con);
}
