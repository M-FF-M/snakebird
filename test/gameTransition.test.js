
function gameTransitionTest() {
  for (let i=0; i<fallSamplesIn.length; i++) {
    let st = new GameState(fallSamplesIn[i]);
    const res = gameTransition(st, null, []);
    assertStrictEqual(JSON.stringify(res.slice(0, 3)), methodRetVal[i]);
    st = res[3];
    if (i < fallSamplesExternal.length) {
      assertStrictEqual(st.toString(), fallSamplesExternal[i]);
      assertStrictEqual(st.internalToString(), fallSamplesInternal[i]);
    } else {
      console.warn(`Skipped test ${(i+1)} in gameTransition -- standard cases`);
      console.log(st.toString());
      console.log(st.internalToString());
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
}
