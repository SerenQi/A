import type { GameKind, GameModule, LegacyGameModule } from "../match/types";
import { normalize } from "./legacy";
import { aeroplane } from "./aeroplane";
import { chess } from "./chess";
import { doudizhu } from "./doudizhu";
import { go } from "./go";
import { gomoku } from "./gomoku";
import { monopoly } from "./monopoly";
import { paodekuai } from "./paodekuai";
import { poker } from "./poker";
import { reversi } from "./reversi";
import { xiangqi } from "./xiangqi";

const RAW: Record<GameKind, GameModule | LegacyGameModule> = { go, gomoku, reversi, chess, xiangqi, poker, paodekuai, monopoly, aeroplane, doudizhu };

/** Every game in the seat-based contract; legacy two-player modules are adapted on the fly. */
export const GAMES = Object.fromEntries(Object.entries(RAW).map(([k, m]) => [k, normalize(m)])) as Record<GameKind, GameModule>;
export const readyGames = () => Object.values(GAMES).filter((g) => g.ready);
