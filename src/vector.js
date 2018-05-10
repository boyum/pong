/**
 * @class Vector
 */
class Vector {
  /**
   * Creates an instance of Vector.
   * @param {Object|number} x
   * @param {number} x.x
   * @param {number} x.y
   * @param {number} y
   * @memberof Vector
   */
  constructor(x, y) {
    if (typeof x === 'number') {
      this.x = x;
      this.y = y;
    } else {
      this.x = x.x;
      this.y = x.y;
    }
  }

  /**
   *
   * @param {Vector} max
   * @param {Vector} min
   */
  clamp(max, min) {
    this.clampX(max.x, min.x);
    this.clampY(max.y, min.y);
  }

  /**
   *
   *
   * @param {number} maxX
   * @param {number} minX
   * @memberof Vector
   */
  clampX(maxX, minX) {
    if (this.x > maxX) {
      this.x = maxX;
    } else if (this.x < minX) {
      this.x = minX;
    }
  }

  /**
   *
   *
   * @param {number} maxY
   * @param {number} minY
   * @memberof Vector
   */
  clampY(maxY, minY) {
    if (this.y > maxY) {
      this.y = maxY;
    } else if (this.y < minY) {
      this.y = minY;
    }
  }

  /**
   * @return {Vector}
   */
  clone() {
    return new Vector(this.x, this.y);
  }

  /**
   *
   *
   * @param {Vector} vector
   * @memberof Vector
   */
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }


  /**
   *
   * @param {Vector} vector
   * @memberof Vector
   */
  sub(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
  }

  /**
   *
   * @param {Vector} vector
   * @memberof Vector
   */
  mult(vector) {
    this.x *= vector.x;
    this.y *= vector.y;
  }

  /**
   *
   * @param {Vector} vector
   * @memberof Vector
   */
  divide(vector) {
    this.x /= vector.x;
    this.y /= vector.y;
  }
}

/**
 * @return {boolean}
 */
function isNode() {
  return this.window !== this;
}


if (isNode()) {
  module.exports = Vector;
}
