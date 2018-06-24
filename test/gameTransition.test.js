
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
      console.warn(`Skipped test ${(i+1)} in gameTransition`);
      console.log(st.toString());
      console.log(st.internalToString());
    }
  }
}
