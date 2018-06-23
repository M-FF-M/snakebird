
function gameTransitionTest() {
  for (let i=0; i<fallSamplesIn.length; i++) {
    let st = new GameState(fallSamplesIn[i]);
    st = gameTransition(st)[3];
    console.log(st.toString());
    console.log(st.internalToString());
  }
}
