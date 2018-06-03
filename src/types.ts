import * as PIXI from "pixi.js";

export interface IEntity {
  readonly id: string;
  readonly sprite: string;
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
}

export enum EffectState  {
  NOT_STARTED = "NOT_STARTED",
  PENDING = "PENDING",
  FINISHED = "FINISHED",
  FAILED = "FAILED",
}

export type Message =
  | {
      readonly type: "TICK";
      readonly app: PIXI.Application;
    }
  | { readonly type: "GAME_READY" }
  | { readonly type: "KEY_PRESS", readonly key: string }
  | { readonly type: "NOOP" };

export interface IState {
  readonly gameInitialized: EffectState;
  readonly paused: boolean;
  readonly entities: ReadonlyArray<IEntity>;
}
