
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

/**
 * Draw text with a border, animate its appearance
 * @param {CanvasRenderingContext2D} con the context of the canvas the text should be drawn on
 * @param {string} text the string to draw
 * @param {number} x the x coordinate
 * @param {number} y the y coordinate
 * @param {string} textColor the text color
 * @param {string} borderColor the border color
 * @param {number} fontSize the font size
 * @param {string} font the font
 * @param {number} aniProgr a number between 0 and 1 indicating the appearance progress
 */
function borderedTextAppear(con, text, x, y, textColor, borderColor, fontSize, font, aniProgr) {
  const cNum = text.length;
  const cChar = Math.floor(aniProgr * cNum);
  const cCharProgr = aniProgr * cNum - cChar;
  
  con.font = `${Math.ceil(fontSize)}px ${font}`;
  con.textAlign = 'center';
  con.textBaseline = 'middle';
  let width = fontSize * 0.2;

  if (aniProgr == 1) {
    con.lineWidth = Math.ceil(width);
    con.strokeStyle = borderColor; // text border
    con.strokeText(text, x, y);
  
    con.fillStyle = textColor; // main text
    con.fillText(text, x, y);
  } else {
    const fullTxtWidth = con.measureText(text).width;
    let appearedWidth = con.measureText(text.substr(0, cChar)).width;
    const appearedWidthWC = con.measureText(text.substr(0, cChar + 1)).width;
    const charWidth = con.measureText(text[cChar]).width;
    
    if (cChar > 0) {
      con.lineWidth = Math.ceil(width);
      con.strokeStyle = borderColor; // text border
      con.strokeText(text.substr(0, cChar), x - (fullTxtWidth - appearedWidth) / 2, y);
    
      con.fillStyle = textColor; // main text
      con.fillText(text.substr(0, cChar), x - (fullTxtWidth - appearedWidth) / 2, y);
    } else appearedWidth = 0;
    if (cChar == text.length - 1) remainingWidth = 0;
    const lCharWidth = appearedWidthWC - appearedWidth;
    const widthDiff = charWidth - lCharWidth;
    const moveDiff = lCharWidth / 2 - widthDiff / 2;
    
    con.font = `${Math.ceil(fontSize * cCharProgr)}px ${font}`;
    width = fontSize * 0.2 * cCharProgr;
    
    con.lineWidth = Math.ceil(width);
    con.strokeStyle = borderColor; // text border
    con.strokeText(text[cChar], x - fullTxtWidth / 2 + appearedWidth + moveDiff, y);
  
    con.fillStyle = textColor; // main text
    con.fillText(text[cChar], x - fullTxtWidth / 2 + appearedWidth + moveDiff, y);
  }
}
