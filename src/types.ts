import * as PIXI from "pixi.js";
import {CmdType} from "redux-loop";

export enum EffectState  {
  NOT_STARTED = "NOT_STARTED",
  PENDING = "PENDING",
  FINISHED = "FINISHED",
  FAILED = "FAILED",
}

export enum KeyState {
  DOWN = "DOWN",
  UP = "UP",
}

export interface IPlayerSubType {
  readonly name: string;
}

export interface IXWingSubType {
  readonly direction: number;
}

export interface IMissileSubType  {
  readonly speed: number;
  readonly velocity: number;
}

export type EntitySubType =
  | { readonly type: "PLAYER"; readonly params: IPlayerSubType }
  | { readonly type: "XWING"; readonly params: IXWingSubType }
  | { readonly type: "MISSILE"; readonly params: IMissileSubType };

export interface IEntity {
  readonly id: string;
  readonly sprite: string;
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly subType: EntitySubType;
}

export interface IEntityInfo<SubType> {
  readonly genericData: IEntity;
  readonly entityData: SubType;
}

export interface IEntityMap {
  readonly player: ReadonlyArray<IEntityInfo<IPlayerSubType>>;
  readonly missiles: ReadonlyArray<IEntityInfo<IMissileSubType>>;
}

export interface ISpawnSchedule {
  readonly status: EffectState;
}

export function entityListToEntityMap(entities: ReadonlyArray<IEntity>): IEntityMap {
  return entities.reduce((entityMap: IEntityMap, entity: IEntity): IEntityMap => {
    const subType: EntitySubType = entity.subType;

    switch (subType.type) {
      case "PLAYER":
        const player = {
          genericData: entity,
          entityData: subType.params,
        };
        return Object.assign(entityMap, {
          player: entityMap.player.concat(player),
        });
      case "MISSILE":
        const missile = {
          genericData: entity,
          entityData: subType.params,
        };
        return Object.assign(entityMap, {
          missiles: entityMap.missiles.concat([missile]),
        });
      default:
        return entityMap;
    }
  }, {
    player: [],
    missiles: [],
  });
}

export type Message =
  | { readonly type: "TICK", readonly app: PIXI.Application }
  | { readonly type: "GAME_READY" }
  | { readonly type: "KEY_DOWN", readonly key: string }
  | { readonly type: "KEY_UP", readonly key: string }
  | { readonly type: "SPAWN_XWING", readonly xwing: IEntity }
  | { readonly type: "NOOP" };

export interface IKeyMap {
  readonly "w": KeyState;
  readonly "a": KeyState;
  readonly "s": KeyState;
  readonly "d": KeyState;
}

export interface IDirectorState {
  readonly xwingSpawn: EffectState;
}

export interface IState {
  readonly gameInitialized: EffectState;
  readonly paused: boolean;
  readonly entities: ReadonlyArray<IEntity>;
  readonly keyMap: IKeyMap;
  readonly director: IDirectorState;
}

export interface IReducerBatchResult {
  readonly state: IState;
   readonly cmds: Array<CmdType<Message>>;
}
