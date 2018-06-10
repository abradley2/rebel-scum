import {assign, set} from "icepick";
import {gameWidth} from "./constants";
import {EffectState, IEntity, IState} from "./types";

const getMissileEntity = (id: string): IEntity => {
  return {
    id,
    sprite: "assets/lazor.png",
    x: 0,
    y: 0,
    width: 6,
    height: 40,
    rotation: 0,
    active: false,
    subType: {
      type: "MISSILE",
      params : {
        speed: 20,
        velocity: 1,
      },
    },
  };
};

const getXwingEntity = (id: string): IEntity => {
  return {
    id,
    sprite: "assets/xwing-smol.png",
    x: 0,
    y: 0,
    width: 70,
    height: 80,
    rotation: 3.14,
    active: false,
    subType: {
      type: "XWING",
      params : {
        squad: 0,
        missileShot: EffectState.NOT_STARTED,
      },
    },
  };
};

const xwings: ReadonlyArray<IEntity> = Array.apply(false, Array(15))
  .map((_, idx) => {
    return getXwingEntity(`xwing_${idx}`);
  });

const missiles: ReadonlyArray<IEntity> = Array.apply(false, Array(100))
  .map((_, idx) => {
    return getMissileEntity(`missile_${idx}`);
  });

export function getXwing(
  state: IState,
  random1: number,
): IEntity {
  const result = xwings.find((m) => {
    return m.subType.type === "XWING" && !state.entities.find((e) => e.id === m.id);
  });

  const xwing = result || xwings[0];
  return assign(xwing, {
    active: true,
    x: random1 * gameWidth,
  });

}

export function firePlayerMissile(state: IState): IState {
  const missile = missiles.find((m) => {
    return m.subType.type === "MISSILE" && !state.entities.find((e) => e.id === m.id);
  });
  const newState = set(
    state,
    "entities",
    state.entities.concat(
      assign(missile, {
        active: true,
        x: state.entities[0].x + (state.entities[0].width / 2),
        y: state.entities[0].y - (state.entities[0].height / 2),
      }),
    ),
  );

  return newState;
}
