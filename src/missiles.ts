import {assign, set} from "icepick";
import {IEntity, IState} from "./types";

const getMissileEntity = (id: string): IEntity => {
  return {
    id,
    sprite: "assets/lazor.png",
    x: 0,
    y: 0,
    width: 6,
    height: 40,
    active: false,
    subType: { type: "MISSILE", speed: 12, velocity: 1 },
  };
};

const missiles: ReadonlyArray<IEntity> = Array.apply(false, Array(100))
  .map((_, idx) => {
    return getMissileEntity(`${idx}`);
  });

export function firePlayerMissile(state: IState): IState {
  const missile = missiles.find((m) => {
    const existing = state.entities.find((e) => e.id === m.id);
    return !existing;
  });
  return set(
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
}

export function updateMissiles(state: IState): IState {
  const entities = state.entities.map((entity) => {
    const subType = entity.subType;
    switch (subType.type) {
      case "MISSILE":
        return set(
          entity,
          "y",
          entity.y - (subType.speed * subType.velocity),
        );
      default:
        return entity;
    }
  });

  return set(state, "entities", entities);
}
