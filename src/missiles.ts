import {assign, set, setIn} from "icepick";
import {deliciousPi, gameHeight, gameWidth} from "./constants";
import {EffectState, IEntity, IState} from "./types";

const getMissileEntity = (id: string): IEntity => {
  return {
    id,
    sprite: "assets/lazor.png",
    x: 0,
    y: 0,
    xVel: 0,
    yVel: -1,
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
    xVel: 0,
    yVel: 1,
    width: 70,
    height: 80,
    rotation: deliciousPi,
    active: false,
    subType: {
      type: "XWING",
      params : {
        missileShot: EffectState.NOT_STARTED,
        spawnId: "unassigned",
        squad: 0,
      },
    },
  };
};

const getTieFighterEntity = (id: string): IEntity => {
  return {
    id,
    sprite: "assets/tie-smol.png",
    x: 0,
    y: gameHeight + 80,
    xVel: 0,
    yVel: -1,
    width: 70,
    height: 80,
    rotation: 0,
    active: false,
    subType: {
      type: "TIEFIGHTER",
      params : {
        spawnId: "unsassigned",
        squad: 0,
        missileShot: EffectState.NOT_STARTED,
      },
    },
  };
};

const tieFighters: ReadonlyArray<IEntity> = Array.apply(false, Array(50))
  .map((_, idx) => {
    return getTieFighterEntity(`tiefighter_${idx}`);
  });

const xwings: ReadonlyArray<IEntity> = Array.apply(false, Array(50))
  .map((_, idx) => {
    return getXwingEntity(`xwing_${idx}`);
  });

const missiles: ReadonlyArray<IEntity> = Array.apply(false, Array(200))
  .map((_, idx) => {
    return getMissileEntity(`missile_${idx}`);
  });

export function getXwing(
  spawnId: string,
  state: IState,
  random1: number,
): IEntity {
  const result = xwings.find((m) => {
    return m.subType.type === "XWING" && !state.entities.find((e) => e.id === m.id);
  });

  const xwing = result || xwings[0];
  return assign(xwing, {
    active: true,
    spawnId,
    x: random1 * gameWidth,
  });
}

export function getTieFighter(
  spawnId: string,
  state: IState,
  random1: number,
): IEntity {
  const result = tieFighters.find((m) => {
    return m.subType.type === "TIEFIGHTER" && !state.entities.find((e) => e.id === m.id);
  });

  const tie = result || xwings[0];
  return assign(tie, {
    active: true,
    subType: setIn(tie.subType, ["params", "spawnId"], spawnId),
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

export function fireMissile(entities: ReadonlyArray<any>, spawnId): IEntity[] {
  const entity = entities.find((e) => {
    return e.subType.params.spawnId === spawnId;
  });

  const missile = missiles.find((m) => {
    return m.subType.type === "MISSILE" && !entities.find((e) => e.id === m.id);
  });

  return entity
    ? [
      assign(missile, {
        active: true,
        x: entity.x,
        y: entity.y,
      }),
    ]
    : [];
}
