const WebSocket = require('ws');
const express = require('express');
const PlayerType = require('./player-type');
const {
  init,
  updateLeft,
  updateRight,
} = require('./pong-server');

const server = express();

const wss = new WebSocket.Server({
  port: 8080,
});

const game = init({
  afterUpdate: broadcastContext,
  afterDraw: () => {},
});
const players = new Set();
const playersReady = new Set();
const serverContext = {
  players: [],
};

wss.on('connection', ws => {
  players.add(ws);
  serverContext.players.push({
    ready: false,
  });

  broadcastContext({});

  if (players.size === 1) {
    send(ws, {
      message: 'You\'re player 1',
      data: {
        playerType: PlayerType.LEFT,
      },
    });
  } else if (players.size === 2) {
    send(ws, {
      message: 'You\'re player 2',
      data: {
        playerType: PlayerType.RIGHT,
      },
    });

    broadcast(wss.clients, {
      message: 'Both players are in, press spacebar when ready',
    });

    wss.clients.forEach(client => {
      client.on('message', m => {
        const wsData = JSON.parse(m);
        if (game.running) {
          if (wsData.data.move) {
            if (wsData.data.playerType === PlayerType.LEFT) {
              updateLeft(wsData.data.move, game);
            } else {
              updateRight(wsData.data.move, game);
            }
          }
        } else {
          if (wsData.data.ready === true) {
            playersReady.add(client);

            if (wsData.data.playerType > -1) {
              serverContext.players[wsData.data.playerType].ready = true;

              if (playersReady.size === 2) {
                game.start();
                broadcast(wss.clients, {
                  message: 'Start game',
                  data: {
                    startGame: true,
                  },
                });
              }
            }
          } else if (wsData.data.ready === false) {
            playersReady.delete(client);
            serverContext.players[wsData.data.playerType].ready = false;
          }
        }

        broadcastContext({});
      });

      client.on('close', (code, reason) => {
        players.delete(client);
        playersReady.delete(client);
      });
    });
  }
});


/**
 *
 *
 * @param {WebSocket[]} clients
 * @param {WsData} data
 */
function broadcast(clients, data) {
  clients.forEach(client => {
    send(client, data);
  });
}

/**
 *
 *
 * @param {WebSocket} client
 * @param {WsData} data
 */
function send(client, data) {
  const s = JSON.stringify(data);
  client.send(s);
}

/**
 *
 * @param {Object} context
 * @param {Vector[]} context.playerPos
 * @param {Vector[]} context.playerVelocities
 * @param {Vector} context.ballPos
 * @param {Object} context.score
 * @param {number} context.score.left
 * @param {number} context.score.right
 * @param {Object[]} context.players
 * @param {boolean} context.players.ready
 */
function broadcastContext(context) {
  broadcast(players, {
    data: Object.assign(context, serverContext),
  });
}

server.use(express.static('src'));
server.listen(3000, () => {});
