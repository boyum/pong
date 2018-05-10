// const Pong = require('./pong');
// /** @typedef {import("./pong.js")} Pong */

const webSocket = new WebSocket('ws://localhost:8080');
let game;

webSocket.onopen = event => {
  // webSocket.send(JSON.stringify({
  //   test: 'hello',
  // }));
};
let playerType = -1;
webSocket.onmessage = m => {
  const wsData = JSON.parse(m.data);

  console.log('wsdata', wsData);

  if (wsData.message) {
    console.log(wsData.message);
  }

  if (wsData.data) {
    if (wsData.data.playerType !== undefined) {
      playerType = wsData.data.playerType;
    }

    if (wsData.data.positions !== undefined) {
      game.leftPlayer.pos = wsData.data.positions[0];
      game.rightPlayer.pos = wsData.data.positions[1];
    }

    if (wsData.data.startGame === true) {
      game.start();
    }
  }
};


document.addEventListener('DOMContentLoaded', onLoad, false);

/**
 *
 *
 */
function onLoad() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 500;
  canvas.height = 500;

  game = new Pong(canvas.width, canvas.height, ctx);

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.body.appendChild(canvas);
  // game.start();

  /**
   *
   *
   * @param {KeyboardEvent} event
   */
  function onKeyDown(event) {
    const speed = 3;

    switch (event.keyCode) {
      case 32:
        sendWsData({
          data: {
            ready: true,
          },
        });
        break;
      case 38:
        sendWsData({
          data: {
            move: new Vector(0, -speed),
            playerType,
          },
        });

        break;
      case 40:
        sendWsData({
          data: {
            move: new Vector(0, speed),
            playerType,
          },
        });
        break;
    }
  }

  /**
   *
   *
   * @param {KeyboardEvent} event
   */
  function onKeyUp(event) {
    switch (event.keyCode) {
      case 38:
        if (game.leftPlayer.velocity.y < 0) {
          game.leftPlayer.velocity.y = 0;
        }
        if (game.rightPlayer.velocity.y < 0) {
          game.rightPlayer.velocity.y = 0;
        }
        break;
      case 40:
        if (game.leftPlayer.velocity.y > 0) {
          game.leftPlayer.velocity.y = 0;
        }
        if (game.rightPlayer.velocity.y > 0) {
          game.rightPlayer.velocity.y = 0;
        }
        break;
    }
  }
}

/**
 * @param {WsData} data
 */
function sendWsData(data) {
  webSocket.send(JSON.stringify(data));
}
