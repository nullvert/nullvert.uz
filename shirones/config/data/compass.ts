/**
 * Автоматически сгенерированный адаптер для обратной совместимости.
 * Первичный снапшот хранится в src/data/snapshots/bookmarks.json
 */
import type { CompassShelf } from "@/types/compass";
import snapshot from "../../../src/data/snapshots/bookmarks.json";

export const compassData = (snapshot.items || []) as CompassShelf[];
