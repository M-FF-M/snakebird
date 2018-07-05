
const FRUIT_COLORS = ['rgba(95, 245, 91, 1)', 'rgba(253, 1, 39, 1)', 'rgba(253, 103, 9, 1)',
  'rgba(255, 216, 10, 1)', 'rgba(255, 130, 107, 1)', 'rgba(254, 102, 7, 1)', 'rgba(255, 216, 10, 1)'];

const FRUIT_SHAPES = [
  [
    [
      [-0.6, -0.6, 0.1 * Math.PI, -0.5 * Math.PI, 0.6, 1],
      [0.45, -0.3, 0.025 * Math.PI, -0.05 * Math.PI, 1, 1],
      [0.7, 0.7, 0.05 * Math.PI, -0.025 * Math.PI, 1, 1],
      [-0.3, 0.45, 0.5 * Math.PI, -0.1 * Math.PI, 1, 0.6]
    ]
  ],
  [
    [
      [-0.5, 0.1, -0.025 * Math.PI, -0.05 * Math.PI, 1.35, 1.3],
      [-0.05, 0.8, 0.05 * Math.PI, 0.025 * Math.PI, 1.25, 1.35]
    ],
    [
      [0.2, -0.4, -0.025 * Math.PI, -0.05 * Math.PI, 1.35, 1.3],
      [0.8, 0.2, 0.05 * Math.PI, 0.025 * Math.PI, 1.25, 1.35]
    ]
  ],
  [
    [
      [-0.5, -0.5, 0, 0, 1.3, 1.35],
      [0.6, 0.6, 0, 0, 1.25, 1.3]
    ]
  ],
  [
    [
      [-0.65, -0.65, 0.4 * Math.PI, -0.2 * Math.PI, 1, 1],
      [-0.45, -0.7, 0.2 * Math.PI, -0.2 * Math.PI, 1, 1],
      [0.7, 0.5, 0.15 * Math.PI, -0.15 * Math.PI, 1.7, 1.7],
      [0.5, 0.7, 0.2 * Math.PI, -0.2 * Math.PI, 1, 1],
      [-0.7, -0.45, 0.2 * Math.PI, -0.4 * Math.PI, 1, 1]
    ]
  ],
  [
    [
      [-0.45, -0.45, -0.1 * Math.PI, 0, 1.35, 1.55],
      [0.6, 0.6, 0, 0.1 * Math.PI, 1.4, 1.3]
    ]
  ],
  [
    [
      [-0.5, -0.5, 0.2 * Math.PI, -0.35 * Math.PI, 1.1, 1],
      [0.45, -0.45, -0.05 * Math.PI, 0.05 * Math.PI, 2, 1.95],
      [-0.45, 0.45, 0.35 * Math.PI, -0.2 * Math.PI, 1, 1.1]
    ]
  ],
  [
    [
      [0.35, -0.6, 0.2 * Math.PI, -0.25 * Math.PI, 1.1, 1],
      [-0.8, -0.1, 0.25 * Math.PI, -0.05 * Math.PI, 1.2, 1.2],
      [-0.9, -0.3, 0.6 * Math.PI, -0.6 * Math.PI, 1, 1.1],
      [0.25, -0.65, 0.05 * Math.PI, -0.05 * Math.PI, 1, 1.1]
    ],
    [
      [0.45, -0.5, 0.2 * Math.PI, -0.25 * Math.PI, 1.1, 1],
      [-0.7, 0.45, 0.25 * Math.PI, -0.05 * Math.PI, 1.2, 1.2],
      [-0.8, 0.25, 0.6 * Math.PI, -0.6 * Math.PI, 1, 1.1],
      [0.35, -0.55, 0.05 * Math.PI, -0.05 * Math.PI, 1, 1.1]
    ],
    [
      [0.55, -0.4, 0.2 * Math.PI, -0.25 * Math.PI, 1.1, 1],
      [-0.4, 0.85, 0.25 * Math.PI, -0.05 * Math.PI, 1.2, 1.2],
      [-0.5, 0.65, 0.6 * Math.PI, -0.6 * Math.PI, 1, 1.1],
      [0.45, -0.45, 0.05 * Math.PI, -0.05 * Math.PI, 1, 1.1]
    ]
  ]
];

const FRUIT_STEMS = [
  [
    [-0.64, -0.55, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.82, -0.71, 0.4 * Math.PI, -0.4 * Math.PI, 1, 1],
    [-0.75, -0.86, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.55, -0.64, 0.2 * Math.PI, -0.2 * Math.PI, 1, 1]
  ],
  [
    [-0.65, -0.75, 0.1 * Math.PI, -0.1 * Math.PI, 1, 1],
    [-0.55, -0.85, 0.7 * Math.PI, -0.45 * Math.PI, 1.3, 1],
    [0.25, -0.45, 0.3 * Math.PI, -0.35 * Math.PI, 1, 1],
    [0.15, -0.35, 0.65 * Math.PI, -0.3 * Math.PI, 1, 1],
    [-0.45, -0.6, 0.3 * Math.PI, -0.65 * Math.PI, 1, 1],
    [-0.45, 0.05, 0.3 * Math.PI, -0.35 * Math.PI, 1, 1.3],
    [-0.55, 0.15, 0.4 * Math.PI, -0.75 * Math.PI, 1, 1]
  ],
  [
    [-0.56, -0.45, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.76, -0.65, 0.4 * Math.PI, -0.4 * Math.PI, 1, 1],
    [-0.65, -0.76, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.6, -0.65, 0.65 * Math.PI, -0.45 * Math.PI, 1, 1.5],
    [0, -0.95, 0.3 * Math.PI, -0.15 * Math.PI, 1, 1],
    [0.45, -0.65, 0.7 * Math.PI, -0.65 * Math.PI, 1, 1],
    [-0.2, -0.75, 0.45 * Math.PI, -0.45 * Math.PI, 1, 1],
    [-0.56, -0.61, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.45, -0.56, 0.2 * Math.PI, -0.2 * Math.PI, 1, 1]
  ],
  [
    [-0.68, -0.63, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.76, -0.71, 0.4 * Math.PI, -0.4 * Math.PI, 1, 1],
    [-0.4, -0.1, 0.4 * Math.PI, -0.4 * Math.PI, 1, 1],
    [-0.8, -0.6, 0.6 * Math.PI, -0.5 * Math.PI, 1, 1],
    [-0.7, 0.4, 0.3 * Math.PI, -0.35 * Math.PI, 1, 1],
    [-0.8, -0.75, 0.52 * Math.PI, -0.51 * Math.PI, 1, 1],
    [-0.88, -0.83, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.83, -0.88, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.63, -0.68, 0.2 * Math.PI, -0.2 * Math.PI, 1, 1],
  ],
  [
    [-0.48, -0.43, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.68, -0.63, 0.4 * Math.PI, -0.4 * Math.PI, 1, 1],
    [-0.63, -0.68, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.55, -0.6, 0.4 * Math.PI, -0.25 * Math.PI, 1, 1.5],
    [0.4, -0.7, 0.7 * Math.PI, -0.65 * Math.PI, 1, 1],
    [-0.51, -0.56, 0.51 * Math.PI, -0.52 * Math.PI, 1, 1],
    [-0.43, -0.48, 0.2 * Math.PI, -0.2 * Math.PI, 1, 1]
  ],
  [
    [-0.65, -0.35, 0.6 * Math.PI, -0.6 * Math.PI, 1, 1],
    [-1, -0.5, 0.3 * Math.PI, -0.2 * Math.PI, 1, 1],
    [-0.6, -0.4, 0.55 * Math.PI, -0.55 * Math.PI, 1, 1],
    [-1, -0.7, 0.3 * Math.PI, -0.3 * Math.PI, 1, 1],
    [-0.55, -0.45, 0.5 * Math.PI, -0.45 * Math.PI, 1, 1],
    [-0.95, -0.95, 0.45 * Math.PI, -0.5 * Math.PI, 1, 1],
    [-0.45, -0.55, 0.3 * Math.PI, -0.3 * Math.PI, 1, 1],
    [-0.7, -1, 0.55 * Math.PI, -0.55 * Math.PI, 1, 1],
    [-0.4, -0.6, 0.2 * Math.PI, -0.3 * Math.PI, 1, 1],
    [-0.5, -1, 0.6 * Math.PI, -0.6 * Math.PI, 1, 1],
    [-0.35, -0.65, 0.45 * Math.PI, -0.45 * Math.PI, 1, 1]
  ],
  [
    [0.6, -0.8, 0.45 * Math.PI, -0.45 * Math.PI, 1.1, 1],
    [0.55, -0.45, 0.25 * Math.PI, -0.05 * Math.PI, 1.2, 1.2],
    [0.25, -0.65, 0.45 * Math.PI, -0.4 * Math.PI, 1, 1.1],
    [0.5, -0.9, 0.45 * Math.PI, -0.55 * Math.PI, 1, 1.1]
  ]
];

/**
 * Draws a fruit on the given canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the fruit should be drawn on
 * @param {number} bx the x coordinate of the center of the grid cell
 * @param {number} by the y coordinate of the center of the grid cell
 * @param {number} bSize the width and height of the grid cell
 * @param {number} globalTime a number between 0 and 1 that is used for cyclic animations
 * @param {number} [fruitType] specifies the type of the fruit (currently available: 0 to 6)
 * @param {number} [scale] an optional factor for scaling the fruit
 */
function drawFruit(con, bx, by, bSize, globalTime, fruitType = 0, scale = 1) {
  const osc = Math.sin(globalTime * 2 * Math.PI);
  scale *= (1 + osc * 0.05);
  const idx = fruitType % FRUIT_COLORS.length;
  con.fillStyle = FRUIT_COLORS[idx]; const sz = scale * bSize / 2;
  for (let k=0; k<FRUIT_SHAPES[idx].length; k++) {
    con.beginPath();
    for (let i=0; i<FRUIT_SHAPES[idx][k].length; i++) {
      let [sx, sy, dx, dy] = [FRUIT_SHAPES[idx][k][i][0], FRUIT_SHAPES[idx][k][i][1],
        FRUIT_SHAPES[idx][k][(i + 1) % FRUIT_SHAPES[idx][k].length][0], FRUIT_SHAPES[idx][k][(i + 1) % FRUIT_SHAPES[idx][k].length][1]];
      sx += osc * 0.05; sy += osc * 0.05; dx += osc * 0.05; dy += osc * 0.05;
      sx *= sz; sy *= sz; dx *= sz; dy *= sz;
      sx += bx; sy += by; dx += bx; dy += by;
      if (i == 0) con.moveTo(sx, sy);
      bezierCurve(con, sx, sy, dx, dy, FRUIT_SHAPES[idx][k][i][2], FRUIT_SHAPES[idx][k][i][3],
        FRUIT_SHAPES[idx][k][i][4], FRUIT_SHAPES[idx][k][i][5]);
    }
    con.closePath();
    con.fill();
  }
  con.fillStyle = 'rgba(92, 210, 99, 1)';
  con.beginPath();
  for (let i=0; i<FRUIT_STEMS[idx].length; i++) {
    let [sx, sy, dx, dy] = [FRUIT_STEMS[idx][i][0], FRUIT_STEMS[idx][i][1],
    FRUIT_STEMS[idx][(i + 1) % FRUIT_STEMS[idx].length][0], FRUIT_STEMS[idx][(i + 1) % FRUIT_STEMS[idx].length][1]];
    sx += osc * 0.05; sy += osc * 0.05; dx += osc * 0.05; dy += osc * 0.05;
    sx *= sz; sy *= sz; dx *= sz; dy *= sz;
    sx += bx; sy += by; dx += bx; dy += by;
    if (i == 0) con.moveTo(sx, sy);
    bezierCurve(con, sx, sy, dx, dy, FRUIT_STEMS[idx][i][2], FRUIT_STEMS[idx][i][3],
      FRUIT_STEMS[idx][i][4], FRUIT_STEMS[idx][i][5]);
  }
  con.closePath();
  con.fill();
}
