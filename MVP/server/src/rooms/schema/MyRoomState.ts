import { Schema, MapSchema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "Guest";
    @type("string") avatarKey: string = "a1";
    @type("string") avatarUrl: string = "";

    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;
    @type("number") ry: number = 0; // rotation around Y
    @type("boolean") isMoving: boolean = false;
}

export class ScreenState extends Schema {
    @type("string") presenterId: string = "";
    @type("boolean") active: boolean = false;

    // Transform
    @type("number") x: number = 0;
    @type("number") y: number = 2;
    @type("number") z: number = 0;
    @type("number") rx: number = 0;
    @type("number") ry: number = 0;
    @type("number") rz: number = 0;
    @type("number") scale: number = 1;
}

export class MyRoomState extends Schema {
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();

    // ✅ room-wide environment
    @type("string") envKey: string = "office";

    // 🖥️ Shared Screen State
    @type(ScreenState) screen = new ScreenState();
}
