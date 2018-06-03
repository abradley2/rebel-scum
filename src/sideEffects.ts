import * as PIXI from "pixi.js";

// sideEffects.ts WHERE ALL THE BAD SIDE-EFFECTY THINGS HAPPEN
// .. just disabling tslint here since everything is a side effect

/* tslint:disable*/
export const initGame = (
  app: PIXI.Application,
  messageCreator: (ready: boolean) => any
) => () => {
  document.getElementById("app").appendChild(app.view);

  PIXI.loader
    .add("assets/xwing.png")
    .load(setup);

  function setup() {
    const sprite = new PIXI.Sprite(
      PIXI.loader.resources["assets/xwing.png"].texture,
    );

    app.stage.addChild(sprite);

    messageCreator(true)
  }
};
/* tslint:enable */
