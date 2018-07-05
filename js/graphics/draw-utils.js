
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
