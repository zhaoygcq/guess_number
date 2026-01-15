export const GAME_MODE = {
  SINGLE: "single",
  MULTI_HOST: "multi_host",
  MULTI_JOIN: "multi_join",
} as const;

export const PLAY_STYLE = {
  RACE: "race",
  DUEL: "duel",
} as const;

export const MATCH_STRATEGY = {
  EXACT: "exact",
  VALUE: "value",
} as const;

export const GAME_STATUS = {
  PLAYING: "playing",
  WON: "won",
  LOST: "lost",
  SETTING_SECRET: "setting_secret",
} as const;

export const VIEW = {
  HOME: "home",
  LOBBY: "lobby",
  GAME: "game",
} as const;

export const P2P_MESSAGE_TYPE = {
  HANDSHAKE: "HANDSHAKE",
  GAME_START: "GAME_START",
  GUESS_UPDATE: "GUESS_UPDATE",
  GAME_OVER: "GAME_OVER",
  DUEL_INIT: "DUEL_INIT",
  DUEL_READY: "DUEL_READY",
  RESTART_REQUEST: "RESTART_REQUEST",
  RESTART_ACCEPT: "RESTART_ACCEPT",
  PLAYER_INFO: "PLAYER_INFO",
  ERROR: "ERROR",
  KICK: "KICK",
  TURN_CHANGE: "TURN_CHANGE",
} as const;

export const MAX_PLAYERS = 5;
