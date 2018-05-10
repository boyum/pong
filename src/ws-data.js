const WsData = {
  message: '',
  data: {},
};

/**
 * @return {boolean}
 */
function isNode() {
  return this.window !== this;
}

if (isNode()) {
  module.exports = WsData;
}

