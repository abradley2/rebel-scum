import * as PIXI from "pixi.js";
import {ticker} from "./gameState";

const app = new PIXI.Application({width: 650, height: 650});

// main
export default (() => {
  return ticker(app);
})();
