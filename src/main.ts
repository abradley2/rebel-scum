import * as PIXI from "pixi.js";
import {createGameStream} from "./gameState";

const app = new PIXI.Application({width: 900, height: 750});

// main
export default (() => {
  return createGameStream(app);
})();
