'use strict';
// wh.e(FFDZ): !n maps to active; m maps to id === strikerId.
// Strict comparisons preserve list order for equal-distance candidates.
function nearestEligibleBall(balls, x, y, radius, strikerId, includeStriker = false) {
 let nearest = null, bestDistance = Infinity;
 const limit = radius * radius;
 for (const ball of balls) {
  if (!ball.active || (!includeStriker && ball.id === strikerId)) continue;
  const distance = (ball.x - x) ** 2 + (ball.y - y) ** 2;
  if (distance < bestDistance && distance < limit) {
   nearest = ball;
   bestDistance = distance;
  }
 }
 return nearest;
}
module.exports = {nearestEligibleBall};
