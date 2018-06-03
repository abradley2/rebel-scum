import * as PIXI from "pixi.js";
import {createGameStream} from "./gameState";

const app = new PIXI.Application({width: 650, height: 650});

// main
export default (() => {
  return createGameStream(app);
})();
