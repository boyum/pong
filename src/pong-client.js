// const Pong = require('./pong');
// /** @typedef {import("./pong.js")} Pong */

const webSocket = new WebSocket('ws://localhost:8080');
let game;
let player;
let playerType = -1;
let canvas;
let ctx;
let score = {
  left: 0,
  right: 0,
};

webSocket.onopen = event => {
  // webSocket.send(JSON.stringify({
  //   test: 'hello',
  // }));
};

webSocket.onmessage = m => {
  const wsData = JSON.parse(m.data);

  if (wsData.message) {
    console.log(wsData.message);
  }

  if (wsData.data) {
    if (wsData.data.playerType !== undefined) {
      playerType = wsData.data.playerType;

      if (playerType === 0) {
        player = game.leftPlayer;
      } else {
        player = game.rightPlayer;
      }
    }

    if (wsData.data.playerPositions !== undefined) {
      game.leftPlayer.pos = new Vector(wsData.data.playerPositions[0]);
      game.rightPlayer.pos = new Vector(wsData.data.playerPositions[1]);
      game.leftPlayer.velocity = new Vector(wsData.data.playerVelocities[0]);
      game.rightPlayer.velocity = new Vector(wsData.data.playerVelocities[1]);
      game.ball.pos = new Vector(wsData.data.ballPosition);
    }

    if (wsData.data.startGame === true) {
      game.start();
    }

    if (
      wsData.data.score && (
        wsData.data.score.left !== score.left ||
        wsData.data.score.right !== score.right
      )
    ) {
      score = wsData.data.score;
    }

    if (
      wsData.data.players &&
      wsData.data.players.filter(player => player.ready).length < 2
    ) {
      updatePlayersReadyText(wsData.data.players, ctx);
    }
  }
};


document.addEventListener('DOMContentLoaded', onLoad, false);

/**
 *
 *
 */
function onLoad() {
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  canvas.width = 500;
  canvas.height = 500;

  clearCanvas(ctx);

  updateScore({
    left: 0,
    right: 0,
  }, ctx);

  updatePlayersReadyText([], ctx);

  game = new Pong(canvas.width, canvas.height, ctx, {
    afterUpdate: () => {},
    afterDraw: () => {
      updateScore(score, ctx);
    },
  });

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.body.appendChild(canvas);

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
        start(-speed);
        break;
      case 40:
        start(speed);
        break;
    }
    /**
     * @param {number} speed
     */
    function start(speed) {
      sendWsData({
        data: {
          move: new Vector(0, speed),
        },
      });
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
        if (player.velocity.y < 0) {
          stop();
        }
        break;

      case 40:
        if (player.velocity.y > 0) {
          stop();
        }
        break;
    }
  }
  /**
   * Stops the player's paddle
   */
  function stop() {
    sendWsData({
      data: {
        move: new Vector(0, 0),
      },
    });
  }
}

/**
 * @param {WsData} data
 */
function sendWsData(data) {
  data.data = data.data || {};

  data.data = Object.assign(data.data, {
    playerType: playerType,
  });

  webSocket.send(JSON.stringify(data));
}

// /**
//  * Returns the max value if the value is bigger than the max,
//  * else the value
//  *
//  * @param {number} val
//  * @param {number} max
//  * @return {number}
//  */
// function clamp(val, max) {
//   return n1 >= n2 ? n2 : n1;
// }

/**
 * @param {Object} score
 * @param {number} score.left
 * @param {number} score.right
 * @param {CanvasRenderingContext2D} ctx
 */
function updateScore(score, ctx) {
  ctx.font = '36px sans-serif';
  ctx.fillStyle = '#ffffff';
  const text = `${score.left} - ${score.right}`;
  const textWidth = ctx.measureText(text).width;
  ctx.fillText(text, 250 - (textWidth / 2), 60);
}

/**
 *
 *
 * @param {Object[]} players
 * @param {boolean} players.ready
 * @param {CanvasRenderingContext2D} ctx
 */
function updatePlayersReadyText(players, ctx) {
  clearCanvas(ctx);
  ctx.font = '32px sans-serif';
  ctx.fillStyle = '#ffffff';
  const label = `Press space to get ready!`;
  const labelWidth = ctx.measureText(label).width;
  ctx.fillText(label, 250 - (labelWidth / 2), 100);

  players.forEach((player, index) => {
    const readySymbol = player.ready ? '✔️' : '❌';
    const text = `Player ${index}: ${readySymbol}`;
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, 250 - (textWidth / 2), 200 + (index * 60));
  });
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function clearCanvas(ctx) {
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, 500, 500);
}
