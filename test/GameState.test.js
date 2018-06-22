
function GameStateTest() {
  for (let i=0; i<stateSamples.length; i++) {
    assertStrictEqual((new GameState(stateSamples[i])).toString(), stateSamplesExternal[i]);
    assertStrictEqual((new GameState(stateSamples[i])).internalToString(), stateSamplesInternal[i]);
  }
}
