
const MAGIC_NUMBER_V0 = '3tFRIoTU';
const MAGIC_NUMBER = 'HyRr4JK1';

const SNAKEFALL_SPACE = 0;
const SNAKEFALL_WALL = 1;
const SNAKEFALL_SPIKE = 2;
const SNAKEFALL_FRUIT_V0 = 3;
const SNAKEFALL_EXIT = 4;
const SNAKEFALL_PORTAL = 5;
const VALID_TILE_CODES = [SNAKEFALL_SPACE, SNAKEFALL_WALL, SNAKEFALL_SPIKE, SNAKEFALL_EXIT, SNAKEFALL_PORTAL];

const SNAKEFALL_SNAKE = "s";
const SNAKEFALL_BLOCK = "b";
const SNAKEFALL_FRUIT = "f";

const TO_SNAKE_CHAR = ['R', 'G', 'B', 'N', 'D', 'O', 'A', 'F', 'U', 'C', 'E', 'H', 'I', 'J', 'K', 'L', 'M', 'P', 'Q', 'S', 'T'];
const TO_BLOCK_CHAR = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u'];

function parseSnakefallLevel(string) {
  string = string.replace(/^.*#level=/, '');

  let cursor = 0;
  const lines = [];

  const skipWhitespace = () => {
    while (' \n\t\r'.indexOf(string[cursor]) !== -1)
      cursor++;
  };

  const consumeKeyword = keyword => {
    skipWhitespace();
    if (string.indexOf(keyword, cursor) !== cursor) throw parserError('expected ' + JSON.stringify(keyword));
    cursor++;
  };

  const readInt = () => {
    skipWhitespace();
    let i;
    for (i=cursor; i<string.length; i++)
      if ('0123456789'.indexOf(string[i]) === -1) break;
    const substring = string.substring(cursor, i);
    if (substring.length === 0) throw parserError('expected int');
    cursor = i;
    return parseInt(substring, 10);
  };

  const readRun = () => {
    consumeKeyword('?');
    const endIndex = string.indexOf('/', cursor);
    const substring = string.substring(cursor, endIndex);
    cursor = endIndex + 1;
    return substring;
  };

  const parserError = message => {
    return new Error(`parse error at position ${cursor}: ${message}`);
  };

  const setStrVal = (x, y, val) => {
    lines[y] = `${lines[y].substring(0, x)}${val}${lines[y].substring(x + 1, lines[y].length)}`;
  };

  skipWhitespace();
  const versionTag = string.substr(cursor, MAGIC_NUMBER.length);
  switch (versionTag) {
    case MAGIC_NUMBER_V0:
    case MAGIC_NUMBER: break;
    default: throw new Error('not a snakefall level');
  }
  cursor += MAGIC_NUMBER.length;
  consumeKeyword('&');

  const level = {
    height: -1,
    width: -1,
    map: [],
    objects: [],
  };

  const lvlHeight = readInt();
  consumeKeyword('&');
  const lvlWidth = readInt();
  level.height = lvlHeight; level.width = lvlWidth;

  const mapData = decompressSerialization( readRun() );
  if (level.height * level.width !== mapData.length) throw parserError('height, width, and map.length do not jive');
  for (let i=0; i<lvlHeight; i++) {
    let lStr = '';
    for (let k=0; k<lvlWidth; k++) lStr += '.';
    lines.push(lStr);
  }

  let target = []; const portalPos = [];
  const upconvertedObjects = [];
  let fruitCount = 0;
  for (let i=0; i<mapData.length; i++) {
    let tileCode = mapData[i].charCodeAt(0) - '0'.charCodeAt(0);
    if (tileCode === SNAKEFALL_FRUIT_V0 && versionTag === MAGIC_NUMBER_V0) {
      upconvertedObjects.push({
        type: SNAKEFALL_FRUIT,
        id: fruitCount++,
        dead: false,
        locations: [i]
      });
      tileCode = SNAKEFALL_SPACE;
    }
    if (VALID_TILE_CODES.indexOf(tileCode) === -1) throw parserError('invalid tilecode: ' + JSON.stringify(mapData[i]));
    level.map.push(tileCode);
    switch (tileCode) {
      case SNAKEFALL_SPACE:
        setStrVal(i % lvlWidth, Math.floor(i / lvlWidth), '.');
        break;
      case SNAKEFALL_WALL:
        setStrVal(i % lvlWidth, Math.floor(i / lvlWidth), '#');
        break;
      case SNAKEFALL_SPIKE:
        setStrVal(i % lvlWidth, Math.floor(i / lvlWidth), '|');
        break;
      case SNAKEFALL_EXIT:
        if (target.length == 0) {
          setStrVal(i % lvlWidth, Math.floor(i / lvlWidth), 'X');
          target = [i % lvlWidth, Math.floor(i / lvlWidth)];
        }
        break;
      case SNAKEFALL_PORTAL:
        if (portalPos.length < 2) {
          setStrVal(i % lvlWidth, Math.floor(i / lvlWidth), '*');
          portalPos.push([i % lvlWidth, Math.floor(i / lvlWidth)]);
        }
        break;
    }
  }
  if (target.length == 0) target = [lvlWidth, lvlHeight];
  if (portalPos.length == 1) portalPos.push([lvlWidth, lvlHeight]);

  skipWhitespace();
  while (cursor < string.length) {
    const object = {
      type: '?',
      id: -1,
      dead: false,
      locations: []
    };

    object.type = string[cursor];
    let locationsLimit;
    if (object.type === SNAKEFALL_SNAKE) locationsLimit = -1;
    else if (object.type === SNAKEFALL_BLOCK) locationsLimit = -1;
    else if (object.type === SNAKEFALL_FRUIT) locationsLimit = 1;
    else throw parserError('expected object type code');
    cursor++;

    object.id = readInt();

    const locationsData = readRun();
    const locationStrings = locationsData.split('&');
    if (locationStrings.length === 0) throw parserError('locations must be non-empty');
    if (locationsLimit !== -1 && locationStrings.length > locationsLimit) throw parserError('too many locations');

    locationStrings.forEach(locationString => {
      const location = parseInt(locationString);
      if (!(0 <= location && location < level.map.length)) throw parserError('location out of bounds: ' + JSON.stringify(locationString));
      object.locations.push(location);
    });

    level.objects.push(object);
    skipWhitespace();
  }
  for (let i=0; i<upconvertedObjects.length; i++)
    level.objects.push(upconvertedObjects[i]);

  let snakeNum = 0; let blockNum = 0;
  for (let i=0; i<level.objects.length; i++) {
    const obj = level.objects[i];
    if (obj.type === SNAKEFALL_FRUIT) setStrVal(obj.locations[0] % lvlWidth, Math.floor(obj.locations[0] / lvlWidth), '@');
    else if (obj.type === SNAKEFALL_SNAKE) {
      const idx = snakeNum++;
      if (idx >= TO_SNAKE_CHAR.length) throw new Error('unfortunately, this version only supports a maximum of 21 snakebirds');
      let [lx, ly] = [obj.locations[0] % lvlWidth, Math.floor(obj.locations[0] / lvlWidth)];
      setStrVal(lx, ly, TO_SNAKE_CHAR[idx]);
      for (let k=1; k<obj.locations.length; k++) {
        const [x, y] = [obj.locations[k] % lvlWidth, Math.floor(obj.locations[k] / lvlWidth)];
        const diff = Math.abs(lx - x) + Math.abs(ly - y);
        if (diff != 1) throw new Error('snakebird was given in unexpected format');
        if (lx > x) setStrVal(x, y, '>');
        else if (lx < x) setStrVal(x, y, '<');
        else if (ly > y) setStrVal(x, y, 'v');
        else setStrVal(x, y, '^');
        [lx, ly] = [x, y];
      }
    } else if (obj.type === SNAKEFALL_BLOCK) {
      const idx = blockNum++;
      if (idx >= TO_BLOCK_CHAR.length) throw new Error('unfortunately, this version only supports a maximum of 21 blocks');
      for (let k=0; k<obj.locations.length; k++) 
        setStrVal(obj.locations[k] % lvlWidth, Math.floor(obj.locations[k] / lvlWidth), TO_BLOCK_CHAR[idx]);
    }
  }

  let wStr = 'not over';
  let portalStr = '';
  if (portalPos.length > 0) {
    portalStr += ` ${portalPos[0][0]} ${portalPos[0][1]}`;
    portalStr += ` ${portalPos[1][0]} ${portalPos[1][1]}`;
  }
  return `${lvlHeight} ${lvlWidth}\n${lines.join('\n')}\n`
    + `${target[0]} ${target[1]} ${wStr}${portalStr}`;
}

const BASE66 = '----0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function decompressSerialization(string) {
  string = string.replace(/\s+/g, '');
  let result = '';
  for (let i=0; i<string.length; i++) {
    if (string[i] === '*') {
      i++;
      const runLength = BASE66.indexOf(string[i]);
      i++;
      const char = string[i];
      for (let j=0; j<runLength; j++)
        result += char;
    } else result += string[i];
  }
  return result;
}

/**
 * A class for saving files on the user's disk
 */
class MFFileSaver {
  /**
   * Create a new MFFileSaver
   */
  constructor() {
    /**
     * The URL to the most recent saved file
     * @type {string}
     */
    this.fileURL = null;
  }
  
  /**
   * Get a link to a file
   * @param {string} content the file content
   * @param {string} filename the file name
   * @return {HTMLElement} a link element pointing to the file
   */
  getFileLink(content, filename) {
    const data = new Blob([content], { type: 'application/octet-stream', endings: 'native' });
    if (this.fileURL !== null) window.URL.revokeObjectURL(this.fileURL);
    this.fileURL = window.URL.createObjectURL(data);
    const linkElem = document.createElement('a');
    linkElem.setAttribute('href', this.fileURL);
    linkElem.setAttribute('download', filename);
    return linkElem;
  }

  /**
   * Save a file on the user's disk
   * @param {string} content the file content
   * @param {string} filename the file name
   */
  saveFile(content, filename) {
    const linkElem = this.getFileLink(content, filename);
    document.body.appendChild(linkElem);
    linkElem.click();
    document.body.removeChild(linkElem);
  }
}

/**
 * A class for reading files from the user's disk
 */
class MFFileReader {
  /**
   * Create a new MFFileReader
   */
  constructor() {
    /**
     * Callback that will be called when a file was loaded
     * @type {Function}
     */
    this.onload = () => {};
    /**
     * Callbacks that will be called when a file was loaded
     * @type {Function[]}
     */
    this.callOnLoad = [];
  }
 
  /**
   * Add an event listener
   * @param {string} type the type of the event listener.
   * Currently, only 'load' is supported. The listener will be called with an event object of
   * the following format: { message, description, name, filename, extension, content }
   * @param {Function} callF the callback to call when the event occurs
   */
  addEventListener(type, callF) {
    if (type == 'load')
      this.callOnLoad.push(callF);
  }
 
  /**
   * Add a file input whose files should be loaded
   * @param {HTMLElement} domElem the file input
   * @param {boolean} [readAsDataUrl] whether to read the file as a URL (useful for images)
   */
  addInput(domElem, readAsDataUrl = false) {
    let changeF;
    if (readAsDataUrl) {
      changeF = () => this.readFileUrl(domElem.files[0]);
    } else {
      changeF = () => this.readFile(domElem.files[0]);
    }
    domElem.addEventListener('change', changeF);
  }
 
  /**
   * Read the given file
   * @param {File} file the file to read
   */
  readFile(file) {
    if (typeof file === 'object') {
      const fReader = new FileReader();
      fReader.onload = () => this.openedFileLoaded(fReader.result, file.name);
      fReader.readAsText(file);
    }
  }
 
  /**
   * Read the given file as URL
   * @param {File} file the file to read
   */
  readFileUrl(file) {
    if (typeof file === 'object') {
      const fReader = new FileReader();
      fReader.onload = () => this.openedFileLoaded(fReader.result, file.name);
      fReader.readAsDataURL(file);
    }
  }
 
  /**
   * Should be called when the file content was loaded
   * @param {string} content the contents of the loaded file
   * @param {string} fname the file name
   */
  openedFileLoaded(content, fname) {
    const eventObj = {};
    eventObj.description = 'file has been read';
    eventObj.message = 'file has been read';
    eventObj.name = fname;
    const fileNameSplit = /^([^.]+)(?:(.*)\.([^.]+))?$/.exec(fname);
    eventObj.extension = fileNameSplit[3];
    if ((typeof eventObj.extension === 'string') && (eventObj.extension.length > 0))
      eventObj.extension = eventObj.extension.toLowerCase();
    else
      eventObj.extension = '';
    eventObj.filename = fileNameSplit[1];
    if (typeof fileNameSplit[2] === 'string') eventObj.filename += fileNameSplit[2];
    eventObj.content = content;
    this.onload(eventObj);
    for (let i=0; i<this.callOnLoad.length; i++)
      this.callOnLoad[i](eventObj);
  }
}

/**
 * Escape a string to be used as HTML source code
 * @param {string} txt_in the string to escape
 * @return {string} the escaped string
 */
function MFhtmlescape(txt_in) {
  txt_in = txt_in.replace(new RegExp(/&/g), '&amp;');
  txt_in = txt_in.replace(new RegExp(/</g), '&lt;');
  txt_in = txt_in.replace(new RegExp(/>/g), '&gt;');
  txt_in = txt_in.replace(new RegExp(/"/g), '&quot;');
  txt_in = txt_in.replace(new RegExp(/ /g), '&nbsp;');
  txt_in = txt_in.replace(new RegExp(/\t/g), '&nbsp;&nbsp;&nbsp;&nbsp;');
  txt_in = txt_in.replace(new RegExp(/\r\n/g), '<br />');
  txt_in = txt_in.replace(new RegExp(/\n/g), '<br />');
  return txt_in;
}


/**
 * A class for simplifying drag and drop file selection
 */
class MFDragDrop {
  /**
   * Create a new MFDragDrop object
   * @param {HTMLElement} domElem the drag and drop target
   * @param {boolean} [readAsDataUrl] whether to read the file as a URL (useful for images)
   */
  constructor(domElem, readAsDataUrl = false) {
    /**
     * The drag and drop target
     * @type {HTMLElement}
     */
    this.domElem = domElem;
    /**
     * The inner div
     * @type {HTMLElement}
     */
    this.innerDiv = document.createElement('div');
    this.innerDiv.innerHTML = 'Drop files here';
    this.domElem.appendChild(this.innerDiv);
    this.innerDiv.addEventListener('drop', event => this.drop(event));
    this.innerDiv.addEventListener('dragover', event => this.dragOver(event));
    this.innerDiv.addEventListener('dragenter', event => this.dragEnter(event));
    this.innerDiv.addEventListener('dragleave', event => this.dragLeave(event));
    /**
     * Reads a given file
     * @type {Function}
     */
    this.readFile = () => {};
    if (readAsDataUrl)
      this.readFile = file => this.readFileAsDataUrl(file);
    else
      this.readFile = file => this.readFileAsText(file);
    /**
     * The file reade
     * @type {MFFileReader}
     */
    this.fReader = new MFFileReader();
    this.fReader.addEventListener('load', event => this.fileLoaded(event));
    /**
     * Callback that will be called when a file was loaded
     * @type {Function}
     */
    this.onload = () => {};
    /**
     * Callbacks that will be called when a file was loaded
     * @type {Function[]}
     */
    this.callOnLoad = [];
  }
 
  /**
   * Add an event listener
   * @param {string} type the type of the event listener.
   * Currently, only 'load' is supported. The listener will be called with an event object of
   * the following format: { message, description, name, filename, extension, content }
   * @param {Function} callF the callback to call when the event occurs
   */
  addEventListener(type, callF) {
    if (type == 'load')
      this.callOnLoad.push(callF);
  }
 
  /**
   * Should be called when a drop event occurred
   * @param {object} event the event object
   */
  drop(event) {
    event.preventDefault();
    this.dragLeave( {} );
    if (event.dataTransfer.files.length > 0)
      this.readFile(event.dataTransfer.files[0]);
    this._removeHover();
  }
 
  /**
   * Read file as plain text
   * @param {File} file the file to read
   */
  readFileAsText(file) {
    this.fReader.readFile(file);
  }
 
  /**
   * Read file as data URL
   * @param {File} file the file to read
   */
  readFileAsDataUrl(file) {
    this.fReader.readFileUrl(file);
  }
 
  /**
   * Should be called when a file was loaded
   * @param {object} event the event object
   */
  fileLoaded(event) {
    this.onload(event);
    for (let i=0; i<this.callOnLoad.length; i++)
      this.callOnLoad[i](event);
  }

  /**
   * Should be called when a drag over event occurred
   * @param {object} event the event object
   */
  dragOver(event) {
    event.preventDefault();
  }
 
  /**
   * Should be called when a drag enter event occurred
   * @param {object} event the event object
   */
  dragEnter(event) {
    this._addHover();
  }
 
  /**
   * Should be called when a drag leave event occurred
   * @param {object} event the event object
   */
  dragLeave(event) {
    this._removeHover();
  }

  _addHover() {
    let classVar = this.domElem.getAttribute('class');
    if (typeof classVar !== 'string') classVar = '';
    if (classVar.search(new RegExp(/mf-drag-drop-hover/)) == -1) {
      if (classVar == '') classVar = 'mf-drag-drop-hover';
      else classVar += ' mf-drag-drop-hover';
      this.domElem.setAttribute('class', classVar);
    }
  }

  _removeHover() {
    let classVar = this.domElem.getAttribute('class');
    if (typeof classVar !== 'string') classVar = '';
    if (classVar.search(new RegExp(/mf-drag-drop-hover/)) != -1) {
      classVar = classVar.replace(new RegExp(/(?:^| )mf-drag-drop-hover(?= |$)/), '');
      this.domElem.setAttribute('class', classVar);
    }
  }
}

/**
 * Another class for simplifying drag and drop file selection
 */
class MFFileSelector {
  /**
   * Create a new MFFileSelector object
   * @param {HTMLElement} parentElem the parent element of the drag and drop target
   * @param {boolean} [readAsDataUrl] whether to read the file as a URL (useful for images)
   */
  constructor(parentElem, readAsDataUrl = false) {
    /**
     * The parent element
     * @type {HTMLElement}
     */
    this.parentElem = parentElem;
    /**
     * The current file name
     * @type {string}
     */
    this.cFileName = '';
    /**
     * The current file content
     * @type {string}
     */
    this.cFileContent = '';
    /**
     * A random ID
     * @type {number}
     */
    this.randVar = Math.round(Math.random()*10000);
    /**
     * The main container
     * @type {HTMLElement}
     */
    this.overallContainer = document.createElement('div');
    this.overallContainer.setAttribute('class', 'mf-file-selector-container');
    /**
     * The inner container
     * @type {HTMLElement}
     */
    this.container = document.createElement('div');
    this.container.setAttribute('class', 'mf-file-selector');
    /**
     * The head container
     * @type {HTMLElement}
     */
    this.head = document.createElement('div');
    this.head.setAttribute('class', 'mf-file-selector-head');
    this.head.innerHTML = 'Select a file';
    /**
     * The drag and drop target
     * @type {HTMLElement}
     */
    this.ddTarget = document.createElement('div');
    this.ddTarget.setAttribute('class', 'mf-drag-drop');
    /**
     * The file input
     * @type {HTMLElement}
     */
    this.fUpload = document.createElement('input');
    this.fUpload.setAttribute('type', 'file');
    this.fUpload.setAttribute('id', `mf-file-selector-${this.randVar}`);
    this.fUpload.style.display = 'none';
    /**
     * The file input label
     * @type {HTMLElement}
     */
    this.fUploadLabel = document.createElement('label');
    this.fUploadLabel.setAttribute('for', `mf-file-selector-${this.randVar}`);
    this.fUploadLabel.innerHTML = 'Browse&hellip;';
    /**
     * The file name span
     * @type {HTMLElement}
     */
    this.fileNameSpan = document.createElement('span');
    this.fileNameSpan.innerHTML = 'No file selected';
    this.container.appendChild(this.ddTarget);
    this.container.appendChild(this.fUpload);
    this.container.appendChild(this.fUploadLabel);
    this.container.appendChild(this.fileNameSpan);
    this.overallContainer.appendChild(this.head);
    this.overallContainer.appendChild(this.container);
    this.parentElem.appendChild(this.overallContainer);
    /**
     * The drag and drop object
     * @type {MFDragDrop}
     */
    this.ddObj = new MFDragDrop(this.ddTarget, readAsDataUrl);
    this.ddObj.addEventListener('load', event => this.fileLoaded(event));
    /**
     * The file reader
     * @type {MFFileReader}
     */
    this.fReader = new MFFileReader();
    this.fReader.addEventListener('load', event => this.fileLoaded(event));
    this.fReader.addInput(this.fUpload, readAsDataUrl);
    /**
     * Callback that will be called when a file was loaded
     * @type {Function}
     */
    this.onload = () => {};
    /**
     * Callbacks that will be called when a file was loaded
     * @type {Function[]}
     */
    this.callOnLoad = [];
  }
 
  /**
   * Add an event listener
   * @param {string} type the type of the event listener.
   * Currently, only 'load' is supported. The listener will be called with an event object of
   * the following format: { message, description, name, filename, extension, content }
   * @param {Function} callF the callback to call when the event occurs
   */
  addEventListener(type, callF) {
    if (type == 'load')
      this.callOnLoad.push(callF);
  }
 
  /**
   * Should be called when a file was loaded
   * @param {object} event the event object
   */
  fileLoaded(event) {
    if ((typeof event.content === 'string') && (event.content.length > 0)) {
      if ((typeof event.name === 'string') && (event.name.length > 0))
        { this.cFileName = event.name; this.fileNameSpan.innerHTML = 'File: ' + MFhtmlescape(this.cFileName); }
      else
        { this.cFileName = ''; this.fileNameSpan.innerHTML = 'File selected'; }
      this.cFileContent = event.content;
    }
    this.onload(event);
    for (let i=0; i<this.callOnLoad.length; i++)
      this.callOnLoad[i](event);
  }
}
