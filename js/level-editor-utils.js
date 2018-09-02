
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
