const WebSocket = require('ws');
const express = require('express');
const {
  init,
  updateLeft,
  updateRight,
} = require('./pong-server');
const PlayerType = require('./player-type');
const WsData = require('./ws-data');

const server = express();

const wss = new WebSocket.Server({
  port: 8080,
});

const game = init(broadCastUpdates);
const players = new Set();
const playersReady = new Set();

wss.on('connection', ws => {
  players.add(ws);
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
        console.log('m', m);
        const wsData = JSON.parse(m.data);

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
            console.log(client, 'ready');

            if (playersReady.size === 2) {
              game.start();
              broadcast(wss.clients, {
                message: 'Start game',
                data: {
                  startGame: true,
                },
              });
            }
          } else if (wsData.data.ready === false) {
            playersReady.delete(client);
          }
        }
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
 *
 * @param {Vector[]} positions
 */
function broadCastUpdates(positions) {
  broadcast(players, {
    data: {
      positions,
    },
  });
}

server.use(express.static('src'));
server.listen(3000, () => {});