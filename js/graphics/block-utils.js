
/**
 * Calculate information that is necessary for drawing a block
 * @param {Queue} partQ the queue containing the parts of the block
 * @return {object}
 */
function calculateGraphicsInfo(partQ) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  
  let centrX = 0, centrY = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i=0; i<partQ.length; i++) { // caculate centroid and borders
    const [cx, cy] = partQ.get(i);
    centrX += cx; centrY += cy;
    if (cx < minX) minX = cx;
    if (cy < minY) minY = cy;
    if (cx > maxX) maxX = cx;
    if (cy > maxY) maxY = cy;
  }
  centrX /= partQ.length; centrY /= partQ.length; const [wi, he] = [maxX - minX + 1, maxY - minY + 1];
  centrX = Math.round(centrX); centrY = Math.round(centrY);
  const blockArr = []; // blockArr contains EMPTY or BLOCK(0) (depending on whether there is a block at a specific position)
  const compArr = []; // compArr contains -1 or the 0-indexed number of the connected component this block part belongs to
  const retArr = []; // contains 0 for nothing, 1 for foreground block, 2 for background connection
  for (let i=0; i<wi; i++) {
    blockArr[i] = []; compArr[i] = []; retArr[i] = [];
    for (let k=0; k<he; k++) {
      blockArr[i][k] = EMPTY;
      compArr[i][k] = -1;
      retArr[i][k] = 0;
    }
  }
  const fCoord = partQ.get(0);
  const origToBlock = (x, y) => { // converts original coordinates into coordinates in the compArr and blockArr arrays
    return [x - minX, y - minY];
  };
  const blockToArrCoords = (x, y) => { // converts coordinates given relative to the first position in the block part queue into array coordinates
    return origToBlock(x + fCoord[0], y + fCoord[1]);
  };
  const arrToBlockCoords = (x, y) => { // converts array coordinates to block coordinates relative to the first position in the block part queue
    return [minX + x - fCoord[0], minY + y - fCoord[1]];
  };
  const getVal = (x, y) => { // returns the value at a given position in blockArr or EMPTY if the indices are out of bounds
    if (x < 0 || y < 0 || x >= wi || y >= he) return EMPTY;
    return blockArr[x][y];
  };
  const [nCentrX, nCentrY] = origToBlock(centrX, centrY); // centroid in new coordinate system

  for (let i=0; i<partQ.length; i++) { // initialize blockArr with block positions
    const [cx, cy] = origToBlock(...partQ.get(i));
    blockArr[cx][cy] = BLOCK(0);
    retArr[cx][cy] = 1;
  }
  let partNum = 0; const partsArr = []; // partsArr is an array of arrays that contain the coordinates of blocks that are in the same component
  for (let i=0; i<partQ.length; i++) { // initialize partsArr and compArr by determination of the connected components
    const [cx, cy] = origToBlock(...partQ.get(i));
    if (compArr[cx][cy] == -1) { // this block is not part of a component yet
      const cPart = partNum++;
      partsArr[cPart] = []; // initialize partsArr
      compArr[cx][cy] = cPart; partsArr[cPart].push([cx, cy]); // save CC status of this block
      const bf = new Queue(); bf.pushBack([cx, cy]); // search queue
      while (!bf.isEmpty()) {
        const [nx, ny] = bf.popFront();
        for (let k=0; k<dirs.length; k++) { // check for other blocks in all four directions
          const [nnx, nny] = [nx + dirs[k][0], ny + dirs[k][1]];
          if (getVal(nnx, nny) != EMPTY && compArr[nnx][nny] == -1) { // if there is a block that is not yet part of the current CC
            compArr[nnx][nny] = cPart; partsArr[cPart].push([nnx, nny]); // save CC status of this block
            bf.pushBack([nnx, nny]); // insert into search queue
          }
        }
      }
    }
  }

  const distArr = []; const pArr = [];
  const resetDistArr = () => {
    for (let i=0; i<wi; i++) {
      distArr[i] = []; pArr[i] = [];
      for (let k=0; k<he; k++) {
        distArr[i][k] = [Infinity, Infinity]; // [Manhattan distance, centroid value]
        pArr[i][k] = [-1, -1]; // parent array with x and y coordinate of parent
      }
    }
  };
  const sPaths = []; // sPaths[i][k] = shortest path from CC i to CC k
  const mstDist = []; // minimum spanning tree distance
  for (let i=0; i<partsArr.length; i++) {
    sPaths[i] = [];
    mstDist[i] = [Infinity, Infinity]; // [Manhattan distance, centroid value]
    for (let k=0; k<partsArr.length; k++) sPaths[i][k] = [Infinity, [-1, -1], Infinity];
    // [distance, end point, centroid value]
  }
  for (let i=0; i<partsArr.length; i++) {
    resetDistArr(); // reset distance array
    const bfs = new Queue(); // BFS queue
    for (let k=0; k<partsArr[i].length; k++) bfs.pushBack([partsArr[i][k], 0, 0]); // insert CC blocks
    while (!bfs.isEmpty()) {
      const c = bfs.popFront();
      const [nx, ny] = c[0]; // current position
      const nDist = c[1] + 1; // new distance = old distance + 1
      for (let k=0; k<dirs.length; k++) { // check all four directions
        const [nnx, nny] = [nx + dirs[k][0], ny + dirs[k][1]]; // new position
        if (nnx >= 0 && nny >= 0 && nnx < wi && nny < he && compArr[nnx][nny] != i) {
          let cVal = Math.abs(nnx - nCentrX) + Math.abs(nny - nCentrY); // centroid value of new position
          if (compArr[nnx][nny] != -1) cVal = 0; // set to 0 if end point was reached
          const nVal = c[2] + cVal; // new centroid value
          if (nDist < distArr[nnx][nny][0]
              || (nDist == distArr[nnx][nny][0] && nVal < distArr[nnx][nny][1])) { // found better path
            distArr[nnx][nny][0] = nDist; // update distArr
            distArr[nnx][nny][1] = nVal;
            pArr[nnx][nny] = [nx, ny]; // update pArr
            if (compArr[nnx][nny] != -1) { // if an endpoint was reached (another component)
              const idx = compArr[nnx][nny];
              if (nDist < sPaths[i][idx][0]
                  || (nDist == sPaths[i][idx][0] && nVal < sPaths[i][idx][2]))
                sPaths[i][idx] = [nDist, [nnx, nny], nVal]; // save new shortest path
            } else {
              bfs.pushBack([[nnx, nny], nDist, nVal]); // add to BFS queue
            }
          }
        }
      }
    }
    // calculate actual path
    for (let k=0; k<partsArr.length; k++) {
      if (k == i) {
        sPaths[i][k][0] = Infinity;
        sPaths[i][k][1] = [];
        continue;
      }
      const sPathCs = []; let cc = sPaths[i][k][1]; // cc = current block position
      while (cc[0] >= 0 && cc[1] >= 0) {
        cc = pArr[cc[0]][cc[1]];
        if (compArr[cc[0]][cc[1]] != i) sPathCs.push([cc[0], cc[1]]);
        else break;
      }
      sPaths[i][k][1] = sPathCs; // save actual path in sPaths array
    }
  }
  const pq = new PriorityQueue((a, b) => {
    if (a[0][0] != b[0][0]) return a[0][0] - b[0][0];
    if (a[0][1] != b[0][1]) return a[0][1] - b[0][1];
    if (a[1][0] != b[1][0]) return a[1][0] - b[1][0];
    if (a[1][1] != b[1][1]) return a[1][1] - b[1][1];
    return 0;
  }); // comparison function: first compare distances, then centroid values, then source component, then destination component
  mstDist[0] = [0, 0]; // component 0 is already completed
  for (let k=0; k<partsArr.length; k++) {
    if (sPaths[0][k][0] == Infinity) continue;
    pq.insert([[sPaths[0][k][0], sPaths[0][k][2]], [0, k]]);
    mstDist[k] = [sPaths[0][k][0], sPaths[0][k][2]];
  }
  while (!pq.isEmpty()) {
    const c = pq.deleteMin();
    const node = c[1][1];
    if (mstDist[node][0] == c[0][0] && mstDist[node][1] == c[0][1]) { // this is an actual edge to insert into the MST
      const path = sPaths[c[1][0]][c[1][1]][1];
      for (let i=0; i<path.length; i++)
        retArr[path[i][0]][path[i][1]] = 2;
      for (let i=0; i<partsArr.length; i++) {
        const nDist = sPaths[node][i][0]; const nVal = sPaths[node][i][2]; // check whether new shortest edge was found
        if (nDist != Infinity && (nDist < mstDist[i][0] || (nDist == mstDist[i][0] && nVal < mstDist[i][1]))) {
          mstDist[i][0] = nDist; mstDist[i][1] = nVal; // update mstDist array
          pq.insert([[nDist, nVal], [node, i]]); // insert into priotity queue
        }
      }
    }
  }

  return {
    blockToArrCoords,
    arrToBlockCoords,
    info: retArr
  };
}
