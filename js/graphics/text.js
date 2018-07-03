
/**
 * Draw text with a shadow
 * @param {CanvasRenderingContext2D} con the context of the canvas the text should be drawn on
 * @param {string} text the string to draw
 * @param {number} x the x coordinate
 * @param {number} y the y coordinate
 * @param {string} textColor the text color
 * @param {string} shadowColor the shadow color
 * @param {number} offset the y offset of the shadow
 */
function textWithShadow(con, text, x, y, textColor, shadowColor, offset) {
  con.fillStyle = shadowColor; // text shadow
  con.fillText(text, x, y + offset);

  con.fillStyle = textColor; // main text
  con.fillText(text, x, y);
}

/**
 * Draw text with a border
 * @param {CanvasRenderingContext2D} con the context of the canvas the text should be drawn on
 * @param {string} text the string to draw
 * @param {number} x the x coordinate
 * @param {number} y the y coordinate
 * @param {string} textColor the text color
 * @param {string} borderColor the border color
 * @param {number} width the width of the border
 */
function borderedText(con, text, x, y, textColor, borderColor, width) {
  width *= 2;
  con.lineWidth = Math.ceil(width);
  con.strokeStyle = borderColor; // text border
  con.strokeText(text, x, y);

  con.fillStyle = textColor; // main text
  con.fillText(text, x, y);
}
