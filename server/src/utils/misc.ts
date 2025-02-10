import { GameConstants } from "@common/constants";
import { Mode, Modes } from "@common/definitions/modes";
import { halfπ, τ } from "@common/utils/math";
import { ReferenceOrNull, ReferenceOrRandom, type ObjectDefinition, type ReferenceTo } from "@common/utils/objectDefinitions";
import { weightedRandom } from "@common/utils/random";
import { Vec, type Vector } from "@common/utils/vector";
import { Config, MapWithParams } from "../config";
import { MapName, Maps } from "../data/maps";

export function modeFromMap(map: MapWithParams): Mode {
    const mapName = map.split(":")[0];
    const mapMode = Maps[mapName as MapName]?.mode;
    if (mapMode) {
        return mapMode;
    } else if (mapName in Modes) {
        return mapName as Mode;
    } else {
        return GameConstants.defaultMode;
    }
}

export function cleanUsername(name?: string | null): string {
    if (
        !name
        || !name.length
        || name.length > GameConstants.player.nameMaxLength
        || Config.protection?.usernameFilters?.some((regex: RegExp) => regex.test(name))
        || /[^\x20-\x7E]/g.test(name) // extended ASCII chars
    ) {
        return GameConstants.player.defaultName;
    } else {
        return name;
    }
}

export function getRandomIDString<T extends ObjectDefinition>(ref: ReferenceOrRandom<T>): ReferenceOrNull<T> {
    if (typeof ref === "string") return ref;

    const items: Array<ReferenceOrNull<T>> = [];
    const weights: number[] = [];
    for (const item in ref) {
        items.push(item);
        weights.push(ref[item as ReferenceOrNull<T>] as number);
    }
    return weightedRandom(items, weights);
}

/**
 * Find and remove an element from an array.
 * @param array The array to iterate over.
 * @param value The value to check for.
 */
export function removeFrom<T>(array: T[], value: NoInfer<T>): void {
    const index = array.indexOf(value);
    if (index !== -1) array.splice(index, 1);
}

export const CARDINAL_DIRECTIONS = Array.from({ length: 4 }, (_, i) => i / τ);

export function getPatterningShape(
    spawnCount: number,
    radius: number
): Vector[] {
    const makeSimpleShape = (points: number) => {
        const tauFrac = τ / points;
        return (radius: number, offset = 0): Vector[] => Array.from(
            { length: points },
            (_, i) => Vec.fromPolar(i * tauFrac + offset, radius)
        );
    };

    const [
        makeTriangle,
        makeSquare,
        makePentagon,
        makeHexagon
    ] = [3, 4, 5, 6].map(makeSimpleShape);

    switch (spawnCount) {
        case 1: return [Vec.create(0, 0)];
        case 2: return [
            Vec.create(0, radius),
            Vec.create(0, -radius)
        ];
        case 3: return makeTriangle(radius);
        case 4: return [Vec.create(0, 0), ...makeTriangle(radius)];
        case 5: return [Vec.create(0, 0), ...makeSquare(radius)];
        case 6: return [Vec.create(0, 0), ...makePentagon(radius)];
        case 7: return [Vec.create(0, 0), ...makeHexagon(radius, halfπ)];
        case 8: return [
            Vec.create(0, 0),
            ...makeTriangle(radius / 2),
            ...makeSquare(radius, halfπ)
        ];
        case 9: return [
            Vec.create(0, 0),
            ...makeTriangle(radius / 2),
            ...makePentagon(radius)
        ];
    }

    return [
        ...getPatterningShape(spawnCount - 6, radius * 3 / 4),
        ...makeHexagon(radius, halfπ)
    ];
}
