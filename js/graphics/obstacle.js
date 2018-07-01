
/**
 * Draws an obstacle on the given canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the obstacle should be drawn on
 * @param {number} bx the x coordinate of the center of the grid cell
 * @param {number} by the y coordinate of the center of the grid cell
 * @param {number[]} adjVals an array containing the values in the adjacent grid cells
 * (0: left, 1: right, 2: top, 3: bottom, 4: top left, 5: top right, 6: bottom right, 7: bottom left)
 * @param {number} bSize the width and height of the grid cell
 * @param {number} sx the x coordinate of the grid cell in the game state array
 * @param {number} sy the y coordinate of the grid cell in the game state array
 * @param {number} globalTime a number between 0 and 1 that is used for cyclic animations
 */
function drawObstacle(con, bx, by, adjVals, bSize, sx, sy, globalTime) {
  const osc = Math.sin(globalTime * 2 * Math.PI);

  const [ssx, ssy] = [(sx + 900) % 3, (sy + 900) % 3];
  const [ssbx, ssby] = [(sx + 900) % 5, (sy + 900) % 5];

  // block
  con.fillStyle = 'rgba(156, 101, 57, 1)';
  con.beginPath();
  con.moveTo(bx - bSize / 2, by - bSize / 2);
  if (adjVals[2] == OBSTACLE) { // top
    con.lineTo(bx - bSize / 2, by - bSize / 2 - 1);
    con.lineTo(bx + bSize / 2, by - bSize / 2 - 1);
  }
  con.lineTo(bx + bSize / 2, by - bSize / 2);
  if (adjVals[1] != OBSTACLE && adjVals[3] != OBSTACLE && adjVals[6] != OBSTACLE) { // round bottom right corner
    con.lineTo(bx + bSize / 2, by + bSize / 3);
    con.arc(bx + bSize / 3, by + bSize / 3, bSize / 6, 0, 0.5 * Math.PI);
  } else {
    if (adjVals[1] == OBSTACLE) { // right
      con.lineTo(bx + bSize / 2 + 1, by - bSize / 2);
      con.lineTo(bx + bSize / 2 + 1, by + bSize / 2);
    }
    con.lineTo(bx + bSize / 2, by + bSize / 2);
  }
  if (adjVals[0] != OBSTACLE && adjVals[3] != OBSTACLE && adjVals[7] != OBSTACLE) { // round bottom left corner
    con.lineTo(bx - bSize / 3, by + bSize / 2);
    con.arc(bx - bSize / 3, by + bSize / 3, bSize / 6, 0.5 * Math.PI, Math.PI);
  } else {
    if (adjVals[3] == OBSTACLE) { // bottom
      con.lineTo(bx + bSize / 4, by + bSize / 2 + 1);
      con.lineTo(bx - bSize / 4, by + bSize / 2 + 1);
    }
    con.lineTo(bx - bSize / 2, by + bSize / 2);
    if (adjVals[0] == OBSTACLE) { // left
      con.lineTo(bx - bSize / 2 - 1, by + bSize / 2);
      con.lineTo(bx - bSize / 2 - 1, by - bSize / 2);
    }
  }
  con.lineTo(bx - bSize / 2, by - bSize / 2);
  con.closePath();
  con.fill();

  // connection to other blocks, if present
  if (adjVals[4] == OBSTACLE) { // top left
    con.beginPath();
    con.moveTo(bx - bSize / 2 + 1, by - bSize / 2 - 1);
    con.arc(bx - 7 * bSize / 10 + 1, by - 3 * bSize / 10 - 1, bSize / 5, 1.5 * Math.PI, 2 * Math.PI);
    con.closePath();
    con.fill();
  }
  if (adjVals[5] == OBSTACLE) { // top right
    con.beginPath();
    con.moveTo(bx + bSize / 2 - 1, by - bSize / 2 - 1);
    con.arc(bx + 7 * bSize / 10 - 1, by - 3 * bSize / 10 - 1, bSize / 5, Math.PI, 1.5 * Math.PI);
    con.closePath();
    con.fill();
  }

  // spots
  con.fillStyle = 'rgba(197, 127, 24, 1)';
  if ((ssbx == 0) && (ssby == 0)) {
    con.beginPath();
    con.moveTo(bx - bSize / 3, by - bSize / 3);
    con.bezierCurveTo(bx, by - bSize / 2,
      bx, by - bSize / 7,
      bx - bSize / 4, by - bSize / 5);
    con.bezierCurveTo(bx - bSize / 2, by + bSize / 5,
      bx - bSize / 2, by - bSize / 3,
      bx - bSize / 3, by - bSize / 3);
    con.closePath();
    con.fill();
    con.beginPath();
    con.moveTo(bx + bSize / 4, by - bSize / 5);
    con.bezierCurveTo(bx + bSize / 4, by - bSize / 2,
      bx + bSize / 2, by - bSize / 7,
      bx + bSize / 4, by - bSize / 5);
    con.closePath();
    con.fill();
  } else if ((ssbx == 2) && (ssby == 3)) {
    con.beginPath();
    con.moveTo(bx + bSize / 4, by - bSize / 3);
    con.bezierCurveTo(bx + 2 * bSize / 5, by - bSize / 3,
      bx + 2 * bSize / 5, by + bSize / 7,
      bx + bSize / 4, by);
    con.bezierCurveTo(bx - bSize / 6, by + bSize / 5,
      bx + bSize / 6, by - bSize / 3,
      bx + bSize / 4, by - bSize / 3);
    con.closePath();
    con.fill();
  } else if ((ssbx == 3) && (ssby == 2)) {
    con.beginPath();
    con.moveTo(bx - bSize / 6, by - bSize / 6);
    con.bezierCurveTo(bx - bSize / 6, by - bSize / 5,
      bx + bSize / 5, by - bSize / 6,
      bx, by);
    con.bezierCurveTo(bx - bSize / 5, by + bSize / 4,
      bx - bSize / 3, by - bSize / 3,
      bx - bSize / 6, by - bSize / 6);
    con.closePath();
    con.fill();
  } else if ((ssbx == 3) && (ssby == 1)) {
    con.beginPath();
    con.moveTo(bx + bSize / 6, by + bSize / 6);
    con.bezierCurveTo(bx + bSize / 8, by - bSize / 3,
      bx + bSize / 2, by + bSize / 4,
      bx + bSize / 4, by + bSize / 4);
    con.bezierCurveTo(bx, by + bSize / 3,
      bx, by,
      bx + bSize / 6, by + bSize / 6);
    con.closePath();
    con.fill();
    con.beginPath();
    con.moveTo(bx - bSize / 6, by - bSize / 6);
    con.bezierCurveTo(bx + bSize / 6, by - bSize / 8,
      bx - bSize / 4, by,
      bx - bSize / 6, by - bSize / 6);
    con.closePath();
    con.fill();
  } else if ((ssbx == 4) && (ssby == 4)) {
    con.beginPath();
    con.moveTo(bx + 2 * bSize / 7, by + bSize / 9);
    con.bezierCurveTo(bx + bSize / 2, by + bSize / 10,
      bx + bSize / 2, by + bSize / 2,
      bx + bSize / 4, by + bSize / 4);
    con.bezierCurveTo(bx - bSize / 8, by + bSize / 3,
      bx - bSize / 5, by - bSize / 4,
      bx + 2 * bSize / 7, by + bSize / 9);
    con.closePath();
    con.fill();
    con.beginPath();
    con.moveTo(bx - 2 * bSize / 5, by + bSize / 5);
    con.bezierCurveTo(bx - bSize / 8, by + bSize / 8,
      bx - 2 * bSize / 5, by + 3 * bSize / 5,
      bx - 2 * bSize / 5, by + bSize / 5);
    con.closePath();
    con.fill();
  } else if ((ssbx == 1) && (ssby == 2)) {
    con.beginPath();
    con.moveTo(bx - bSize / 8, by + bSize / 6);
    con.bezierCurveTo(bx + bSize / 5, by - bSize / 10,
      bx + bSize / 5, by + bSize / 2,
      bx - bSize / 8, by + bSize / 3);
    con.bezierCurveTo(bx - bSize / 3, by + bSize / 2,
      bx - bSize / 5, by - bSize / 4,
      bx - bSize / 8, by + bSize / 3);
    con.closePath();
    con.fill();
  }

  if (adjVals[2] != OBSTACLE) {
    // grass
    const grassOffset = bSize / 20;
    let off1 = [0, 0];
    let off2 = [0, 3];
    let off3 = [0, 0];
    if (ssx == 0) {
      if (ssy == 0) { off1 = [0, 0]; off2 = [0, 3]; off3 = [0, 0]; }
      else if (ssy == 1) { off1 = [-1, 0]; off2 = [0.5, 3]; off3 = [1, 0.5]; }
      else if (ssy == 2) { off1 = [0.5, 2]; off2 = [0, 4]; off3 = [0.5, 0]; }
    } else if (ssx == 1) {
      if (ssy == 0) { off1 = [0, -1]; off2 = [1, 2]; off3 = [-0.5, 0.5]; }
      else if (ssy == 1) { off1 = [0, 1]; off2 = [-0.5, 3]; off3 = [0, 0.5]; }
      else if (ssy == 2) { off1 = [-0.5, 1]; off2 = [0.5, 2]; off3 = [0, 0]; }
    } else if (ssx == 2) {
      if (ssy == 0) { off1 = [-0.5, -0.5]; off2 = [-1, 4]; off3 = [0, 0]; }
      else if (ssy == 1) { off1 = [1, 0]; off2 = [0, 2]; off3 = [1, 0.5]; }
      else if (ssy == 2) { off1 = [0, 2]; off2 = [1, 3]; off3 = [-1, 1]; }
    }
    for (let i=0; i<2; i++) {
      if (i == 0) {
        off1[i] += osc;
        off2[i] += osc;
        off3[i] += osc;
      }
      off1[i] *= grassOffset;
      off2[i] *= grassOffset;
      off3[i] *= grassOffset;
    }
    con.fillStyle = 'rgba(155, 254, 80, 1)';
    con.beginPath();
    con.moveTo(bx - bSize / 2 - grassOffset, by - bSize / 2 - grassOffset);
    con.lineTo(bx + bSize / 2 + grassOffset, by - bSize / 2 - grassOffset);
    con.bezierCurveTo(bx + bSize / 2 + grassOffset + off1[0], by - bSize / 6 + off1[1],
      bx + bSize / 5 + off1[0], by - bSize / 6 + off1[1],
      bx + bSize / 5, by - bSize / 3);
    con.bezierCurveTo(bx + bSize / 5 + off2[0], by - bSize / 6 + off2[1],
      bx - bSize / 5 + off2[0], by - bSize / 6 + off2[1],
      bx - bSize / 5, by - bSize / 3);
    con.bezierCurveTo(bx - bSize / 5 + off3[0], by - bSize / 6 + off3[1],
      bx - bSize / 2 - grassOffset + off3[0], by - bSize / 6 + off3[1],
      bx - bSize / 2 - grassOffset, by - bSize / 3);
    con.closePath();
    con.fill();

    // additional grass
    con.strokeStyle = 'rgba(155, 254, 80, 1)';
    con.lineWidth = Math.ceil(bSize / 15);
    con.lineCap = 'round';
    let extra_grass = -1; // 0 or 1 or 2
    if ((ssbx == 3) && (ssby == 0)) {
      extra_grass = 0;
    } else if ((ssbx == 1) && (ssby == 3)) {
      extra_grass = 1;
    } else if ((ssbx == 2) && (ssby == 2)) {
      extra_grass = 2;
    } else if ((ssbx == 0) && (ssby == 1)) {
      extra_grass = 1;
    } else if ((ssbx == 4) && (ssby == 4)) {
      extra_grass = 0;
    } else if ((ssbx == 2) && (ssby == 4)) {
      extra_grass = 2;
    }
    if (extra_grass != -1) {
      if (extra_grass == 0) {
        con.beginPath();
        con.moveTo(bx + 0.3 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx + 0.3 * bSize / 3, by - 1.2 * bSize / 2,
          bx + 0.4 * bSize / 3, by - 1.2 * bSize / 2,
          bx + (0.6 + osc * 0.15) * bSize / 3, by - 1.3 * bSize / 2);
        con.moveTo(bx + 1 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.moveTo(bx + 0.1 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx + 0.1 * bSize / 3, by - 1.2 * bSize / 2,
          bx + 0.2 * bSize / 3, by - 1.5 * bSize / 2,
          bx + (0.3 + osc * 0.1) * bSize / 3, by - 1.7 * bSize / 2);
        con.moveTo(bx + 0.9 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.moveTo(bx + 0 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx + 0 * bSize / 3, by - 1.2 * bSize / 2,
          bx - 0.1 * bSize / 3, by - 1.5 * bSize / 2,
          bx - (0.15 - osc * 0.1) * bSize / 3, by - 1.8 * bSize / 2);
        con.moveTo(bx + 0.8 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.moveTo(bx - 0.1 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx - 0.1 * bSize / 3, by - 1.1 * bSize / 2,
          bx - 0.3 * bSize / 3, by - 1.1 * bSize / 2,
          bx - (0.4 - osc * 0.15) * bSize / 3, by - 1.4 * bSize / 2);
        con.moveTo(bx + 0.7 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.stroke();
      } else if (extra_grass == 1) {
        con.beginPath();
        con.moveTo(bx - 0.9 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx - 0.9 * bSize / 3, by - 1.2 * bSize / 2,
          bx - 1 * bSize / 3, by - 1.2 * bSize / 2,
          bx - (1.05 + osc * 0.12) * bSize / 3, by - 1.4 * bSize / 2);
        con.moveTo(bx - 0.9 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.moveTo(bx - 0.8 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx - 0.8 * bSize / 3, by - 1.2 * bSize / 2,
          bx - 0.75 * bSize / 3, by - 1.4 * bSize / 2,
          bx - (0.7 + osc * 0.08) * bSize / 3, by - 1.6 * bSize / 2);
        con.moveTo(bx - 0.8 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.moveTo(bx - 0.7 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx - 0.7 * bSize / 3, by - 1.1 * bSize / 2,
          bx - 0.6 * bSize / 3, by - 1.1 * bSize / 2,
          bx - (0.5 + osc * 0.15) * bSize / 3, by - 1.2 * bSize / 2);
        con.moveTo(bx - 0.7 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.stroke();
      } else {
        con.beginPath();
        con.moveTo(bx + 1 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx + 1 * bSize / 3, by - 1.2 * bSize / 2,
          bx + 1.1 * bSize / 3, by - 1.2 * bSize / 2,
          bx + (1.2 + osc * 0.15) * bSize / 3, by - 1.3 * bSize / 2);
        con.moveTo(bx + 1 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.moveTo(bx + 0.9 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx + 0.9 * bSize / 3, by - 1.2 * bSize / 2,
          bx + 1 * bSize / 3, by - 1.3 * bSize / 2,
          bx + (1.05 + osc * 0.1) * bSize / 3, by - 1.5 * bSize / 2);
        con.moveTo(bx + 0.9 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.moveTo(bx + 0.8 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx + 0.8 * bSize / 3, by - 1.2 * bSize / 2,
          bx + 0.75 * bSize / 3, by - 1.4 * bSize / 2,
          bx + (0.7 + osc * 0.1) * bSize / 3, by - 1.6 * bSize / 2);
        con.moveTo(bx + 0.8 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.moveTo(bx + 0.7 * bSize / 3, by - 1 * bSize / 2);
        con.bezierCurveTo(bx + 0.7 * bSize / 3, by - 1.1 * bSize / 2,
          bx + 0.6 * bSize / 3, by - 1.1 * bSize / 2,
          bx + (0.5 + osc * 0.15) * bSize / 3, by - 1.2 * bSize / 2);
        con.moveTo(bx + 0.7 * bSize / 3, by - 1 * bSize / 2);
        con.closePath();
        con.stroke();
      }
    }

    // flowers
    let flower = -1; // 0 or 1
    let fcolor = 'rgba(1, 194, 247, 1)';
    if ((ssbx == 1) && (ssby == 0)) {
      flower = 0; fcolor = 'rgba(255, 77, 166, 1)';
    } else if ((ssbx == 0) && (ssby == 2)) {
      flower = 1;
    } else if ((ssbx == 2) && (ssby == 1)) {
      flower = 0;
    } else if ((ssbx == 4) && (ssby == 3)) {
      flower = 0;
    } else if ((ssbx == 2) && (ssby == 4)) {
      flower = 1; fcolor = 'rgba(255, 77, 166, 1)';
    }
    if (flower != -1) {
      if (flower == 0) {
        con.fillStyle = fcolor;
        con.beginPath();
        con.moveTo(bx + 1 * bSize / 9, by - 3.1 * bSize / 5);
        con.bezierCurveTo(bx + 0.8 * bSize / 9, by - 3.5 * bSize / 5,
          bx + 2.1 * bSize / 9, by - 3.5 * bSize / 5,
          bx + 2 * bSize / 9, by - 3.2 * bSize / 5);
        con.bezierCurveTo(bx + 2.3 * bSize / 9, by - 3.4 * bSize / 5,
          bx + 3.4 * bSize / 9, by - 3.4 * bSize / 5,
          bx + 3 * bSize / 9, by - 3.1 * bSize / 5);
        con.bezierCurveTo(bx + 4.3 * bSize / 9, by - 3.0 * bSize / 5,
          bx + 3.8 * bSize / 9, by - 2.3 * bSize / 5,
          bx + 3 * bSize / 9, by - 2.5 * bSize / 5);
        con.bezierCurveTo(bx + 3.5 * bSize / 9, by - 2.2 * bSize / 5,
          bx + 2.2 * bSize / 9, by - 2.1 * bSize / 5,
          bx + 2 * bSize / 9, by - 2.4 * bSize / 5);
        con.bezierCurveTo(bx + 1.8 * bSize / 9, by - 2.2 * bSize / 5,
          bx + 0.6 * bSize / 9, by - 2.1 * bSize / 5,
          bx + 1 * bSize / 9, by - 2.5 * bSize / 5);
        con.bezierCurveTo(bx - 0.3 * bSize / 9, by - 2.5 * bSize / 5,
          bx + 0.1 * bSize / 9, by - 3.3 * bSize / 5,
          bx + 1 * bSize / 9, by - 3.1 * bSize / 5);
        con.closePath();
        con.fill();
        con.fillStyle = 'rgba(255, 242, 0, 1)';
        con.beginPath();
        con.moveTo(bx + 2 * bSize / 9, by - 3 * bSize / 5);
        con.bezierCurveTo(bx + 3 * bSize / 9, by - 3 * bSize / 5,
          bx + 3 * bSize / 9, by - 2.6 * bSize / 5,
          bx + 2 * bSize / 9, by - 2.6 * bSize / 5);
        con.bezierCurveTo(bx + 1 * bSize / 9, by - 2.6 * bSize / 5,
          bx + 1 * bSize / 9, by - 3 * bSize / 5,
          bx + 2 * bSize / 9, by - 3 * bSize / 5);
        con.closePath();
        con.fill();
      } else {
        con.fillStyle = fcolor;
        con.beginPath();
        con.moveTo(bx - bSize / 3, by - 3.4 * bSize / 5);
        con.bezierCurveTo(bx - 0.6 * bSize / 3, by - 3.7 * bSize / 5,
          bx - 0.3 * bSize / 6, by - 3.1 * bSize / 5,
          bx - bSize / 6, by - 3 * bSize / 5);
        con.bezierCurveTo(bx - 0.4 * bSize / 6, by - 2.8 * bSize / 5,
          bx - 0.5 * bSize / 3, by - 2.2 * bSize / 5,
          bx - bSize / 3, by - 2.6 * bSize / 5);
        con.bezierCurveTo(bx - 1.5 * bSize / 3, by - 2.1 * bSize / 5,
          bx - 1.2 * bSize / 2, by - 2.9 * bSize / 5,
          bx - bSize / 2, by - 3 * bSize / 5);
        con.bezierCurveTo(bx - 1.1 * bSize / 2, by - 3.2 * bSize / 5,
          bx - 1.4 * bSize / 3, by - 3.6 * bSize / 5,
          bx - bSize / 3, by - 3.4 * bSize / 5);
        con.closePath();
        con.fill();
        con.fillStyle = 'rgba(255, 242, 0, 1)';
        con.beginPath();
        con.moveTo(bx - bSize / 3, by - 3.2 * bSize / 5);
        con.bezierCurveTo(bx - 0.7 * bSize / 3, by - 3.2 * bSize / 5,
          bx - 0.7 * bSize / 3, by - 2.8 * bSize / 5,
          bx - bSize / 3, by - 2.8 * bSize / 5);
        con.bezierCurveTo(bx - 1.3 * bSize / 3, by - 2.8 * bSize / 5,
          bx - 1.3 * bSize / 3, by - 3.2 * bSize / 5,
          bx - bSize / 3, by - 3.2 * bSize / 5);
        con.closePath();
        con.fill();
      }
    }
  }
}
