
/**
 * Indicates movement to the left
 * @type {number[]}
 */
const LEFT = [-1, 0];
/**
 * Indicates movement to the right
 * @type {number[]}
 */
const RIGHT = [1, 0];
/**
 * Indicates upward movement
 * @type {number[]}
 */
const UP = [0, -1];
/**
 * Indicates downward movement
 * @type {number[]}
 */
const DOWN = [0, 1];

/**
 * Calculate the transition from one game state to another when one snake is moved in a specific
 * direction
 * @param {GameState} gameState the original game state
 * @param {string|number} snake the snake to move. Can either be the character or the number
 * corresponding to the snake.
 * @param {number[]} direction the direction of the snake movement  (one of LEFT, RIGHT, UP, DOWN)
 * @param {boolean} [fallThrough] if set to true, snakes and objects that fall out of the board
 * will appear again at the top
 * @param {number[]} [gravity] the direction of gravity (one of LEFT, RIGHT, UP, DOWN)
 * @param {boolean} [moveInfo] whether to include detailed move info in the response (see description
 * below; if set to false, the method will return the GameState object which is normally returned
 * at index 3 of the return arry)
 * @return {any[]} will return null if the move was invalid. If the move was valid the array will
 * contain:
 * - at index 0: a boolean -- indicating whether or not the snake ate a fruit.
 * - at index 1: a number which will be -1 if the game was lost due to an endless loop, -2 if it
 *   was lost due to a snake falling out of the board or onto a spike, 1 if the game was
 *   won and 0 if the game is not over yet
 * - at index 2: an array of type number[time][numObj][2]. time is the length it takes for
 *   all objects to come to rest or be caught in an infinite loop (falling down one step takes one
 *   time unit). numObj is the number of objects on the field (that is, number of snakes plus
 *   number of blocks). The last dimension is 2 for the two coordinates of the object. If the
 *   dimension is not 2, one of the following is indicated:
 *   - six entries: a portation -- third and fourth coordinate contain the position the object
 *     will be ported to, the fifth and sixth array entry will contain the index of the source and
 *     the destination portal in GameState.portalPos
 *   - four entries: a failed portation -- third entry index of source portal, fourth entry index of
 *     destination portal
 *   - three entries: an object disappeared because it fell out of the board or (in case it is a
 *     snake) fell onto a spike (third entry 1) or a snake entered the target cell (third entry 3)
 * - at index 3: the new game state (a GameState object).
 */
function gameTransition(gameState, snake, direction, fallThrough = false, gravity = DOWN,
    moveInfo = true) {

}

function move() {
  // TODO
}
