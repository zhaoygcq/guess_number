import { GAME_MODE, PLAY_STYLE, MATCH_STRATEGY } from '../constants';

export type GameMode = typeof GAME_MODE[keyof typeof GAME_MODE];
export type PlayStyle = typeof PLAY_STYLE[keyof typeof PLAY_STYLE];
export type MatchStrategy = typeof MATCH_STRATEGY[keyof typeof MATCH_STRATEGY];
