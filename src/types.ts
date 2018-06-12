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
  readonly squad: number;
  readonly missileShot: EffectState;
  readonly spawnId: string;
}

export interface ITieFighterSubType {
  readonly squad: number;
  readonly missileShot: EffectState;
  readonly spawnId: string;
}

export interface IMissileSubType  {
  readonly speed: number;
  readonly velocity: number;
}

export type EntitySubType =
  | { readonly type: "PLAYER"; readonly params: IPlayerSubType }
  | { readonly type: "XWING"; readonly params: IXWingSubType }
  | { readonly type: "TIEFIGHTER"; readonly params: ITieFighterSubType }
  | { readonly type: "MISSILE"; readonly params: IMissileSubType };

export interface IEntity {
  readonly id: string;
  readonly sprite: string;
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly xVel: number;
  readonly yVel: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly subType: EntitySubType;
}

export interface IEntityInfo<SubType> {
  readonly genericData: IEntity;
  readonly entityData: SubType;
}

export interface ISpawnSchedule {
  readonly status: EffectState;
}

export type Message =
  | { readonly type: "TICK", readonly app: PIXI.Application }
  | { readonly type: "GAME_READY" }
  | { readonly type: "KEY_DOWN", readonly key: string }
  | { readonly type: "KEY_UP", readonly key: string }
  | { readonly type: "SPAWN_XWING", readonly xwing: IEntity }
  | { readonly type: "SPAWN_TIEFIGHTER", readonly tieFighter: IEntity }
  | { readonly type: "NOOP" };

export interface IKeyMap {
  readonly "w": KeyState;
  readonly "a": KeyState;
  readonly "s": KeyState;
  readonly "d": KeyState;
}

export interface IDirectorState {
  readonly xwingSpawn: EffectState;
  readonly tieFighterSpawn: EffectState;
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
