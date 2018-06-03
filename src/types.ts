import * as PIXI from "pixi.js";

export type EntitySubType =
  | { readonly type: "PLAYER" }
  | { readonly type: "MISSILE"
      readonly speed: number;
      readonly velocity: number;
    };

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

export type Message =
  | {
      readonly type: "TICK";
      readonly app: PIXI.Application;
    }
  | { readonly type: "GAME_READY" }
  | { readonly type: "KEY_DOWN", readonly key: string }
  | { readonly type: "KEY_UP", readonly key: string }
  | { readonly type: "NOOP" };

export interface IKeyMap {
  readonly "w": KeyState;
  readonly "a": KeyState;
  readonly "s": KeyState;
  readonly "d": KeyState;
}

export interface IState {
  readonly gameInitialized: EffectState;
  readonly paused: boolean;
  readonly entities: ReadonlyArray<IEntity>;
  readonly keyMap: IKeyMap;
}
