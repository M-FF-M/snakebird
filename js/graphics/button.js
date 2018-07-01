
/**
 * Draws a button on the given canvas
 * @param {CanvasRenderingContext2D} con the context of the canvas the button should be drawn on
 * @param {number} x the x coordinate of the center of the button
 * @param {number} y the y coordinate of the center of the button
 * @param {number} height the height of the button
 * @param {string} color the background color of the button
 * @param {string} shadowColor the shadow color of the button
 * @param {string} text the text to display on the button
 * @param {string} [textColor] the text color of the button
 * @return {number[]} an array containing the dimensions of the button: [x, y, width, height]
 */
function drawButton(con, x, y, height, color, shadowColor, text, textColor = 'rgba(255, 255, 255, 1)') {
  con.font = `${Math.ceil(height * 0.75)}px \'Fredoka One\'`;
  con.textAlign = 'center';
  con.textBaseline = 'middle';
  const width = con.measureText(text).width + height;
  const shadowOffset = height / 10;
  const textShadowOffset = shadowOffset / 2;

  con.fillStyle = shadowColor; // shadow
  con.beginPath();
  con.moveTo(x - width / 2 + height / 4, y - height / 2 + shadowOffset);
  con.lineTo(x + width / 2 - height / 4, y - height / 2 + shadowOffset);
  con.arc(x + width / 2 - height / 4, y - height / 4 + shadowOffset, height / 4, 1.5 * Math.PI, 2 * Math.PI);
  con.lineTo(x + width / 2, y + height / 4 + shadowOffset);
  con.arc(x + width / 2 - height / 4, y + height / 4 + shadowOffset, height / 4, 0, 0.5 * Math.PI);
  con.lineTo(x - width / 2 + height / 4, y + height / 2 + shadowOffset);
  con.arc(x - width / 2 + height / 4, y + height / 4 + shadowOffset, height / 4, 0.5 * Math.PI, Math.PI);
  con.lineTo(x - width / 2, y - height / 4 + shadowOffset);
  con.arc(x - width / 2 + height / 4, y - height / 4 + shadowOffset, height / 4, Math.PI, 1.5 * Math.PI);
  con.closePath();
  con.fill();

  con.fillStyle = color; // main background
  con.beginPath();
  con.moveTo(x - width / 2 + height / 4, y - height / 2);
  con.lineTo(x + width / 2 - height / 4, y - height / 2);
  con.arc(x + width / 2 - height / 4, y - height / 4, height / 4, 1.5 * Math.PI, 2 * Math.PI);
  con.lineTo(x + width / 2, y + height / 4);
  con.arc(x + width / 2 - height / 4, y + height / 4, height / 4, 0, 0.5 * Math.PI);
  con.lineTo(x - width / 2 + height / 4, y + height / 2);
  con.arc(x - width / 2 + height / 4, y + height / 4, height / 4, 0.5 * Math.PI, Math.PI);
  con.lineTo(x - width / 2, y - height / 4);
  con.arc(x - width / 2 + height / 4, y - height / 4, height / 4, Math.PI, 1.5 * Math.PI);
  con.closePath();
  con.fill();

  con.fillStyle = shadowColor; // text shadow
  con.fillText(text, x, y + height / 16 + textShadowOffset);

  con.fillStyle = textColor; // main text
  con.fillText(text, x, y + height / 16);

  return [x - width / 2, y - height / 2, width, height];
}
