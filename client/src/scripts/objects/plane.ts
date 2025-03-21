import { GameConstants, Layer } from "@common/constants";
import { adjacentOrEqualLayer } from "@common/utils/layer";
import { Geometry } from "@common/utils/math";
import { Vec, type Vector } from "@common/utils/vector";
import { SoundManager, type GameSound } from "../managers/soundManager";
import { PIXI_SCALE } from "../utils/constants";
import { SuroiSprite } from "../utils/pixi";
import { CameraManager } from "../managers/cameraManager";
import { Game } from "../game";

export class Plane {
    readonly startPosition: Vector;
    readonly endPosition: Vector;
    readonly image: SuroiSprite;
    readonly sound: GameSound;

    readonly startTime = Date.now();

    static readonly maxDistanceSquared = (GameConstants.maxPosition * 2) ** 2;

    constructor(startPosition: Vector, direction: number) {
        this.startPosition = startPosition;

        this.endPosition = Vec.add(
            this.startPosition,
            Vec.fromPolar(direction, GameConstants.maxPosition * 2)
        );

        this.image = new SuroiSprite("airdrop_plane")
            .setZIndex(Number.MAX_SAFE_INTEGER - 2) // todo: better logic for this lol
            .setRotation(direction)
            .setScale(4);

        this.sound = SoundManager.play(
            "airdrop_plane",
            {
                position: startPosition,
                falloff: 0.5,
                maxRange: 256,
                dynamic: true,
                loop: true
            }
        );

        CameraManager.addObject(this.image);
    }

    update(): void {
        const position = this.sound.position = Vec.lerp(
            this.startPosition,
            this.endPosition,
            (Date.now() - this.startTime) / (GameConstants.airdrop.flyTime * 2)
        );

        this.image.setVPos(Vec.scale(position, PIXI_SCALE));

        if (Geometry.distanceSquared(position, this.startPosition) > Plane.maxDistanceSquared) {
            this.destroy();
            Game.planes.delete(this);
        }

        if (Game.layer && Game.layer !== Layer.Floor1) {
            this.image.visible = adjacentOrEqualLayer(Layer.Ground, Game.layer);
            this.sound.maxRange = adjacentOrEqualLayer(Layer.Ground, Game.layer) ? 256 : 0;
        }
    }

    destroy(): void {
        this.image.destroy();
        this.sound.stop();
    }
}
