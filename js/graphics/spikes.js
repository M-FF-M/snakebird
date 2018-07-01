
/**
 * Draws a spike on the given canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the spike should be drawn on
 * @param {number} bx the x coordinate of the center of the grid cell
 * @param {number} by the y coordinate of the center of the grid cell
 * @param {number[]} adjVals an array containing the values in the adjacent grid cells
 * (0: left, 1: right, 2: top, 3: bottom, 4: top left, 5: top right, 6: bottom right, 7: bottom left)
 * @param {number} bSize the width and height of the grid cell
 */
function drawSpike(con, bx, by, adjVals, bSize) {
  // connection to obstacles
  con.fillStyle = 'rgba(89, 99, 110, 1)';
  if (adjVals[2] == OBSTACLE) { // top
    con.fillRect(bx - bSize / 5, by - bSize / 2, 2 * bSize / 5, bSize / 2);
  }
  if (adjVals[1] == OBSTACLE) { // right
    con.fillRect(bx, by - bSize / 5, bSize / 2, 2 * bSize / 5);
  }
  if (adjVals[3] == OBSTACLE) { // bottom
    con.fillRect(bx - bSize / 5, by, 2 * bSize / 5, bSize / 2);
  }
  if (adjVals[0] == OBSTACLE) { // left
    con.fillRect(bx - bSize / 2, by - bSize / 5, bSize / 2, 2 * bSize / 5);
  }

  // actual spikes
  con.fillStyle = 'rgba(175, 170, 169, 1)';
  if (adjVals[2] != OBSTACLE && adjVals[2] != SPIKE) { // top
    con.beginPath();
    con.moveTo(bx - bSize / 4, by - bSize / 5);
    con.lineTo(bx - bSize / 8, by - bSize / 2);
    con.lineTo(bx, by - bSize / 5);
    con.lineTo(bx + bSize / 8, by - bSize / 2);
    con.lineTo(bx + bSize / 4, by - bSize / 5);
    con.closePath();
    con.fill();
  }
  if (adjVals[1] != OBSTACLE && adjVals[1] != SPIKE) { // right
    con.beginPath();
    con.moveTo(bx + bSize / 5, by - bSize / 4);
    con.lineTo(bx + bSize / 2, by - bSize / 8);
    con.lineTo(bx + bSize / 5, by);
    con.lineTo(bx + bSize / 2, by + bSize / 8);
    con.lineTo(bx + bSize / 5, by + bSize / 4);
    con.closePath();
    con.fill();
  }
  if (adjVals[3] != OBSTACLE && adjVals[3] != SPIKE) { // bottom
    con.beginPath();
    con.moveTo(bx - bSize / 4, by + bSize / 5);
    con.lineTo(bx - bSize / 8, by + bSize / 2);
    con.lineTo(bx, by + bSize / 5);
    con.lineTo(bx + bSize / 8, by + bSize / 2);
    con.lineTo(bx + bSize / 4, by + bSize / 5);
    con.closePath();
    con.fill();
  }
  if (adjVals[0] != OBSTACLE && adjVals[0] != SPIKE) { // left
    con.beginPath();
    con.moveTo(bx - bSize / 5, by - bSize / 4);
    con.lineTo(bx - bSize / 2, by - bSize / 8);
    con.lineTo(bx - bSize / 5, by);
    con.lineTo(bx - bSize / 2, by + bSize / 8);
    con.lineTo(bx - bSize / 5, by + bSize / 4);
    con.closePath();
    con.fill();
  }

  // spikes for connecting parts
  if (adjVals[2] == SPIKE) { // top
    con.beginPath();
    con.moveTo(bx + bSize / 5, by - bSize / 2);
    con.lineTo(bx + bSize / 2, by - 3 * bSize / 8);
    con.lineTo(bx + bSize / 5, by - bSize / 4);
    con.lineTo(bx - bSize / 5, by - bSize / 4);
    con.lineTo(bx - bSize / 2, by - 3 * bSize / 8);
    con.lineTo(bx - bSize / 5, by - bSize / 2);
    con.closePath();
    con.fill();
  }
  if (adjVals[1] == SPIKE) { // right
    con.beginPath();
    con.moveTo(bx + bSize / 2, by + bSize / 5);
    con.lineTo(bx + 3 * bSize / 8, by + bSize / 2);
    con.lineTo(bx + bSize / 4, by + bSize / 5);
    con.lineTo(bx + bSize / 4, by - bSize / 5);
    con.lineTo(bx + 3 * bSize / 8, by - bSize / 2);
    con.lineTo(bx + bSize / 2, by - bSize / 5);
    con.closePath();
    con.fill();
  }
  if (adjVals[3] == SPIKE) { // bottom
    con.beginPath();
    con.moveTo(bx + bSize / 5, by + bSize / 2);
    con.lineTo(bx + bSize / 2, by + 3 * bSize / 8);
    con.lineTo(bx + bSize / 5, by + bSize / 4);
    con.lineTo(bx - bSize / 5, by + bSize / 4);
    con.lineTo(bx - bSize / 2, by + 3 * bSize / 8);
    con.lineTo(bx - bSize / 5, by + bSize / 2);
    con.closePath();
    con.fill();
  }
  if (adjVals[0] == SPIKE) { // left
    con.beginPath();
    con.moveTo(bx - bSize / 2, by + bSize / 5);
    con.lineTo(bx - 3 * bSize / 8, by + bSize / 2);
    con.lineTo(bx - bSize / 4, by + bSize / 5);
    con.lineTo(bx - bSize / 4, by - bSize / 5);
    con.lineTo(bx - 3 * bSize / 8, by - bSize / 2);
    con.lineTo(bx - bSize / 2, by - bSize / 5);
    con.closePath();
    con.fill();
  }

  // main body
  con.fillStyle = 'rgba(104, 119, 126, 1)';
  con.beginPath();
  con.moveTo(bx - bSize / 4, by - bSize / 4);
  if (adjVals[2] == SPIKE) { // top
    con.lineTo(bx - bSize / 4, by - bSize / 2 - 1);
    con.lineTo(bx + bSize / 4, by - bSize / 2 - 1);
  }
  con.lineTo(bx + bSize / 4, by - bSize / 4);
  if (adjVals[1] == SPIKE) { // right
    con.lineTo(bx + bSize / 2 + 1, by - bSize / 4);
    con.lineTo(bx + bSize / 2 + 1, by + bSize / 4);
  }
  con.lineTo(bx + bSize / 4, by + bSize / 4);
  if (adjVals[3] == SPIKE) { // bottom
    con.lineTo(bx + bSize / 4, by + bSize / 2 + 1);
    con.lineTo(bx - bSize / 4, by + bSize / 2 + 1);
  }
  con.lineTo(bx - bSize / 4, by + bSize / 4);
  if (adjVals[0] == SPIKE) { // left
    con.lineTo(bx - bSize / 2 - 1, by + bSize / 4);
    con.lineTo(bx - bSize / 2 - 1, by - bSize / 4);
  }
  con.lineTo(bx - bSize / 4, by - bSize / 4);
  con.closePath();
  con.fill();
  con.fillRect(bx - bSize / 4, by - bSize / 4, bSize * 0.5, bSize * 0.5);

  // screw
  let drawScrew = 1; // 0: |, 1: /, 2: -, 3: \
  if ((adjVals[0] == SPIKE && adjVals[1] == SPIKE && adjVals[2] != SPIKE && adjVals[3] != SPIKE)
      || (adjVals[0] != SPIKE && adjVals[1] != SPIKE && adjVals[2] == SPIKE && adjVals[3] == SPIKE)) {
    drawScrew = -1;
  } else {
    if ((adjVals[0] == SPIKE && adjVals[1] != SPIKE && adjVals[2] != SPIKE && adjVals[3] != SPIKE)
        || (adjVals[0] != SPIKE && adjVals[1] == SPIKE && adjVals[2] != SPIKE && adjVals[3] != SPIKE))
      drawScrew = 0;
    else if ((adjVals[0] != SPIKE && adjVals[1] != SPIKE && adjVals[2] == SPIKE && adjVals[3] != SPIKE)
        || (adjVals[0] != SPIKE && adjVals[1] != SPIKE && adjVals[2] != SPIKE && adjVals[3] == SPIKE))
      drawScrew = 2;
    else if ((adjVals[0] != SPIKE && adjVals[1] == SPIKE && adjVals[2] != SPIKE && adjVals[3] == SPIKE)
        || (adjVals[0] == SPIKE && adjVals[1] != SPIKE && adjVals[2] == SPIKE && adjVals[3] != SPIKE))
      drawScrew = 3;
  }
  if (drawScrew != -1) {
    con.fillStyle = 'rgba(160, 174, 186, 1)';
    con.beginPath();
    con.arc(bx, by, bSize / 6, 0, 2 * Math.PI);
    con.closePath();
    con.fill();
    const ang = drawScrew == 0 ? -0.45*Math.PI : (drawScrew == 1 ? -0.25*Math.PI :
      (drawScrew == 2 ? -0.05*Math.PI : (0.45*Math.PI)));
    con.strokeStyle = 'rgba(104, 119, 126, 1)';
    con.lineWidth = Math.ceil(bSize * 0.05);
    con.beginPath();
    con.moveTo(bx + (bSize / 5.5) * Math.cos(ang), by + (bSize / 5.5) * Math.sin(ang));
    con.lineTo(bx - (bSize / 5.5) * Math.cos(ang), by - (bSize / 5.5) * Math.sin(ang));
    con.closePath();
    con.stroke();
  }
}
