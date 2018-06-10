import * as PIXI from "pixi.js";
import {gameHeight, gameWidth} from "./constants";
import {createGameStream} from "./gameState";

const app = new PIXI.Application({width: gameWidth, height: gameHeight});

// main
export default (() => {
  return createGameStream(app);
})();
