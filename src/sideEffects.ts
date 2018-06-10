import * as PIXI from "pixi.js";
import {IEntity} from "./types";
// sideEffects.ts WHERE ALL THE BAD SIDE-EFFECTY THINGS HAPPEN
// .. just disabling tslint here since everything is a side effect

/* tslint:disable*/
let spawnId = 0
const drawableEntities: {[entityId: string]: PIXI.Sprite} = {}

export const initGame = (app: PIXI.Application) => () => (new Promise((resolve) => {
  document.getElementById("app").appendChild(app.view);

  PIXI.loader
    .add("assets/xwing-smol.png")
    .add("assets/tie-smol.png")
    .add("assets/lazor.png")
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
      y: entity.y,
      rotation: entity.rotation
    })
  })
}

export const scheduleSpawn = (mean) => () => (new Promise(resolve => {
  // these are just super useful to grab here
  const [random1, random2, random3, random4] = [1, 2, 3, 4].map(Math.random)
  setTimeout(
    () => resolve([`${spawnId++}`, random1, random2, random3, random4]),
    1000 * mean * Math.random()
  )
}))

export const scheduleAction = (mean: number, spawnId: string) => () => (new Promise(resolve => {
  setTimeout(
    () => resolve(spawnId),
    1000 * mean * Math.random()
  )
}))
/* tslint:enable */
