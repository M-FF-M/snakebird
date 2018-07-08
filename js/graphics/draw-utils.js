
/**
 * The squareroot of 2
 * @type {number}
 */
const SQRT_2 = Math.sqrt(2);

const GLOBAL_HIDDEN_CAN_ARR = [];

/**
 * Get a canvas that is not displayed to the user
 * @param {HTMLElement} visibleCanvas the corresponding visible canvas (used for specifying the size)
 * @param {number} [idx] the index of the canvas in GLOBAL_HIDDEN_CAN_ARR
 * @return {HTMLElement} the hidden canvas
 */
function getHiddenCanvas(visibleCanvas, idx = 0) {
  if (GLOBAL_HIDDEN_CAN_ARR[idx]) {
    if (GLOBAL_HIDDEN_CAN_ARR[idx].width != visibleCanvas.width
        || GLOBAL_HIDDEN_CAN_ARR[idx].height != visibleCanvas.height) {
      GLOBAL_HIDDEN_CAN_ARR[idx].width = visibleCanvas.width;
      GLOBAL_HIDDEN_CAN_ARR[idx].height = visibleCanvas.height;
    }
    return GLOBAL_HIDDEN_CAN_ARR[idx];
  } else {
    GLOBAL_HIDDEN_CAN_ARR[idx] = document.createElement('canvas');
    GLOBAL_HIDDEN_CAN_ARR[idx].width = visibleCanvas.width;
    GLOBAL_HIDDEN_CAN_ARR[idx].height = visibleCanvas.height;
    return GLOBAL_HIDDEN_CAN_ARR[idx];
  }
}

/**
 * Get a context of a hidden canvas
 * @param {HTMLElement} visibleCanvas the corresponding visible canvas (used for specifying the size)
 * @param {boolean} [true] whether to clear the context
 * @param {number} [idx] the index of the canvas in GLOBAL_HIDDEN_CAN_ARR
 * @return {CanvasRenderingContext2D} the context of the canvas
 */
function getHiddenContext(visibleCanvas, clear = true, idx = 0) {
  const can = getHiddenCanvas(visibleCanvas, idx);
  const con = can.getContext('2d');
  if (clear) con.clearRect(0, 0, can.width, can.height);
  return con;
}

/**
 * Draw a hidden canvas onto another canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas to draw the hidden canvas on
 * @param {number} [idx] the index of the hidden canvas
 * @param {Function} [zoom] a function that applies a zoom and a translation to the context
 */
function drawHiddenCanvas(con, idx = 0, zoom) {
  if (typeof zoom === 'function') con.restore();
  con.drawImage(GLOBAL_HIDDEN_CAN_ARR[idx], 0, 0);
  if (typeof zoom === 'function') zoom(con);
}

/**
 * Change the opacity of a color
 * @param {string} color the color (format: rgba(255, 255, 255, 1))
 * @param {number|string} opacity the new opacity (a value between 0 and 1)
 * @return {string} the same color with the new opacity
 */
function transparentize(color, opacity) {
  return color.replace(/, \d+(\.\d+)?\)/, `, ${opacity})`);
}

/**
 * Mix two colors
 * @param {string} colorA the first color
 * @param {string} colorB the second color
 * @param {number} [fac] a number between 0 and 1 indicating how much of the first color should be present
 * in the mix
 * @param {boolean} [ignoreOpacity] if set to true, the resulting color will have the opacity of colorA,
 * regardless of the opacity of colorB
 * @return {string} the mixed color
 */
function mix(colorA, colorB, fac = 0.5, ignoreOpacity = false) {
  let cA = /^rgba\((\d+), ?(\d+), ?(\d+), ?(\d+(?:\.\d+)?)\)$/.exec(colorA).slice(1);
  let cB = /^rgba\((\d+), ?(\d+), ?(\d+), ?(\d+(?:\.\d+)?)\)$/.exec(colorB).slice(1);
  cA = cA.map(val => parseFloat(val));
  cB = cB.map(val => parseFloat(val));
  const res = [];
  for (let i=0; i<4; i++) {
    res[i] = fac * cA[i] + (1 - fac) * cB[i];
    if (i < 3) res[i] = Math.round(res[i]);
  }
  return `rgba(${res[0]}, ${res[1]}, ${res[2]}, ${ignoreOpacity ? cA[3] : res[3]})`;
}

/**
 * Darken a color
 * @param {string} color the color to darken
 * @param {number} [amount] the amount to darken the color by (0 = don't darken, 1 = convert to black)
 * @return {string} the darkened color
 */
function darken(color, amount = 0.5) {
  return mix(color, 'rgba(0, 0, 0, 1)', (1 - amount), true);
}

/**
 * Make a color lighter
 * @param {string} color the color to make lighter
 * @param {number} [amount] the amount to lighten the color by (0 = don't lighten, 1 = convert to white)
 * @return {string} the lightened color
 */
function lighten(color, amount = 0.5) {
  return mix(color, 'rgba(255, 255, 255, 1)', (1 - amount), true);
}
