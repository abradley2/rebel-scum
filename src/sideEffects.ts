import * as PIXI from "pixi.js";
import {IEntity} from "./types";
// sideEffects.ts WHERE ALL THE BAD SIDE-EFFECTY THINGS HAPPEN
// .. just disabling tslint here since everything is a side effect

/* tslint:disable*/
const drawableEntities: {[entityId: string]: PIXI.Sprite} = {}

export const initGame = (app: PIXI.Application) => () => (new Promise((resolve) => {
  document.getElementById("app").appendChild(app.view);

  PIXI.loader
    .add("assets/xwing-smol.png")
    .load(setup);

  function setup() {
    resolve(true)
  }
}));

export const draw = (
  app: PIXI.Application,
  entities: ReadonlyArray<IEntity>
) => () => {
  entities.forEach(entity => {
    if (!drawableEntities[entity.id]) {
      const sprite = new PIXI.Sprite(
        PIXI.loader.resources[entity.sprite].texture,
      );

      app.stage.addChild(sprite);

      drawableEntities[entity.id] = sprite
    }

    Object.assign(drawableEntities[entity.id], {
      x: entity.x,
      y: entity.y
    })
  })
}
/* tslint:enable */
