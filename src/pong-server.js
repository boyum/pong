const Pong = require('./pong');
const Vector = require('./vector');

/**
 * @param {Function} func
 * @return {Pong}
 */
function init(func) {
  return new Pong(500, 500, undefined, func);
}

/**
 * @param {Vector} vector
 * @param {Pong} game
 */
function updateLeft(vector, game) {
  game.leftPlayer.velocity = vector;
}

/**
 * @param {Vector} vector
 * @param {Pong} game
 */
function updateRight(vector, game) {
  game.rightPlayer.velocity = vector;
}


module.exports = {
  init,
  updateLeft,
  updateRight,
};
