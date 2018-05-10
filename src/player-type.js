const PlayerType = {
  LEFT: 0,
  RIGHT: 1,
};

/**
 * @return {boolean}
 */
function isNode() {
  return this.window !== this;
}

if (isNode()) {
  module.exports = PlayerType;
}
