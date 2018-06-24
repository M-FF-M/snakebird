
function GameSolverTest() {
  for (let i=0; i<8; i++) {
    const gs = new GameSolver(new GameState(stateSamples[i]));
    const res = gs.solve(false, DOWN, 1000);
    assertStrictEqual(stdSolutions[i][0], res[0]);
    if (res[0] == FOUND_SOLUTION)
      assertStrictEqual(stdSolutions[i][1], res[3]);
  }
}
