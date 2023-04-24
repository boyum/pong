if (isNode()) {
  eval(`
    var PlayerType = require('./player-type');
    var Vector = require('./vector');
  `);
}

const Wall = {
  TOP: 0,
  RIGHT: 1,
  BOTTOM: 2,
  LEFT: 3,
};

/**
 *
 *
 * @class Pong
 */
class Pong {
  /**
   *
   * @param {number} boardWidth
   * @param {number} boardHeight
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} functions
   * @param {Function} functions.afterUpdate
   * @param {Function} functions.afterDraw
   */
  constructor(boardWidth, boardHeight, ctx, functions) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.isServer = !Boolean(ctx);
    this.ctx = ctx;
    this.running = false;

    this.leftPlayer = new Player(
        10,
        boardHeight / 2,
        boardHeight,
        PlayerType.LEFT
    );
    this.rightPlayer = new Player(
        boardWidth - 20,
        boardHeight / 2,
        boardHeight,
        PlayerType.RIGHT
    );
    this.ball = new Ball(
        boardWidth / 2,
        boardHeight / 2, [
          this.leftPlayer,
          this.rightPlayer,
        ]
    );

    this.update = this.update.bind(this, functions.afterUpdate);
    this.draw = this.draw.bind(this, functions.afterDraw);
  }

  /**
   *
   *
   * @memberof Pong
   */
  start() {
    this.running = true;
    this.update();
  }
  /**
   *
   * @param {Function} afterUpdate
   * @memberof Pong
   */
  update(afterUpdate) {
    if (!this.running) {
      return;
    }

    if (this.isServer) {
      if (this.ballOutOfBounds()) {
        this.ball.lastHitBy.score++;
        this.ball.reset();
      } else {
        if (this.ballHitsLeftPlayer()) {
          this.ball.lastHitBy = this.leftPlayer;
          this.ball.bounce(
              Wall.LEFT,
              this.calculateBounceAngle(this.leftPlayer)
          );
        } else if (this.ballHitsRightPlayer()) {
          this.ball.lastHitBy = this.rightPlayer;
          this.ball.bounce(
              Wall.RIGHT,
              this.calculateBounceAngle(this.rightPlayer)
          );
        }
      }

      if (this.ballHitsCeiling()) {
        this.ball.bounce(Wall.TOP);
      } else if (this.ballHitsFloor()) {
        this.ball.bounce(Wall.BOTTOM);
      }

      this.ball.update();
      this.leftPlayer.update();
      this.rightPlayer.update();

      if (afterUpdate) {
        afterUpdate({
          playerPositions: [
            this.leftPlayer.pos,
            this.rightPlayer.pos,
          ],
          playerVelocities: [
            this.leftPlayer.velocity,
            this.rightPlayer.velocity,
          ],
          ballPosition: this.ball.pos,
          score: {
            left: this.leftPlayer.score,
            right: this.rightPlayer.score,
          },
        });
      }
    } else {
      this.draw();
    }

    setTimeout(this.update, 16);
  }

  /**
   * @param {Function} afterDraw
   * @memberof Pong
   */
  draw(afterDraw) {
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(0, 0, this.boardHeight, this.boardWidth);

    this.ball.draw(this.ctx);
    this.leftPlayer.draw(this.ctx);
    this.rightPlayer.draw(this.ctx);

    if (afterDraw) {
      afterDraw();
    }
  }

  /**
   * @param {Player} player
   * @param {boolean} left
   * @return {number}
   * @memberof Pong
   */
  calculateBounceAngle(player) {
    const MIN_ANGLE = 20;
    const MAX_ANGLE = 90;
    const d = MAX_ANGLE - MIN_ANGLE;

    const hitYPos = player.pos.y - this.ball.pos.y;

    if (hitYPos >= 0) {
      const percentage = hitYPos / player.height;
      const res = -(d * (1 - percentage)) + MIN_ANGLE;
      return res;
    } else {
      const percentage = -hitYPos / player.height;
      const res = (d * (1 - percentage)) + MIN_ANGLE;
      return res;
    }
  }

  /**
   * @memberof Pong
   * @return {boolean}
   */
  ballOutOfBounds() {
    return (this.leftPlayer.pos.x + this.leftPlayer.width > this.ball.pos.x) ||
      (this.rightPlayer.pos.x < this.ball.pos.x);
  }

  /**
   *
   *
   * @return {boolean}
   * @memberof Pong
   */
  ballHitsLeftPlayer() {
    return this.ballHitsPlayer(this.leftPlayer, true);
  }

  /**
   *
   *
   * @return {boolean}
   * @memberof Pong
   */
  ballHitsRightPlayer() {
    return this.ballHitsPlayer(this.rightPlayer, false);
  }

  /**
   *
   * @param {Player} player
   * @param {boolean} isLeftPlayer
   * @memberof Pong
   * @return {boolean}
   */
  ballHitsPlayer(player) {
    const ballIsBelowPlayer =
      (player.pos.y + player.height / 2) <
      (this.ball.pos.y - (this.ball.radius / 2));
    const ballIsAbovePlayer =
      (player.pos.y - player.height / 2) >
      (this.ball.pos.y + (this.ball.radius / 2));

    if (ballIsBelowPlayer || ballIsAbovePlayer) {
      return false;
    }

    if (player.playerType === PlayerType.LEFT) {
      return (player.pos.x + player.width) >=
        this.ball.pos.x - this.ball.radius;
    } else {
      return player.pos.x <= this.ball.pos.x;
    }
  }

  /**
   *
   *
   * @return {boolean}
   * @memberof Pong
   */
  ballHitsFloor() {
    return this.ball.pos.y + this.ball.radius >= this.boardHeight;
  }

  /**
   *
   *
   * @return {boolean}
   * @memberof Pong
   */
  ballHitsCeiling() {
    return this.ball.pos.y - this.ball.radius <= 0;
  }
}

/**
 *
 *
 * @class Ball
 */
class Ball {
  /**
   * Creates an instance of Ball.
   * @param {number} x
   * @param {number} y
   * @param {Player[]} players
   * @memberof Ball
   */
  constructor(x, y, players) {
    this.MAX_SPEED = 5;
    this.startPos = new Vector(x, y);
    this.paused = false;
    this.radius = 5;
    this.players = players;

    /** @type {Vector} */
    this.velocity = null;
    /** @type {Vector} */
    this.pos = null;
    /** @type {Player} */
    this.lastHitBy = null;


    this.reset();
  }

  /**
   *
   * @return {boolean}
   */
  goingLeft() {
    return this.velocity.x >= 0;
  }

  /**
   *
   *
   * @param {Wall} wall
   * @param {number=} angle
   * @memberof Ball
   */
  bounce(wall, angle = 90) {
    switch (wall) {
      case Wall.TOP:
      case Wall.BOTTOM:
        this.velocity.y *= -1;
        break;
      case Wall.LEFT:
      case Wall.RIGHT:
        const newY = (Math.sin(angle * Math.PI / 180));
        this.velocity.x *= -1;
        this.velocity.y = newY;
        break;
    }
  }

  /**
   *
   *
   * @memberof Ball
   */
  reset() {
    this.pos = this.startPos.clone();
    let xSpeed = 0;
    while (xSpeed === 0) {
      xSpeed = (Math.round(Math.random() * 2) - 1) * this.MAX_SPEED;
    }

    this.velocity = new Vector(
        xSpeed,
        0
        // Math.random() * (2 * this.MAX_SPEED) - this.MAX_SPEED,
        // Math.random() * (2 * this.MAX_SPEED) - this.MAX_SPEED
    );

    this.lastHitBy = xSpeed > 0 ? this.players[0] : this.players[1];
    // this.lastHitBy = this.goingLeft() ? this.players[1] : this.players[0];
  }

  /**
   * Pauses the ball,
   * and stores speed and direction for when the ball is unpaused
   *
   * @memberof Ball
   */
  pause() {
    this.paused = true;
  }

  /**
   * Unpauses the ball
   *
   * @memberof Ball
   */
  unpause() {
    this.paused = false;
  }

  /**
   *
   *
   * @memberof Ball
   */
  update() {
    if (!this.paused) {
      this.pos.add(this.velocity);
    }
  }

  /**
   *
   *
   * @param {CanvasRenderingContext2D} ctx
   * @memberof Ball
   */
  draw(ctx) {
    ctx.fillStyle = '#ffffff';

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 *
 *
 * @class Player
 */
class Player {
  /**
   * Creates an instance of Player.
   * @param {number} x
   * @param {number} y
   * @param {number} boardHeight
   * @param {PlayerType} playerType
   * @memberof Player
   */
  constructor(x, y, boardHeight, playerType) {
    this.boardHeight = boardHeight;
    this.pos = new Vector(x, y);
    this.velocity = new Vector(0, 0);
    this.score = 0;
    this.height = 100;
    this.width = 5;
    this.playerType = playerType;
  }

  /**
   *
   *
   * @memberof Player
   */
  update() {
    if (!isNode()) {
      console.log('this', this);
    }
    this.pos.add(this.velocity);
    this.pos.clampY(this.boardHeight - this.height / 2, this.height / 2);
  }

  /**
   *
   *
   * @param {CanvasRenderingContext2D} ctx
   * @memberof Player
   */
  draw(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
        this.pos.x + this.width / 2,
        this.pos.y - this.height / 2,
        this.width,
        this.height);
  }
}

if (isNode()) {
  module.exports = Pong;
}

/**
 * @return {boolean}
 */
function isNode() {
  return this.window !== this;
}
