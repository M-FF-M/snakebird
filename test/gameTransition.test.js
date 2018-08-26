
function gameTransitionTest() {
  for (let i=0; i<fallSamplesIn.length; i++) {
    let st = new GameState(fallSamplesIn[i]);
    const numSn = st.snakes.length;
    const res = gameTransition(st, null, []);
    st = res[3];
    if (i < fallSamplesExternal.length) {
      assertStrictEqual(JSON.stringify(res.slice(0, 3)), methodRetVal[i]);
      assertStrictEqual(JSON.stringify(convertToFullArray(res[2], numSn)), fullArrRetVal[i]);
      assertStrictEqual(st.toString(), fallSamplesExternal[i]);
      assertStrictEqual(st.internalToString(), fallSamplesInternal[i]);
    } else {
      console.warn(`Skipped test ${(i+1)} in gameTransition -- standard cases`);
      console.log(st.toString());
      console.log(st.internalToString());
      console.log(JSON.stringify(res.slice(0, 3)));
      console.log(JSON.stringify(convertToFullArray(res[2], numSn)));
    }
  }

  // modify gravity, wrap porperty
  const grav_opts = [LEFT, RIGHT, UP, DOWN];
  const grav_text = ['left', 'right', 'up', 'down'];
  const wrap_opts = [false, true];
  const wrap_text = ['don\'t wrap', 'wrap'];
  for (let i=0; i<specialFallSamplesIn.length; i++) {
    for (let k=0; k<grav_opts.length; k++) {
      for (let q=0; q<wrap_opts.length; q++) {
        let st = new GameState(specialFallSamplesIn[i]);
        const res = gameTransition(st, null, [], wrap_opts[q], grav_opts[k]);
        st = res[3];
        if (i < specialSamplesExternal.length && k < specialSamplesExternal[i].length
            && q < specialSamplesExternal[i][k].length) {
          assertStrictEqual(st.toString(), specialSamplesExternal[i][k][q]);
          assertStrictEqual(st.internalToString(), specialSamplesInternal[i][k][q]);
          assertStrictEqual(JSON.stringify(res.slice(0, 3)), specialSamplesRetVal[i][k][q]);
        } else {
          console.warn(`Skipped test ${(i+1)}.${(k+1)}.${(q+1)} in gameTransition -- special cases`);
          console.log(`gravity: ${grav_text[k]}, wrap: ${wrap_text[q]}`);
          console.log(st.toString());
          console.log(st.internalToString());
        }
      }
    }
  }

  // test moving around
  let state, result, moves;
  moves = [
    [['G', LEFT], ['G', LEFT], ['G', LEFT]],
    [['G', LEFT], ['G', LEFT]],
    [['R', RIGHT], ['R', RIGHT], ['R', UP], ['R', LEFT], ['R', UP], ['R', UP]],
    [['B', UP], ['B', RIGHT], ['B', RIGHT]],
    [['B', UP], ['B', RIGHT], ['B', RIGHT], ['B', DOWN], ['B', RIGHT], ['B', RIGHT]],
    [['R', RIGHT], ['R', RIGHT]],
    [['R', RIGHT], ['R', RIGHT]]
  ];
  for (let k=0; k<moves.length; k++) {
    state = new GameState(stateSamples[k]);
    for (let i=0; i<moves[k].length; i++) {
      result = gameTransition(state, moves[k][i][0], moves[k][i][1]);
      state = result[3];
      if (k < stdMoveSamplesExternal.length && i < stdMoveSamplesExternal[k].length) {
        assertStrictEqual(state.toString(), stdMoveSamplesExternal[k][i]);
        assertStrictEqual(state.internalToString(), stdMoveSamplesInternal[k][i]);
        assertStrictEqual(JSON.stringify(result.slice(0, 3)), stdMoveSamplesRetVal[k][i]);
      } else {
        console.warn(`Skipped test ${(k+1)}.${(i+1)} in gameTransition -- standard move tests`);
        console.log(state.toString());
        console.log(state.internalToString());
      }
    }
  }

  moves = [
    [['R', RIGHT], ['R', RIGHT], ['R', DOWN], ['R', RIGHT], ['R', RIGHT]],
    [['R', LEFT], ['R', LEFT]],
    [['R', UP], ['R', UP]],
    [['R', RIGHT], ['R', UP], ['R', UP], ['R', UP]],
    [['R', RIGHT], ['R', RIGHT]]
  ];
  for (let k=0; k<moves.length; k++) {
    state = new GameState(moveSamplesIn[k]);
    for (let i=0; i<moves[k].length; i++) {
      result = gameTransition(state, moves[k][i][0], moves[k][i][1]);
      state = result[3];
      if (k < specialMoveSamplesExternal.length && i < specialMoveSamplesExternal[k].length) {
        assertStrictEqual(state.toString(), specialMoveSamplesExternal[k][i]);
        assertStrictEqual(state.internalToString(), specialMoveSamplesInternal[k][i]);
        assertStrictEqual(JSON.stringify(result.slice(0, 3)), specialMoveSamplesRetVal[k][i]);
      } else {
        console.warn(`Skipped test ${(k+1)}.${(i+1)} in gameTransition -- special move tests`);
        console.log(state.toString());
        console.log(state.internalToString());
        console.log(JSON.stringify(result.slice(0, 3)));
      }
    }
  }

  state = new GameState(specialBlockingMoveSamples[0]);
  result = gameTransition(state, 'R', LEFT, false, DOWN, true, false, { allowMovingWithoutSpace: true });
  state = result[3];
  assertStrictEqual(state.toString(), specialBlockingMoveSamplesSol[0][0]);
  assertStrictEqual(state.internalToString(), specialBlockingMoveSamplesSol[0][1]);
  assertStrictEqual(JSON.stringify(result.slice(0, 3)), specialBlockingMoveSamplesSol[0][2]);

  result = gameTransition(state, 'R', LEFT);
  assertStrictEqual(result, null);

  state = new GameState(specialBlockingMoveSamples[1]);
  result = gameTransition(state, 'R', RIGHT, false, DOWN, true, false, { allowMovingWithoutSpace: true });
  assertStrictEqual(result, null);

  result = gameTransition(state, 'R', RIGHT);
  assertStrictEqual(result, null);

  state = new GameState(specialBlockingMoveSamples[2]);
  result = gameTransition(state, 'R', RIGHT, false, DOWN, true, false, { allowMovingWithoutSpace: true });
  state = result[3];
  assertStrictEqual(state.toString(), specialBlockingMoveSamplesSol[1][0]);
  assertStrictEqual(state.internalToString(), specialBlockingMoveSamplesSol[1][1]);
  assertStrictEqual(JSON.stringify(result.slice(0, 3)), specialBlockingMoveSamplesSol[1][2]);

  result = gameTransition(state, 'R', RIGHT);
  assertStrictEqual(result, null);

  /*moves = [
    [['R', RIGHT], ['R', RIGHT], ['R', DOWN], ['R', RIGHT], ['R', RIGHT]],
    [['R', LEFT], ['R', LEFT]],
    [['R', UP], ['R', UP]],
    [['R', RIGHT], ['R', UP], ['R', UP], ['R', UP]],
    [['R', RIGHT], ['R', RIGHT]]
  ];
  let resStrA = '[';
  let resStrB = '[';
  let resStrC = '[';
  for (let k=0; k<moves.length; k++) {
    resStrA += '\n\n[';
    resStrB += '\n\n[';
    resStrC += '\n\n[';
    state = new GameState(moveSamplesIn[k]);
    for (let i=0; i<moves[k].length; i++) {
      result = gameTransition(state, moves[k][i][0], moves[k][i][1]);
      state = result[3];
      if (k < specialMoveSamplesExternal.length && i < specialMoveSamplesExternal[k].length) {
        assertStrictEqual(state.toString(), specialMoveSamplesExternal[k][i]);
        assertStrictEqual(state.internalToString(), specialMoveSamplesInternal[k][i]);
        assertStrictEqual(JSON.stringify(result.slice(0, 3)), specialMoveSamplesRetVal[k][i]);
      } else {
        console.warn(`Skipped test ${(k+1)}.${(i+1)} in gameTransition -- standard move tests`);
        console.log(state.toString());
        console.log(state.internalToString());
        console.log(JSON.stringify(result.slice(0, 3)));
      }
      let comAdd1 = ''; if (i < moves[k].length - 1) comAdd1 = ',\n';
      resStrA += `\n\`${state.toString()}\`` + comAdd1;
      resStrB += `\n\`${state.internalToString()}\`` + comAdd1;
      resStrC += `\n'${JSON.stringify(result.slice(0, 3))}'` + comAdd1.substring(0, 1);
    }
    let comAdd2 = ''; if (k < moves.length - 1) comAdd2 = ',';
    resStrA += '\n]' + comAdd2;
    resStrB += '\n]' + comAdd2;
    resStrC += '\n]' + comAdd2;
  }
  resStrA += '\n\n];';
  resStrB += '\n\n];';
  resStrC += '\n\n];';
  console.log(resStrA);
  console.log(resStrB);
  console.log(resStrC);*/
}
