import "./style.css";
import * as THREE from "three";

const canvas = document.querySelector("#game");
const playButton = document.querySelector("#play-button");
const startPanel = document.querySelector("#start-panel");
const inventoryPanel = document.querySelector("#inventory-panel");
const closeInventoryButton = document.querySelector("#close-inventory");
const blockPalette = document.querySelector("#block-palette");
const recipeList = document.querySelector("#recipe-list");
const equipmentList = document.querySelector("#equipment-list");
const enchantmentList = document.querySelector("#enchantment-list");
const brewingList = document.querySelector("#brewing-list");
const hotbarEl = document.querySelector("#hotbar");
const statusBarsEl = document.querySelector("#status-bars");
const readoutEl = document.querySelector("#world-readout");
const toastEl = document.querySelector("#toast");
const touchControlsEl = document.querySelector("#touch-controls");
const touchStickEl = document.querySelector("#touch-stick");
const touchStickKnobEl = document.querySelector("#touch-stick-knob");
const touchActionButtons = [...document.querySelectorAll("[data-touch-action]")];

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 72;
const WATER_LEVEL = 22;
const RENDER_DISTANCE = 6;
const RENDER_DISTANCE_BLOCKS = RENDER_DISTANCE * CHUNK_SIZE;
const CHUNK_UNLOAD_DISTANCE = RENDER_DISTANCE + 3.2;
const MAX_REACH = 6;
const SAVE_KEY = "my-world-voxel-save-v1";
const EXPERIENCE_REWARDS = {
  sheep: 1,
  zombie: 5,
  skeleton: 5,
  villager: 0,
};
const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
const soundState = {
  context: null,
  enabled: true,
  unlocked: false,
  lastEvent: null,
  played: 0,
  events: [],
};
const SOUND_PATTERNS = {
  start: [{ type: "tone", frequency: 330, endFrequency: 520, duration: 0.12, gain: 0.045, wave: "triangle" }],
  mine: [
    { type: "noise", duration: 0.07, gain: 0.06, filter: 520 },
    { type: "tone", frequency: 120, duration: 0.06, gain: 0.035, wave: "square" },
  ],
  place: [{ type: "noise", duration: 0.045, gain: 0.04, filter: 760 }],
  hit: [
    { type: "noise", duration: 0.055, gain: 0.05, filter: 900 },
    { type: "tone", frequency: 160, endFrequency: 90, duration: 0.09, gain: 0.03, wave: "sawtooth" },
  ],
  hurt: [{ type: "tone", frequency: 180, endFrequency: 80, duration: 0.16, gain: 0.05, wave: "sawtooth" }],
  bow: [{ type: "tone", frequency: 420, endFrequency: 190, duration: 0.12, gain: 0.035, wave: "triangle" }],
  craft: [
    { type: "tone", frequency: 460, duration: 0.055, gain: 0.035, wave: "square" },
    { type: "tone", frequency: 690, duration: 0.08, gain: 0.028, delay: 0.045, wave: "triangle" },
  ],
  chest: [{ type: "tone", frequency: 260, endFrequency: 420, duration: 0.12, gain: 0.035, wave: "triangle" }],
  trade: [
    { type: "tone", frequency: 520, duration: 0.05, gain: 0.032, wave: "triangle" },
    { type: "tone", frequency: 780, duration: 0.07, gain: 0.026, delay: 0.05, wave: "triangle" },
  ],
  door: [{ type: "noise", duration: 0.08, gain: 0.035, filter: 360 }],
  lever: [{ type: "tone", frequency: 260, duration: 0.055, gain: 0.036, wave: "square" }],
  sleep: [{ type: "tone", frequency: 220, endFrequency: 140, duration: 0.25, gain: 0.032, wave: "sine" }],
  eat: [
    { type: "noise", duration: 0.045, gain: 0.035, filter: 1300 },
    { type: "noise", duration: 0.045, gain: 0.03, filter: 1050, delay: 0.055 },
  ],
  potion: [{ type: "tone", frequency: 680, endFrequency: 910, duration: 0.18, gain: 0.034, wave: "sine" }],
  equip: [{ type: "tone", frequency: 240, endFrequency: 360, duration: 0.09, gain: 0.034, wave: "square" }],
  save: [{ type: "tone", frequency: 560, duration: 0.08, gain: 0.028, wave: "triangle" }],
  ride: [{ type: "tone", frequency: 190, endFrequency: 280, duration: 0.12, gain: 0.034, wave: "triangle" }],
};

const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  OAK_LOG: 6,
  LEAVES: 7,
  COAL_ORE: 8,
  IRON_ORE: 9,
  PLANKS: 10,
  GLASS: 11,
  TORCH: 12,
  CRAFTING: 13,
  FURNACE: 14,
  BEDROCK: 15,
  CLAY: 16,
  SNOW: 17,
  FARMLAND: 18,
  WHEAT_CROP: 19,
  WHEAT_READY: 20,
  COBBLESTONE: 21,
  DOOR: 22,
  OPEN_DOOR: 23,
  LADDER: 24,
  REDSTONE_WIRE: 25,
  REDSTONE_WIRE_ON: 26,
  LEVER: 27,
  LEVER_ON: 28,
  REDSTONE_LAMP: 29,
  REDSTONE_LAMP_ON: 30,
  CHEST: 31,
  PATH: 32,
  BED: 33,
  ENCHANTING_TABLE: 34,
  BREWING_STAND: 35,
  OAK_SLAB: 36,
  COBBLESTONE_SLAB: 37,
  OAK_STAIRS: 38,
  COBBLESTONE_STAIRS: 39,
  GRAVEL: 40,
  RAIL: 41,
  PRESSURE_PLATE: 42,
  PRESSURE_PLATE_ON: 43,
  BUTTON: 44,
  BUTTON_ON: 45,
  POWERED_RAIL: 46,
  POWERED_RAIL_ON: 47,
  REPEATER: 48,
  REPEATER_ON: 49,
  OBSERVER: 50,
  OBSERVER_ON: 51,
  PISTON: 52,
  PISTON_ON: 53,
  PISTON_HEAD: 54,
};

const ITEM = {
  WOOD_PICKAXE: 100,
  STONE_PICKAXE: 101,
  IRON_PICKAXE: 102,
  WOOD_AXE: 103,
  WOOD_SHOVEL: 104,
  WOOD_HOE: 105,
  WHEAT_SEEDS: 106,
  WHEAT: 107,
  BREAD: 108,
  RAW_MUTTON: 109,
  COOKED_MUTTON: 110,
  IRON_INGOT: 111,
  CHARCOAL: 112,
  IRON_HELMET: 113,
  IRON_CHESTPLATE: 114,
  IRON_LEGGINGS: 115,
  IRON_BOOTS: 116,
  EMERALD: 117,
  WOOL: 118,
  BOW: 119,
  ARROW: 120,
  BONE: 121,
  GLASS_BOTTLE: 122,
  WATER_BOTTLE: 123,
  HEALING_POTION: 124,
  SWIFTNESS_POTION: 125,
  STRENGTH_POTION: 126,
  WOOD_SWORD: 127,
  FLINT: 128,
  BOAT: 129,
  MINECART: 130,
};

const BLOCKS = {
  [BLOCK.AIR]: {
    name: "Air",
    label: "空气",
    color: "#000000",
    transparent: true,
    collision: false,
    selectable: false,
  },
  [BLOCK.GRASS]: {
    name: "Grass",
    label: "草方块",
    color: "#69a742",
    side: "#7a5b35",
    top: "#69a742",
    bottom: "#6d4d2d",
    hardness: 0.6,
    drop: BLOCK.DIRT,
    selectable: true,
    collision: true,
  },
  [BLOCK.DIRT]: {
    name: "Dirt",
    label: "泥土",
    color: "#795336",
    hardness: 0.5,
    selectable: true,
    collision: true,
  },
  [BLOCK.STONE]: {
    name: "Stone",
    label: "石头",
    color: "#8a8f87",
    hardness: 1.5,
    tool: "pickaxe",
    tier: 0,
    drop: BLOCK.COBBLESTONE,
    selectable: true,
    collision: true,
  },
  [BLOCK.SAND]: {
    name: "Sand",
    label: "沙子",
    color: "#d7c478",
    hardness: 0.5,
    tool: "shovel",
    selectable: true,
    collision: true,
  },
  [BLOCK.WATER]: {
    name: "Water",
    label: "水",
    color: "#4ca8d8",
    transparent: true,
    liquid: true,
    collision: false,
    selectable: true,
  },
  [BLOCK.OAK_LOG]: {
    name: "Oak Log",
    label: "原木",
    color: "#8a5b2d",
    top: "#b0834c",
    hardness: 2,
    tool: "axe",
    selectable: true,
    collision: true,
  },
  [BLOCK.LEAVES]: {
    name: "Leaves",
    label: "树叶",
    color: "#3f8a38",
    transparent: true,
    hardness: 0.2,
    selectable: true,
    collision: true,
  },
  [BLOCK.COAL_ORE]: {
    name: "Coal Ore",
    label: "煤矿石",
    color: "#767b73",
    speck: "#242424",
    hardness: 3,
    tool: "pickaxe",
    tier: 1,
    drop: BLOCK.COAL_ORE,
    selectable: true,
    collision: true,
  },
  [BLOCK.IRON_ORE]: {
    name: "Iron Ore",
    label: "铁矿石",
    color: "#847d72",
    speck: "#d08b5f",
    hardness: 3,
    tool: "pickaxe",
    tier: 1,
    drop: BLOCK.IRON_ORE,
    selectable: true,
    collision: true,
  },
  [BLOCK.PLANKS]: {
    name: "Planks",
    label: "木板",
    color: "#b88747",
    hardness: 2,
    tool: "axe",
    selectable: true,
    collision: true,
  },
  [BLOCK.GLASS]: {
    name: "Glass",
    label: "玻璃",
    color: "#b9edf0",
    transparent: true,
    alpha: 0.35,
    hardness: 0.3,
    selectable: true,
    collision: true,
  },
  [BLOCK.TORCH]: {
    name: "Torch",
    label: "火把",
    color: "#f3ca55",
    emissive: true,
    hardness: 0,
    selectable: true,
    collision: false,
  },
  [BLOCK.CRAFTING]: {
    name: "Crafting Table",
    label: "工作台",
    color: "#9a6434",
    top: "#c99a54",
    hardness: 2.5,
    tool: "axe",
    selectable: true,
    collision: true,
  },
  [BLOCK.FURNACE]: {
    name: "Furnace",
    label: "熔炉",
    color: "#676b67",
    front: "#3b3d39",
    hardness: 3.5,
    tool: "pickaxe",
    tier: 0,
    selectable: true,
    collision: true,
  },
  [BLOCK.BEDROCK]: {
    name: "Bedrock",
    label: "基岩",
    color: "#3b3c40",
    hardness: Infinity,
    selectable: false,
    collision: true,
  },
  [BLOCK.CLAY]: {
    name: "Clay",
    label: "黏土",
    color: "#9ca7ad",
    hardness: 0.6,
    tool: "shovel",
    selectable: true,
    collision: true,
  },
  [BLOCK.SNOW]: {
    name: "Snow",
    label: "雪块",
    color: "#eef6f5",
    hardness: 0.4,
    tool: "shovel",
    selectable: true,
    collision: true,
  },
  [BLOCK.FARMLAND]: {
    name: "Farmland",
    label: "耕地",
    color: "#5f4128",
    top: "#735030",
    hardness: 0.6,
    tool: "shovel",
    drop: BLOCK.DIRT,
    selectable: true,
    collision: true,
  },
  [BLOCK.WHEAT_CROP]: {
    name: "Young Wheat",
    label: "小麦苗",
    color: "#79a83f",
    transparent: true,
    hardness: 0.1,
    drop: ITEM.WHEAT_SEEDS,
    selectable: false,
    collision: false,
  },
  [BLOCK.WHEAT_READY]: {
    name: "Mature Wheat",
    label: "成熟小麦",
    color: "#d2b34b",
    transparent: true,
    hardness: 0.1,
    drop: ITEM.WHEAT,
    selectable: false,
    collision: false,
  },
  [BLOCK.COBBLESTONE]: {
    name: "Cobblestone",
    label: "圆石",
    color: "#777b77",
    speck: "#565b56",
    hardness: 2,
    tool: "pickaxe",
    tier: 0,
    selectable: true,
    collision: true,
  },
  [BLOCK.DOOR]: {
    name: "Wooden Door",
    label: "木门",
    color: "#8e5b2d",
    front: "#6c411f",
    hardness: 2,
    tool: "axe",
    shape: "door",
    selectable: true,
    collision: true,
  },
  [BLOCK.OPEN_DOOR]: {
    name: "Open Door",
    label: "打开的木门",
    color: "#9c6a35",
    transparent: true,
    hardness: 2,
    tool: "axe",
    drop: BLOCK.DOOR,
    shape: "door",
    selectable: false,
    collision: true,
  },
  [BLOCK.LADDER]: {
    name: "Ladder",
    label: "梯子",
    color: "#b1783d",
    transparent: true,
    hardness: 0.5,
    tool: "axe",
    selectable: true,
    collision: false,
  },
  [BLOCK.REDSTONE_WIRE]: {
    name: "Redstone Wire",
    label: "红石线",
    color: "#7b1f1f",
    transparent: true,
    hardness: 0.1,
    selectable: true,
    collision: false,
  },
  [BLOCK.REDSTONE_WIRE_ON]: {
    name: "Powered Redstone Wire",
    label: "通电红石线",
    color: "#f0443e",
    transparent: true,
    emissive: true,
    hardness: 0.1,
    drop: BLOCK.REDSTONE_WIRE,
    selectable: false,
    collision: false,
  },
  [BLOCK.LEVER]: {
    name: "Lever",
    label: "拉杆",
    color: "#8b8172",
    top: "#b38452",
    transparent: true,
    hardness: 0.5,
    selectable: true,
    collision: false,
  },
  [BLOCK.LEVER_ON]: {
    name: "Lever On",
    label: "开启的拉杆",
    color: "#d0a15d",
    top: "#ffca6b",
    transparent: true,
    emissive: true,
    hardness: 0.5,
    drop: BLOCK.LEVER,
    selectable: false,
    collision: false,
  },
  [BLOCK.REDSTONE_LAMP]: {
    name: "Redstone Lamp",
    label: "红石灯",
    color: "#73624d",
    speck: "#9b835b",
    hardness: 0.3,
    selectable: true,
    collision: true,
  },
  [BLOCK.REDSTONE_LAMP_ON]: {
    name: "Lit Redstone Lamp",
    label: "点亮的红石灯",
    color: "#ffd56a",
    speck: "#fff2a8",
    emissive: true,
    hardness: 0.3,
    drop: BLOCK.REDSTONE_LAMP,
    selectable: false,
    collision: true,
  },
  [BLOCK.CHEST]: {
    name: "Chest",
    label: "箱子",
    color: "#a7652c",
    top: "#c4863f",
    front: "#6e431f",
    hardness: 2.5,
    tool: "axe",
    selectable: true,
    collision: true,
  },
  [BLOCK.PATH]: {
    name: "Path",
    label: "道路",
    color: "#9b7a45",
    top: "#b49a5d",
    hardness: 0.6,
    tool: "shovel",
    drop: BLOCK.DIRT,
    selectable: true,
    collision: true,
  },
  [BLOCK.BED]: {
    name: "Bed",
    label: "床",
    color: "#b23f36",
    top: "#e4e0d0",
    side: "#8d5a38",
    hardness: 0.4,
    tool: "axe",
    selectable: true,
    collision: true,
  },
  [BLOCK.ENCHANTING_TABLE]: {
    name: "Enchanting Table",
    label: "附魔台",
    color: "#2d315f",
    top: "#7d415d",
    front: "#c9b36d",
    speck: "#63d4c4",
    hardness: 4,
    tool: "pickaxe",
    tier: 1,
    selectable: true,
    collision: true,
  },
  [BLOCK.BREWING_STAND]: {
    name: "Brewing Stand",
    label: "酿造台",
    color: "#6d6758",
    top: "#d7ba63",
    front: "#3c3631",
    speck: "#8be0d8",
    transparent: true,
    hardness: 0.5,
    tool: "pickaxe",
    tier: 0,
    selectable: true,
    collision: false,
  },
  [BLOCK.OAK_SLAB]: {
    name: "Oak Slab",
    label: "木半砖",
    color: "#b88747",
    hardness: 2,
    tool: "axe",
    shape: "slab",
    drop: BLOCK.OAK_SLAB,
    selectable: true,
    collision: true,
  },
  [BLOCK.COBBLESTONE_SLAB]: {
    name: "Cobblestone Slab",
    label: "圆石半砖",
    color: "#777b77",
    speck: "#565b56",
    hardness: 2,
    tool: "pickaxe",
    tier: 0,
    shape: "slab",
    drop: BLOCK.COBBLESTONE_SLAB,
    selectable: true,
    collision: true,
  },
  [BLOCK.OAK_STAIRS]: {
    name: "Oak Stairs",
    label: "木楼梯",
    color: "#b88747",
    hardness: 2,
    tool: "axe",
    shape: "stairs",
    drop: BLOCK.OAK_STAIRS,
    selectable: true,
    collision: true,
  },
  [BLOCK.COBBLESTONE_STAIRS]: {
    name: "Cobblestone Stairs",
    label: "圆石楼梯",
    color: "#777b77",
    speck: "#565b56",
    hardness: 2,
    tool: "pickaxe",
    tier: 0,
    shape: "stairs",
    drop: BLOCK.COBBLESTONE_STAIRS,
    selectable: true,
    collision: true,
  },
  [BLOCK.GRAVEL]: {
    name: "Gravel",
    label: "沙砾",
    color: "#8d877d",
    speck: "#5f5a52",
    hardness: 0.6,
    tool: "shovel",
    selectable: true,
    collision: true,
  },
  [BLOCK.RAIL]: {
    name: "Rail",
    label: "铁轨",
    color: "#5f584d",
    top: "#b7b0a2",
    hardness: 0.7,
    tool: "pickaxe",
    tier: 0,
    shape: "rail",
    selectable: true,
    collision: false,
  },
  [BLOCK.POWERED_RAIL]: {
    name: "Powered Rail",
    label: "动力铁轨",
    color: "#77613a",
    top: "#c8a647",
    hardness: 0.7,
    tool: "pickaxe",
    tier: 0,
    shape: "rail",
    selectable: true,
    collision: false,
  },
  [BLOCK.POWERED_RAIL_ON]: {
    name: "Powered Rail On",
    label: "通电动力铁轨",
    color: "#c88c3a",
    top: "#ffd45c",
    emissive: true,
    hardness: 0.7,
    tool: "pickaxe",
    tier: 0,
    drop: BLOCK.POWERED_RAIL,
    shape: "rail",
    selectable: false,
    collision: false,
  },
  [BLOCK.PRESSURE_PLATE]: {
    name: "Pressure Plate",
    label: "压力板",
    color: "#b88747",
    top: "#d0a15d",
    hardness: 0.5,
    tool: "axe",
    shape: "plate",
    selectable: true,
    collision: false,
  },
  [BLOCK.PRESSURE_PLATE_ON]: {
    name: "Powered Pressure Plate",
    label: "踩下的压力板",
    color: "#d0a15d",
    top: "#f0c861",
    emissive: true,
    hardness: 0.5,
    tool: "axe",
    drop: BLOCK.PRESSURE_PLATE,
    shape: "plate",
    selectable: false,
    collision: false,
  },
  [BLOCK.BUTTON]: {
    name: "Button",
    label: "按钮",
    color: "#9b8b76",
    top: "#c1b29a",
    hardness: 0.5,
    tool: "pickaxe",
    shape: "button",
    selectable: true,
    collision: false,
  },
  [BLOCK.BUTTON_ON]: {
    name: "Button On",
    label: "按下的按钮",
    color: "#c1b29a",
    top: "#f0d18b",
    emissive: true,
    hardness: 0.5,
    tool: "pickaxe",
    drop: BLOCK.BUTTON,
    shape: "button",
    selectable: false,
    collision: false,
  },
  [BLOCK.REPEATER]: {
    name: "Repeater",
    label: "中继器",
    color: "#6f6861",
    top: "#b6aaa0",
    hardness: 0.6,
    tool: "pickaxe",
    tier: 0,
    shape: "repeater",
    selectable: true,
    collision: false,
  },
  [BLOCK.REPEATER_ON]: {
    name: "Repeater On",
    label: "通电中继器",
    color: "#9a8170",
    top: "#f3d2a0",
    emissive: true,
    hardness: 0.6,
    tool: "pickaxe",
    tier: 0,
    drop: BLOCK.REPEATER,
    shape: "repeater",
    selectable: false,
    collision: false,
  },
  [BLOCK.OBSERVER]: {
    name: "Observer",
    label: "侦测器",
    color: "#5d6267",
    top: "#8f969c",
    front: "#3e454a",
    speck: "#2c3035",
    hardness: 1.8,
    tool: "pickaxe",
    tier: 0,
    shape: "observer",
    selectable: true,
    collision: true,
  },
  [BLOCK.OBSERVER_ON]: {
    name: "Observer Pulse",
    label: "脉冲侦测器",
    color: "#7b848c",
    top: "#b3c4cf",
    front: "#ff6c4a",
    speck: "#ffcf7a",
    emissive: true,
    hardness: 1.8,
    tool: "pickaxe",
    tier: 0,
    drop: BLOCK.OBSERVER,
    shape: "observer",
    selectable: false,
    collision: true,
  },
  [BLOCK.PISTON]: {
    name: "Piston",
    label: "活塞",
    color: "#7f7569",
    top: "#c49a55",
    front: "#d6b877",
    hardness: 1.4,
    tool: "pickaxe",
    tier: 0,
    shape: "piston",
    selectable: true,
    collision: true,
  },
  [BLOCK.PISTON_ON]: {
    name: "Extended Piston",
    label: "伸出的活塞",
    color: "#8f8373",
    top: "#d2ab68",
    front: "#e3c78a",
    emissive: true,
    hardness: 1.4,
    tool: "pickaxe",
    tier: 0,
    drop: BLOCK.PISTON,
    shape: "piston",
    selectable: false,
    collision: true,
  },
  [BLOCK.PISTON_HEAD]: {
    name: "Piston Head",
    label: "活塞头",
    color: "#d0a466",
    top: "#e0bf7e",
    front: "#f1d99a",
    hardness: 1.4,
    tool: "pickaxe",
    tier: 0,
    drop: null,
    shape: "piston_head",
    selectable: false,
    collision: true,
  },
};

const ITEMS = {
  [ITEM.WOOD_PICKAXE]: {
    name: "Wooden Pickaxe",
    label: "木镐",
    color: "#b88747",
    selectable: true,
    tool: { kind: "pickaxe", tier: 1, speed: 2.2, damage: 4, durability: 59 },
  },
  [ITEM.STONE_PICKAXE]: {
    name: "Stone Pickaxe",
    label: "石镐",
    color: "#8a8f87",
    selectable: true,
    tool: { kind: "pickaxe", tier: 2, speed: 3.4, damage: 5, durability: 131 },
  },
  [ITEM.IRON_PICKAXE]: {
    name: "Iron Pickaxe",
    label: "铁镐",
    color: "#d5d5cf",
    selectable: true,
    tool: { kind: "pickaxe", tier: 3, speed: 5.2, damage: 6, durability: 250 },
  },
  [ITEM.WOOD_AXE]: {
    name: "Wooden Axe",
    label: "木斧",
    color: "#a87338",
    selectable: true,
    tool: { kind: "axe", tier: 1, speed: 2.4, damage: 6, durability: 59 },
  },
  [ITEM.WOOD_SHOVEL]: {
    name: "Wooden Shovel",
    label: "木锹",
    color: "#c2955a",
    selectable: true,
    tool: { kind: "shovel", tier: 1, speed: 2.6, damage: 3, durability: 59 },
  },
  [ITEM.WOOD_HOE]: {
    name: "Wooden Hoe",
    label: "木锄",
    color: "#c49a55",
    selectable: true,
    tool: { kind: "hoe", tier: 1, speed: 1.2, damage: 2, durability: 59 },
  },
  [ITEM.WOOD_SWORD]: {
    name: "Wooden Sword",
    label: "木剑",
    color: "#b88747",
    selectable: true,
    tool: { kind: "sword", tier: 1, speed: 1.8, damage: 7, durability: 59 },
  },
  [ITEM.WHEAT_SEEDS]: {
    name: "Wheat Seeds",
    label: "小麦种子",
    color: "#8fbf4d",
    selectable: true,
  },
  [ITEM.WHEAT]: {
    name: "Wheat",
    label: "小麦",
    color: "#d5b14f",
    selectable: true,
  },
  [ITEM.BREAD]: {
    name: "Bread",
    label: "面包",
    color: "#c9893c",
    selectable: true,
    food: { hunger: 5, health: 1 },
  },
  [ITEM.RAW_MUTTON]: {
    name: "Raw Mutton",
    label: "生肉",
    color: "#b86161",
    selectable: true,
    food: { hunger: 2, health: 0 },
  },
  [ITEM.COOKED_MUTTON]: {
    name: "Cooked Mutton",
    label: "熟肉",
    color: "#8d4d2d",
    selectable: true,
    food: { hunger: 6, health: 2 },
  },
  [ITEM.IRON_INGOT]: {
    name: "Iron Ingot",
    label: "铁锭",
    color: "#d7d7cf",
    selectable: true,
  },
  [ITEM.CHARCOAL]: {
    name: "Charcoal",
    label: "木炭",
    color: "#30302e",
    selectable: true,
  },
  [ITEM.IRON_HELMET]: {
    name: "Iron Helmet",
    label: "铁头盔",
    color: "#c9cbc4",
    selectable: true,
    armor: { slot: "head", defense: 2, durability: 165 },
  },
  [ITEM.IRON_CHESTPLATE]: {
    name: "Iron Chestplate",
    label: "铁胸甲",
    color: "#d0d2cb",
    selectable: true,
    armor: { slot: "chest", defense: 6, durability: 240 },
  },
  [ITEM.IRON_LEGGINGS]: {
    name: "Iron Leggings",
    label: "铁护腿",
    color: "#c3c7c0",
    selectable: true,
    armor: { slot: "legs", defense: 5, durability: 225 },
  },
  [ITEM.IRON_BOOTS]: {
    name: "Iron Boots",
    label: "铁靴子",
    color: "#b8bbb4",
    selectable: true,
    armor: { slot: "feet", defense: 2, durability: 195 },
  },
  [ITEM.EMERALD]: {
    name: "Emerald",
    label: "绿宝石",
    color: "#30b86d",
    selectable: true,
  },
  [ITEM.WOOL]: {
    name: "Wool",
    label: "羊毛",
    color: "#f1f1df",
    selectable: true,
  },
  [ITEM.BOW]: {
    name: "Bow",
    label: "弓",
    color: "#8b5a2b",
    selectable: true,
    tool: { kind: "bow", tier: 1, speed: 1, damage: 5, durability: 384 },
  },
  [ITEM.ARROW]: {
    name: "Arrow",
    label: "箭",
    color: "#d8d4bd",
    selectable: true,
  },
  [ITEM.FLINT]: {
    name: "Flint",
    label: "燧石",
    color: "#4f5658",
    selectable: true,
  },
  [ITEM.BONE]: {
    name: "Bone",
    label: "骨头",
    color: "#e8e4cf",
    selectable: true,
  },
  [ITEM.GLASS_BOTTLE]: {
    name: "Glass Bottle",
    label: "玻璃瓶",
    color: "#d8f7fa",
    selectable: true,
  },
  [ITEM.WATER_BOTTLE]: {
    name: "Water Bottle",
    label: "水瓶",
    color: "#77bde8",
    selectable: true,
  },
  [ITEM.HEALING_POTION]: {
    name: "Healing Potion",
    label: "治疗药水",
    color: "#e85d72",
    selectable: true,
    potion: { key: "healing", heal: 8 },
  },
  [ITEM.SWIFTNESS_POTION]: {
    name: "Swiftness Potion",
    label: "迅捷药水",
    color: "#68c8ff",
    selectable: true,
    potion: { key: "swiftness", duration: 45, amplifier: 1 },
  },
  [ITEM.STRENGTH_POTION]: {
    name: "Strength Potion",
    label: "力量药水",
    color: "#c43d3a",
    selectable: true,
    potion: { key: "strength", duration: 45, amplifier: 1 },
  },
  [ITEM.BOAT]: {
    name: "Boat",
    label: "木船",
    color: "#8b5a2b",
    selectable: true,
  },
  [ITEM.MINECART]: {
    name: "Minecart",
    label: "矿车",
    color: "#868b8c",
    selectable: true,
  },
};

const CATALOG = { ...BLOCKS, ...ITEMS };

const HOTBAR_DEFAULT = [
  ITEM.WOOD_PICKAXE,
  ITEM.WOOD_SHOVEL,
  BLOCK.PLANKS,
  BLOCK.OAK_LOG,
  BLOCK.TORCH,
  ITEM.WOOD_HOE,
  ITEM.WHEAT_SEEDS,
  ITEM.BOW,
  ITEM.WOOD_SWORD,
];

const RECIPES = [
  {
    label: "原木 -> 木板 x4",
    input: { [BLOCK.OAK_LOG]: 1 },
    output: { [BLOCK.PLANKS]: 4 },
    station: "hand",
  },
  {
    label: "木板 x4 -> 工作台",
    input: { [BLOCK.PLANKS]: 4 },
    output: { [BLOCK.CRAFTING]: 1 },
    station: "hand",
  },
  {
    label: "圆石 x8 -> 熔炉",
    input: { [BLOCK.COBBLESTONE]: 8 },
    output: { [BLOCK.FURNACE]: 1 },
    station: "crafting",
  },
  {
    label: "木板 x3 -> 木门 x2",
    input: { [BLOCK.PLANKS]: 3 },
    output: { [BLOCK.DOOR]: 2 },
    station: "crafting",
  },
  {
    label: "木板 x3 + 羊毛 x3 -> 床",
    input: { [BLOCK.PLANKS]: 3, [ITEM.WOOL]: 3 },
    output: { [BLOCK.BED]: 1 },
    station: "crafting",
  },
  {
    label: "木板 x3 + 羊毛 -> 弓",
    input: { [BLOCK.PLANKS]: 3, [ITEM.WOOL]: 1 },
    output: { [ITEM.BOW]: 1 },
    station: "crafting",
  },
  {
    label: "木板 x5 -> 木船",
    input: { [BLOCK.PLANKS]: 5 },
    output: { [ITEM.BOAT]: 1 },
    station: "crafting",
  },
  {
    label: "铁锭 x5 -> 矿车",
    input: { [ITEM.IRON_INGOT]: 5 },
    output: { [ITEM.MINECART]: 1 },
    station: "crafting",
  },
  {
    label: "铁锭 + 木板 -> 铁轨 x8",
    input: { [ITEM.IRON_INGOT]: 1, [BLOCK.PLANKS]: 1 },
    output: { [BLOCK.RAIL]: 8 },
    station: "crafting",
  },
  {
    label: "铁锭 + 红石线 -> 动力铁轨 x4",
    input: { [ITEM.IRON_INGOT]: 1, [BLOCK.REDSTONE_WIRE]: 1 },
    output: { [BLOCK.POWERED_RAIL]: 4 },
    station: "crafting",
  },
  {
    label: "圆石 + 红石线 + 火把 -> 中继器",
    input: { [BLOCK.COBBLESTONE]: 1, [BLOCK.REDSTONE_WIRE]: 1, [BLOCK.TORCH]: 1 },
    output: { [BLOCK.REPEATER]: 1 },
    station: "crafting",
  },
  {
    label: "圆石 x2 + 红石线 -> 侦测器",
    input: { [BLOCK.COBBLESTONE]: 2, [BLOCK.REDSTONE_WIRE]: 1 },
    output: { [BLOCK.OBSERVER]: 1 },
    station: "crafting",
  },
  {
    label: "木板 x3 + 圆石 x4 + 红石线 -> 活塞",
    input: { [BLOCK.PLANKS]: 3, [BLOCK.COBBLESTONE]: 4, [BLOCK.REDSTONE_WIRE]: 1 },
    output: { [BLOCK.PISTON]: 1 },
    station: "crafting",
  },
  {
    label: "圆石 -> 按钮",
    input: { [BLOCK.COBBLESTONE]: 1 },
    output: { [BLOCK.BUTTON]: 1 },
    station: "hand",
  },
  {
    label: "木板 x2 -> 压力板 x2",
    input: { [BLOCK.PLANKS]: 2 },
    output: { [BLOCK.PRESSURE_PLATE]: 2 },
    station: "crafting",
  },
  {
    label: "木板 + 骨头 -> 箭 x4",
    input: { [BLOCK.PLANKS]: 1, [ITEM.BONE]: 1 },
    output: { [ITEM.ARROW]: 4 },
    station: "crafting",
  },
  {
    label: "燧石 + 木板 -> 箭 x4",
    input: { [ITEM.FLINT]: 1, [BLOCK.PLANKS]: 1 },
    output: { [ITEM.ARROW]: 4 },
    station: "crafting",
  },
  {
    label: "木棍替代: 木板 x2 -> 梯子 x3",
    input: { [BLOCK.PLANKS]: 2 },
    output: { [BLOCK.LADDER]: 3 },
    station: "crafting",
  },
  {
    label: "木板 x3 -> 木半砖 x6",
    input: { [BLOCK.PLANKS]: 3 },
    output: { [BLOCK.OAK_SLAB]: 6 },
    station: "crafting",
  },
  {
    label: "圆石 x3 -> 圆石半砖 x6",
    input: { [BLOCK.COBBLESTONE]: 3 },
    output: { [BLOCK.COBBLESTONE_SLAB]: 6 },
    station: "crafting",
  },
  {
    label: "木板 x6 -> 木楼梯 x4",
    input: { [BLOCK.PLANKS]: 6 },
    output: { [BLOCK.OAK_STAIRS]: 4 },
    station: "crafting",
  },
  {
    label: "圆石 x6 -> 圆石楼梯 x4",
    input: { [BLOCK.COBBLESTONE]: 6 },
    output: { [BLOCK.COBBLESTONE_STAIRS]: 4 },
    station: "crafting",
  },
  {
    label: "木板 x2 -> 木剑",
    input: { [BLOCK.PLANKS]: 2 },
    output: { [ITEM.WOOD_SWORD]: 1 },
    station: "crafting",
  },
  {
    label: "木板 x3 -> 木镐",
    input: { [BLOCK.PLANKS]: 3 },
    output: { [ITEM.WOOD_PICKAXE]: 1 },
    station: "crafting",
  },
  {
    label: "圆石 x3 + 木板 -> 石镐",
    input: { [BLOCK.COBBLESTONE]: 3, [BLOCK.PLANKS]: 1 },
    output: { [ITEM.STONE_PICKAXE]: 1 },
    station: "crafting",
  },
  {
    label: "铁锭 x3 + 木板 -> 铁镐",
    input: { [ITEM.IRON_INGOT]: 3, [BLOCK.PLANKS]: 1 },
    output: { [ITEM.IRON_PICKAXE]: 1 },
    station: "crafting",
  },
  {
    label: "木板 x2 -> 木斧",
    input: { [BLOCK.PLANKS]: 2 },
    output: { [ITEM.WOOD_AXE]: 1 },
    station: "crafting",
  },
  {
    label: "木板 x1 -> 木锹",
    input: { [BLOCK.PLANKS]: 1 },
    output: { [ITEM.WOOD_SHOVEL]: 1 },
    station: "crafting",
  },
  {
    label: "木板 x2 -> 木锄",
    input: { [BLOCK.PLANKS]: 2 },
    output: { [ITEM.WOOD_HOE]: 1 },
    station: "crafting",
  },
  {
    label: "小麦 x3 -> 面包",
    input: { [ITEM.WHEAT]: 3 },
    output: { [ITEM.BREAD]: 1 },
    station: "crafting",
  },
  {
    label: "煤矿石/木炭 + 木板 -> 火把 x4",
    input: { [BLOCK.COAL_ORE]: 1, [BLOCK.PLANKS]: 1 },
    output: { [BLOCK.TORCH]: 4 },
    station: "hand",
  },
  {
    label: "木炭 + 木板 -> 火把 x4",
    input: { [ITEM.CHARCOAL]: 1, [BLOCK.PLANKS]: 1 },
    output: { [BLOCK.TORCH]: 4 },
    station: "hand",
  },
  {
    label: "煤矿石 + 铁锭 -> 红石线 x4",
    input: { [BLOCK.COAL_ORE]: 1, [ITEM.IRON_INGOT]: 1 },
    output: { [BLOCK.REDSTONE_WIRE]: 4 },
    station: "crafting",
  },
  {
    label: "圆石 + 红石线 -> 拉杆",
    input: { [BLOCK.COBBLESTONE]: 1, [BLOCK.REDSTONE_WIRE]: 1 },
    output: { [BLOCK.LEVER]: 1 },
    station: "crafting",
  },
  {
    label: "玻璃 + 红石线 -> 红石灯",
    input: { [BLOCK.GLASS]: 1, [BLOCK.REDSTONE_WIRE]: 1 },
    output: { [BLOCK.REDSTONE_LAMP]: 1 },
    station: "crafting",
  },
  {
    label: "铁锭 x2 + 红石线 x2 + 绿宝石 -> 附魔台",
    input: { [ITEM.IRON_INGOT]: 2, [BLOCK.REDSTONE_WIRE]: 2, [ITEM.EMERALD]: 1 },
    output: { [BLOCK.ENCHANTING_TABLE]: 1 },
    station: "crafting",
  },
  {
    label: "圆石 x3 + 铁锭 + 红石线 -> 酿造台",
    input: { [BLOCK.COBBLESTONE]: 3, [ITEM.IRON_INGOT]: 1, [BLOCK.REDSTONE_WIRE]: 1 },
    output: { [BLOCK.BREWING_STAND]: 1 },
    station: "crafting",
  },
  {
    label: "玻璃 -> 玻璃瓶 x3",
    input: { [BLOCK.GLASS]: 1 },
    output: { [ITEM.GLASS_BOTTLE]: 3 },
    station: "crafting",
  },
  {
    label: "铁锭 x5 -> 铁头盔",
    input: { [ITEM.IRON_INGOT]: 5 },
    output: { [ITEM.IRON_HELMET]: 1 },
    station: "crafting",
  },
  {
    label: "铁锭 x8 -> 铁胸甲",
    input: { [ITEM.IRON_INGOT]: 8 },
    output: { [ITEM.IRON_CHESTPLATE]: 1 },
    station: "crafting",
  },
  {
    label: "铁锭 x7 -> 铁护腿",
    input: { [ITEM.IRON_INGOT]: 7 },
    output: { [ITEM.IRON_LEGGINGS]: 1 },
    station: "crafting",
  },
  {
    label: "铁锭 x4 -> 铁靴子",
    input: { [ITEM.IRON_INGOT]: 4 },
    output: { [ITEM.IRON_BOOTS]: 1 },
    station: "crafting",
  },
];

const SMELTING_RECIPES = [
  {
    label: "冶炼: 铁矿石 + 燃料 -> 铁锭",
    input: { [BLOCK.IRON_ORE]: 1 },
    fuel: 1,
    output: { [ITEM.IRON_INGOT]: 1 },
    station: "furnace",
  },
  {
    label: "冶炼: 沙子 + 燃料 -> 玻璃",
    input: { [BLOCK.SAND]: 1 },
    fuel: 1,
    output: { [BLOCK.GLASS]: 1 },
    station: "furnace",
  },
  {
    label: "烧制: 生肉 + 燃料 -> 熟肉",
    input: { [ITEM.RAW_MUTTON]: 1 },
    fuel: 1,
    output: { [ITEM.COOKED_MUTTON]: 1 },
    station: "furnace",
  },
  {
    label: "烧制: 原木 -> 木炭",
    input: { [BLOCK.OAK_LOG]: 1 },
    fuel: 1,
    output: { [ITEM.CHARCOAL]: 1 },
    station: "furnace",
  },
];

const BREWING_RECIPES = [
  {
    label: "玻璃瓶 + 水 -> 水瓶",
    input: { [ITEM.GLASS_BOTTLE]: 1, [BLOCK.WATER]: 1 },
    output: { [ITEM.WATER_BOTTLE]: 1 },
  },
  {
    label: "水瓶 + 熟肉 -> 治疗药水",
    input: { [ITEM.WATER_BOTTLE]: 1, [ITEM.COOKED_MUTTON]: 1 },
    output: { [ITEM.HEALING_POTION]: 1 },
  },
  {
    label: "水瓶 + 小麦 -> 迅捷药水",
    input: { [ITEM.WATER_BOTTLE]: 1, [ITEM.WHEAT]: 1 },
    output: { [ITEM.SWIFTNESS_POTION]: 1 },
  },
  {
    label: "水瓶 + 骨头 -> 力量药水",
    input: { [ITEM.WATER_BOTTLE]: 1, [ITEM.BONE]: 1 },
    output: { [ITEM.STRENGTH_POTION]: 1 },
  },
];

const FUEL_ITEMS = [BLOCK.COAL_ORE, ITEM.CHARCOAL, BLOCK.OAK_LOG, BLOCK.PLANKS];
const VEHICLE_TYPES = new Set(["boat", "minecart"]);
const EFFECTS = {
  swiftness: { label: "迅捷", color: "#68c8ff" },
  strength: { label: "力量", color: "#d85b50" },
};
const ENCHANTMENTS = [
  {
    key: "efficiency",
    label: "效率",
    maxLevel: 3,
    material: ITEM.EMERALD,
    appliesTo: (id) => {
      const tool = toolInfo(id);
      return Boolean(tool && !["bow", "sword"].includes(tool.kind));
    },
    effect: "挖掘速度 +35%/级",
  },
  {
    key: "power",
    label: "力量",
    maxLevel: 3,
    material: ITEM.EMERALD,
    appliesTo: (id) => toolInfo(id)?.kind === "bow",
    effect: "箭伤害 +2/级",
  },
  {
    key: "protection",
    label: "保护",
    maxLevel: 3,
    material: ITEM.EMERALD,
    appliesTo: (id) => isArmor(id),
    effect: "护甲值 +1/级",
  },
];

function itemDef(id) {
  return CATALOG[Number(id)] ?? {
    name: "Unknown",
    label: "未知",
    color: "#ffffff",
    selectable: false,
  };
}

function isKnownItem(id) {
  return Boolean(CATALOG[Number(id)]);
}

function isPlaceableBlock(id) {
  return Boolean(BLOCKS[Number(id)]?.selectable);
}

function toolInfo(id) {
  return ITEMS[Number(id)]?.tool ?? null;
}

function armorInfo(id) {
  return ITEMS[Number(id)]?.armor ?? null;
}

function isTool(id) {
  return Boolean(toolInfo(id));
}

function isArmor(id) {
  return Boolean(armorInfo(id));
}

function persistentBlockId(id) {
  if (id === BLOCK.REDSTONE_WIRE_ON) return BLOCK.REDSTONE_WIRE;
  if (id === BLOCK.REDSTONE_LAMP_ON) return BLOCK.REDSTONE_LAMP;
  if (id === BLOCK.PRESSURE_PLATE_ON) return BLOCK.PRESSURE_PLATE;
  if (id === BLOCK.BUTTON_ON) return BLOCK.BUTTON;
  if (id === BLOCK.POWERED_RAIL_ON) return BLOCK.POWERED_RAIL;
  if (id === BLOCK.REPEATER_ON) return BLOCK.REPEATER;
  if (id === BLOCK.OBSERVER_ON) return BLOCK.OBSERVER;
  if (id === BLOCK.PISTON_ON) return BLOCK.PISTON;
  if (id === BLOCK.PISTON_HEAD) return BLOCK.AIR;
  return id;
}

function isPressurePlateBlock(id) {
  return id === BLOCK.PRESSURE_PLATE || id === BLOCK.PRESSURE_PLATE_ON;
}

function isButtonBlock(id) {
  return id === BLOCK.BUTTON || id === BLOCK.BUTTON_ON;
}

function isRepeaterBlock(id) {
  return id === BLOCK.REPEATER || id === BLOCK.REPEATER_ON;
}

function isObserverBlock(id) {
  return id === BLOCK.OBSERVER || id === BLOCK.OBSERVER_ON;
}

function isPistonBlock(id) {
  return id === BLOCK.PISTON || id === BLOCK.PISTON_ON;
}

function isPistonHeadBlock(id) {
  return id === BLOCK.PISTON_HEAD;
}

function isDoorBlock(id) {
  return id === BLOCK.DOOR || id === BLOCK.OPEN_DOOR;
}

function isRailBlock(id) {
  return id === BLOCK.RAIL || id === BLOCK.POWERED_RAIL || id === BLOCK.POWERED_RAIL_ON;
}

function isPoweredRailBlock(id) {
  return id === BLOCK.POWERED_RAIL || id === BLOCK.POWERED_RAIL_ON;
}

function isVehicleType(type) {
  return VEHICLE_TYPES.has(type);
}

function vehicleItem(type) {
  return type === "boat" ? ITEM.BOAT : type === "minecart" ? ITEM.MINECART : null;
}

function playerHasItemForUse(id) {
  return player.mode === "creative" || (player.inventory.get(Number(id)) ?? 0) > 0;
}

function usableToolInfo(id) {
  const tool = toolInfo(id);
  if (!tool || !playerHasItemForUse(id)) return null;
  return tool;
}

function toolKindLabel(kind) {
  return {
    pickaxe: "镐",
    shovel: "锹",
    axe: "斧",
    hoe: "锄",
    sword: "剑",
    bow: "弓",
  }[kind] ?? "工具";
}

function canHarvestBlock(blockId, toolId) {
  const block = BLOCKS[blockId];
  if (!block?.tool || block.tier === undefined) return true;
  const tool = usableToolInfo(toolId);
  if (!tool || tool.kind !== block.tool) return false;
  return tool.tier >= (block.tier ?? 0);
}

function canBreakBlock(blockId, toolId) {
  const block = BLOCKS[blockId];
  if (!block?.tool || block.tier === undefined || player.mode === "creative") return true;
  return canHarvestBlock(blockId, toolId);
}

function miningSpeedFor(blockId, toolId) {
  const block = BLOCKS[blockId];
  const tool = usableToolInfo(toolId);
  if (!block) return 1;
  if (!block.tool) return tool ? 1.15 : 1;
  if (!tool || tool.kind !== block.tool) return 0.45;
  return tool.speed * (1 + player.upgradeLevel(toolId, "efficiency") * 0.35);
}

function romanLevel(level) {
  return ["", "I", "II", "III", "IV", "V"][level] ?? String(level);
}

function enchantmentCost(entry, currentLevel) {
  return currentLevel + 1;
}

const FACING_ORDER = ["north", "east", "south", "west"];

function normalizeFacing(facing) {
  return FACING_ORDER.includes(facing) ? facing : "north";
}

function facingFromYaw(yaw) {
  const x = -Math.sin(yaw);
  const z = -Math.cos(yaw);
  if (Math.abs(x) > Math.abs(z)) return x > 0 ? "east" : "west";
  return z > 0 ? "south" : "north";
}

function rotatedFacing(facing, quarterTurns = 1) {
  const index = FACING_ORDER.indexOf(normalizeFacing(facing));
  return FACING_ORDER[mod(index + quarterTurns, FACING_ORDER.length)];
}

function facingVector(facing) {
  return {
    north: { x: 0, z: -1 },
    east: { x: 1, z: 0 },
    south: { x: 0, z: 1 },
    west: { x: -1, z: 0 },
  }[normalizeFacing(facing)];
}

function rotateBoxForFacing(box, facing) {
  const rotatePoint = (x, z) => {
    if (facing === "south") return [1 - x, 1 - z];
    if (facing === "east") return [1 - z, x];
    if (facing === "west") return [z, 1 - x];
    return [x, z];
  };
  const corners = [
    rotatePoint(box.minX, box.minZ),
    rotatePoint(box.maxX, box.minZ),
    rotatePoint(box.minX, box.maxZ),
    rotatePoint(box.maxX, box.maxZ),
  ];
  const xs = corners.map(([x]) => x);
  const zs = corners.map(([, z]) => z);
  return {
    minX: Math.min(...xs),
    minY: box.minY,
    minZ: Math.min(...zs),
    maxX: Math.max(...xs),
    maxY: box.maxY,
    maxZ: Math.max(...zs),
  };
}

function blockShapeBoxes(id, meta = null) {
  const shape = BLOCKS[id]?.shape;
  const facing = normalizeFacing(meta?.facing);
  if (shape === "slab") {
    return [{ minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 0.5, maxZ: 1 }];
  }
  if (shape === "rail") {
    return [
      { minX: 0.18, minY: 0.02, minZ: 0.04, maxX: 0.28, maxY: 0.08, maxZ: 0.96 },
      { minX: 0.72, minY: 0.02, minZ: 0.04, maxX: 0.82, maxY: 0.08, maxZ: 0.96 },
      { minX: 0.08, minY: 0.01, minZ: 0.2, maxX: 0.92, maxY: 0.05, maxZ: 0.3 },
      { minX: 0.08, minY: 0.01, minZ: 0.46, maxX: 0.92, maxY: 0.05, maxZ: 0.56 },
      { minX: 0.08, minY: 0.01, minZ: 0.72, maxX: 0.92, maxY: 0.05, maxZ: 0.82 },
    ];
  }
  if (shape === "plate") {
    return [{ minX: 0.08, minY: 0.01, minZ: 0.08, maxX: 0.92, maxY: 0.08, maxZ: 0.92 }];
  }
  if (shape === "button") {
    return [{ minX: 0.32, minY: 0.02, minZ: 0.32, maxX: 0.68, maxY: 0.16, maxZ: 0.68 }];
  }
  if (shape === "repeater") {
    const boxes = [
      { minX: 0.08, minY: 0.01, minZ: 0.08, maxX: 0.92, maxY: 0.08, maxZ: 0.92 },
      { minX: 0.28, minY: 0.08, minZ: 0.3, maxX: 0.42, maxY: 0.28, maxZ: 0.44 },
      { minX: 0.58, minY: 0.08, minZ: 0.56, maxX: 0.72, maxY: 0.28, maxZ: 0.7 },
    ];
    return boxes.map((box) => rotateBoxForFacing(box, facing));
  }
  if (shape === "observer") {
    const boxes = [
      { minX: 0.04, minY: 0.02, minZ: 0.04, maxX: 0.96, maxY: 0.92, maxZ: 0.96 },
      { minX: 0.22, minY: 0.22, minZ: 0.0, maxX: 0.38, maxY: 0.42, maxZ: 0.04 },
      { minX: 0.62, minY: 0.22, minZ: 0.0, maxX: 0.78, maxY: 0.42, maxZ: 0.04 },
      { minX: 0.32, minY: 0.62, minZ: 0.0, maxX: 0.68, maxY: 0.72, maxZ: 0.04 },
    ];
    return boxes.map((box) => rotateBoxForFacing(box, facing));
  }
  if (shape === "piston") {
    const boxes = [
      { minX: 0.02, minY: 0.02, minZ: 0.06, maxX: 0.98, maxY: 0.98, maxZ: 0.96 },
      { minX: 0.18, minY: 0.18, minZ: 0.0, maxX: 0.82, maxY: 0.82, maxZ: 0.12 },
    ];
    return boxes.map((box) => rotateBoxForFacing(box, facing));
  }
  if (shape === "piston_head") {
    const boxes = [
      { minX: 0.12, minY: 0.12, minZ: 0.0, maxX: 0.88, maxY: 0.88, maxZ: 0.28 },
      { minX: 0.34, minY: 0.34, minZ: 0.28, maxX: 0.66, maxY: 0.66, maxZ: 1.0 },
    ];
    return boxes.map((box) => rotateBoxForFacing(box, facing));
  }
  if (shape === "stairs") {
    if (facing === "south") {
      return [
        { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 0.5, maxZ: 0.5 },
        { minX: 0, minY: 0, minZ: 0.5, maxX: 1, maxY: 1, maxZ: 1 },
      ];
    }
    if (facing === "east") {
      return [
        { minX: 0, minY: 0, minZ: 0, maxX: 0.5, maxY: 0.5, maxZ: 1 },
        { minX: 0.5, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 },
      ];
    }
    if (facing === "west") {
      return [
        { minX: 0.5, minY: 0, minZ: 0, maxX: 1, maxY: 0.5, maxZ: 1 },
        { minX: 0, minY: 0, minZ: 0, maxX: 0.5, maxY: 1, maxZ: 1 },
      ];
    }
    return [
      { minX: 0, minY: 0, minZ: 0.5, maxX: 1, maxY: 0.5, maxZ: 1 },
      { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 0.5 },
    ];
  }
  if (shape === "door") {
    const effectiveFacing = id === BLOCK.OPEN_DOOR ? rotatedFacing(facing, 1) : facing;
    if (effectiveFacing === "south") return [{ minX: 0, minY: 0, minZ: 0.84, maxX: 1, maxY: 1, maxZ: 1 }];
    if (effectiveFacing === "east") return [{ minX: 0.84, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 }];
    if (effectiveFacing === "west") return [{ minX: 0, minY: 0, minZ: 0, maxX: 0.16, maxY: 1, maxZ: 1 }];
    return [{ minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 0.16 }];
  }
  return [{ minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 }];
}

function isShapedBlock(id) {
  return Boolean(BLOCKS[id]?.shape);
}

function pointInsideBlockShape(id, meta, point, x, y, z) {
  if (!isShapedBlock(id)) return true;
  const localX = point.x - x;
  const localY = point.y - y;
  const localZ = point.z - z;
  return blockShapeBoxes(id, meta).some(
    (box) =>
      localX >= box.minX &&
      localX <= box.maxX &&
      localY >= box.minY &&
      localY <= box.maxY &&
      localZ >= box.minZ &&
      localZ <= box.maxZ,
  );
}

function isFallingBlock(id) {
  return id === BLOCK.SAND || id === BLOCK.GRAVEL;
}

function blockOccludesFullFace(id) {
  const def = BLOCKS[id];
  return Boolean(def?.collision && !def.liquid && !def.transparent && !def.shape);
}

function collisionBoxesForBlock(id, x, y, z, meta = null) {
  const def = BLOCKS[id];
  if (!def?.collision) return [];
  return blockShapeBoxes(id, meta).map((box) => ({
    minX: x + box.minX,
    minY: y + box.minY,
    minZ: z + box.minZ,
    maxX: x + box.maxX,
    maxY: y + box.maxY,
    maxZ: z + box.maxZ,
  }));
}

function aabbIntersects(a, b) {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
}

function findFuel(player, recipe = null) {
  for (const id of FUEL_ITEMS) {
    const reservedInput = recipe?.input?.[id] ?? 0;
    if ((player.inventory.get(id) ?? 0) >= reservedInput + (recipe?.fuel ?? 1)) return id;
  }
  return null;
}

const FACE_DEFS = [
  {
    name: "east",
    normal: [1, 0, 0],
    corners: [
      [1, 0, 1],
      [1, 1, 1],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
  {
    name: "west",
    normal: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  {
    name: "up",
    normal: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    name: "down",
    normal: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  {
    name: "south",
    normal: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
      [1, 0, 1],
    ],
  },
  {
    name: "north",
    normal: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function isNightTime(time) {
  return Math.sin(time * Math.PI * 2) < -0.12;
}

function hash2(x, z, seed = 1337) {
  const n = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function hash3(x, y, z, seed = 1337) {
  const n =
    Math.sin(x * 157.13 + y * 113.71 + z * 271.9 + seed * 53.31) *
    43758.5453123;
  return n - Math.floor(n);
}

function valueNoise2(x, z, scale, seed) {
  const sx = x / scale;
  const sz = z / scale;
  const x0 = Math.floor(sx);
  const z0 = Math.floor(sz);
  const xf = smoothstep(sx - x0);
  const zf = smoothstep(sz - z0);
  const a = hash2(x0, z0, seed);
  const b = hash2(x0 + 1, z0, seed);
  const c = hash2(x0, z0 + 1, seed);
  const d = hash2(x0 + 1, z0 + 1, seed);
  return lerp(lerp(a, b, xf), lerp(c, d, xf), zf);
}

function valueNoise3(x, y, z, scale, seed) {
  const sx = x / scale;
  const sy = y / scale;
  const sz = z / scale;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const z0 = Math.floor(sz);
  const xf = smoothstep(sx - x0);
  const yf = smoothstep(sy - y0);
  const zf = smoothstep(sz - z0);

  const sample = (dx, dy, dz) => hash3(x0 + dx, y0 + dy, z0 + dz, seed);
  const x00 = lerp(sample(0, 0, 0), sample(1, 0, 0), xf);
  const x10 = lerp(sample(0, 1, 0), sample(1, 1, 0), xf);
  const x01 = lerp(sample(0, 0, 1), sample(1, 0, 1), xf);
  const x11 = lerp(sample(0, 1, 1), sample(1, 1, 1), xf);
  return lerp(lerp(x00, x10, yf), lerp(x01, x11, yf), zf);
}

function fbm2(x, z, seed, octaves = 4) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += valueNoise2(x * freq, z * freq, 24, seed + i * 19) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function fbm3(x, y, z, seed, octaves = 3) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += valueNoise3(x * freq, y * freq, z * freq, 18, seed + i * 29) * amp;
    norm += amp;
    amp *= 0.55;
    freq *= 1.9;
  }
  return sum / norm;
}

function worldKey(x, y, z) {
  return `${x},${y},${z}`;
}

function parseWorldKey(key) {
  return key.split(",").map(Number);
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function ensureAudioContext() {
  if (!soundState.enabled || !AudioContextCtor) return null;
  if (!soundState.context) {
    soundState.context = new AudioContextCtor();
  }
  if (soundState.context.state === "suspended") {
    soundState.context.resume?.();
  }
  soundState.unlocked = soundState.context.state !== "suspended";
  return soundState.context;
}

function rememberSound(name) {
  soundState.lastEvent = name;
  soundState.events.push(name);
  if (soundState.events.length > 12) soundState.events.shift();
}

function playTone(ctx, part, start) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const duration = part.duration ?? 0.08;
  const gainValue = part.gain ?? 0.03;
  const from = part.frequency ?? 320;
  const to = part.endFrequency ?? from;
  osc.type = part.wave ?? "square";
  osc.frequency.setValueAtTime(from, start);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playNoise(ctx, part, start) {
  const duration = part.duration ?? 0.06;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(part.filter ?? 900, start);
  gain.gain.setValueAtTime(part.gain ?? 0.04, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

function playSound(name) {
  rememberSound(name);
  const pattern = SOUND_PATTERNS[name];
  const ctx = ensureAudioContext();
  if (!pattern || !ctx) return false;
  const base = ctx.currentTime + 0.002;
  for (const part of pattern) {
    const start = base + (part.delay ?? 0);
    if (part.type === "noise") playNoise(ctx, part, start);
    else playTone(ctx, part, start);
  }
  soundState.played += 1;
  soundState.unlocked = ctx.state !== "suspended";
  return true;
}

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

function chunkIndex(x, y, z) {
  return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
}

function makeGeometry(buffers) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(buffers.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(buffers.normals, 3),
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(buffers.colors, 3),
  );
  geometry.setIndex(buffers.indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function addFace(buffers, x, y, z, face, color) {
  const base = buffers.positions.length / 3;
  for (const corner of face.corners) {
    buffers.positions.push(x + corner[0], y + corner[1], z + corner[2]);
    buffers.normals.push(...face.normal);
    buffers.colors.push(color.r, color.g, color.b);
  }
  buffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function cuboidFaceCorners(box, faceName) {
  const { minX, minY, minZ, maxX, maxY, maxZ } = box;
  if (faceName === "east") {
    return [
      [maxX, minY, maxZ],
      [maxX, maxY, maxZ],
      [maxX, maxY, minZ],
      [maxX, minY, minZ],
    ];
  }
  if (faceName === "west") {
    return [
      [minX, minY, minZ],
      [minX, maxY, minZ],
      [minX, maxY, maxZ],
      [minX, minY, maxZ],
    ];
  }
  if (faceName === "up") {
    return [
      [minX, maxY, maxZ],
      [maxX, maxY, maxZ],
      [maxX, maxY, minZ],
      [minX, maxY, minZ],
    ];
  }
  if (faceName === "down") {
    return [
      [minX, minY, minZ],
      [maxX, minY, minZ],
      [maxX, minY, maxZ],
      [minX, minY, maxZ],
    ];
  }
  if (faceName === "south") {
    return [
      [minX, minY, maxZ],
      [minX, maxY, maxZ],
      [maxX, maxY, maxZ],
      [maxX, minY, maxZ],
    ];
  }
  return [
    [maxX, minY, minZ],
    [maxX, maxY, minZ],
    [minX, maxY, minZ],
    [minX, minY, minZ],
  ];
}

function boxFaceTouchesBoundary(box, faceName) {
  if (faceName === "east") return box.maxX >= 1;
  if (faceName === "west") return box.minX <= 0;
  if (faceName === "up") return box.maxY >= 1;
  if (faceName === "down") return box.minY <= 0;
  if (faceName === "south") return box.maxZ >= 1;
  return box.minZ <= 0;
}

function addCuboidFace(buffers, x, y, z, box, face, color) {
  const base = buffers.positions.length / 3;
  for (const corner of cuboidFaceCorners(box, face.name)) {
    buffers.positions.push(x + corner[0], y + corner[1], z + corner[2]);
    buffers.normals.push(...face.normal);
    buffers.colors.push(color.r, color.g, color.b);
  }
  buffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function adjustedColor(hex, factor) {
  const color = new THREE.Color(hex);
  color.multiplyScalar(factor);
  return color;
}

let blockColorWorld = null;

function blockFaceColor(id, face, x, y, z) {
  const def = BLOCKS[id];
  let hex = def.color;
  if (face.name === "up" && def.top) hex = def.top;
  if (face.name === "down" && def.bottom) hex = def.bottom;
  if (face.name !== "up" && face.name !== "down" && def.side) hex = def.side;
  const meta = blockColorWorld?.getBlockMeta?.(x, y, z);
  const frontFace = meta?.facing ?? "north";
  if (face.name === frontFace && def.front) hex = def.front;

  let factor = 1;
  if (face.name === "down") factor = 0.56;
  if (face.name === "north" || face.name === "west") factor = 0.74;
  if (face.name === "south" || face.name === "east") factor = 0.88;
  if (face.name === "up") factor = 1.08;

  if (def.speck && hash3(x, y, z, id) > 0.64) {
    hex = def.speck;
    factor = 1;
  }

  if (id === BLOCK.LEAVES) {
    factor *= 0.88 + hash3(x, y, z, 91) * 0.24;
  }

  if (def.emissive) factor *= 1.35;
  if (id === BLOCK.SNOW) factor *= 1.08;
  return adjustedColor(hex, factor);
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

class World {
  constructor(scene, seed, saved) {
    this.scene = scene;
    this.seed = seed;
    this.chunks = new Map();
    this.dirty = new Set();
    this.modified = new Map(saved?.modified ?? []);
    this.blockMeta = new Map(saved?.blockMeta ?? []);
    this.cropAges = new Map(saved?.cropAges ?? []);
    this.openedChests = new Set(saved?.openedChests ?? []);
    this.poweredRedstone = new Set();
    this.poweredLamps = new Set();
    this.poweredDoors = new Set();
    this.activePressurePlates = new Set();
    this.activeButtons = new Set();
    this.buttonTimers = new Map();
    this.poweredRails = new Set();
    this.poweredRepeaters = new Set();
    this.poweredObservers = new Set();
    this.observerTimers = new Map();
    this.poweredPistons = new Set();
    this.extendedPistons = new Set();
    this.redstoneOpenedDoors = new Set();
    this.group = new THREE.Group();
    this.group.name = "voxel-world";
    scene.add(this.group);
    this.solidMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    this.waterMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  getSurfaceHeight(x, z) {
    const continent = fbm2(x * 0.38, z * 0.38, this.seed + 8, 5);
    const detail = fbm2(x * 1.2, z * 1.2, this.seed + 77, 3);
    const ridge = Math.abs(fbm2(x * 0.72 + 99, z * 0.72 - 45, this.seed + 31, 3) - 0.5);
    const mountain = Math.max(0, ridge - 0.25) * 42;
    return clamp(Math.floor(12 + continent * 24 + detail * 8 + mountain), 6, 58);
  }

  getBiome(x, z, height) {
    const temp = fbm2(x * 0.16 + 200, z * 0.16 - 160, this.seed + 201, 3);
    const wet = fbm2(x * 0.18 - 90, z * 0.18 + 50, this.seed + 301, 3);
    if (height <= WATER_LEVEL + 1) return "beach";
    if (height > 45 || temp < 0.24) return "snow";
    if (wet < 0.28) return "dry";
    if (wet > 0.66) return "forest";
    return "plains";
  }

  getVillageInfo(cx, cz) {
    const roll = hash2(cx, cz, this.seed + 1600);
    if (roll > 0.18) return null;
    const ox = 4 + Math.floor(hash2(cx, cz, this.seed + 1601) * 4);
    const oz = 4 + Math.floor(hash2(cx, cz, this.seed + 1602) * 4);
    const x = cx * CHUNK_SIZE + ox + 3;
    const z = cz * CHUNK_SIZE + oz + 3;
    const height = this.getSurfaceHeight(x, z);
    const biome = this.getBiome(x, z, height);
    if (!["plains", "forest", "dry"].includes(biome)) return null;
    return { cx, cz, ox, oz, y: height, x, z, biome };
  }

  getChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = this.generateChunk(cx, cz);
      this.chunks.set(key, chunk);
      this.markDirty(cx, cz);
    }
    return chunk;
  }

  generateChunk(cx, cz) {
    const blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    const surface = new Int16Array(CHUNK_SIZE * CHUNK_SIZE);
    for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
      for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
        const x = cx * CHUNK_SIZE + lx;
        const z = cz * CHUNK_SIZE + lz;
        const height = this.getSurfaceHeight(x, z);
        surface[lz * CHUNK_SIZE + lx] = height;
        const biome = this.getBiome(x, z, height);
        for (let y = 0; y < WORLD_HEIGHT; y += 1) {
          let id = BLOCK.AIR;
          if (y === 0) {
            id = BLOCK.BEDROCK;
          } else if (y <= height) {
            const depth = height - y;
            const cave =
              y > 5 &&
              y < height - 2 &&
              fbm3(x * 0.9, y * 1.15, z * 0.9, this.seed + 500, 3) > 0.69;
            if (cave) {
              id = y < WATER_LEVEL - 4 ? BLOCK.WATER : BLOCK.AIR;
            } else if (depth === 0) {
              if (biome === "beach" || biome === "dry") id = BLOCK.SAND;
              else if (biome === "snow") id = BLOCK.SNOW;
              else id = BLOCK.GRASS;
            } else if (depth < 4) {
              if (biome === "beach" && hash3(x, y, z, this.seed + 810) > 0.72) id = BLOCK.GRAVEL;
              else id = biome === "beach" ? BLOCK.SAND : BLOCK.DIRT;
            } else {
              id = BLOCK.STONE;
              if (y < 42 && hash3(x, y, z, this.seed + 811) > 0.988) id = BLOCK.GRAVEL;
              const oreRoll = hash3(x, y, z, this.seed + 700);
              if (y < 48 && oreRoll > 0.965) id = BLOCK.COAL_ORE;
              if (y < 34 && oreRoll > 0.986) id = BLOCK.IRON_ORE;
            }
          } else if (y <= WATER_LEVEL) {
            id = biome === "beach" && y < WATER_LEVEL - 2 ? BLOCK.CLAY : BLOCK.WATER;
          }
          blocks[chunkIndex(lx, y, lz)] = id;
        }
      }
    }

    for (let lx = 2; lx < CHUNK_SIZE - 2; lx += 1) {
      for (let lz = 2; lz < CHUNK_SIZE - 2; lz += 1) {
        const x = cx * CHUNK_SIZE + lx;
        const z = cz * CHUNK_SIZE + lz;
        const height = surface[lz * CHUNK_SIZE + lx];
        const top = blocks[chunkIndex(lx, height, lz)];
        const biome = this.getBiome(x, z, height);
        const chance = biome === "forest" ? 0.045 : biome === "plains" ? 0.012 : 0;
        if (top === BLOCK.GRASS && hash2(x, z, this.seed + 900) < chance) {
          this.placeTreeLocal(blocks, lx, height + 1, lz, x, z);
        }
      }
    }

    const village = this.getVillageInfo(cx, cz);
    if (village) this.placeVillageLocal(blocks, surface, village);

    for (const [key, id] of this.modified.entries()) {
      const [x, y, z] = parseWorldKey(key);
      const targetCx = Math.floor(x / CHUNK_SIZE);
      const targetCz = Math.floor(z / CHUNK_SIZE);
      if (targetCx === cx && targetCz === cz && y >= 0 && y < WORLD_HEIGHT) {
        blocks[chunkIndex(mod(x, CHUNK_SIZE), y, mod(z, CHUNK_SIZE))] = id;
      }
    }

    return {
      cx,
      cz,
      blocks,
      surface,
      solidMesh: null,
      waterMesh: null,
      lastTouched: performance.now(),
    };
  }

  placeTreeLocal(blocks, lx, y, lz, x, z) {
    const height = 4 + Math.floor(hash2(x, z, this.seed + 901) * 3);
    for (let dy = 0; dy < height && y + dy < WORLD_HEIGHT; dy += 1) {
      blocks[chunkIndex(lx, y + dy, lz)] = BLOCK.OAK_LOG;
    }
    const top = y + height;
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dz = -2; dz <= 2; dz += 1) {
        for (let dy = -2; dy <= 1; dy += 1) {
          const ax = lx + dx;
          const ay = top + dy;
          const az = lz + dz;
          if (
            ax < 0 ||
            ax >= CHUNK_SIZE ||
            az < 0 ||
            az >= CHUNK_SIZE ||
            ay <= 0 ||
            ay >= WORLD_HEIGHT
          ) {
            continue;
          }
          const distance = Math.abs(dx) + Math.abs(dz) + Math.max(0, dy);
          if (distance <= 4 && blocks[chunkIndex(ax, ay, az)] === BLOCK.AIR) {
            blocks[chunkIndex(ax, ay, az)] = BLOCK.LEAVES;
          }
        }
      }
    }
  }

  placeVillageLocal(blocks, surface, village) {
    const { ox, oz } = village;
    const groundY = surface[(oz + 3) * CHUNK_SIZE + (ox + 3)];
    const set = (lx, y, lz, id) => {
      if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE || y < 1 || y >= WORLD_HEIGHT) return;
      blocks[chunkIndex(lx, y, lz)] = id;
    };

    for (let dx = -2; dx <= 8; dx += 1) {
      for (let dz = -2; dz <= 8; dz += 1) {
        const lx = ox + dx;
        const lz = oz + dz;
        if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) continue;
        const pathY = surface[lz * CHUNK_SIZE + lx];
        set(lx, pathY, lz, BLOCK.PATH);
        for (let y = pathY + 1; y <= pathY + 5 && y < WORLD_HEIGHT; y += 1) set(lx, y, lz, BLOCK.AIR);
      }
    }

    for (let dx = 0; dx <= 6; dx += 1) {
      for (let dz = 0; dz <= 6; dz += 1) {
        const lx = ox + dx;
        const lz = oz + dz;
        set(lx, groundY, lz, dz === 0 || dx === 0 || dx === 6 ? BLOCK.COBBLESTONE : BLOCK.PLANKS);
        for (let y = groundY + 1; y <= groundY + 4; y += 1) set(lx, y, lz, BLOCK.AIR);
        const wall = dx === 0 || dx === 6 || dz === 0 || dz === 6;
        if (wall) {
          for (let y = groundY + 1; y <= groundY + 3; y += 1) set(lx, y, lz, y === groundY + 3 ? BLOCK.OAK_LOG : BLOCK.PLANKS);
        }
        set(lx, groundY + 4, lz, BLOCK.OAK_LOG);
      }
    }

    set(ox + 3, groundY + 1, oz, BLOCK.DOOR);
    set(ox + 3, groundY + 2, oz, BLOCK.AIR);
    set(ox + 5, groundY + 1, oz + 4, BLOCK.CHEST);
    set(ox + 1, groundY + 1, oz + 4, BLOCK.CRAFTING);
    set(ox + 2, groundY + 1, oz + 5, BLOCK.FURNACE);
    set(ox + 4, groundY + 1, oz + 1, BLOCK.BED);

    for (let dz = -6; dz <= 10; dz += 1) {
      const lz = oz + dz;
      const lx = ox + 3;
      if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) continue;
      const y = surface[lz * CHUNK_SIZE + lx];
      set(lx, y, lz, BLOCK.PATH);
    }
  }

  getBlock(x, y, z) {
    if (y < 0) return BLOCK.BEDROCK;
    if (y >= WORLD_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    chunk.lastTouched = performance.now();
    return chunk.blocks[chunkIndex(mod(x, CHUNK_SIZE), y, mod(z, CHUNK_SIZE))];
  }

  getBlockMeta(x, y, z) {
    return this.blockMeta.get(worldKey(x, y, z)) ?? null;
  }

  setBlock(x, y, z, id, record = true, meta = null) {
    if (y < 0 || y >= WORLD_HEIGHT) return false;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    const previousId = chunk.blocks[chunkIndex(mod(x, CHUNK_SIZE), y, mod(z, CHUNK_SIZE))];
    const previousMeta = this.getBlockMeta(x, y, z);
    chunk.blocks[chunkIndex(mod(x, CHUNK_SIZE), y, mod(z, CHUNK_SIZE))] = id;
    const key = worldKey(x, y, z);
    if (record) this.modified.set(key, id);
    if (id === BLOCK.AIR || !meta) this.blockMeta.delete(key);
    else this.blockMeta.set(key, { ...meta, facing: normalizeFacing(meta.facing) });
    if (id !== BLOCK.OPEN_DOOR || record) this.redstoneOpenedDoors.delete(key);
    if (!this.isRedstoneDoor(id)) this.poweredDoors.delete(key);
    if (!this.isRedstoneLamp(id)) this.poweredLamps.delete(key);
    if (!this.isRedstoneWire(id)) this.poweredRedstone.delete(key);
    if (!this.isPressurePlate(id)) this.activePressurePlates.delete(key);
    if (!this.isButton(id)) {
      this.activeButtons.delete(key);
      this.buttonTimers.delete(key);
    }
    if (id === BLOCK.BUTTON && record) {
      this.activeButtons.delete(key);
      this.buttonTimers.delete(key);
    }
    if (!this.isPoweredRail(id)) this.poweredRails.delete(key);
    if (id === BLOCK.POWERED_RAIL && record) this.poweredRails.delete(key);
    if (!this.isRepeater(id)) this.poweredRepeaters.delete(key);
    if (id === BLOCK.REPEATER && record) this.poweredRepeaters.delete(key);
    if (!this.isObserver(id)) {
      this.poweredObservers.delete(key);
      this.observerTimers.delete(key);
    }
    if (id === BLOCK.OBSERVER && record) {
      this.poweredObservers.delete(key);
      this.observerTimers.delete(key);
    }
    if (!this.isPiston(id)) {
      this.poweredPistons.delete(key);
      this.extendedPistons.delete(key);
    }
    if (id === BLOCK.PISTON && record) {
      this.poweredPistons.delete(key);
      this.extendedPistons.delete(key);
    }
    if (previousId === BLOCK.PISTON_ON && id !== BLOCK.PISTON_ON) this.clearPistonHeadFor(x, y, z, previousMeta);
    if (id === BLOCK.WHEAT_CROP) this.cropAges.set(key, 0);
    if (id !== BLOCK.WHEAT_CROP) this.cropAges.delete(key);
    if (previousId !== id || record) this.notifyObserversAround(x, y, z);
    this.markDirty(cx, cz);
    if (mod(x, CHUNK_SIZE) === 0) this.markDirty(cx - 1, cz);
    if (mod(x, CHUNK_SIZE) === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz);
    if (mod(z, CHUNK_SIZE) === 0) this.markDirty(cx, cz - 1);
    if (mod(z, CHUNK_SIZE) === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);
    return true;
  }

  markDirty(cx, cz) {
    this.dirty.add(chunkKey(cx, cz));
  }

  updateChunksAround(position) {
    const pcx = Math.floor(position.x / CHUNK_SIZE);
    const pcz = Math.floor(position.z / CHUNK_SIZE);
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx += 1) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz += 1) {
        if (Math.hypot(dx, dz) <= RENDER_DISTANCE + 0.4) {
          this.getChunk(pcx + dx, pcz + dz);
        }
      }
    }

    for (const [key, chunk] of this.chunks.entries()) {
      const dist = Math.hypot(chunk.cx - pcx, chunk.cz - pcz);
      if (dist > CHUNK_UNLOAD_DISTANCE) {
        this.disposeChunk(chunk);
        this.chunks.delete(key);
        this.dirty.delete(key);
      }
    }
  }

  disposeChunk(chunk) {
    for (const mesh of [chunk.solidMesh, chunk.waterMesh]) {
      if (mesh) {
        this.group.remove(mesh);
        mesh.geometry.dispose();
      }
    }
    chunk.solidMesh = null;
    chunk.waterMesh = null;
  }

  buildDirty(limit = 10) {
    let built = 0;
    for (const key of [...this.dirty]) {
      if (built >= limit) break;
      const chunk = this.chunks.get(key);
      this.dirty.delete(key);
      if (!chunk) continue;
      this.rebuildChunk(chunk);
      built += 1;
    }
  }

  rebuildChunk(chunk) {
    this.disposeChunk(chunk);
    const solid = { positions: [], normals: [], colors: [], indices: [] };
    const water = { positions: [], normals: [], colors: [], indices: [] };

    for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
      for (let y = 0; y < WORLD_HEIGHT; y += 1) {
        for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
          const id = chunk.blocks[chunkIndex(lx, y, lz)];
          if (id === BLOCK.AIR) continue;
          const x = chunk.cx * CHUNK_SIZE + lx;
          const z = chunk.cz * CHUNK_SIZE + lz;
          const def = BLOCKS[id];
          const target = def.liquid || def.transparent ? water : solid;
          const meta = this.getBlockMeta(x, y, z);
          if (isShapedBlock(id)) {
            for (const box of blockShapeBoxes(id, meta)) {
              for (const face of FACE_DEFS) {
                const neighbor = this.getBlock(x + face.normal[0], y + face.normal[1], z + face.normal[2]);
                if (boxFaceTouchesBoundary(box, face.name) && blockOccludesFullFace(neighbor)) continue;
                addCuboidFace(target, x, y, z, box, face, blockFaceColor(id, face, x, y, z));
              }
            }
          } else {
            for (const face of FACE_DEFS) {
              const nx = x + face.normal[0];
              const ny = y + face.normal[1];
              const nz = z + face.normal[2];
              const neighbor = this.getBlock(nx, ny, nz);
              const neighborDef = BLOCKS[neighbor];
              const showSolidFace =
                !def.liquid &&
                (neighbor === BLOCK.AIR ||
                  neighborDef.liquid ||
                  !blockOccludesFullFace(neighbor) ||
                  (neighborDef.transparent && neighbor !== id));
              const showLiquidFace =
                def.liquid && (neighbor === BLOCK.AIR || (!neighborDef.liquid && neighborDef.transparent));
              if (showSolidFace || showLiquidFace) {
                addFace(target, x, y, z, face, blockFaceColor(id, face, x, y, z));
              }
            }
          }
        }
      }
    }

    if (solid.positions.length > 0) {
      chunk.solidMesh = new THREE.Mesh(makeGeometry(solid), this.solidMaterial);
      chunk.solidMesh.frustumCulled = true;
      this.group.add(chunk.solidMesh);
    }
    if (water.positions.length > 0) {
      chunk.waterMesh = new THREE.Mesh(makeGeometry(water), this.waterMaterial);
      chunk.waterMesh.frustumCulled = true;
      this.group.add(chunk.waterMesh);
    }
  }

  isSolidForCollision(id) {
    const def = BLOCKS[id];
    return Boolean(def?.collision);
  }

  collisionBoxesForBlock(x, y, z) {
    return collisionBoxesForBlock(this.getBlock(x, y, z), x, y, z, this.getBlockMeta(x, y, z));
  }

  isLiquidAt(position) {
    return this.getBlock(
      Math.floor(position.x),
      Math.floor(position.y),
      Math.floor(position.z),
    ) === BLOCK.WATER;
  }

  firstFreeSpawnNear(x, z) {
    const surface = this.getSurfaceHeight(x, z);
    return new THREE.Vector3(x + 0.5, Math.min(surface + 3, WORLD_HEIGHT - 4), z + 0.5);
  }

  serializeModified() {
    return [...this.modified.entries()].map(([key, id]) => [key, persistentBlockId(id)]);
  }

  serializeBlockMeta() {
    return [...this.blockMeta.entries()].filter(([key]) => {
      const [x, y, z] = parseWorldKey(key);
      return persistentBlockId(this.getBlock(x, y, z)) !== BLOCK.AIR;
    });
  }

  serializeCropAges() {
    return [...this.cropAges.entries()];
  }

  serializeOpenedChests() {
    return [...this.openedChests.values()];
  }

  chestLoot(x, y, z) {
    const roll = hash3(x, y, z, this.seed + 2200);
    const loot = [
      [ITEM.BREAD, 1 + Math.floor(hash3(x, y, z, this.seed + 2201) * 3)],
      [ITEM.WHEAT_SEEDS, 2 + Math.floor(hash3(x, y, z, this.seed + 2202) * 4)],
      [BLOCK.TORCH, 2 + Math.floor(hash3(x, y, z, this.seed + 2203) * 4)],
    ];
    if (roll > 0.18) loot.push([ITEM.WOOL, 1 + Math.floor(hash3(x, y, z, this.seed + 2204) * 2)]);
    if (roll > 0.25) loot.push([ITEM.EMERALD, 1]);
    if (roll > 0.55) loot.push([ITEM.IRON_INGOT, 1]);
    if (roll > 0.62) loot.push([ITEM.ARROW, 2 + Math.floor(hash3(x, y, z, this.seed + 2205) * 4)]);
    if (roll > 0.78) loot.push([BLOCK.REDSTONE_WIRE, 2]);
    return loot;
  }

  openChest(player, x, y, z) {
    const key = worldKey(x, y, z);
    if (this.openedChests.has(key)) {
      showToast("箱子已经空了");
      playSound("chest");
      return true;
    }
    const loot = this.chestLoot(x, y, z);
    for (const [id, count] of loot) player.addItem(id, count);
    this.openedChests.add(key);
    showToast(`箱子: ${loot.map(([id, count]) => `${itemDef(id).label}x${count}`).join(" ")}`);
    playSound("chest");
    return true;
  }

  updateFallingBlocksAround(position, radius = 18, maxMoves = 128) {
    let moved = 0;
    const cx = Math.floor(position.x);
    const cz = Math.floor(position.z);
    for (let y = 1; y < WORLD_HEIGHT && moved < maxMoves; y += 1) {
      for (let x = cx - radius; x <= cx + radius && moved < maxMoves; x += 1) {
        for (let z = cz - radius; z <= cz + radius && moved < maxMoves; z += 1) {
          const id = this.getBlock(x, y, z);
          if (!isFallingBlock(id)) continue;
          const below = this.getBlock(x, y - 1, z);
          if (below !== BLOCK.AIR && !BLOCKS[below]?.liquid) continue;
          this.setBlock(x, y, z, BLOCK.AIR);
          this.setBlock(x, y - 1, z, id);
          moved += 1;
        }
      }
    }
    return moved;
  }

  updateCrops(dt) {
    for (const [key, age] of [...this.cropAges.entries()]) {
      const [x, y, z] = parseWorldKey(key);
      if (this.getBlock(x, y, z) !== BLOCK.WHEAT_CROP) {
        this.cropAges.delete(key);
        continue;
      }
      const wet =
        this.getBlock(x + 1, y - 1, z) === BLOCK.WATER ||
        this.getBlock(x - 1, y - 1, z) === BLOCK.WATER ||
        this.getBlock(x, y - 1, z + 1) === BLOCK.WATER ||
        this.getBlock(x, y - 1, z - 1) === BLOCK.WATER;
      const next = age + dt * (wet ? 0.22 : 0.1);
      if (next >= 7) {
        this.setBlock(x, y, z, BLOCK.WHEAT_READY);
      } else {
        this.cropAges.set(key, next);
      }
    }
  }

  isRedstoneWire(id) {
    return id === BLOCK.REDSTONE_WIRE || id === BLOCK.REDSTONE_WIRE_ON;
  }

  isRedstoneLamp(id) {
    return id === BLOCK.REDSTONE_LAMP || id === BLOCK.REDSTONE_LAMP_ON;
  }

  isPressurePlate(id) {
    return isPressurePlateBlock(id);
  }

  isButton(id) {
    return isButtonBlock(id);
  }

  isRepeater(id) {
    return isRepeaterBlock(id);
  }

  isObserver(id) {
    return isObserverBlock(id);
  }

  isPiston(id) {
    return isPistonBlock(id);
  }

  isPistonHead(id) {
    return isPistonHeadBlock(id);
  }

  isRedstoneDoor(id) {
    return isDoorBlock(id);
  }

  isRail(id) {
    return isRailBlock(id);
  }

  isPoweredRail(id) {
    return isPoweredRailBlock(id);
  }

  redstoneNeighbors(x, y, z) {
    return [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ];
  }

  repeaterReceivesFrom(x, y, z, sx, sy, sz) {
    if (sy !== y) return false;
    const facing = normalizeFacing(this.getBlockMeta(x, y, z)?.facing);
    const front = facingVector(facing);
    return sx === x - front.x && sz === z - front.z;
  }

  observerOutputTarget(x, y, z) {
    const facing = normalizeFacing(this.getBlockMeta(x, y, z)?.facing);
    const front = facingVector(facing);
    return { x: x - front.x, y, z: z - front.z };
  }

  pistonFacing(x, y, z) {
    return normalizeFacing(this.getBlockMeta(x, y, z)?.facing);
  }

  clearPistonHeadFor(x, y, z, meta = this.getBlockMeta(x, y, z)) {
    const facing = normalizeFacing(meta?.facing);
    const front = facingVector(facing);
    const hx = x + front.x;
    const hz = z + front.z;
    if (this.getBlock(hx, y, hz) !== BLOCK.PISTON_HEAD) return false;
    const headMeta = this.getBlockMeta(hx, y, hz);
    if (normalizeFacing(headMeta?.facing) !== facing) return false;
    this.setBlock(hx, y, hz, BLOCK.AIR, false);
    return true;
  }

  canPistonMoveBlock(id) {
    if (id === BLOCK.AIR || BLOCKS[id]?.liquid) return true;
    if (!BLOCKS[id]?.collision) return false;
    return ![
      BLOCK.BEDROCK,
      BLOCK.CHEST,
      BLOCK.CRAFTING,
      BLOCK.FURNACE,
      BLOCK.ENCHANTING_TABLE,
      BLOCK.BREWING_STAND,
      BLOCK.BED,
      BLOCK.DOOR,
      BLOCK.OPEN_DOOR,
      BLOCK.PISTON,
      BLOCK.PISTON_ON,
      BLOCK.PISTON_HEAD,
    ].includes(id);
  }

  moveBlockForPiston(from, to) {
    const id = persistentBlockId(this.getBlock(from.x, from.y, from.z));
    const meta = this.getBlockMeta(from.x, from.y, from.z);
    const fromKey = worldKey(from.x, from.y, from.z);
    const toKey = worldKey(to.x, to.y, to.z);
    const cropAge = this.cropAges.get(fromKey);
    this.setBlock(to.x, to.y, to.z, id, true, meta);
    if (cropAge !== undefined) this.cropAges.set(toKey, cropAge);
    if (this.openedChests.has(fromKey)) {
      this.openedChests.delete(fromKey);
      this.openedChests.add(toKey);
    }
    this.setBlock(from.x, from.y, from.z, BLOCK.AIR, true);
  }

  tryExtendPiston(x, y, z) {
    const id = this.getBlock(x, y, z);
    if (id !== BLOCK.PISTON) return id === BLOCK.PISTON_ON;
    const facing = this.pistonFacing(x, y, z);
    const front = facingVector(facing);
    const pushed = [];
    let cursor = { x: x + front.x, y, z: z + front.z };
    for (let distance = 0; distance < 12; distance += 1) {
      if (cursor.y < 0 || cursor.y >= WORLD_HEIGHT) return false;
      const blockId = this.getBlock(cursor.x, cursor.y, cursor.z);
      if (blockId === BLOCK.AIR || BLOCKS[blockId]?.liquid) break;
      if (!this.canPistonMoveBlock(blockId)) return false;
      pushed.push({ ...cursor });
      cursor = { x: cursor.x + front.x, y: cursor.y, z: cursor.z + front.z };
    }
    if (cursor.y < 0 || cursor.y >= WORLD_HEIGHT) return false;
    for (let index = pushed.length - 1; index >= 0; index -= 1) {
      const from = pushed[index];
      const to = { x: from.x + front.x, y: from.y, z: from.z + front.z };
      this.moveBlockForPiston(from, to);
    }
    this.setBlock(x + front.x, y, z + front.z, BLOCK.PISTON_HEAD, false, { facing });
    this.setBlock(x, y, z, BLOCK.PISTON_ON, false, { facing });
    this.extendedPistons.add(worldKey(x, y, z));
    return true;
  }

  retractPiston(x, y, z) {
    const id = this.getBlock(x, y, z);
    if (id !== BLOCK.PISTON_ON) return id === BLOCK.PISTON;
    const facing = this.pistonFacing(x, y, z);
    this.clearPistonHeadFor(x, y, z, { facing });
    this.setBlock(x, y, z, BLOCK.PISTON, false, { facing });
    this.extendedPistons.delete(worldKey(x, y, z));
    return true;
  }

  cleanupPistonHeads() {
    let changed = false;
    for (const chunk of this.chunks.values()) {
      for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
        for (let y = 0; y < WORLD_HEIGHT; y += 1) {
          for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
            if (chunk.blocks[chunkIndex(lx, y, lz)] !== BLOCK.PISTON_HEAD) continue;
            const x = chunk.cx * CHUNK_SIZE + lx;
            const z = chunk.cz * CHUNK_SIZE + lz;
            const facing = normalizeFacing(this.getBlockMeta(x, y, z)?.facing);
            const front = facingVector(facing);
            const baseX = x - front.x;
            const baseZ = z - front.z;
            if (this.getBlock(baseX, y, baseZ) !== BLOCK.PISTON_ON) {
              this.setBlock(x, y, z, BLOCK.AIR, false);
              changed = true;
            }
          }
        }
      }
    }
    return changed;
  }

  applyPistonPower(poweredPistons) {
    let changed = false;
    const pistonKeys = new Set([...poweredPistons, ...this.extendedPistons]);
    for (const chunk of this.chunks.values()) {
      for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
        for (let y = 0; y < WORLD_HEIGHT; y += 1) {
          for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
            const id = chunk.blocks[chunkIndex(lx, y, lz)];
            if (this.isPiston(id)) pistonKeys.add(worldKey(chunk.cx * CHUNK_SIZE + lx, y, chunk.cz * CHUNK_SIZE + lz));
          }
        }
      }
    }
    const nextExtended = new Set();
    for (const key of pistonKeys) {
      const [x, y, z] = parseWorldKey(key);
      const before = this.getBlock(x, y, z);
      if (!this.isPiston(before)) continue;
      if (poweredPistons.has(key)) {
        if (this.tryExtendPiston(x, y, z)) nextExtended.add(key);
      } else {
        this.retractPiston(x, y, z);
      }
      const after = this.getBlock(x, y, z);
      if (before !== after) changed = true;
      if (after === BLOCK.PISTON_ON) nextExtended.add(key);
    }
    this.extendedPistons = nextExtended;
    if (this.cleanupPistonHeads()) changed = true;
    return changed;
  }

  notifyObserversAround(x, y, z) {
    for (const [nx, ny, nz] of this.redstoneNeighbors(x, y, z)) {
      const id = this.getBlock(nx, ny, nz);
      if (!this.isObserver(id)) continue;
      const facing = normalizeFacing(this.getBlockMeta(nx, ny, nz)?.facing);
      const front = facingVector(facing);
      if (nx + front.x === x && ny === y && nz + front.z === z) {
        this.triggerObserver(nx, ny, nz);
      }
    }
  }

  triggerObserver(x, y, z, duration = 0.35) {
    const id = this.getBlock(x, y, z);
    if (!this.isObserver(id)) return false;
    const key = worldKey(x, y, z);
    this.observerTimers.set(key, Math.max(0.08, Number(duration) || 0.35));
    this.poweredObservers.add(key);
    if (id !== BLOCK.OBSERVER_ON) this.setBlock(x, y, z, BLOCK.OBSERVER_ON, false, this.getBlockMeta(x, y, z));
    return true;
  }

  updateObservers(dt) {
    let changed = false;
    for (const [key, remaining] of [...this.observerTimers.entries()]) {
      const next = remaining - dt;
      const [x, y, z] = parseWorldKey(key);
      const id = this.getBlock(x, y, z);
      if (!this.isObserver(id)) {
        this.observerTimers.delete(key);
        this.poweredObservers.delete(key);
        changed = true;
        continue;
      }
      if (next > 0) {
        this.observerTimers.set(key, next);
        this.poweredObservers.add(key);
        if (id !== BLOCK.OBSERVER_ON) {
          this.setBlock(x, y, z, BLOCK.OBSERVER_ON, false, this.getBlockMeta(x, y, z));
          changed = true;
        }
        continue;
      }
      this.observerTimers.delete(key);
      this.poweredObservers.delete(key);
      if (id === BLOCK.OBSERVER_ON) {
        this.setBlock(x, y, z, BLOCK.OBSERVER, false, this.getBlockMeta(x, y, z));
        changed = true;
      }
    }
    return changed;
  }

  actorPressureKeys(position, radius = 0.35) {
    const keys = [];
    const y = Math.floor(position.y);
    const minX = Math.floor(position.x - radius);
    const maxX = Math.floor(position.x + radius);
    const minZ = Math.floor(position.z - radius);
    const maxZ = Math.floor(position.z + radius);
    for (let x = minX; x <= maxX; x += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        if (this.isPressurePlate(this.getBlock(x, y, z))) keys.push(worldKey(x, y, z));
      }
    }
    return keys;
  }

  updatePressurePlates(player, entityList = []) {
    const pressed = new Set(this.actorPressureKeys(player.position, player.radius));
    for (const entity of entityList) {
      if (entity.health <= 0) continue;
      for (const key of this.actorPressureKeys(entity.position, entity.radius ?? 0.4)) pressed.add(key);
    }
    let changed = false;
    const candidates = new Set([...this.activePressurePlates, ...pressed]);
    for (const key of candidates) {
      const [x, y, z] = parseWorldKey(key);
      const id = this.getBlock(x, y, z);
      if (!this.isPressurePlate(id)) continue;
      const desired = pressed.has(key) ? BLOCK.PRESSURE_PLATE_ON : BLOCK.PRESSURE_PLATE;
      if (id !== desired) {
        this.setBlock(x, y, z, desired, false);
        changed = true;
      }
    }
    this.activePressurePlates = pressed;
    return changed;
  }

  triggerButton(x, y, z, duration = 1) {
    const id = this.getBlock(x, y, z);
    if (!this.isButton(id)) return false;
    const key = worldKey(x, y, z);
    this.buttonTimers.set(key, Math.max(0.1, Number(duration) || 1));
    this.activeButtons.add(key);
    if (id !== BLOCK.BUTTON_ON) this.setBlock(x, y, z, BLOCK.BUTTON_ON, false, this.getBlockMeta(x, y, z));
    return true;
  }

  updateButtons(dt) {
    let changed = false;
    for (const [key, remaining] of [...this.buttonTimers.entries()]) {
      const next = remaining - dt;
      const [x, y, z] = parseWorldKey(key);
      const id = this.getBlock(x, y, z);
      if (!this.isButton(id)) {
        this.buttonTimers.delete(key);
        this.activeButtons.delete(key);
        changed = true;
        continue;
      }
      if (next > 0) {
        this.buttonTimers.set(key, next);
        if (id !== BLOCK.BUTTON_ON) {
          this.setBlock(x, y, z, BLOCK.BUTTON_ON, false, this.getBlockMeta(x, y, z));
          changed = true;
        }
        continue;
      }
      this.buttonTimers.delete(key);
      this.activeButtons.delete(key);
      if (id === BLOCK.BUTTON_ON) {
        this.setBlock(x, y, z, BLOCK.BUTTON, false, this.getBlockMeta(x, y, z));
        changed = true;
      }
    }
    return changed;
  }

  updateRedstone() {
    const poweredWires = new Set();
    const wireStrength = new Map();
    const poweredLamps = new Set();
    const poweredDoors = new Set();
    const poweredRails = new Set();
    const poweredRepeaters = new Set();
    const poweredPistons = new Set();
    const wireQueue = [];

    const receivePower = (x, y, z, strength, sx, sy, sz) => {
      const id = this.getBlock(x, y, z);
      const key = worldKey(x, y, z);
      if (this.isRedstoneLamp(id)) poweredLamps.add(key);
      if (this.isRedstoneDoor(id)) poweredDoors.add(key);
      if (this.isPoweredRail(id)) poweredRails.add(key);
      if (this.isRepeater(id) && this.repeaterReceivesFrom(x, y, z, sx, sy, sz)) poweredRepeaters.add(key);
      if (this.isPiston(id)) poweredPistons.add(key);
      if (this.isRedstoneWire(id) && strength > 0) wireQueue.push([x, y, z, strength]);
    };

    const powerFrom = (x, y, z, strength) => {
      for (const [nx, ny, nz] of this.redstoneNeighbors(x, y, z)) {
        receivePower(nx, ny, nz, strength, x, y, z);
      }
    };

    const drainWireQueue = () => {
      while (wireQueue.length) {
        const [x, y, z, strength] = wireQueue.shift();
        const key = worldKey(x, y, z);
        if (strength <= 0 || !this.isRedstoneWire(this.getBlock(x, y, z))) continue;
        if ((wireStrength.get(key) ?? -1) >= strength) continue;
        wireStrength.set(key, strength);
        poweredWires.add(key);
        for (const [nx, ny, nz] of this.redstoneNeighbors(x, y, z)) {
          receivePower(nx, ny, nz, strength - 1, x, y, z);
        }
      }
    };

    for (const chunk of this.chunks.values()) {
      for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
        for (let y = 0; y < WORLD_HEIGHT; y += 1) {
          for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
            const id = chunk.blocks[chunkIndex(lx, y, lz)];
            if (id === BLOCK.LEVER_ON || id === BLOCK.PRESSURE_PLATE_ON || id === BLOCK.BUTTON_ON) {
              powerFrom(chunk.cx * CHUNK_SIZE + lx, y, chunk.cz * CHUNK_SIZE + lz, 15);
            } else if (id === BLOCK.OBSERVER_ON) {
              const x = chunk.cx * CHUNK_SIZE + lx;
              const z = chunk.cz * CHUNK_SIZE + lz;
              const target = this.observerOutputTarget(x, y, z);
              receivePower(target.x, target.y, target.z, 15, x, y, z);
            }
          }
        }
      }
    }

    const outputRepeaters = new Set();
    while (true) {
      drainWireQueue();
      const pendingRepeaters = [...poweredRepeaters].filter((key) => !outputRepeaters.has(key));
      if (pendingRepeaters.length === 0) break;
      for (const key of pendingRepeaters) {
        outputRepeaters.add(key);
        const [x, y, z] = parseWorldKey(key);
        const facing = normalizeFacing(this.getBlockMeta(x, y, z)?.facing);
        const front = facingVector(facing);
        receivePower(x + front.x, y, z + front.z, 15, x, y, z);
      }
    }

    for (const chunk of this.chunks.values()) {
      for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
        for (let y = 0; y < WORLD_HEIGHT; y += 1) {
          for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
            const x = chunk.cx * CHUNK_SIZE + lx;
            const z = chunk.cz * CHUNK_SIZE + lz;
            const id = chunk.blocks[chunkIndex(lx, y, lz)];
            if (this.isRedstoneWire(id)) {
              const desired = poweredWires.has(worldKey(x, y, z)) ? BLOCK.REDSTONE_WIRE_ON : BLOCK.REDSTONE_WIRE;
              if (id !== desired) this.setBlock(x, y, z, desired, false);
            } else if (this.isRedstoneLamp(id)) {
              const desired = poweredLamps.has(worldKey(x, y, z)) ? BLOCK.REDSTONE_LAMP_ON : BLOCK.REDSTONE_LAMP;
              if (id !== desired) this.setBlock(x, y, z, desired, false);
            } else if (this.isPoweredRail(id)) {
              const desired = poweredRails.has(worldKey(x, y, z)) ? BLOCK.POWERED_RAIL_ON : BLOCK.POWERED_RAIL;
              if (id !== desired) this.setBlock(x, y, z, desired, false);
            } else if (this.isRepeater(id)) {
              const desired = poweredRepeaters.has(worldKey(x, y, z)) ? BLOCK.REPEATER_ON : BLOCK.REPEATER;
              if (id !== desired) this.setBlock(x, y, z, desired, false, this.getBlockMeta(x, y, z));
            } else if (this.isPiston(id)) {
              if (poweredPistons.has(worldKey(x, y, z))) this.extendedPistons.add(worldKey(x, y, z));
            } else if (this.isRedstoneDoor(id)) {
              const key = worldKey(x, y, z);
              if (poweredDoors.has(key) && id === BLOCK.DOOR) {
                this.redstoneOpenedDoors.add(key);
                this.setBlock(x, y, z, BLOCK.OPEN_DOOR, false, this.getBlockMeta(x, y, z));
              } else if (!poweredDoors.has(key) && this.redstoneOpenedDoors.has(key)) {
                this.redstoneOpenedDoors.delete(key);
                this.setBlock(x, y, z, BLOCK.DOOR, false, this.getBlockMeta(x, y, z));
              }
            }
          }
        }
      }
    }

    this.applyPistonPower(poweredPistons);
    this.poweredRedstone = poweredWires;
    this.poweredLamps = poweredLamps;
    this.poweredDoors = poweredDoors;
    this.poweredRails = poweredRails;
    this.poweredRepeaters = poweredRepeaters;
    this.poweredPistons = poweredPistons;
  }
}

class Player {
  constructor(world, saved) {
    this.world = world;
    this.position = saved?.player?.position
      ? new THREE.Vector3(saved.player.position.x, saved.player.position.y, saved.player.position.z)
      : world.firstFreeSpawnNear(0, 0);
    this.spawnPoint = saved?.player?.spawnPoint
      ? new THREE.Vector3(saved.player.spawnPoint.x, saved.player.spawnPoint.y, saved.player.spawnPoint.z)
      : world.firstFreeSpawnNear(0, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = saved?.player?.yaw ?? Math.PI;
    this.pitch = saved?.player?.pitch ?? -0.25;
    this.onGround = false;
    this.radius = 0.32;
    this.height = 1.8;
    this.eyeHeight = 1.62;
    this.mode = saved?.player?.mode ?? "survival";
    this.health = saved?.player?.health ?? 20;
    this.hunger = saved?.player?.hunger ?? 20;
    this.level = saved?.player?.level ?? 0;
    this.experience = saved?.player?.experience ?? 0;
    this.oxygen = 20;
    this.damageCooldown = 0;
    this.actionCooldown = 0;
    this.ridingEntity = null;
    this.fallPeakY = this.position.y;
    this.selected = saved?.player?.selected ?? 2;
    this.hotbar = saved?.player?.hotbar ?? [...HOTBAR_DEFAULT];
    this.inventory = new Map(saved?.inventory ?? []);
    this.toolDurability = new Map(saved?.toolDurability ?? []);
    this.upgrades = new Map(saved?.upgrades ?? saved?.player?.upgrades ?? []);
    this.effects = new Map(saved?.effects ?? saved?.player?.effects ?? []);
    const savedArmorSlots = saved?.player?.armorSlots ?? saved?.armorSlots ?? {};
    this.armorSlots = {
      head: savedArmorSlots.head ?? null,
      chest: savedArmorSlots.chest ?? null,
      legs: savedArmorSlots.legs ?? null,
      feet: savedArmorSlots.feet ?? null,
    };
    this.armorDurability = new Map(saved?.armorDurability ?? []);
    if (this.inventory.size === 0) {
      this.inventory.set(BLOCK.OAK_LOG, 8);
      this.inventory.set(BLOCK.PLANKS, 12);
      this.inventory.set(BLOCK.TORCH, 8);
      this.inventory.set(ITEM.WOOD_PICKAXE, 1);
      this.inventory.set(ITEM.WOOD_SHOVEL, 1);
      this.inventory.set(ITEM.WOOD_HOE, 1);
      this.inventory.set(ITEM.WHEAT_SEEDS, 6);
      this.inventory.set(ITEM.BREAD, 2);
      this.inventory.set(BLOCK.COAL_ORE, 2);
      this.inventory.set(BLOCK.IRON_ORE, 2);
      this.inventory.set(BLOCK.REDSTONE_WIRE, 4);
      this.inventory.set(BLOCK.LEVER, 1);
      this.inventory.set(BLOCK.REDSTONE_LAMP, 1);
      this.inventory.set(ITEM.WOOL, 3);
      this.inventory.set(ITEM.BOW, 1);
      this.inventory.set(ITEM.ARROW, 12);
      this.inventory.set(ITEM.WOOD_SWORD, 1);
    }
    for (const id of this.inventory.keys()) this.ensureToolDurability(id);
    for (const id of Object.values(this.armorSlots)) this.ensureArmorDurability(id);
  }

  get eye() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z,
    );
  }

  direction() {
    const cosPitch = Math.cos(this.pitch);
    return new THREE.Vector3(
      -Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cosPitch,
    ).normalize();
  }

  addItem(id, count = 1) {
    id = Number(id);
    if (!isKnownItem(id)) return;
    this.inventory.set(id, (this.inventory.get(id) ?? 0) + count);
    this.ensureToolDurability(id);
    this.ensureArmorDurability(id);
  }

  removeItem(id, count = 1) {
    id = Number(id);
    if (this.mode === "creative") return true;
    const current = this.inventory.get(id) ?? 0;
    if (current < count) return false;
    const next = current - count;
    if (next <= 0) this.inventory.delete(id);
    else this.inventory.set(id, next);
    return true;
  }

  selectedBlock() {
    return this.hotbar[this.selected] ?? BLOCK.DIRT;
  }

  mountVehicle(entity) {
    if (!entity || !isVehicleType(entity.type)) return false;
    if (this.ridingEntity && this.ridingEntity !== entity) this.dismountVehicle(false);
    this.ridingEntity = entity;
    entity.rider = true;
    this.velocity.set(0, 0, 0);
    this.onGround = true;
    this.fallPeakY = entity.position.y;
    this.position.set(entity.position.x, entity.position.y + 0.12, entity.position.z);
    this.actionCooldown = 0.25;
    showToast(entity.type === "boat" ? "已上船，Shift 下船" : "已上矿车，Shift 下车");
    playSound("ride");
    return true;
  }

  dismountVehicle(showMessage = true) {
    const entity = this.ridingEntity;
    if (!entity) return false;
    entity.rider = false;
    this.ridingEntity = null;
    const offsets = [
      [entity.radius + 0.75, 0],
      [-(entity.radius + 0.75), 0],
      [0, entity.radius + 0.75],
      [0, -(entity.radius + 0.75)],
      [0, 0],
    ];
    for (const [dx, dz] of offsets) {
      this.position.set(entity.position.x + dx, entity.position.y + 0.12, entity.position.z + dz);
      this.velocity.set(0, 0, 0);
      this.onGround = false;
      if (!this.collides()) break;
    }
    this.fallPeakY = this.position.y;
    this.actionCooldown = 0.25;
    if (showMessage) {
      showToast("已下车");
      playSound("ride");
    }
    return true;
  }

  boatWaterY(entity, sampleX = entity.position.x, sampleZ = entity.position.z) {
    const x = Math.floor(sampleX);
    const z = Math.floor(sampleZ);
    const start = Math.floor(entity.position.y + 0.2);
    for (let y = start; y >= Math.max(0, start - 2); y -= 1) {
      if (this.world.getBlock(x, y, z) === BLOCK.WATER) return y;
    }
    return null;
  }

  railInfoAt(entity, nextX = entity.position.x, nextZ = entity.position.z) {
    const x = Math.floor(nextX);
    const z = Math.floor(nextZ);
    const candidates = [
      Math.floor(entity.position.y),
      Math.floor(entity.position.y - 0.15),
      Math.floor(entity.position.y - 0.65),
    ];
    for (const y of candidates) {
      const id = this.world.getBlock(x, y, z);
      if (!isRailBlock(id)) continue;
      const axis = railAxisFor(this.world, x, y, z, entity.railAxis ?? "x");
      return { x, y, z, axis, id, powered: id === BLOCK.POWERED_RAIL_ON, brake: id === BLOCK.POWERED_RAIL };
    }
    return null;
  }

  updateRiding(dt, input) {
    const entity = this.ridingEntity;
    if (!entity || entity.health <= 0) {
      this.ridingEntity = null;
      return false;
    }
    if (input.down("ShiftLeft") || input.down("ShiftRight")) {
      this.dismountVehicle();
      return true;
    }

    if (entity.type === "boat") {
      const turn = (input.down("KeyD") || input.down("ArrowRight") ? 1 : 0) - (input.down("KeyA") || input.down("ArrowLeft") ? 1 : 0);
      const thrust = (input.down("KeyW") || input.down("ArrowUp") ? 1 : 0) - (input.down("KeyS") || input.down("ArrowDown") ? 1 : 0);
      entity.targetYaw -= turn * 1.9 * dt;
      const waterY = this.boatWaterY(entity);
      const inWater = waterY !== null;
      if (thrust !== 0) {
        entity.velocity.x += -Math.sin(entity.targetYaw) * thrust * 5.8 * dt;
        entity.velocity.z += -Math.cos(entity.targetYaw) * thrust * 5.8 * dt;
      }
      entity.velocity.x *= inWater ? 0.965 : 0.72;
      entity.velocity.z *= inWater ? 0.965 : 0.72;
      const maxSpeed = inWater ? 5.4 : 1.6;
      const speed = Math.hypot(entity.velocity.x, entity.velocity.z);
      if (speed > maxSpeed) {
        entity.velocity.x = (entity.velocity.x / speed) * maxSpeed;
        entity.velocity.z = (entity.velocity.z / speed) * maxSpeed;
      }
      const nextX = entity.position.x + entity.velocity.x * dt;
      const nextZ = entity.position.z + entity.velocity.z * dt;
      const nextWaterY = this.boatWaterY(entity, nextX, nextZ);
      if (inWater && nextWaterY === null) {
        entity.velocity.x *= 0.25;
        entity.velocity.z *= 0.25;
      } else {
        entity.position.x = nextX;
        entity.position.z = nextZ;
      }
      const targetWaterY = nextWaterY ?? waterY;
      entity.position.y = targetWaterY !== null ? lerp(entity.position.y, targetWaterY + 0.55, clamp(dt * 8, 0, 1)) : entity.position.y;
      entity.mesh.rotation.y = entity.targetYaw;
    } else if (entity.type === "minecart") {
      const rail = this.railInfoAt(entity);
      if (rail) {
        entity.railAxis = rail.axis;
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const viewSign = rail.axis === "x" ? Math.sign(forward.x) || 1 : Math.sign(forward.z) || 1;
        const thrust = (input.down("KeyW") || input.down("ArrowUp") ? viewSign : 0) - (input.down("KeyS") || input.down("ArrowDown") ? viewSign : 0);
        entity.velocity[rail.axis] += thrust * 8.5 * dt;
        entity.velocity[rail.axis === "x" ? "z" : "x"] = 0;
        applyMinecartRailPower(entity, rail, dt, thrust);
        const nextX = rail.axis === "x" ? entity.position.x + entity.velocity.x * dt : rail.x + 0.5;
        const nextZ = rail.axis === "z" ? entity.position.z + entity.velocity.z * dt : rail.z + 0.5;
        const nextRail = this.railInfoAt(entity, nextX, nextZ);
        if (nextRail) {
          entity.position.x = rail.axis === "x" ? nextX : nextRail.x + 0.5;
          entity.position.z = rail.axis === "z" ? nextZ : nextRail.z + 0.5;
          entity.position.y = lerp(entity.position.y, nextRail.y + 0.18, clamp(dt * 12, 0, 1));
          const sign = rail.axis === "x" ? Math.sign(entity.velocity.x) : Math.sign(entity.velocity.z);
          if (Math.abs(sign) > 0) {
            entity.targetYaw = rail.axis === "x" ? (sign > 0 ? -Math.PI / 2 : Math.PI / 2) : (sign > 0 ? Math.PI : 0);
          }
        } else {
          entity.velocity.set(0, 0, 0);
        }
      } else {
        entity.velocity.multiplyScalar(0.78);
        entity.position.addScaledVector(entity.velocity, dt);
      }
      entity.mesh.rotation.y = entity.targetYaw;
    }

    this.position.set(entity.position.x, entity.position.y + 0.12, entity.position.z);
    this.velocity.set(0, 0, 0);
    this.onGround = true;
    this.fallPeakY = this.position.y;
    this.oxygen = 20;
    entity.mesh.position.copy(entity.position);
    return true;
  }

  ensureToolDurability(id) {
    const tool = toolInfo(id);
    if (tool && !this.toolDurability.has(Number(id))) {
      this.toolDurability.set(Number(id), tool.durability);
    }
  }

  ensureArmorDurability(id) {
    if (id === null || id === undefined) return;
    const armor = armorInfo(id);
    if (armor && !this.armorDurability.has(Number(id))) {
      this.armorDurability.set(Number(id), armor.durability);
    }
  }

  durabilityFor(id) {
    id = Number(id);
    const tool = toolInfo(id);
    if (!tool) return null;
    if (this.mode !== "creative" && (this.inventory.get(id) ?? 0) <= 0) return null;
    this.ensureToolDurability(id);
    return this.toolDurability.get(id);
  }

  ownedToolDurability() {
    return [...this.toolDurability.entries()].filter(([id]) => (this.inventory.get(Number(id)) ?? 0) > 0);
  }

  ownedArmorDurability() {
    return [...this.armorDurability.entries()].filter(
      ([id]) => (this.inventory.get(Number(id)) ?? 0) > 0 || Object.values(this.armorSlots).includes(Number(id)),
    );
  }

  armorDurabilityFor(id) {
    id = Number(id);
    const armor = armorInfo(id);
    if (!armor) return null;
    const equipped = this.armorSlots[armor.slot] === id;
    if (!equipped && this.mode !== "creative" && (this.inventory.get(id) ?? 0) <= 0) return null;
    this.ensureArmorDurability(id);
    return this.armorDurability.get(id);
  }

  equipArmor(id) {
    id = Number(id);
    const armor = armorInfo(id);
    if (!armor) return false;
    if (this.mode !== "creative" && (this.inventory.get(id) ?? 0) <= 0) {
      showToast(`缺少 ${itemDef(id).label}`);
      return true;
    }
    const previous = this.armorSlots[armor.slot];
    if (!this.removeItem(id, 1)) return true;
    if (previous) this.addItem(previous, 1);
    this.armorSlots[armor.slot] = id;
    this.ensureArmorDurability(id);
    this.actionCooldown = 0.25;
    showToast(`已装备 ${itemDef(id).label}`);
    playSound("equip");
    return true;
  }

  unequipArmor(slot) {
    const id = this.armorSlots[slot];
    if (!id) return;
    this.armorSlots[slot] = null;
    this.addItem(id, 1);
    showToast(`卸下 ${itemDef(id).label}`);
  }

  armorPoints() {
    return Object.values(this.armorSlots).reduce(
      (sum, id) => sum + (armorInfo(id)?.defense ?? 0) + this.upgradeLevel(id, "protection"),
      0,
    );
  }

  equippedArmor() {
    return Object.entries(this.armorSlots).map(([slot, id]) => ({
      slot,
      item: id ? itemDef(id).name : null,
      label: id ? itemDef(id).label : null,
      defense: id ? (armorInfo(id)?.defense ?? 0) + this.upgradeLevel(id, "protection") : 0,
      durability: id ? this.armorDurabilityFor(id) : null,
      upgrades: id ? this.upgradeSummary(id) : [],
    }));
  }

  damageArmor(amount = 1) {
    for (const [slot, id] of Object.entries(this.armorSlots)) {
      if (!id) continue;
      const armor = armorInfo(id);
      if (!armor) continue;
      this.ensureArmorDurability(id);
      const next = (this.armorDurability.get(id) ?? armor.durability) - amount;
      if (next > 0) {
        this.armorDurability.set(id, next);
      } else {
        this.armorDurability.delete(id);
        this.armorSlots[slot] = null;
        showToast(`${itemDef(id).label} 损坏了`);
      }
    }
  }

  useTool(id, amount = 1) {
    id = Number(id);
    const tool = toolInfo(id);
    if (!tool || this.mode === "creative") return true;
    if ((this.inventory.get(id) ?? 0) <= 0) return false;
    this.ensureToolDurability(id);
    const next = (this.toolDurability.get(id) ?? tool.durability) - amount;
    if (next > 0) {
      this.toolDurability.set(id, next);
      return true;
    }
    this.toolDurability.delete(id);
    this.removeItem(id, 1);
    showToast(`${itemDef(id).label} 损坏了`);
    return false;
  }

  eat(id) {
    const food = itemDef(id).food;
    if (!food) return false;
    if (this.mode !== "creative" && (this.inventory.get(id) ?? 0) <= 0) return false;
    if (this.hunger >= 20 && this.health >= 20) {
      showToast("现在不饿");
      return true;
    }
    if (!this.removeItem(id, 1)) return false;
    this.hunger = Math.min(20, this.hunger + food.hunger);
    this.health = Math.min(20, this.health + food.health);
    this.actionCooldown = 0.35;
    showToast(`食用 ${itemDef(id).label}`);
    playSound("eat");
    return true;
  }

  xpToNextLevel(level = this.level) {
    return 7 + level * 3;
  }

  experienceProgress() {
    const required = this.xpToNextLevel();
    return {
      level: this.level,
      experience: this.experience,
      required,
      ratio: required > 0 ? clamp(this.experience / required, 0, 1) : 0,
    };
  }

  addExperience(amount = 0) {
    if (this.mode === "creative" || amount <= 0) return { gained: 0, leveled: false };
    this.experience += amount;
    let leveled = false;
    while (this.experience >= this.xpToNextLevel()) {
      this.experience -= this.xpToNextLevel();
      this.level += 1;
      leveled = true;
    }
    return { gained: amount, leveled };
  }

  applyEffect(key, duration, amplifier = 1) {
    if (!EFFECTS[key] || duration <= 0) return false;
    const existing = this.effects.get(key);
    const maxDuration = Math.max(duration, existing?.maxDuration ?? 0);
    this.effects.set(key, {
      duration: Math.max(duration, existing?.duration ?? 0),
      maxDuration,
      amplifier: Math.max(amplifier, existing?.amplifier ?? 1),
    });
    return true;
  }

  updateEffects(dt) {
    for (const [key, effect] of [...this.effects.entries()]) {
      effect.duration -= dt;
      if (effect.duration <= 0) this.effects.delete(key);
      else this.effects.set(key, effect);
    }
  }

  effectLevel(key) {
    return this.effects.get(key)?.amplifier ?? 0;
  }

  effectEntries() {
    return [...this.effects.entries()].map(([key, effect]) => ({
      key,
      label: EFFECTS[key]?.label ?? key,
      duration: Number(effect.duration.toFixed(1)),
      maxDuration: Number((effect.maxDuration ?? effect.duration).toFixed(1)),
      amplifier: effect.amplifier,
    }));
  }

  spendLevels(cost = 1) {
    if (this.mode === "creative") return true;
    if (this.level < cost) return false;
    this.level -= cost;
    this.experience = Math.min(this.experience, Math.max(0, this.xpToNextLevel() - 1));
    return true;
  }

  upgradeKey(id, key) {
    return `${Number(id)}:${key}`;
  }

  upgradeLevel(id, key) {
    if (id === null || id === undefined) return 0;
    return this.upgrades.get(this.upgradeKey(id, key)) ?? 0;
  }

  setUpgradeLevel(id, key, level) {
    id = Number(id);
    if (!isKnownItem(id)) return;
    if (level <= 0) this.upgrades.delete(this.upgradeKey(id, key));
    else this.upgrades.set(this.upgradeKey(id, key), level);
  }

  upgradeSummary(id) {
    return ENCHANTMENTS.map((entry) => {
      const level = this.upgradeLevel(id, entry.key);
      return level > 0 ? { key: entry.key, label: entry.label, level } : null;
    }).filter(Boolean);
  }

  serializeUpgrades() {
    return [...this.upgrades.entries()];
  }

  serializeEffects() {
    return [...this.effects.entries()];
  }

  update(dt, input) {
    this.damageCooldown = Math.max(0, this.damageCooldown - dt);
    this.actionCooldown = Math.max(0, this.actionCooldown - dt);
    this.updateEffects(dt);
    if (this.ridingEntity && this.updateRiding(dt, input)) return;
    const wasOnGround = this.onGround;
    if (wasOnGround) this.fallPeakY = this.position.y;

    const inWater =
      this.world.isLiquidAt(this.eye) ||
      this.world.isLiquidAt(new THREE.Vector3(this.position.x, this.position.y + 0.6, this.position.z));
    const onLadder =
      this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 0.9), Math.floor(this.position.z)) ===
        BLOCK.LADDER ||
      this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 1.6), Math.floor(this.position.z)) ===
        BLOCK.LADDER;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3();
    if (input.down("KeyW") || input.down("ArrowUp")) wish.add(forward);
    if (input.down("KeyS") || input.down("ArrowDown")) wish.sub(forward);
    if (input.down("KeyD") || input.down("ArrowRight")) wish.add(right);
    if (input.down("KeyA") || input.down("ArrowLeft")) wish.sub(right);
    if (wish.lengthSq() > 0) wish.normalize();

    if (this.mode === "creative") {
      const speed = input.down("ShiftLeft") || input.down("ShiftRight") ? 10.5 : 6.5;
      this.velocity.x = wish.x * speed;
      this.velocity.z = wish.z * speed;
      this.velocity.y = 0;
      if (input.down("Space")) this.velocity.y += speed;
      if (input.down("ControlLeft") || input.down("ControlRight")) this.velocity.y -= speed;
      this.position.addScaledVector(this.velocity, dt);
      this.onGround = false;
      this.oxygen = 20;
      return;
    }

    const sprinting = input.down("ShiftLeft") || input.down("ShiftRight");
    const speedBoost = 1 + this.effectLevel("swiftness") * 0.3;
    const speed = (sprinting ? 5.6 : 4.25) * speedBoost * (inWater ? 0.52 : 1);
    const accel = this.onGround ? 24 : 8;
    this.velocity.x = lerp(this.velocity.x, wish.x * speed, clamp(accel * dt, 0, 1));
    this.velocity.z = lerp(this.velocity.z, wish.z * speed, clamp(accel * dt, 0, 1));

    if (input.down("Space") && this.onGround) {
      this.velocity.y = 8.4;
      this.onGround = false;
    } else if (input.down("Space") && inWater) {
      this.velocity.y = Math.max(this.velocity.y, 3.5);
    }

    if (onLadder) {
      if (input.down("Space")) this.velocity.y = 3.2;
      else if (input.down("ControlLeft") || input.down("ControlRight")) this.velocity.y = -2.2;
      else this.velocity.y = Math.max(this.velocity.y, -1.2);
    } else {
      this.velocity.y -= (inWater ? 8 : 24) * dt;
    }
    this.velocity.y = Math.max(this.velocity.y, -32);

    this.moveAxis("x", this.velocity.x * dt);
    this.moveAxis("z", this.velocity.z * dt);
    this.moveAxis("y", this.velocity.y * dt);
    this.updateFallDamage(wasOnGround, inWater, onLadder);

    if (this.position.y < -10) {
      this.position.copy(this.spawnPoint);
      this.velocity.set(0, 0, 0);
      this.onGround = false;
      this.fallPeakY = this.position.y;
      this.health = Math.max(10, this.health);
      showToast("已返回重生点");
    }

    if (inWater) {
      this.oxygen = Math.max(0, this.oxygen - dt * 1.6);
      if (this.oxygen <= 0) this.damage(1.2 * dt, { bypassArmor: true });
    } else {
      this.oxygen = Math.min(20, this.oxygen + dt * 5);
    }

    this.hunger = Math.max(0, this.hunger - dt * (sprinting && wish.lengthSq() > 0 ? 0.018 : 0.006));
    if (this.hunger <= 0) this.damage(0.45 * dt, { bypassArmor: true });
    else if (this.hunger > 14 && this.health < 20) this.health = Math.min(20, this.health + dt * 0.35);
  }

  updateFallDamage(wasOnGround, inWater, onLadder) {
    if (inWater || onLadder) {
      this.fallPeakY = this.position.y;
      return;
    }
    if (!this.onGround) {
      this.fallPeakY = Math.max(this.fallPeakY, this.position.y);
      return;
    }
    if (!wasOnGround) {
      const fallDistance = this.fallPeakY - this.position.y;
      if (fallDistance > 3) {
        const damage = (fallDistance - 3) * 1.35;
        this.damage(damage, { bypassArmor: true });
        showToast(`坠落伤害 ${damage.toFixed(1)}`);
      }
    }
    this.fallPeakY = this.position.y;
  }

  moveAxis(axis, amount) {
    if (amount === 0) return;
    this.position[axis] += amount;
    if (this.collides()) {
      this.position[axis] -= amount;
      if (axis === "y") {
        if (amount < 0) this.onGround = true;
        this.velocity.y = 0;
      } else {
        this.velocity[axis] = 0;
      }
    } else if (axis === "y" && amount < 0) {
      this.onGround = false;
    }
  }

  collides() {
    const playerBox = {
      minX: this.position.x - this.radius,
      maxX: this.position.x + this.radius,
      minY: this.position.y,
      maxY: this.position.y + this.height,
      minZ: this.position.z - this.radius,
      maxZ: this.position.z + this.radius,
    };
    const minX = Math.floor(this.position.x - this.radius);
    const maxX = Math.floor(this.position.x + this.radius);
    const minY = Math.floor(this.position.y);
    const maxY = Math.floor(this.position.y + this.height);
    const minZ = Math.floor(this.position.z - this.radius);
    const maxZ = Math.floor(this.position.z + this.radius);
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          for (const blockBox of this.world.collisionBoxesForBlock(x, y, z)) {
            if (aabbIntersects(playerBox, blockBox)) return true;
          }
        }
      }
    }
    return false;
  }

  damage(amount, options = {}) {
    if (this.mode === "creative") return;
    let finalAmount = amount;
    if (!options.bypassArmor && amount > 0) {
      const reduction = clamp(this.armorPoints() * 0.04, 0, 0.72);
      finalAmount = amount * (1 - reduction);
      if (this.armorPoints() > 0) this.damageArmor(Math.max(1, Math.ceil(amount)));
    }
    this.health = Math.max(0, this.health - finalAmount);
    if (finalAmount > 0.05) playSound("hurt");
    if (this.health <= 0) {
      this.health = 20;
      this.hunger = 18;
      this.position.copy(this.spawnPoint);
      this.velocity.set(0, 0, 0);
      this.onGround = false;
      this.fallPeakY = this.position.y;
      showToast("你倒下了，已在重生点复活");
    }
  }

  serialize() {
    return {
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      },
      spawnPoint: this.spawnPoint
        ? {
            x: this.spawnPoint.x,
            y: this.spawnPoint.y,
            z: this.spawnPoint.z,
          }
        : null,
      yaw: this.yaw,
      pitch: this.pitch,
      mode: this.mode,
      health: this.health,
      hunger: this.hunger,
      level: this.level,
      experience: this.experience,
      upgrades: this.serializeUpgrades(),
      effects: this.serializeEffects(),
      selected: this.selected,
      hotbar: this.hotbar,
      armorSlots: this.armorSlots,
    };
  }
}

class Input {
  constructor() {
    this.keys = new Set();
    this.virtualKeys = new Set();
    this.pointerLocked = false;
  }

  down(code) {
    return this.keys.has(code) || this.virtualKeys.has(code);
  }

  setVirtual(code, active) {
    if (active) this.virtualKeys.add(code);
    else this.virtualKeys.delete(code);
  }

  clearVirtual() {
    this.virtualKeys.clear();
  }

  activeVirtualKeys() {
    return [...this.virtualKeys];
  }
}

class EntityManager {
  constructor(scene, world, player) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.entities = [];
    this.projectiles = [];
    this.group = new THREE.Group();
    this.projectileGroup = new THREE.Group();
    this.projectileGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.72);
    this.playerArrowMaterial = new THREE.MeshLambertMaterial({ color: "#f0e7c8" });
    this.hostileArrowMaterial = new THREE.MeshLambertMaterial({ color: "#c9d3e8" });
    scene.add(this.group, this.projectileGroup);
  }

  spawnInitial() {
    for (let i = 0; i < 16; i += 1) {
      const angle = hash2(i, 2, this.world.seed) * Math.PI * 2;
      const dist = 14 + hash2(i, 7, this.world.seed) * 42;
      const x = Math.floor(Math.cos(angle) * dist);
      const z = Math.floor(Math.sin(angle) * dist);
      const type = i % 5 === 0 ? "skeleton" : i % 4 === 0 ? "zombie" : "sheep";
      this.spawn(type, x, z);
    }
    const pcx = Math.floor(this.player.position.x / CHUNK_SIZE);
    const pcz = Math.floor(this.player.position.z / CHUNK_SIZE);
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx += 1) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz += 1) {
        const village = this.world.getVillageInfo(pcx + dx, pcz + dz);
        if (village) {
          this.spawn("villager", village.x, village.z);
        }
      }
    }
  }

  spawn(type, x, z) {
    const y = this.world.getSurfaceHeight(x, z) + 1;
    return this.spawnAt(type, x + 0.5, y, z + 0.5);
  }

  spawnAt(type, x, y, z, saved = {}) {
    const vehicle = isVehicleType(type);
    const entity = {
      type,
      position: new THREE.Vector3(Number(x), Number(y), Number(z)),
      velocity: new THREE.Vector3(saved.vx ?? 0, saved.vy ?? 0, saved.vz ?? 0),
      health: saved.health ?? (type === "zombie" ? 14 : type === "skeleton" ? 12 : type === "villager" ? 20 : vehicle ? 10 : 8),
      radius: type === "boat" ? 0.78 : type === "minecart" ? 0.55 : type === "zombie" || type === "skeleton" ? 0.42 : type === "villager" ? 0.45 : 0.5,
      timer: saved.timer ?? hash2(x, z, this.world.seed) * 4,
      targetYaw: saved.targetYaw ?? hash2(x, z, this.world.seed + 12) * Math.PI * 2,
      attackCooldown: saved.attackCooldown ?? 0,
      railAxis: saved.railAxis ?? "x",
      rider: false,
      mesh: this.createMesh(type),
    };
    entity.mesh.rotation.y = entity.targetYaw;
    entity.mesh.position.copy(entity.position);
    this.group.add(entity.mesh);
    this.entities.push(entity);
    return entity;
  }

  restore(savedEntities) {
    if (!Array.isArray(savedEntities)) return false;
    const allowed = new Set(["sheep", "zombie", "skeleton", "villager", "boat", "minecart"]);
    for (const saved of savedEntities.slice(0, 48)) {
      if (!allowed.has(saved?.type)) continue;
      const x = Number(saved.x);
      const y = Number(saved.y);
      const z = Number(saved.z);
      if (![x, y, z].every(Number.isFinite) || y < 0 || y >= WORLD_HEIGHT) continue;
      const entity = this.spawnAt(saved.type, x, y, z, saved);
      entity.health = clamp(Number(saved.health) || entity.health, 0.1, 40);
    }
    return true;
  }

  serialize() {
    return this.entities
      .filter((entity) => entity.health > 0)
      .slice(0, 48)
      .map((entity) => ({
        type: entity.type,
        x: Number(entity.position.x.toFixed(3)),
        y: Number(entity.position.y.toFixed(3)),
        z: Number(entity.position.z.toFixed(3)),
        vx: Number(entity.velocity.x.toFixed(3)),
        vy: Number(entity.velocity.y.toFixed(3)),
        vz: Number(entity.velocity.z.toFixed(3)),
        health: Number(entity.health.toFixed(2)),
        targetYaw: Number(entity.targetYaw.toFixed(4)),
        railAxis: entity.railAxis,
        timer: Number(entity.timer.toFixed(3)),
        attackCooldown: Number(entity.attackCooldown.toFixed(3)),
      }));
  }

  createMesh(type) {
    const root = new THREE.Group();
    if (type === "boat") {
      const hull = new THREE.MeshLambertMaterial({ color: "#8b5a2b" });
      const dark = new THREE.MeshLambertMaterial({ color: "#51351c" });
      this.box(root, hull, [0, 0.18, 0], [1.55, 0.28, 0.82]);
      this.box(root, dark, [0, 0.34, -0.48], [1.55, 0.42, 0.16]);
      this.box(root, dark, [0, 0.34, 0.48], [1.55, 0.42, 0.16]);
      this.box(root, dark, [-0.82, 0.34, 0], [0.16, 0.4, 0.88]);
      this.box(root, dark, [0.82, 0.34, 0], [0.16, 0.4, 0.88]);
      this.box(root, new THREE.MeshLambertMaterial({ color: "#b88747" }), [0, 0.5, 0], [0.7, 0.08, 0.62]);
    } else if (type === "minecart") {
      const metal = new THREE.MeshLambertMaterial({ color: "#878d8e" });
      const dark = new THREE.MeshLambertMaterial({ color: "#363a3c" });
      this.box(root, metal, [0, 0.22, 0], [1.05, 0.28, 0.82]);
      this.box(root, metal, [0, 0.48, -0.46], [1.08, 0.42, 0.12]);
      this.box(root, metal, [0, 0.48, 0.46], [1.08, 0.42, 0.12]);
      this.box(root, metal, [-0.58, 0.48, 0], [0.12, 0.42, 0.82]);
      this.box(root, metal, [0.58, 0.48, 0], [0.12, 0.42, 0.82]);
      for (const sx of [-0.38, 0.38]) {
        for (const sz of [-0.34, 0.34]) {
          this.box(root, dark, [sx, 0.02, sz], [0.22, 0.16, 0.16]);
        }
      }
    } else if (type === "sheep") {
      const wool = new THREE.MeshLambertMaterial({ color: "#f1f1df" });
      const face = new THREE.MeshLambertMaterial({ color: "#2f2b26" });
      this.box(root, wool, [0, 0.65, 0], [0.95, 0.7, 0.55]);
      this.box(root, face, [0, 0.72, -0.48], [0.42, 0.42, 0.35]);
      for (const sx of [-0.28, 0.28]) {
        for (const sz of [-0.22, 0.22]) {
          this.box(root, face, [sx, 0.18, sz], [0.16, 0.36, 0.16]);
        }
      }
    } else if (type === "zombie" || type === "skeleton") {
      const skin = new THREE.MeshLambertMaterial({ color: type === "skeleton" ? "#d9d8cc" : "#5a9b61" });
      const shirt = new THREE.MeshLambertMaterial({ color: type === "skeleton" ? "#b9b8ac" : "#3d6f93" });
      const pants = new THREE.MeshLambertMaterial({ color: type === "skeleton" ? "#9e9d93" : "#2f3f69" });
      this.box(root, skin, [0, 1.45, 0], [0.48, 0.48, 0.48]);
      this.box(root, shirt, [0, 0.9, 0], [0.58, 0.72, 0.32]);
      this.box(root, skin, [-0.43, 0.88, -0.02], [0.18, 0.7, 0.22]);
      this.box(root, skin, [0.43, 0.88, -0.02], [0.18, 0.7, 0.22]);
      this.box(root, pants, [-0.17, 0.28, 0], [0.2, 0.56, 0.22]);
      this.box(root, pants, [0.17, 0.28, 0], [0.2, 0.56, 0.22]);
      if (type === "skeleton") this.box(root, new THREE.MeshLambertMaterial({ color: "#7c5630" }), [0.52, 0.95, -0.12], [0.08, 0.9, 0.08]);
    } else {
      const robe = new THREE.MeshLambertMaterial({ color: "#8d5a35" });
      const skin = new THREE.MeshLambertMaterial({ color: "#b98b62" });
      const belt = new THREE.MeshLambertMaterial({ color: "#3c2a1d" });
      this.box(root, skin, [0, 1.46, 0], [0.5, 0.5, 0.5]);
      this.box(root, skin, [0, 1.38, -0.32], [0.18, 0.18, 0.18]);
      this.box(root, robe, [0, 0.82, 0], [0.64, 0.92, 0.38]);
      this.box(root, belt, [0, 0.95, -0.21], [0.7, 0.08, 0.04]);
      this.box(root, robe, [-0.42, 0.86, 0], [0.16, 0.72, 0.2]);
      this.box(root, robe, [0.42, 0.86, 0], [0.16, 0.72, 0.2]);
      this.box(root, robe, [-0.18, 0.28, 0], [0.2, 0.56, 0.22]);
      this.box(root, robe, [0.18, 0.28, 0], [0.2, 0.56, 0.22]);
    }
    return root;
  }

  box(root, material, position, scale) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(scale[0], scale[1], scale[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    root.add(mesh);
  }

  spawnProjectile(origin, direction, options = {}) {
    const velocity = direction.clone().normalize().multiplyScalar(options.speed ?? 18);
    const mesh = new THREE.Mesh(
      this.projectileGeometry,
      options.owner === "player" ? this.playerArrowMaterial : this.hostileArrowMaterial,
    );
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), velocity.clone().normalize());
    this.projectileGroup.add(mesh);
    this.projectiles.push({
      owner: options.owner ?? "player",
      position: origin.clone(),
      velocity,
      damage: options.damage ?? 5,
      ttl: options.ttl ?? 3.5,
      mesh,
    });
  }

  entityHeight(entity) {
    if (entity.type === "boat") return 0.75;
    if (entity.type === "minecart") return 0.72;
    if (entity.type === "sheep") return 1.15;
    return 1.8;
  }

  entityBoxAt(entity, x, y, z) {
    return {
      minX: x - entity.radius,
      maxX: x + entity.radius,
      minY: y,
      maxY: y + this.entityHeight(entity),
      minZ: z - entity.radius,
      maxZ: z + entity.radius,
    };
  }

  entityCollidesAt(entity, x, y, z) {
    const entityBox = this.entityBoxAt(entity, x, y, z);
    const minX = Math.floor(entityBox.minX);
    const maxX = Math.floor(entityBox.maxX);
    const minY = Math.floor(entityBox.minY);
    const maxY = Math.floor(entityBox.maxY);
    const minZ = Math.floor(entityBox.minZ);
    const maxZ = Math.floor(entityBox.maxZ);
    for (let bx = minX; bx <= maxX; bx += 1) {
      for (let by = minY; by <= maxY; by += 1) {
        for (let bz = minZ; bz <= maxZ; bz += 1) {
          for (const blockBox of this.world.collisionBoxesForBlock(bx, by, bz)) {
            if (aabbIntersects(entityBox, blockBox)) return true;
          }
        }
      }
    }
    return false;
  }

  entityStandingYAt(entity, x, z) {
    const startY = Math.min(WORLD_HEIGHT - 2, Math.floor(entity.position.y + 2));
    for (let y = startY; y >= 0; y -= 1) {
      const standingY = y + 1;
      const hasSupport = this.world.collisionBoxesForBlock(Math.floor(x), y, Math.floor(z)).length > 0;
      if (!hasSupport) continue;
      if (!this.entityCollidesAt(entity, x, standingY, z)) return standingY;
    }
    return null;
  }

  moveEntityOnGround(entity, nextX, nextZ, dt) {
    const groundY = this.entityStandingYAt(entity, nextX, nextZ);
    if (groundY === null || groundY - entity.position.y > 1.2 || entity.position.y - groundY > 1.4) {
      entity.targetYaw += Math.PI * 0.75;
      return;
    }
    entity.position.x = nextX;
    entity.position.z = nextZ;
    entity.position.y = lerp(entity.position.y, groundY, clamp(dt * 10, 0, 1));
  }

  boatWaterY(entity, sampleX = entity.position.x, sampleZ = entity.position.z) {
    const x = Math.floor(sampleX);
    const z = Math.floor(sampleZ);
    const start = Math.floor(entity.position.y + 0.2);
    for (let y = start; y >= Math.max(0, start - 2); y -= 1) {
      if (this.world.getBlock(x, y, z) === BLOCK.WATER) return y;
    }
    return null;
  }

  railInfoAt(entity, nextX = entity.position.x, nextZ = entity.position.z) {
    const x = Math.floor(nextX);
    const z = Math.floor(nextZ);
    const candidates = [
      Math.floor(entity.position.y),
      Math.floor(entity.position.y - 0.15),
      Math.floor(entity.position.y - 0.65),
    ];
    for (const y of candidates) {
      const id = this.world.getBlock(x, y, z);
      if (!isRailBlock(id)) continue;
      const axis = railAxisFor(this.world, x, y, z, entity.railAxis ?? "x");
      return { x, y, z, axis, id, powered: id === BLOCK.POWERED_RAIL_ON, brake: id === BLOCK.POWERED_RAIL };
    }
    return null;
  }

  updateVehicleEntity(entity, dt) {
    if (entity.rider) {
      entity.mesh.position.copy(entity.position);
      entity.mesh.rotation.y = entity.targetYaw;
      return;
    }
    if (entity.type === "boat") {
      const waterY = this.boatWaterY(entity);
      entity.velocity.x *= waterY === null ? 0.72 : 0.94;
      entity.velocity.z *= waterY === null ? 0.72 : 0.94;
      const nextX = entity.position.x + entity.velocity.x * dt;
      const nextZ = entity.position.z + entity.velocity.z * dt;
      const nextWaterY = this.boatWaterY(entity, nextX, nextZ);
      if (waterY !== null && nextWaterY === null) {
        entity.velocity.x *= 0.25;
        entity.velocity.z *= 0.25;
      } else {
        entity.position.x = nextX;
        entity.position.z = nextZ;
      }
      const targetWaterY = nextWaterY ?? waterY;
      if (targetWaterY !== null) entity.position.y = lerp(entity.position.y, targetWaterY + 0.55, clamp(dt * 8, 0, 1));
    } else if (entity.type === "minecart") {
      const rail = this.railInfoAt(entity);
      if (rail) {
        entity.railAxis = rail.axis;
        entity.velocity[rail.axis === "x" ? "z" : "x"] = 0;
        applyMinecartRailPower(entity, rail, dt);
        const nextX = rail.axis === "x" ? entity.position.x + entity.velocity.x * dt : rail.x + 0.5;
        const nextZ = rail.axis === "z" ? entity.position.z + entity.velocity.z * dt : rail.z + 0.5;
        const nextRail = this.railInfoAt(entity, nextX, nextZ);
        if (nextRail) {
          entity.position.x = rail.axis === "x" ? nextX : nextRail.x + 0.5;
          entity.position.z = rail.axis === "z" ? nextZ : nextRail.z + 0.5;
          entity.position.y = lerp(entity.position.y, nextRail.y + 0.18, clamp(dt * 12, 0, 1));
          const sign = rail.axis === "x" ? Math.sign(entity.velocity.x) : Math.sign(entity.velocity.z);
          if (Math.abs(sign) > 0) {
            entity.targetYaw = rail.axis === "x" ? (sign > 0 ? -Math.PI / 2 : Math.PI / 2) : (sign > 0 ? Math.PI : 0);
          }
        } else {
          entity.velocity.set(0, 0, 0);
        }
      } else {
        entity.velocity.multiplyScalar(0.78);
        entity.position.addScaledVector(entity.velocity, dt);
      }
    }
    entity.mesh.position.copy(entity.position);
    entity.mesh.rotation.y = entity.targetYaw;
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      projectile.ttl -= dt;
      projectile.velocity.y -= 9.8 * dt;
      const next = projectile.position.clone().addScaledVector(projectile.velocity, dt);
      const blockId = this.world.getBlock(Math.floor(next.x), Math.floor(next.y), Math.floor(next.z));
      let remove = projectile.ttl <= 0 || (blockId !== BLOCK.AIR && !BLOCKS[blockId]?.liquid && BLOCKS[blockId]?.collision);

      if (!remove && projectile.owner === "player") {
        for (const entity of this.entities) {
          const center = entity.position.clone().add(new THREE.Vector3(0, this.entityHeight(entity) * 0.55, 0));
          if (center.distanceTo(next) < entity.radius + 0.32) {
            this.damageEntity(entity, projectile.damage);
            remove = true;
            break;
          }
        }
      } else if (!remove && projectile.owner === "hostile") {
        const playerCenter = this.player.position.clone().add(new THREE.Vector3(0, 0.9, 0));
        if (playerCenter.distanceTo(next) < this.player.radius + 0.35) {
          this.player.damage(projectile.damage);
          showToast("被箭射中");
          remove = true;
        }
      }

      if (remove) {
        this.projectileGroup.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
      } else {
        projectile.position.copy(next);
        projectile.mesh.position.copy(projectile.position);
        projectile.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), projectile.velocity.clone().normalize());
      }
    }
  }

  update(dt, timeOfDay) {
    const isNight = isNightTime(timeOfDay);
    for (const entity of this.entities) {
      entity.attackCooldown = Math.max(0, entity.attackCooldown - dt);
      entity.timer -= dt;
      if (isVehicleType(entity.type)) {
        this.updateVehicleEntity(entity, dt);
        continue;
      }
      const toPlayer = this.player.position.clone().sub(entity.position);
      const distance = toPlayer.length();
      let speed = 0;
      let yaw = entity.targetYaw;

      if ((entity.type === "zombie" || entity.type === "skeleton") && (isNight || distance < 14)) {
        yaw = Math.atan2(-toPlayer.x, -toPlayer.z);
        if (entity.type === "zombie") {
          speed = isNight ? 2.3 : 1.3;
          const canReachPlayer = this.hasLineOfSight(entity.position.clone().add(new THREE.Vector3(0, 1.05, 0)), this.player.eye);
          if (distance < 1.45 && entity.attackCooldown <= 0 && canReachPlayer) {
            this.player.damage(2);
            entity.attackCooldown = 1.1;
            showToast("受到攻击");
          }
        } else {
          speed = distance < 7 ? 0.35 : distance > 11 ? 1.15 : 0;
          if (distance < 16 && entity.attackCooldown <= 0 && this.hasLineOfSight(entity.position, this.player.eye)) {
            const origin = entity.position.clone().add(new THREE.Vector3(0, 1.25, 0));
            const aim = this.player.eye.clone().sub(origin).normalize();
            this.spawnProjectile(origin, aim, { owner: "hostile", damage: 2.5, speed: 13, ttl: 3.2 });
            entity.attackCooldown = 2.1;
          }
        }
        if (!isNight && this.canSeeSky(entity.position)) entity.health -= dt * 0.9;
      } else if (entity.type === "sheep" || entity.type === "villager") {
        speed = entity.type === "villager" ? 0.55 : 0.8;
        if (entity.timer <= 0) {
          entity.targetYaw = hash2(entity.position.x, entity.position.z, performance.now()) * Math.PI * 2;
          entity.timer = 1.5 + hash2(entity.position.z, entity.position.x, this.world.seed) * 4;
        }
      }

      entity.mesh.rotation.y = yaw;
      entity.velocity.x = -Math.sin(yaw) * speed;
      entity.velocity.z = -Math.cos(yaw) * speed;
      const nextX = entity.position.x + entity.velocity.x * dt;
      const nextZ = entity.position.z + entity.velocity.z * dt;
      this.moveEntityOnGround(entity, nextX, nextZ, dt);
      entity.mesh.position.copy(entity.position);
    }

    for (let i = this.entities.length - 1; i >= 0; i -= 1) {
      const entity = this.entities[i];
      if (entity.health <= 0) {
        if (this.player.ridingEntity === entity) this.player.dismountVehicle(false);
        this.group.remove(entity.mesh);
        this.entities.splice(i, 1);
        if (entity.type === "boat") {
          this.player.addItem(ITEM.BOAT, 1);
          showToast("木船被回收");
        } else if (entity.type === "minecart") {
          this.player.addItem(ITEM.MINECART, 1);
          showToast("矿车被回收");
        } else if (entity.type === "zombie") {
          this.player.addItem(BLOCK.COAL_ORE, 1);
          this.rewardExperience(entity.type, "获得煤矿石");
        } else if (entity.type === "skeleton") {
          this.player.addItem(ITEM.BONE, 1);
          this.player.addItem(ITEM.ARROW, 2);
          this.rewardExperience(entity.type, "获得骨头和箭");
        } else if (entity.type === "villager") {
          this.player.addItem(ITEM.EMERALD, 1);
          this.rewardExperience(entity.type, "获得绿宝石");
        } else {
          this.player.addItem(ITEM.RAW_MUTTON, 1);
          this.player.addItem(ITEM.WOOL, 1);
          this.rewardExperience(entity.type, "获得生肉和羊毛");
        }
      }
    }

    this.updateProjectiles(dt);

    if (this.entities.length < 12 && Math.random() < dt * 0.025) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 36 + Math.random() * 38;
      const x = Math.floor(this.player.position.x + Math.cos(angle) * dist);
      const z = Math.floor(this.player.position.z + Math.sin(angle) * dist);
      this.spawn(isNight ? (Math.random() < 0.45 ? "skeleton" : "zombie") : "sheep", x, z);
    }
  }

  rewardExperience(type, message) {
    const xp = EXPERIENCE_REWARDS[type] ?? 0;
    const result = this.player.addExperience(xp);
    const xpText = xp > 0 ? ` 经验+${xp}${result.leveled ? ` 等级${this.player.level}` : ""}` : "";
    showToast(`${message}${xpText}`);
  }

  canSeeSky(position) {
    const x = Math.floor(position.x);
    const z = Math.floor(position.z);
    for (let y = Math.floor(position.y + 2); y < WORLD_HEIGHT; y += 1) {
      const id = this.world.getBlock(x, y, z);
      if (id !== BLOCK.AIR && id !== BLOCK.LEAVES && id !== BLOCK.WATER) return false;
    }
    return true;
  }

  hasLineOfSight(from, to) {
    const dir = to.clone().sub(from);
    const distance = dir.length();
    if (distance <= 0) return true;
    dir.normalize();
    for (let d = 0.4; d < distance; d += 0.45) {
      const p = from.clone().addScaledVector(dir, d);
      const id = this.world.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
      if (id !== BLOCK.AIR && id !== BLOCK.WATER && BLOCKS[id]?.collision) return false;
    }
    return true;
  }

  damageEntity(entity, amount) {
    entity.health -= amount;
    entity.mesh.scale.setScalar(1.08);
    setTimeout(() => entity.mesh.scale.setScalar(1), 80);
  }

  raycast(origin, dir, maxDistance) {
    let best = null;
    for (const entity of this.entities) {
      const height = this.entityHeight(entity);
      const sampleHeights = [height * 0.35, height * 0.62, height * 0.86].filter((value, index, array) => index === 0 || Math.abs(value - array[index - 1]) > 0.12);
      for (const height of sampleHeights) {
        const center = entity.position.clone().add(new THREE.Vector3(0, height, 0));
        const toEntity = center.clone().sub(origin);
        const t = toEntity.dot(dir);
        if (t < 0 || t > maxDistance) continue;
        const closest = origin.clone().addScaledVector(dir, t);
        const miss = closest.distanceTo(center);
        if (miss < entity.radius + 0.36 && (!best || t < best.distance)) {
          best = { entity, distance: t };
        }
      }
    }
    return best;
  }
}

const savedState = loadSavedState();
const seed = savedState?.seed ?? Math.floor(Math.random() * 1_000_000);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#7fb6dc", 80, 280);

const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 800);
scene.add(camera);
const heldItemGroup = new THREE.Group();
camera.add(heldItemGroup);
let lastHeldItemId = null;
let heldItemSwing = 0;
const hemi = new THREE.HemisphereLight("#dcefff", "#4d402b", 0.68);
const sun = new THREE.DirectionalLight("#fff4d2", 1.18);
sun.position.set(30, 55, 20);
const moon = new THREE.DirectionalLight("#8da7ff", 0.08);
moon.position.set(-20, 25, -30);
scene.add(hemi, sun, moon);

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 16, 8),
  new THREE.MeshBasicMaterial({ color: "#fff1a2" }),
);
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.7, 16, 8),
  new THREE.MeshBasicMaterial({ color: "#dfe6ff" }),
);
scene.add(sunMesh, moonMesh);

const world = new World(scene, seed, savedState);
blockColorWorld = world;
const player = new Player(world, savedState);
const input = new Input();
const entities = new EntityManager(scene, world, player);
if (!entities.restore(savedState?.entities)) entities.spawnInitial();

const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
  new THREE.LineBasicMaterial({ color: "#ffe66d", linewidth: 2 }),
);
highlight.visible = false;
scene.add(highlight);

const entityHighlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: "#7ee8ff", linewidth: 2 }),
);
entityHighlight.visible = false;
scene.add(entityHighlight);

let gameStarted = false;
let paused = false;
let inventoryOpen = false;
let targetBlock = null;
let targetEntity = null;
let timeOfDay = savedState?.timeOfDay ?? 0.28;
let weather = savedState?.weather ?? "clear";
let autosaveTimer = 0;
let fallingBlockTimer = 0;
let toastTimer = 0;
let lastFrameTime = performance.now();
let lastTrade = null;
const touchState = {
  available: false,
  forcedVisible: false,
  stickPointerId: null,
  lookPointerId: null,
  lookX: 0,
  lookY: 0,
  stickX: 0,
  stickY: 0,
  lastAction: null,
};

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("visible");
  toastTimer = 2.2;
}

function setInventoryOpen(open) {
  inventoryOpen = open;
  inventoryPanel.classList.toggle("visible", open);
  inventoryPanel.setAttribute("aria-hidden", String(!open));
  if (open && document.pointerLockElement) document.exitPointerLock();
  renderInventory();
}

function startGame() {
  gameStarted = true;
  paused = false;
  startPanel.classList.remove("visible");
  ensureAudioContext();
  playSound("start");
  canvas.requestPointerLock?.();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateTouchControlsVisibility(force = null) {
  if (typeof force === "boolean") touchState.forcedVisible = force;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  touchState.available = touchState.forcedVisible || coarse || navigator.maxTouchPoints > 0;
  document.body.classList.toggle("touch-device", touchState.available);
  touchControlsEl?.classList.toggle("force-visible", touchState.forcedVisible);
  touchControlsEl?.setAttribute("aria-hidden", String(!touchState.available));
  return touchState.available;
}

function applyVirtualJoystick(x = 0, y = 0) {
  const length = Math.hypot(x, y);
  if (length > 1) {
    x /= length;
    y /= length;
  }
  touchState.stickX = clamp(x, -1, 1);
  touchState.stickY = clamp(y, -1, 1);
  const threshold = 0.24;
  input.setVirtual("KeyA", touchState.stickX < -threshold);
  input.setVirtual("KeyD", touchState.stickX > threshold);
  input.setVirtual("KeyW", touchState.stickY < -threshold);
  input.setVirtual("KeyS", touchState.stickY > threshold);
  if (touchStickKnobEl) {
    touchStickKnobEl.style.transform = `translate(-50%, -50%) translate(${touchState.stickX * 34}px, ${touchState.stickY * 34}px)`;
  }
  return input.activeVirtualKeys();
}

function resetVirtualJoystick() {
  applyVirtualJoystick(0, 0);
}

function updateJoystickFromPointer(event) {
  if (!touchStickEl) return;
  const rect = touchStickEl.getBoundingClientRect();
  const radius = Math.max(1, rect.width / 2);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  applyVirtualJoystick((event.clientX - centerX) / radius, (event.clientY - centerY) / radius);
}

function runTouchAction(action, active = true) {
  touchState.lastAction = action;
  ensureAudioContext();
  if (action === "jump") {
    input.setVirtual("Space", active);
    return true;
  }
  if (!active) return true;
  if (!gameStarted) startGame();
  if (action === "mine") {
    mineOrAttack();
    renderInventory();
    renderHud();
    return true;
  }
  if (action === "use") {
    placeOrUse();
    renderInventory();
    renderHud();
    return true;
  }
  if (action === "inventory") {
    setInventoryOpen(!inventoryOpen);
    return true;
  }
  return false;
}

function beginTouchLook(event) {
  if (event.pointerType !== "touch") return;
  if (event.target instanceof Element && event.target.closest("#touch-controls, .panel, button")) return;
  if (!gameStarted || inventoryOpen) return;
  touchState.lookPointerId = event.pointerId;
  touchState.lookX = event.clientX;
  touchState.lookY = event.clientY;
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveTouchLook(event) {
  if (event.pointerId !== touchState.lookPointerId) return;
  const dx = event.clientX - touchState.lookX;
  const dy = event.clientY - touchState.lookY;
  touchState.lookX = event.clientX;
  touchState.lookY = event.clientY;
  player.yaw -= dx * 0.004;
  player.pitch -= dy * 0.004;
  player.pitch = clamp(player.pitch, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
  event.preventDefault();
}

function endTouchLook(event) {
  if (event.pointerId === touchState.lookPointerId) {
    touchState.lookPointerId = null;
    canvas.releasePointerCapture?.(event.pointerId);
  }
}

function updateCamera() {
  camera.position.copy(player.eye);
  camera.rotation.order = "YXZ";
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}

function raycastBlock(origin, direction, maxDistance) {
  let lastEmpty = null;
  const step = 0.05;
  for (let d = 0; d <= maxDistance; d += step) {
    const p = origin.clone().addScaledVector(direction, d);
    const x = Math.floor(p.x);
    const y = Math.floor(p.y);
    const z = Math.floor(p.z);
    const id = world.getBlock(x, y, z);
    if (id !== BLOCK.AIR) {
      if (pointInsideBlockShape(id, world.getBlockMeta(x, y, z), p, x, y, z)) {
        return { x, y, z, id, distance: d, place: lastEmpty };
      }
      lastEmpty = { x, y, z };
      continue;
    }
    lastEmpty = { x, y, z };
  }
  return null;
}

function intersectsPlayerBlock(x, y, z, id = player.selectedBlock(), meta = null) {
  const playerBox = {
    minX: player.position.x - player.radius,
    maxX: player.position.x + player.radius,
    minY: player.position.y,
    maxY: player.position.y + player.height,
    minZ: player.position.z - player.radius,
    maxZ: player.position.z + player.radius,
  };
  return collisionBoxesForBlock(id, x, y, z, meta).some((box) => aabbIntersects(playerBox, box));
}

function blockDrops(blockId, toolId, x = 0, y = 0, z = 0) {
  if (blockId === BLOCK.WHEAT_READY) {
    return [
      [ITEM.WHEAT, 1],
      [ITEM.WHEAT_SEEDS, 2],
    ];
  }
  if (blockId === BLOCK.WHEAT_CROP) return [[ITEM.WHEAT_SEEDS, 1]];
  if (blockId === BLOCK.GLASS && player.mode !== "creative") return [];
  if (blockId === BLOCK.PISTON_HEAD) return [];
  if (!canHarvestBlock(blockId, toolId) && player.mode !== "creative") return [];
  if (blockId === BLOCK.GRAVEL && player.mode !== "creative") {
    return [[hash3(x, y, z, seed + 3300) > 0.86 ? ITEM.FLINT : BLOCK.GRAVEL, 1]];
  }
  const drop = BLOCKS[blockId].drop ?? blockId;
  return drop ? [[drop, 1]] : [];
}

function cleanupAfterBlockBreak(x, y, z, brokenId, brokenMeta = null) {
  if (brokenId === BLOCK.PISTON_HEAD) {
    const facing = normalizeFacing(brokenMeta?.facing);
    const front = facingVector(facing);
    const baseX = x - front.x;
    const baseZ = z - front.z;
    if (world.getBlock(baseX, y, baseZ) === BLOCK.PISTON_ON) {
      world.setBlock(baseX, y, baseZ, BLOCK.PISTON, false, { facing });
      world.extendedPistons.delete(worldKey(baseX, y, baseZ));
    }
  } else if (brokenId === BLOCK.PISTON_ON) {
    world.clearPistonHeadFor(x, y, z, brokenMeta);
  }
}

function addDrops(drops) {
  for (const [id, count] of drops) player.addItem(id, count);
}

function selectedLabel() {
  return itemDef(player.selectedBlock()).label;
}

function addHeldBox(material, position, scale) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(scale[0], scale[1], scale[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  heldItemGroup.add(mesh);
  return mesh;
}

function rebuildHeldItemModel(id) {
  heldItemGroup.clear();
  lastHeldItemId = id;
  if (id === BLOCK.AIR) return;
  const def = itemDef(id);
  const main = new THREE.MeshLambertMaterial({ color: def.color ?? "#ffffff" });
  const dark = new THREE.MeshLambertMaterial({ color: "#4b3322" });
  const metal = new THREE.MeshLambertMaterial({ color: "#c8c7bd" });
  const tool = toolInfo(id);

  if (tool?.kind === "sword") {
    addHeldBox(dark, [0, -0.12, 0], [0.1, 0.46, 0.1]);
    addHeldBox(main, [0, 0.15, 0], [0.18, 0.08, 0.14]);
    addHeldBox(main, [0, 0.55, 0], [0.16, 0.78, 0.08]);
  } else if (tool?.kind === "bow") {
    addHeldBox(main, [0.03, 0.26, 0], [0.1, 0.95, 0.08]);
    addHeldBox(dark, [-0.13, 0.26, 0], [0.035, 0.9, 0.035]);
    addHeldBox(main, [0.12, 0.63, 0], [0.2, 0.08, 0.08]);
    addHeldBox(main, [0.12, -0.1, 0], [0.2, 0.08, 0.08]);
  } else if (tool) {
    addHeldBox(dark, [0, 0.1, 0], [0.1, 0.76, 0.1]);
    addHeldBox(tool.kind === "pickaxe" || tool.kind === "shovel" ? metal : main, [0.12, 0.52, 0], [0.44, 0.14, 0.12]);
    if (tool.kind === "axe") addHeldBox(main, [0.24, 0.35, 0], [0.16, 0.36, 0.1]);
    if (tool.kind === "hoe") addHeldBox(main, [0.23, 0.43, 0], [0.22, 0.08, 0.1]);
  } else if (BLOCKS[id]) {
    addHeldBox(main, [0, 0.18, 0], [0.38, 0.38, 0.38]);
  } else {
    addHeldBox(main, [0, 0.12, 0], [0.28, 0.28, 0.08]);
  }
}

function updateHeldItemModel(dt) {
  const id = player.selectedBlock();
  const hasHeldItem = player.mode === "creative" || (player.inventory.get(id) ?? 0) > 0;
  const modelId = hasHeldItem ? id : BLOCK.AIR;
  if (lastHeldItemId !== modelId) rebuildHeldItemModel(modelId);
  heldItemGroup.visible = gameStarted && !inventoryOpen && hasHeldItem;
  heldItemSwing = Math.max(0, heldItemSwing - dt * 5);
  const swing = Math.sin(heldItemSwing * Math.PI);
  heldItemGroup.position.set(0.58, -0.5 + swing * 0.02, -0.78 + swing * 0.08);
  heldItemGroup.rotation.set(-0.58 - swing * 0.5, 0.28 + swing * 0.18, -0.34 - swing * 0.24);
}

function placementMetaFor(id) {
  const shape = BLOCKS[id]?.shape;
  if (shape === "stairs" || shape === "door" || shape === "repeater" || shape === "observer" || shape === "piston") {
    return { facing: facingFromYaw(player.yaw) };
  }
  return null;
}

function shootBow() {
  const selected = player.selectedBlock();
  if (toolInfo(selected)?.kind !== "bow") return false;
  if (player.mode !== "creative" && (player.inventory.get(selected) ?? 0) <= 0) {
    showToast("缺少弓");
    player.actionCooldown = 0.25;
    return true;
  }
  if (player.mode !== "creative" && (player.inventory.get(ITEM.ARROW) ?? 0) <= 0) {
    showToast("缺少箭");
    player.actionCooldown = 0.25;
    return true;
  }
  if (player.mode !== "creative" && !player.removeItem(ITEM.ARROW, 1)) return true;
  const direction = player.direction();
  const origin = player.eye.clone().addScaledVector(direction, 0.65);
  const power = player.upgradeLevel(selected, "power");
  const strength = player.effectLevel("strength");
  entities.spawnProjectile(origin, direction, { owner: "player", damage: 6 + power * 2 + strength * 2, speed: 24, ttl: 3.2 });
  player.useTool(selected, 1);
  heldItemSwing = 1;
  player.actionCooldown = 0.45;
  showToast(power > 0 ? `射出一箭 力量${romanLevel(power)}` : "射出一箭");
  playSound("bow");
  return true;
}

function mineOrAttack() {
  if (!gameStarted || inventoryOpen || player.actionCooldown > 0) return;
  if (shootBow()) {
    renderInventory();
    return;
  }
  const dir = player.direction();
  const origin = player.eye;
  const blockHit = raycastBlock(origin, dir, MAX_REACH);
  const entityHit = entities.raycast(origin, dir, MAX_REACH);
  const selected = player.selectedBlock();
  targetBlock = blockHit ?? targetBlock;
  targetEntity = entityHit;
  if (entityHit && (!blockHit || entityHit.distance <= blockHit.distance)) {
    const tool = usableToolInfo(selected);
    const strength = player.effectLevel("strength");
    const damage = player.mode === "creative" ? 20 : (tool?.damage ?? 3) + strength * 2;
    entities.damageEntity(entityHit.entity, damage);
    player.useTool(selected, 1);
    heldItemSwing = 1;
    player.actionCooldown = 0.28;
    showToast(`命中 ${entityHit.entity.type} 剩余${Math.max(0, entityHit.entity.health).toFixed(0)}`);
    playSound("hit");
    return;
  }
  const blockTarget = blockHit ?? targetBlock;
  if (!blockTarget) return;
  if (blockTarget.id === BLOCK.BEDROCK) {
    showToast("基岩无法破坏");
    return;
  }
  if (!canBreakBlock(blockTarget.id, selected)) {
    const required = BLOCKS[blockTarget.id]?.tool;
    showToast(`需要合适的${toolKindLabel(required)}才能破坏 ${BLOCKS[blockTarget.id].label}`);
    player.actionCooldown = 0.18;
    return;
  }
  const drops = blockDrops(blockTarget.id, selected, blockTarget.x, blockTarget.y, blockTarget.z);
  const brokenMeta = world.getBlockMeta(blockTarget.x, blockTarget.y, blockTarget.z);
  world.setBlock(blockTarget.x, blockTarget.y, blockTarget.z, BLOCK.AIR);
  cleanupAfterBlockBreak(blockTarget.x, blockTarget.y, blockTarget.z, blockTarget.id, brokenMeta);
  world.updateRedstone();
  addDrops(drops);
  player.useTool(selected, 1);
  heldItemSwing = 1;
  const speed = miningSpeedFor(blockTarget.id, selected);
  player.actionCooldown = Math.max(0.1, ((BLOCKS[blockTarget.id].hardness ?? 0.5) / speed) * 0.16);
  showToast(drops.length ? `获得 ${drops.map(([id, count]) => `${itemDef(id).label}x${count}`).join(" ")}` : "方块已破坏");
  playSound("mine");
  renderInventory();
}

function tillSoil() {
  if (!targetBlock) return false;
  const selected = player.selectedBlock();
  const rawTool = toolInfo(selected);
  if (rawTool?.kind === "hoe" && !playerHasItemForUse(selected)) {
    showToast(`缺少 ${itemDef(selected).label}`);
    return true;
  }
  const tool = usableToolInfo(selected);
  if (tool?.kind !== "hoe") return false;
  if (![BLOCK.GRASS, BLOCK.DIRT].includes(targetBlock.id)) {
    showToast("这里只能翻耕泥土或草方块");
    return true;
  }
  world.setBlock(targetBlock.x, targetBlock.y, targetBlock.z, BLOCK.FARMLAND);
  player.useTool(selected, 1);
  player.actionCooldown = 0.22;
  showToast("已翻耕：换小麦种子右键播种");
  playSound("place");
  return true;
}

function plantSeeds() {
  if (!targetBlock || player.selectedBlock() !== ITEM.WHEAT_SEEDS) return false;
  if (targetBlock.id !== BLOCK.FARMLAND) {
    showToast("种子需要耕地：先用锄头右键泥土或草方块");
    return true;
  }
  const x = targetBlock.x;
  const y = targetBlock.y + 1;
  const z = targetBlock.z;
  if (world.getBlock(x, y, z) !== BLOCK.AIR) {
    showToast("上方没有空间");
    return true;
  }
  if (!player.removeItem(ITEM.WHEAT_SEEDS, 1)) {
    showToast("缺少小麦种子");
    return true;
  }
  world.setBlock(x, y, z, BLOCK.WHEAT_CROP);
  player.actionCooldown = 0.18;
  showToast("已播种");
  playSound("place");
  return true;
}

function harvestCrop() {
  if (!targetBlock) return false;
  let crop = null;
  if (targetBlock.id === BLOCK.WHEAT_READY) {
    crop = { x: targetBlock.x, y: targetBlock.y, z: targetBlock.z };
  } else if (
    targetBlock.id === BLOCK.FARMLAND &&
    world.getBlock(targetBlock.x, targetBlock.y + 1, targetBlock.z) === BLOCK.WHEAT_READY
  ) {
    crop = { x: targetBlock.x, y: targetBlock.y + 1, z: targetBlock.z };
  }
  if (!crop) return false;
  world.setBlock(crop.x, crop.y, crop.z, BLOCK.WHEAT_CROP);
  player.addItem(ITEM.WHEAT, 1);
  player.addItem(ITEM.WHEAT_SEEDS, 2);
  player.actionCooldown = 0.2;
  showToast("收获小麦");
  playSound("mine");
  return true;
}

function toggleDoor() {
  if (!targetBlock || ![BLOCK.DOOR, BLOCK.OPEN_DOOR].includes(targetBlock.id)) return false;
  const meta = world.getBlockMeta(targetBlock.x, targetBlock.y, targetBlock.z);
  world.setBlock(
    targetBlock.x,
    targetBlock.y,
    targetBlock.z,
    targetBlock.id === BLOCK.DOOR ? BLOCK.OPEN_DOOR : BLOCK.DOOR,
    true,
    meta,
  );
  player.actionCooldown = 0.18;
  showToast(targetBlock.id === BLOCK.DOOR ? "门已打开" : "门已关闭");
  playSound("door");
  return true;
}

function toggleLever() {
  if (!targetBlock || ![BLOCK.LEVER, BLOCK.LEVER_ON].includes(targetBlock.id)) return false;
  world.setBlock(
    targetBlock.x,
    targetBlock.y,
    targetBlock.z,
    targetBlock.id === BLOCK.LEVER ? BLOCK.LEVER_ON : BLOCK.LEVER,
  );
  world.updateRedstone();
  player.actionCooldown = 0.18;
  showToast(targetBlock.id === BLOCK.LEVER ? "红石已通电" : "红石已断电");
  playSound("lever");
  return true;
}

function pressButton() {
  if (!targetBlock || ![BLOCK.BUTTON, BLOCK.BUTTON_ON].includes(targetBlock.id)) return false;
  world.triggerButton(targetBlock.x, targetBlock.y, targetBlock.z);
  world.updateRedstone();
  player.actionCooldown = 0.18;
  showToast("按钮已按下");
  playSound("lever");
  return true;
}

function sleepInBed() {
  if (!targetBlock || targetBlock.id !== BLOCK.BED) return false;
  player.spawnPoint.copy(new THREE.Vector3(targetBlock.x + 0.5, targetBlock.y + 1, targetBlock.z + 0.5));
  const night = isNightTime(timeOfDay);
  if (night) {
    timeOfDay = 0.25;
    player.health = Math.min(20, player.health + 6);
    player.hunger = Math.max(0, player.hunger - 1);
    showToast("一觉到天亮，重生点已设置");
  } else {
    showToast("重生点已设置，夜晚可睡到天亮");
  }
  player.actionCooldown = 0.35;
  playSound("sleep");
  return true;
}

function usePotion(id) {
  const potion = itemDef(id).potion;
  if (!potion) return false;
  if (player.mode !== "creative" && (player.inventory.get(id) ?? 0) <= 0) return false;
  if (!player.removeItem(id, 1)) return false;
  if (potion.key === "healing") {
    player.health = Math.min(20, player.health + (potion.heal ?? 6));
    showToast("饮用治疗药水");
  } else if (player.applyEffect(potion.key, potion.duration ?? 30, potion.amplifier ?? 1)) {
    showToast(`获得${EFFECTS[potion.key]?.label ?? "药水"}效果`);
  }
  player.addItem(ITEM.GLASS_BOTTLE, 1);
  player.actionCooldown = 0.35;
  playSound("potion");
  renderHud();
  return true;
}

function useHeldItem() {
  const selected = player.selectedBlock();
  const def = itemDef(selected);
  if (def.food) return player.eat(selected);
  if (def.potion) return usePotion(selected);
  if (isArmor(selected)) return player.equipArmor(selected);
  if (sleepInBed()) return true;
  if (harvestCrop()) return true;
  if (toggleDoor()) return true;
  if (toggleLever()) return true;
  if (pressButton()) return true;
  if (tillSoil()) return true;
  if (plantSeeds()) return true;
  return false;
}

function tradeWithVillager() {
  let villager = null;
  let distance = Infinity;
  if (targetEntity?.entity.type === "villager" && (!targetBlock || targetBlock.distance >= targetEntity.distance)) {
    villager = targetEntity.entity;
    distance = targetEntity.distance;
  } else {
    for (const entity of entities.entities) {
      if (entity.type !== "villager") continue;
      const d = entity.position.distanceTo(player.position);
      if (d < distance) {
        villager = entity;
        distance = d;
      }
    }
  }
  if (!villager || distance > 3.5) return false;
  let trade = null;
  if ((player.inventory.get(ITEM.WHEAT) ?? 0) >= 3) {
    player.removeItem(ITEM.WHEAT, 3);
    player.addItem(ITEM.EMERALD, 1);
    trade = "小麦x3 -> 绿宝石";
  } else if ((player.inventory.get(BLOCK.COAL_ORE) ?? 0) >= 2) {
    player.removeItem(BLOCK.COAL_ORE, 2);
    player.addItem(ITEM.EMERALD, 1);
    trade = "煤矿石x2 -> 绿宝石";
  } else if ((player.inventory.get(ITEM.EMERALD) ?? 0) >= 1) {
    player.removeItem(ITEM.EMERALD, 1);
    player.addItem(ITEM.BREAD, 2);
    trade = "绿宝石 -> 面包x2";
  } else {
    showToast("村民想要小麦、煤矿石或绿宝石");
    player.actionCooldown = 0.35;
    return true;
  }
  lastTrade = {
    trade,
    time: clockLabel(),
    villager: {
      x: Number(villager.position.x.toFixed(1)),
      z: Number(villager.position.z.toFixed(1)),
    },
  };
  player.actionCooldown = 0.35;
  showToast(`交易: ${trade}`);
  playSound("trade");
  return true;
}

function openChest() {
  if (!targetBlock || targetBlock.id !== BLOCK.CHEST) return false;
  world.openChest(player, targetBlock.x, targetBlock.y, targetBlock.z);
  player.actionCooldown = 0.28;
  return true;
}

function interactWithVehicle() {
  if (player.ridingEntity) return false;
  const entity = targetEntity?.entity;
  if (!entity || !isVehicleType(entity.type) || targetEntity.distance > 3.5) return false;
  if (targetBlock && targetBlock.distance < targetEntity.distance) return false;
  player.mountVehicle(entity);
  return true;
}

function railAxisFor(worldRef, x, y, z, fallback = "x") {
  const hasX = isRailBlock(worldRef.getBlock(x - 1, y, z)) || isRailBlock(worldRef.getBlock(x + 1, y, z));
  const hasZ = isRailBlock(worldRef.getBlock(x, y, z - 1)) || isRailBlock(worldRef.getBlock(x, y, z + 1));
  if (hasX && !hasZ) return "x";
  if (hasZ && !hasX) return "z";
  return fallback;
}

function railAxisAt(x, y, z, fallback = "x") {
  return railAxisFor(world, x, y, z, fallback);
}

function minecartRailSign(entity, rail, riderThrust = 0) {
  if (riderThrust !== 0) return Math.sign(riderThrust);
  const current = entity.velocity[rail.axis];
  if (Math.abs(current) > 0.05) return Math.sign(current);
  const facingComponent = rail.axis === "x" ? -Math.sin(entity.targetYaw) : -Math.cos(entity.targetYaw);
  return Math.sign(facingComponent) || 1;
}

function applyMinecartRailPower(entity, rail, dt, riderThrust = 0) {
  const axis = rail.axis;
  if (rail.powered) {
    const sign = minecartRailSign(entity, rail, riderThrust);
    const boost = Math.abs(entity.velocity[axis]) < 0.12 ? 3.6 : 5.2;
    entity.velocity[axis] += sign * boost * dt;
  } else if (rail.brake) {
    entity.velocity[axis] *= Math.pow(0.34, dt * 10);
  } else {
    entity.velocity[axis] *= 0.985;
  }
  entity.velocity[axis] = clamp(entity.velocity[axis], -8.5, 8.5);
}

function placeVehicleFromItem() {
  const selected = player.selectedBlock();
  if (selected !== ITEM.BOAT && selected !== ITEM.MINECART) return false;
  if (!targetBlock) return false;
  if (selected === ITEM.BOAT) {
    if (targetBlock.id !== BLOCK.WATER) {
      showToast("木船需要放在水面上");
      player.actionCooldown = 0.18;
      return true;
    }
    if (!player.removeItem(ITEM.BOAT, 1)) {
      showToast("缺少木船");
      return true;
    }
    const boat = entities.spawnAt("boat", targetBlock.x + 0.5, targetBlock.y + 0.55, targetBlock.z + 0.5, { targetYaw: player.yaw });
    boat.targetYaw = player.yaw;
    player.actionCooldown = 0.22;
    showToast("木船已下水，右键上船");
    playSound("place");
    return true;
  }
  if (!isRailBlock(targetBlock.id)) {
    showToast("矿车需要放在铁轨上");
    player.actionCooldown = 0.18;
    return true;
  }
  if (!player.removeItem(ITEM.MINECART, 1)) {
    showToast("缺少矿车");
    return true;
  }
  const axis = railAxisAt(targetBlock.x, targetBlock.y, targetBlock.z, Math.abs(Math.sin(player.yaw)) > Math.abs(Math.cos(player.yaw)) ? "x" : "z");
  const minecart = entities.spawnAt("minecart", targetBlock.x + 0.5, targetBlock.y + 0.18, targetBlock.z + 0.5, { targetYaw: player.yaw, railAxis: axis });
  minecart.railAxis = axis;
  player.actionCooldown = 0.22;
  showToast("矿车已放上铁轨，右键上车");
  playSound("place");
  return true;
}

function placeOrUse() {
  if (!gameStarted || inventoryOpen || player.actionCooldown > 0) return;
  if (interactWithVehicle()) {
    renderInventory();
    return;
  }
  if (tradeWithVillager()) {
    renderInventory();
    return;
  }
  if (openChest()) {
    renderInventory();
    return;
  }
  if (placeVehicleFromItem()) {
    renderInventory();
    return;
  }
  if (useHeldItem()) {
    renderInventory();
    return;
  }
  if (!targetBlock) return;
  if (
    (
      targetBlock.id === BLOCK.CRAFTING ||
      targetBlock.id === BLOCK.FURNACE ||
      targetBlock.id === BLOCK.ENCHANTING_TABLE ||
      targetBlock.id === BLOCK.BREWING_STAND
    ) &&
    !input.down("ShiftLeft") &&
    !input.down("ShiftRight")
  ) {
    setInventoryOpen(true);
    showToast(
      targetBlock.id === BLOCK.CRAFTING
        ? "打开工作台"
        : targetBlock.id === BLOCK.FURNACE
          ? "打开熔炉"
          : targetBlock.id === BLOCK.ENCHANTING_TABLE
            ? "打开附魔台"
            : "打开酿造台",
    );
    return;
  }
  const selected = player.selectedBlock();
  const place = targetBlock.place;
  if (!place || selected === BLOCK.AIR) return;
  if (!isPlaceableBlock(selected)) {
    showToast(`${selectedLabel()} 不能放置`);
    return;
  }
  const meta = placementMetaFor(selected);
  if (intersectsPlayerBlock(place.x, place.y, place.z, selected, meta)) {
    showToast("不能把方块放在自己身上");
    return;
  }
  if (!player.removeItem(selected, 1)) {
    showToast(`缺少 ${itemDef(selected).label}`);
    return;
  }
  world.setBlock(place.x, place.y, place.z, selected, true, meta);
  world.updateRedstone();
  player.actionCooldown = 0.12;
  playSound("place");
  renderInventory();
}

function recipeStation(recipe) {
  if (recipe.station) return recipe.station;
  return SMELTING_RECIPES.includes(recipe) ? "furnace" : "hand";
}

function stationLabel(station) {
  if (station === "crafting") return "工作台";
  if (station === "furnace") return "熔炉";
  return "对应工作站";
}

function canUseCraftingTable() {
  return player.mode === "creative" || hasNearbyBlock(BLOCK.CRAFTING, 4);
}

function canUseFurnace() {
  return player.mode === "creative" || hasNearbyBlock(BLOCK.FURNACE, 4);
}

function stationReadyFor(recipe) {
  const station = recipeStation(recipe);
  if (station === "hand") return true;
  if (station === "crafting") return canUseCraftingTable();
  if (station === "furnace") return canUseFurnace();
  return false;
}

function hasRecipeMaterials(recipe) {
  return Object.entries(recipe.input).every(([id, count]) => (player.inventory.get(Number(id)) ?? 0) >= count);
}

function recipeFuelReady(recipe) {
  return !recipe.fuel || findFuel(player, recipe) !== null;
}

function recipePossible(recipe) {
  return player.mode === "creative" || (stationReadyFor(recipe) && hasRecipeMaterials(recipe) && recipeFuelReady(recipe));
}

function craft(recipe) {
  const station = recipeStation(recipe);
  if (!stationReadyFor(recipe)) {
    showToast(`需要${stationLabel(station)}`);
    return false;
  }
  if (!hasRecipeMaterials(recipe) && player.mode !== "creative") {
    showToast("材料不足");
    return false;
  }
  const fuelId = recipe.fuel ? findFuel(player, recipe) : null;
  if (recipe.fuel && fuelId === null && player.mode !== "creative") {
    showToast("缺少燃料");
    return false;
  }
  if (player.mode !== "creative") {
    for (const [id, count] of Object.entries(recipe.input)) {
      player.removeItem(Number(id), count);
    }
    if (recipe.fuel) player.removeItem(fuelId, recipe.fuel);
  }
  for (const [id, count] of Object.entries(recipe.output)) {
    player.addItem(Number(id), count);
  }
  showToast(`合成 ${recipe.label.split("->").at(-1).trim()}`);
  playSound("craft");
  renderInventory();
  return true;
}

function hasNearbyBlock(blockId, radius = 4) {
  const px = Math.floor(player.position.x);
  const py = Math.floor(player.position.y);
  const pz = Math.floor(player.position.z);
  for (let x = px - radius; x <= px + radius; x += 1) {
    for (let y = Math.max(0, py - radius); y <= Math.min(WORLD_HEIGHT - 1, py + radius); y += 1) {
      for (let z = pz - radius; z <= pz + radius; z += 1) {
        if (world.getBlock(x, y, z) === blockId) return true;
      }
    }
  }
  return false;
}

function canUseEnchantingTable() {
  return (
    player.mode === "creative" ||
    (player.inventory.get(BLOCK.ENCHANTING_TABLE) ?? 0) > 0 ||
    hasNearbyBlock(BLOCK.ENCHANTING_TABLE, 4)
  );
}

function canUseBrewingStand() {
  return (
    player.mode === "creative" ||
    (player.inventory.get(BLOCK.BREWING_STAND) ?? 0) > 0 ||
    hasNearbyBlock(BLOCK.BREWING_STAND, 4)
  );
}

function brew(recipe) {
  if (!canUseBrewingStand()) {
    showToast("需要酿造台");
    return false;
  }
  if (player.mode !== "creative") {
    for (const [id, count] of Object.entries(recipe.input)) {
      if ((player.inventory.get(Number(id)) ?? 0) < count) {
        showToast("材料不足");
        return false;
      }
    }
    for (const [id, count] of Object.entries(recipe.input)) {
      player.removeItem(Number(id), count);
    }
  }
  for (const [id, count] of Object.entries(recipe.output)) {
    player.addItem(Number(id), count);
  }
  showToast(`酿造 ${recipe.label.split("->").at(-1).trim()}`);
  renderInventory();
  renderHud();
  return true;
}

function enchantSelected(key) {
  const id = player.selectedBlock();
  const entry = ENCHANTMENTS.find((candidate) => candidate.key === key);
  if (!entry || !entry.appliesTo(id)) {
    showToast("当前物品不能升级");
    return false;
  }
  if (!canUseEnchantingTable()) {
    showToast("需要附魔台");
    return false;
  }
  const currentLevel = player.upgradeLevel(id, entry.key);
  if (currentLevel >= entry.maxLevel) {
    showToast(`${entry.label} 已达到上限`);
    return false;
  }
  const cost = enchantmentCost(entry, currentLevel);
  if (player.mode !== "creative" && player.level < cost) {
    showToast(`需要等级 ${cost}`);
    return false;
  }
  if (player.mode !== "creative" && (player.inventory.get(entry.material) ?? 0) < 1) {
    showToast(`需要 ${itemDef(entry.material).label}`);
    return false;
  }
  if (!player.spendLevels(cost)) return false;
  if (player.mode !== "creative") player.removeItem(entry.material, 1);
  const nextLevel = currentLevel + 1;
  player.setUpgradeLevel(id, entry.key, nextLevel);
  showToast(`${itemDef(id).label} 获得 ${entry.label}${romanLevel(nextLevel)}`);
  renderInventory();
  renderHud();
  return true;
}

function renderInventory() {
  equipmentList.innerHTML = "";
  const slotLabels = { head: "头盔", chest: "胸甲", legs: "护腿", feet: "靴子" };
  for (const armor of player.equippedArmor()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "equipment-choice";
    const color = armor.item ? itemDef(player.armorSlots[armor.slot]).color : "#3d443c";
    button.innerHTML = `<span class="swatch" style="background:${color}"></span><span>${slotLabels[armor.slot]}: ${armor.label ?? "空"}</span><strong>${armor.durability ?? "-"}</strong>`;
    button.addEventListener("click", () => {
      player.unequipArmor(armor.slot);
      renderInventory();
    });
    equipmentList.append(button);
  }

  enchantmentList.innerHTML = "";
  const selected = player.selectedBlock();
  const tableReady = canUseEnchantingTable();
  const enchantable = ENCHANTMENTS.filter((entry) => entry.appliesTo(selected));
  if (enchantable.length === 0) {
    const empty = document.createElement("button");
    empty.type = "button";
    empty.className = "recipe-choice";
    empty.disabled = true;
    empty.innerHTML = `<span class="swatch" style="background:#3d443c"></span><span>选择工具、弓或护甲</span><strong>-</strong>`;
    enchantmentList.append(empty);
  } else {
    for (const entry of enchantable) {
      const currentLevel = player.upgradeLevel(selected, entry.key);
      const nextLevel = currentLevel + 1;
      const cost = enchantmentCost(entry, currentLevel);
      const materialCount = player.inventory.get(entry.material) ?? 0;
      const possible =
        player.mode === "creative" ||
        (tableReady && currentLevel < entry.maxLevel && player.level >= cost && materialCount >= 1);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recipe-choice";
      button.disabled = !possible;
      const levelText =
        currentLevel >= entry.maxLevel ? `${entry.label}${romanLevel(currentLevel)} 已满` : `${entry.label}${romanLevel(nextLevel)}`;
      const needText =
        currentLevel >= entry.maxLevel
          ? entry.effect
          : `${entry.effect} | 等级${cost} + ${itemDef(entry.material).label}x1`;
      const statusText = currentLevel >= entry.maxLevel ? "满" : possible ? "升" : "缺";
      button.innerHTML = `<span class="swatch" style="background:${itemDef(selected).color}"></span><span>${itemDef(selected).label}: ${levelText}<br>${needText}</span><strong>${statusText}</strong>`;
      button.addEventListener("click", () => enchantSelected(entry.key));
      enchantmentList.append(button);
    }
    if (!tableReady && player.mode !== "creative") {
      const hint = document.createElement("button");
      hint.type = "button";
      hint.className = "recipe-choice";
      hint.disabled = true;
      hint.innerHTML = `<span class="swatch" style="background:${BLOCKS[BLOCK.ENCHANTING_TABLE].color}"></span><span>放置或携带附魔台后可升级</span><strong>台</strong>`;
      enchantmentList.append(hint);
    }
  }

  brewingList.innerHTML = "";
  const brewingReady = canUseBrewingStand();
  for (const recipe of BREWING_RECIPES) {
    const possible =
      player.mode === "creative" ||
      (brewingReady &&
        Object.entries(recipe.input).every(([id, count]) => (player.inventory.get(Number(id)) ?? 0) >= count));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recipe-choice";
    button.disabled = !possible;
    const outputId = Number(Object.keys(recipe.output)[0]);
    button.innerHTML = `<span class="swatch" style="background:${itemDef(outputId).color}"></span><span>${recipe.label}</span><strong>${possible ? "酿" : "缺"}</strong>`;
    button.addEventListener("click", () => brew(recipe));
    brewingList.append(button);
  }
  if (!brewingReady && player.mode !== "creative") {
    const hint = document.createElement("button");
    hint.type = "button";
    hint.className = "recipe-choice";
    hint.disabled = true;
    hint.innerHTML = `<span class="swatch" style="background:${BLOCKS[BLOCK.BREWING_STAND].color}"></span><span>放置或携带酿造台后可酿药</span><strong>台</strong>`;
    brewingList.append(hint);
  }

  blockPalette.innerHTML = "";
  const selectable = Object.entries(CATALOG)
    .filter(([id, def]) => def.selectable && (player.mode === "creative" || (player.inventory.get(Number(id)) ?? 0) > 0))
    .map(([id]) => Number(id));
  for (const id of selectable) {
    const def = itemDef(id);
    const count = player.mode === "creative" ? "∞" : (player.inventory.get(id) ?? 0);
    const durability = player.durabilityFor(id) ?? player.armorDurabilityFor(id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "block-choice";
    const upgradeText = player.upgradeSummary(id).map((entry) => `${entry.label}${romanLevel(entry.level)}`).join(" ");
    button.innerHTML = `<span class="swatch" style="background:${def.color}"></span><span>${def.label}${upgradeText ? `<br>${upgradeText}` : ""}</span><strong>${durability ?? count}</strong>`;
    button.addEventListener("click", () => {
      player.hotbar[player.selected] = id;
      showToast(`已选择 ${def.label}`);
      renderHud();
    });
    blockPalette.append(button);
  }

  recipeList.innerHTML = "";
  for (const recipe of [...RECIPES, ...SMELTING_RECIPES]) {
    const station = recipeStation(recipe);
    const stationReady = stationReadyFor(recipe);
    const possible = recipePossible(recipe);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recipe-choice";
    button.disabled = !possible;
    const outputId = Number(Object.keys(recipe.output)[0]);
    const statusText = stationReady ? (possible ? "做" : "缺") : station === "furnace" ? "炉" : station === "crafting" ? "台" : "站";
    button.innerHTML = `<span class="swatch" style="background:${itemDef(outputId).color}"></span><span>${recipe.label}</span><strong>${statusText}</strong>`;
    button.addEventListener("click", () => craft(recipe));
    recipeList.append(button);
  }
}

function renderHud() {
  statusBarsEl.innerHTML = "";
  const stats = [
    ["生命", player.health / 20, "#d94b48"],
    ["护甲", player.armorPoints() / 20, "#bfc8d2"],
    ["饥饿", player.hunger / 20, "#d6a23f"],
    ["氧气", player.oxygen / 20, "#4da7df"],
    [`等级 ${player.level}`, player.experienceProgress().ratio, "#66d36f"],
  ];
  for (const effect of player.effectEntries()) {
    stats.push([
      `${effect.label}${effect.amplifier > 1 ? romanLevel(effect.amplifier) : ""}`,
      effect.maxDuration > 0 ? effect.duration / effect.maxDuration : 0,
      EFFECTS[effect.key]?.color ?? "#ffffff",
    ]);
  }
  if (player.mode === "creative") stats.unshift(["创造", 1, "#b4d957"]);
  for (const [label, ratio, color] of stats) {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.innerHTML = `<span style="width:${Math.round(clamp(ratio, 0, 1) * 100)}%;background:${color}"></span><label>${label}</label>`;
    statusBarsEl.append(bar);
  }

  hotbarEl.innerHTML = "";
  player.hotbar.forEach((id, index) => {
    const def = itemDef(id);
    const slot = document.createElement("div");
    slot.className = `slot${index === player.selected ? " selected" : ""}`;
    const durability = player.durabilityFor(id);
    const count = player.mode === "creative" ? "∞" : (durability ?? (player.inventory.get(id) ?? 0));
    slot.innerHTML = `<span class="key">${index + 1}</span><span class="swatch" style="background:${def.color}"></span><span class="slot-label">${def.label}</span><span class="count">${count}</span>`;
    hotbarEl.append(slot);
  });

  const pos = player.position;
  let targetText = "无目标";
  if (targetEntity && (!targetBlock || targetEntity.distance <= targetBlock.distance)) {
    targetText = `${targetEntity.entity.type} HP ${targetEntity.entity.health.toFixed(0)} @ ${targetEntity.distance.toFixed(1)}m`;
  } else if (targetBlock) {
    targetText = `${BLOCKS[targetBlock.id].label} @ ${targetBlock.x},${targetBlock.y},${targetBlock.z}`;
  }
  readoutEl.textContent = `XYZ ${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)} | 地图 无限 | 区块 ${world.chunks.size} | ${player.mode} | Lv ${player.level} | ${weather} | ${clockLabel()} | ${targetText}`;
}

function clockLabel() {
  const hours = Math.floor((timeOfDay * 24 + 6) % 24);
  const minutes = Math.floor(((timeOfDay * 24 + 6) % 1) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function updateTarget() {
  const origin = player.eye;
  const dir = player.direction();
  targetBlock = raycastBlock(origin, dir, MAX_REACH);
  targetEntity = entities.raycast(origin, dir, MAX_REACH);
  if (targetEntity && (!targetBlock || targetEntity.distance <= targetBlock.distance)) {
    highlight.visible = false;
    const entity = targetEntity.entity;
    const height = entities.entityHeight(entity);
    entityHighlight.visible = true;
    entityHighlight.position.set(entity.position.x, entity.position.y + height / 2, entity.position.z);
    entityHighlight.scale.set(entity.radius * 2 + 0.22, height + 0.12, entity.radius * 2 + 0.22);
  } else if (targetBlock) {
    highlight.visible = true;
    highlight.position.set(targetBlock.x + 0.5, targetBlock.y + 0.5, targetBlock.z + 0.5);
    entityHighlight.visible = false;
  } else {
    highlight.visible = false;
    entityHighlight.visible = false;
  }
}

function updateLighting(dt) {
  timeOfDay = (timeOfDay + dt / 360) % 1;
  const sunAngle = timeOfDay * Math.PI * 2;
  const sunY = Math.sin(sunAngle);
  const sunX = Math.cos(sunAngle);
  sun.position.set(sunX * 60, sunY * 80, 28);
  moon.position.set(-sunX * 50, -sunY * 55, -28);
  sun.intensity = clamp(sunY * 1.25 + 0.1, 0.02, 1.35);
  moon.intensity = clamp(-sunY * 0.35, 0.04, 0.38);
  hemi.intensity = clamp(0.22 + sun.intensity * 0.55, 0.18, 0.78);

  sunMesh.position.copy(sun.position).normalize().multiplyScalar(90).add(player.position);
  moonMesh.position.copy(moon.position).normalize().multiplyScalar(90).add(player.position);

  const day = new THREE.Color("#82bfe9");
  const dusk = new THREE.Color("#d69b67");
  const night = new THREE.Color("#101421");
  let sky;
  if (sunY > 0.22) sky = day;
  else if (sunY > -0.12) sky = dusk.clone().lerp(night, clamp((-sunY + 0.12) / 0.34, 0, 1));
  else sky = night;
  if (weather === "rain") sky.lerp(new THREE.Color("#6f7f83"), 0.42);
  scene.background = sky;
  scene.fog.color.copy(sky);
}

function saveGame(silent = false) {
  const data = {
    seed,
    timeOfDay,
    weather,
    modified: world.serializeModified(),
    blockMeta: world.serializeBlockMeta(),
    cropAges: world.serializeCropAges(),
    openedChests: world.serializeOpenedChests(),
    player: player.serialize(),
    inventory: [...player.inventory.entries()],
    toolDurability: player.ownedToolDurability(),
    armorDurability: player.ownedArmorDurability(),
    upgrades: player.serializeUpgrades(),
    effects: player.serializeEffects(),
    entities: entities.serialize(),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  if (!silent) {
    showToast("世界已保存");
    playSound("save");
  }
}

function update(dt) {
  if (!gameStarted || paused || inventoryOpen) {
    updateCamera();
    updateLighting(dt * 0.2);
    world.updateChunksAround(player.position);
    world.buildDirty(20);
    updateTarget();
    return;
  }
  player.update(dt, input);
  world.updateChunksAround(player.position);
  world.updateCrops(dt);
  fallingBlockTimer += dt;
  if (fallingBlockTimer >= 0.12) {
    fallingBlockTimer = 0;
    world.updateFallingBlocksAround(player.position);
  }
  entities.update(dt, timeOfDay);
  if (world.updateButtons(dt)) world.updateRedstone();
  if (world.updateObservers(dt) || world.poweredObservers.size > 0) world.updateRedstone();
  if (world.updatePressurePlates(player, entities.entities)) world.updateRedstone();
  world.buildDirty(16);
  updateLighting(dt);
  updateCamera();
  updateTarget();

  autosaveTimer += dt;
  if (autosaveTimer > 12) {
    autosaveTimer = 0;
    saveGame(true);
  }
}

function render() {
  updateHeldItemModel(1 / 60);
  renderer.render(scene, camera);
  renderHud();
  if (toastTimer > 0) {
    toastTimer -= 1 / 60;
    if (toastTimer <= 0) toastEl.classList.remove("visible");
  }
}

function redstoneState() {
  const loaded = [...world.chunks.values()].reduce((acc, chunk) => {
    for (const id of chunk.blocks) {
      if (isPressurePlateBlock(id)) acc.pressurePlates += 1;
      if (isButtonBlock(id)) acc.buttons += 1;
      if (isPoweredRailBlock(id)) acc.poweredRails += 1;
      if (isRepeaterBlock(id)) acc.repeaters += 1;
      if (isObserverBlock(id)) acc.observers += 1;
      if (isPistonBlock(id)) acc.pistons += 1;
      if (isPistonHeadBlock(id)) acc.pistonHeads += 1;
    }
    return acc;
  }, { pressurePlates: 0, buttons: 0, poweredRails: 0, repeaters: 0, observers: 0, pistons: 0, pistonHeads: 0 });
  return {
    poweredWires: world.poweredRedstone.size,
    poweredLamps: world.poweredLamps.size,
    poweredDoors: world.poweredDoors.size,
    poweredRails: world.poweredRails.size,
    poweredPressurePlates: world.activePressurePlates.size,
    poweredButtons: world.activeButtons.size,
    poweredRepeaters: world.poweredRepeaters.size,
    poweredObservers: world.poweredObservers.size,
    poweredPistons: world.poweredPistons.size,
    extendedPistons: world.extendedPistons.size,
    observerTimers: world.observerTimers.size,
    buttonTimers: world.buttonTimers.size,
    redstoneOpenedDoors: world.redstoneOpenedDoors.size,
    pressurePlatesLoaded: loaded.pressurePlates,
    buttonsLoaded: loaded.buttons,
    repeatersLoaded: loaded.repeaters,
    observersLoaded: loaded.observers,
    pistonsLoaded: loaded.pistons,
    pistonHeadsLoaded: loaded.pistonHeads,
    poweredRailsLoaded: loaded.poweredRails,
  };
}

function frame(now) {
  const dt = clamp((now - lastFrameTime) / 1000, 0, 0.05);
  lastFrameTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) {
    update(1 / 60);
  }
  render();
};

window.render_game_to_text = () => {
  const nearbyEntities = entities.entities
    .filter((entity) => entity.position.distanceTo(player.position) < 28)
    .slice(0, 12)
    .map((entity) => ({
      type: entity.type,
      x: Number(entity.position.x.toFixed(1)),
      y: Number(entity.position.y.toFixed(1)),
      z: Number(entity.position.z.toFixed(1)),
      health: Number(entity.health.toFixed(1)),
      rider: Boolean(entity.rider),
      speed: Number(Math.hypot(entity.velocity.x, entity.velocity.z).toFixed(2)),
    }));
  const vehicles = entities.entities
    .filter((entity) => isVehicleType(entity.type))
    .map((entity) => ({
      type: entity.type,
      x: Number(entity.position.x.toFixed(2)),
      y: Number(entity.position.y.toFixed(2)),
      z: Number(entity.position.z.toFixed(2)),
      speed: Number(Math.hypot(entity.velocity.x, entity.velocity.z).toFixed(2)),
      rider: Boolean(entity.rider),
      railAxis: entity.railAxis ?? null,
      health: Number(entity.health.toFixed(1)),
    }));
  const activeProjectiles = entities.projectiles.slice(0, 12).map((projectile) => ({
    owner: projectile.owner,
    x: Number(projectile.position.x.toFixed(1)),
    y: Number(projectile.position.y.toFixed(1)),
    z: Number(projectile.position.z.toFixed(1)),
    ttl: Number(projectile.ttl.toFixed(2)),
  }));
  const selectedId = player.selectedBlock();
  const selectedPlacementMeta = placementMetaFor(selectedId);
  const targetMeta = targetBlock ? world.getBlockMeta(targetBlock.x, targetBlock.y, targetBlock.z) : null;
  return JSON.stringify({
    mode: gameStarted ? (inventoryOpen ? "inventory" : "playing") : "start",
    coordinateSystem: "x east/west, y up, z north/south; block coords use floor(world position)",
    player: {
      x: Number(player.position.x.toFixed(2)),
      y: Number(player.position.y.toFixed(2)),
      z: Number(player.position.z.toFixed(2)),
      yaw: Number(player.yaw.toFixed(2)),
      pitch: Number(player.pitch.toFixed(2)),
      health: Number(player.health.toFixed(1)),
      armor: player.armorPoints(),
      hunger: Number(player.hunger.toFixed(1)),
      oxygen: Number(player.oxygen.toFixed(1)),
      level: player.level,
      experience: player.experience,
      experienceToNext: player.xpToNextLevel(),
      effects: player.effectEntries(),
      mode: player.mode,
      onGround: player.onGround,
      riding: player.ridingEntity
        ? {
            type: player.ridingEntity.type,
            x: Number(player.ridingEntity.position.x.toFixed(2)),
            y: Number(player.ridingEntity.position.y.toFixed(2)),
            z: Number(player.ridingEntity.position.z.toFixed(2)),
            speed: Number(Math.hypot(player.ridingEntity.velocity.x, player.ridingEntity.velocity.z).toFixed(2)),
          }
        : null,
      spawnPoint: player.spawnPoint
        ? {
            x: Number(player.spawnPoint.x.toFixed(1)),
            y: Number(player.spawnPoint.y.toFixed(1)),
            z: Number(player.spawnPoint.z.toFixed(1)),
          }
        : null,
    },
    selected: {
      slot: player.selected + 1,
      item: itemDef(selectedId).name,
      label: itemDef(selectedId).label,
      shape: BLOCKS[selectedId]?.shape ?? "cube",
      toolKind: toolInfo(selectedId)?.kind ?? null,
      facing: selectedPlacementMeta?.facing ?? null,
      heldModelParts: heldItemGroup.children.length,
      count:
        player.mode === "creative"
          ? "infinite"
          : (player.inventory.get(selectedId) ?? 0),
      durability: player.durabilityFor(selectedId),
      upgrades: player.upgradeSummary(selectedId),
    },
    inventory: [...player.inventory.entries()]
      .filter(([, count]) => count > 0)
      .slice(0, 20)
      .map(([id, count]) => ({ item: itemDef(id).name, count })),
    tools: player.ownedToolDurability().map(([id, durability]) => ({
      item: itemDef(id).name,
      durability,
    })),
    armor: player.equippedArmor(),
    upgrades: player.serializeUpgrades().map(([key, level]) => {
      const [id, enchantment] = key.split(":");
      const entry = ENCHANTMENTS.find((candidate) => candidate.key === enchantment);
      return {
        item: itemDef(Number(id)).name,
        enchantment,
        label: entry?.label ?? enchantment,
        level,
      };
    }),
    crafting: {
      fuel: findFuel(player) !== null ? itemDef(findFuel(player)).name : null,
      activeCrops: world.cropAges.size,
      craftingTableReady: canUseCraftingTable(),
      furnaceReady: canUseFurnace(),
      recipes: [...RECIPES, ...SMELTING_RECIPES].map((recipe) => ({
        label: recipe.label,
        station: recipeStation(recipe),
        stationReady: stationReadyFor(recipe),
        materialReady: player.mode === "creative" || hasRecipeMaterials(recipe),
        fuelReady: player.mode === "creative" || recipeFuelReady(recipe),
        output: itemDef(Number(Object.keys(recipe.output)[0])).name,
        possible: recipePossible(recipe),
      })),
    },
    brewing: {
      standReady: canUseBrewingStand(),
      activeEffects: player.effectEntries(),
      recipes: BREWING_RECIPES.map((recipe) => ({
        label: recipe.label,
        output: itemDef(Number(Object.keys(recipe.output)[0])).name,
        possible:
          player.mode === "creative" ||
          (canUseBrewingStand() &&
            Object.entries(recipe.input).every(([id, count]) => (player.inventory.get(Number(id)) ?? 0) >= count)),
      })),
    },
    building: {
      shapedBlocksLoaded: [...world.chunks.values()].reduce((sum, chunk) => {
        let count = 0;
        for (const id of chunk.blocks) {
          if (isShapedBlock(id)) count += 1;
        }
        return sum + count;
      }, 0),
      orientedBlocks: world.blockMeta.size,
    },
    enchanting: {
      tableReady: canUseEnchantingTable(),
      selectedEnchantments: ENCHANTMENTS.filter((entry) => entry.appliesTo(player.selectedBlock())).map((entry) => ({
        key: entry.key,
        label: entry.label,
        level: player.upgradeLevel(player.selectedBlock(), entry.key),
        maxLevel: entry.maxLevel,
        nextCost: player.upgradeLevel(player.selectedBlock(), entry.key) >= entry.maxLevel
          ? null
          : enchantmentCost(entry, player.upgradeLevel(player.selectedBlock(), entry.key)),
      })),
    },
    redstone: redstoneState(),
    exploration: {
      villageChunksLoaded: [...world.chunks.values()].filter((chunk) => world.getVillageInfo(chunk.cx, chunk.cz)).length,
      openedChests: world.openedChests.size,
      lastTrade,
    },
    combat: {
      totalEntities: entities.entities.length,
      activeProjectiles: entities.projectiles.length,
      projectiles: activeProjectiles,
      hostileMobsNearby: nearbyEntities.filter((entity) => entity.type === "zombie" || entity.type === "skeleton").length,
      arrows: player.inventory.get(ITEM.ARROW) ?? 0,
      level: player.level,
      experience: player.experience,
      experienceToNext: player.xpToNextLevel(),
    },
    transport: {
      riding: player.ridingEntity?.type ?? null,
      vehicles,
      boats: vehicles.filter((entity) => entity.type === "boat").length,
      minecarts: vehicles.filter((entity) => entity.type === "minecart").length,
      railsLoaded: [...world.chunks.values()].reduce((sum, chunk) => {
        let count = 0;
        for (const id of chunk.blocks) {
          if (isRailBlock(id)) count += 1;
        }
        return sum + count;
      }, 0),
      poweredRailsLoaded: [...world.chunks.values()].reduce((sum, chunk) => {
        let count = 0;
        for (const id of chunk.blocks) {
          if (isPoweredRailBlock(id)) count += 1;
        }
        return sum + count;
      }, 0),
    },
    target: targetBlock
      ? {
          block: BLOCKS[targetBlock.id].name,
          shape: BLOCKS[targetBlock.id].shape ?? "cube",
          meta: targetMeta,
          above: BLOCKS[world.getBlock(targetBlock.x, targetBlock.y + 1, targetBlock.z)]?.name ?? null,
          x: targetBlock.x,
          y: targetBlock.y,
          z: targetBlock.z,
          distance: Number(targetBlock.distance.toFixed(2)),
        }
      : null,
    targetEntity: targetEntity
      ? {
          type: targetEntity.entity.type,
          distance: Number(targetEntity.distance.toFixed(2)),
          health: Number(targetEntity.entity.health.toFixed(1)),
          highlighted: entityHighlight.visible,
        }
      : null,
    world: {
      seed,
      horizontalScale: "infinite procedural chunk stream",
      verticalRange: `0-${WORLD_HEIGHT - 1}`,
      chunkSize: CHUNK_SIZE,
      renderDistanceChunks: RENDER_DISTANCE,
      renderDistanceBlocks: RENDER_DISTANCE_BLOCKS,
      time: clockLabel(),
      timeOfDay: Number(timeOfDay.toFixed(3)),
      weather,
      loadedChunks: world.chunks.size,
      pendingChunkMeshes: world.dirty.size,
    },
    audio: {
      supported: Boolean(AudioContextCtor),
      enabled: soundState.enabled,
      unlocked: soundState.unlocked,
      state: soundState.context?.state ?? "not-created",
      lastEvent: soundState.lastEvent,
      played: soundState.played,
      recentEvents: soundState.events.slice(-6),
    },
    touch: {
      available: touchState.available,
      visible: Boolean(touchControlsEl && getComputedStyle(touchControlsEl).display !== "none"),
      forcedVisible: touchState.forcedVisible,
      joystick: {
        x: Number(touchState.stickX.toFixed(2)),
        y: Number(touchState.stickY.toFixed(2)),
      },
      virtualKeys: input.activeVirtualKeys(),
      lastAction: touchState.lastAction,
    },
    nearbyEntities,
  });
};

window.gameTestApi = {
  setSelectedItem(id) {
    id = Number(id);
    if (!isKnownItem(id)) return false;
    player.hotbar[player.selected] = id;
    renderHud();
    return true;
  },
  addItem(id, count = 1) {
    player.addItem(Number(id), count);
    renderInventory();
    renderHud();
    return true;
  },
  itemCount(id) {
    return player.inventory.get(Number(id)) ?? 0;
  },
  removeItem(id, count = 1) {
    const removed = player.removeItem(Number(id), Number(count));
    renderInventory();
    renderHud();
    return removed;
  },
  setPlayerPose(x, y, z, yaw = player.yaw, pitch = player.pitch) {
    player.position.set(Number(x), Number(y), Number(z));
    player.velocity.set(0, 0, 0);
    player.fallPeakY = player.position.y;
    player.yaw = Number(yaw);
    player.pitch = clamp(Number(pitch), -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    updateCamera();
    updateTarget();
    renderHud();
    return true;
  },
  worldInfo() {
    return {
      horizontalScale: "infinite procedural chunk stream",
      verticalRange: [0, WORLD_HEIGHT - 1],
      chunkSize: CHUNK_SIZE,
      renderDistanceChunks: RENDER_DISTANCE,
      renderDistanceBlocks: RENDER_DISTANCE_BLOCKS,
      unloadDistanceChunks: CHUNK_UNLOAD_DISTANCE,
      loadedChunks: world.chunks.size,
      pendingChunkMeshes: world.dirty.size,
      playerChunk: {
        x: Math.floor(player.position.x / CHUNK_SIZE),
        z: Math.floor(player.position.z / CHUNK_SIZE),
      },
    };
  },
  sampleChunkAt(x, z) {
    x = Math.floor(Number(x));
    z = Math.floor(Number(z));
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    world.getChunk(cx, cz);
    const surfaceY = world.getSurfaceHeight(x, z);
    return {
      x,
      z,
      cx,
      cz,
      surfaceY,
      surfaceBlock: world.getBlock(x, surfaceY, z),
      loadedChunks: world.chunks.size,
    };
  },
  clearEntities() {
    if (player.ridingEntity) player.dismountVehicle(false);
    for (const entity of entities.entities) entities.group.remove(entity.mesh);
    entities.entities.length = 0;
    for (const projectile of entities.projectiles) entities.projectileGroup.remove(projectile.mesh);
    entities.projectiles.length = 0;
    return true;
  },
  spawnEntity(type, x, z) {
    if (!["sheep", "zombie", "skeleton", "villager", "boat", "minecart"].includes(type)) return false;
    entities.spawn(type, Math.floor(x), Math.floor(z));
    return true;
  },
  spawnEntityAt(type, x, y, z, options = {}) {
    if (!["sheep", "zombie", "skeleton", "villager", "boat", "minecart"].includes(type)) return false;
    const entity = entities.spawnAt(type, Number(x), Number(y), Number(z), options ?? {});
    return {
      type: entity.type,
      x: Number(entity.position.x.toFixed(2)),
      y: Number(entity.position.y.toFixed(2)),
      z: Number(entity.position.z.toFixed(2)),
      health: entity.health,
      railAxis: entity.railAxis ?? null,
    };
  },
  setNearestEntityVelocity(type = null, vx = 0, vy = 0, vz = 0, targetYaw = null) {
    let best = null;
    let bestDistance = Infinity;
    for (const entity of entities.entities) {
      if (type && entity.type !== type) continue;
      const distance = entity.position.distanceTo(player.position);
      if (distance < bestDistance) {
        best = entity;
        bestDistance = distance;
      }
    }
    if (!best) return false;
    best.velocity.set(Number(vx), Number(vy), Number(vz));
    if (targetYaw !== null) best.targetYaw = Number(targetYaw);
    best.mesh.rotation.y = best.targetYaw;
    return {
      type: best.type,
      distance: Number(bestDistance.toFixed(2)),
      speed: Number(Math.hypot(best.velocity.x, best.velocity.z).toFixed(2)),
      x: Number(best.position.x.toFixed(2)),
      y: Number(best.position.y.toFixed(2)),
      z: Number(best.position.z.toFixed(2)),
    };
  },
  entityCount() {
    return entities.entities.length;
  },
  entityList() {
    return entities.entities.map((entity) => ({
      type: entity.type,
      x: Number(entity.position.x.toFixed(2)),
      y: Number(entity.position.y.toFixed(2)),
      z: Number(entity.position.z.toFixed(2)),
      health: Number(entity.health.toFixed(1)),
      speed: Number(Math.hypot(entity.velocity.x, entity.velocity.z).toFixed(2)),
      rider: Boolean(entity.rider),
      railAxis: entity.railAxis ?? null,
    }));
  },
  mountNearestVehicle(type = null) {
    let best = null;
    let bestDistance = Infinity;
    for (const entity of entities.entities) {
      if (!isVehicleType(entity.type)) continue;
      if (type && entity.type !== type) continue;
      const distance = entity.position.distanceTo(player.position);
      if (distance < bestDistance) {
        best = entity;
        bestDistance = distance;
      }
    }
    if (!best || bestDistance > 4) return false;
    return player.mountVehicle(best);
  },
  dismountVehicle() {
    return player.dismountVehicle();
  },
  damageNearestEntity(type, amount = 1) {
    let best = null;
    let bestDistance = Infinity;
    for (const entity of entities.entities) {
      if (type && entity.type !== type) continue;
      const distance = entity.position.distanceTo(player.position);
      if (distance < bestDistance) {
        best = entity;
        bestDistance = distance;
      }
    }
    if (!best) return false;
    entities.damageEntity(best, Number(amount));
    entities.update(0, timeOfDay);
    renderHud();
    return { type: best.type, distance: Number(bestDistance.toFixed(2)), health: Number(best.health.toFixed(1)) };
  },
  addExperience(amount = 1) {
    const result = player.addExperience(Number(amount));
    renderHud();
    return { ...result, level: player.level, experience: player.experience, required: player.xpToNextLevel() };
  },
  setLevel(level, experience = player.experience) {
    player.level = Math.max(0, Math.floor(Number(level)));
    player.experience = Math.max(0, Math.floor(Number(experience)));
    renderInventory();
    renderHud();
    return { level: player.level, experience: player.experience };
  },
  enchantSelected(key) {
    return enchantSelected(key);
  },
  brew(labelPart) {
    const recipe = BREWING_RECIPES.find((entry) => entry.label.includes(labelPart));
    if (!recipe) return false;
    return brew(recipe);
  },
  setHealth(value) {
    player.health = clamp(Number(value), 0, 20);
    renderHud();
    return player.health;
  },
  applyEffect(key, duration = 30, amplifier = 1) {
    const applied = player.applyEffect(key, Number(duration), Number(amplifier));
    renderHud();
    return applied;
  },
  upgradeLevel(id, key) {
    return player.upgradeLevel(Number(id), key);
  },
  shootBow() {
    if (!gameStarted) startGame();
    const previousCooldown = player.actionCooldown;
    player.actionCooldown = 0;
    const previousSelected = player.selectedBlock();
    player.hotbar[player.selected] = ITEM.BOW;
    const shot = shootBow();
    if (!shot) player.hotbar[player.selected] = previousSelected;
    if (!shot) player.actionCooldown = previousCooldown;
    renderInventory();
    renderHud();
    return shot;
  },
  setTargetBlock(x, y, z) {
    targetBlock = {
      x: Math.floor(x),
      y: Math.floor(y),
      z: Math.floor(z),
      id: world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)),
      distance: 1,
      place: null,
    };
    highlight.visible = true;
    highlight.position.set(targetBlock.x + 0.5, targetBlock.y + 0.5, targetBlock.z + 0.5);
    entityHighlight.visible = false;
    return targetBlock.id;
  },
  placeBlock(x, y, z, id, facing = null) {
    const numericId = Number(id);
    const shape = BLOCKS[numericId]?.shape;
    const meta =
      facing !== null && (shape === "stairs" || shape === "door" || shape === "repeater" || shape === "observer" || shape === "piston" || shape === "piston_head")
        ? { facing: normalizeFacing(facing) }
        : null;
    const ok = world.setBlock(Math.floor(x), Math.floor(y), Math.floor(z), numericId, true, meta);
    world.updatePressurePlates(player, entities.entities);
    world.updateRedstone();
    return ok;
  },
  getBlockMeta(x, y, z) {
    const meta = world.getBlockMeta(Math.floor(x), Math.floor(y), Math.floor(z));
    return meta ? { ...meta } : null;
  },
  getBlock(x, y, z) {
    return world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
  },
  updatePressurePlates() {
    const changed = world.updatePressurePlates(player, entities.entities);
    if (changed) world.updateRedstone();
    world.buildDirty(16);
    updateTarget();
    renderHud();
    return { changed, redstone: redstoneState() };
  },
  triggerButton(x, y, z, duration = 1) {
    const ok = world.triggerButton(Math.floor(x), Math.floor(y), Math.floor(z), Number(duration));
    if (ok) world.updateRedstone();
    world.buildDirty(16);
    updateTarget();
    renderHud();
    return { ok, redstone: redstoneState() };
  },
  triggerObserver(x, y, z, duration = 0.35) {
    const ok = world.triggerObserver(Math.floor(x), Math.floor(y), Math.floor(z), Number(duration));
    if (ok) world.updateRedstone();
    world.buildDirty(16);
    updateTarget();
    renderHud();
    return { ok, redstone: redstoneState() };
  },
  redstoneState() {
    return redstoneState();
  },
  updateRedstone() {
    world.updatePressurePlates(player, entities.entities);
    world.updateRedstone();
    world.buildDirty(16);
    updateTarget();
    renderHud();
    return redstoneState();
  },
  breakBlock(x, y, z, toolId = player.selectedBlock()) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    const id = world.getBlock(x, y, z);
    if (id === BLOCK.AIR || id === BLOCK.BEDROCK || !canBreakBlock(id, Number(toolId))) return false;
    const drops = blockDrops(id, Number(toolId), x, y, z);
    const brokenMeta = world.getBlockMeta(x, y, z);
    world.setBlock(x, y, z, BLOCK.AIR);
    cleanupAfterBlockBreak(x, y, z, id, brokenMeta);
    world.updatePressurePlates(player, entities.entities);
    world.updateRedstone();
    addDrops(drops);
    renderInventory();
    renderHud();
    return {
      block: itemDef(id).name,
      drops: drops.map(([dropId, count]) => ({ item: itemDef(dropId).name, id: dropId, count })),
    };
  },
  collisionBoxes(x, y, z) {
    return world.collisionBoxesForBlock(Math.floor(x), Math.floor(y), Math.floor(z)).map((box) => ({
      minX: Number(box.minX.toFixed(2)),
      minY: Number(box.minY.toFixed(2)),
      minZ: Number(box.minZ.toFixed(2)),
      maxX: Number(box.maxX.toFixed(2)),
      maxY: Number(box.maxY.toFixed(2)),
      maxZ: Number(box.maxZ.toFixed(2)),
    }));
  },
  saveNow() {
    saveGame(true);
    return true;
  },
  savedData() {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  soundStatus() {
    return {
      supported: Boolean(AudioContextCtor),
      enabled: soundState.enabled,
      unlocked: soundState.unlocked,
      state: soundState.context?.state ?? "not-created",
      lastEvent: soundState.lastEvent,
      played: soundState.played,
      recentEvents: soundState.events.slice(-6),
    };
  },
  playSound(name = "craft") {
    return playSound(String(name));
  },
  setSoundEnabled(enabled = true) {
    soundState.enabled = Boolean(enabled);
    return soundState.enabled;
  },
  setTouchControlsVisible(visible = true) {
    return updateTouchControlsVisibility(Boolean(visible));
  },
  setVirtualJoystick(x = 0, y = 0) {
    return applyVirtualJoystick(Number(x), Number(y));
  },
  clearVirtualInput() {
    input.clearVirtual();
    resetVirtualJoystick();
    return true;
  },
  touchAction(action, active = true) {
    return runTouchAction(String(action), Boolean(active));
  },
  leftAction() {
    if (!gameStarted) startGame();
    player.actionCooldown = 0;
    mineOrAttack();
    renderInventory();
    renderHud();
    return true;
  },
  rightAction() {
    if (!gameStarted) startGame();
    player.actionCooldown = 0;
    placeOrUse();
    renderInventory();
    renderHud();
    return true;
  },
  useTarget() {
    if (!gameStarted) startGame();
    const before = player.actionCooldown;
    player.actionCooldown = 0;
    const used = useHeldItem();
    if (!used) player.actionCooldown = before;
    renderInventory();
    renderHud();
    return used;
  },
  craft(labelPart) {
    const recipe = [...RECIPES, ...SMELTING_RECIPES].find((entry) => entry.label.includes(labelPart));
    if (!recipe) return false;
    return craft(recipe);
  },
  recipeStatus(labelPart) {
    const recipe = [...RECIPES, ...SMELTING_RECIPES].find((entry) => entry.label.includes(labelPart));
    if (!recipe) return null;
    return {
      label: recipe.label,
      station: recipeStation(recipe),
      stationReady: stationReadyFor(recipe),
      materialReady: player.mode === "creative" || hasRecipeMaterials(recipe),
      fuelReady: player.mode === "creative" || recipeFuelReady(recipe),
      possible: recipePossible(recipe),
    };
  },
  setTimeOfDay(value) {
    timeOfDay = mod(Number(value), 1);
    updateLighting(0);
    renderHud();
    return timeOfDay;
  },
  setMode(mode) {
    player.mode = mode === "creative" ? "creative" : "survival";
    renderInventory();
    renderHud();
    return player.mode;
  },
  getIds() {
    return { BLOCK, ITEM };
  },
};

playButton.addEventListener("click", startGame);
canvas.addEventListener("click", () => {
  if (!gameStarted) startGame();
  else if (!inventoryOpen && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
});
closeInventoryButton.addEventListener("click", () => setInventoryOpen(false));

touchStickEl?.addEventListener(
  "pointerdown",
  (event) => {
    touchState.stickPointerId = event.pointerId;
    touchStickEl.setPointerCapture?.(event.pointerId);
    ensureAudioContext();
    updateJoystickFromPointer(event);
    event.preventDefault();
  },
  { passive: false },
);

touchStickEl?.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerId !== touchState.stickPointerId) return;
    updateJoystickFromPointer(event);
    event.preventDefault();
  },
  { passive: false },
);

for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
  touchStickEl?.addEventListener(eventName, (event) => {
    if (eventName !== "lostpointercapture" && event.pointerId !== touchState.stickPointerId) return;
    touchState.stickPointerId = null;
    resetVirtualJoystick();
  });
}

for (const button of touchActionButtons) {
  const action = button.dataset.touchAction;
  button.addEventListener(
    "pointerdown",
    (event) => {
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("active");
      runTouchAction(action, true);
      event.preventDefault();
    },
    { passive: false },
  );
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(
      eventName,
      (event) => {
        button.classList.remove("active");
        if (action === "jump") runTouchAction(action, false);
        event.preventDefault();
      },
      { passive: false },
    );
  }
}

document.addEventListener("pointerlockchange", () => {
  input.pointerLocked = document.pointerLockElement === canvas;
});

canvas.addEventListener("pointerdown", beginTouchLook, { passive: false });
canvas.addEventListener("pointermove", moveTouchLook, { passive: false });
canvas.addEventListener("pointerup", endTouchLook);
canvas.addEventListener("pointercancel", endTouchLook);

document.addEventListener("mousemove", (event) => {
  if (!input.pointerLocked || inventoryOpen) return;
  player.yaw -= event.movementX * 0.0024;
  player.pitch -= event.movementY * 0.0024;
  player.pitch = clamp(player.pitch, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
});

document.addEventListener("keydown", (event) => {
  input.keys.add(event.code);
  if (event.code.startsWith("Digit")) {
    const n = Number(event.code.replace("Digit", ""));
    if (n >= 1 && n <= 9) player.selected = n - 1;
  }
  if (event.code === "KeyE") setInventoryOpen(!inventoryOpen);
  if (event.code === "KeyC") {
    player.mode = player.mode === "creative" ? "survival" : "creative";
    showToast(player.mode === "creative" ? "创造模式" : "生存模式");
    renderInventory();
    renderHud();
  }
  if (event.code === "KeyF") {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  if (event.code === "KeyP") saveGame();
  if (event.code === "Escape" && inventoryOpen) setInventoryOpen(false);
});

document.addEventListener("keyup", (event) => {
  input.keys.delete(event.code);
});

document.addEventListener("mousedown", (event) => {
  if (event.target instanceof Element && event.target.closest(".panel, #touch-controls")) return;
  if (event.button === 0) mineOrAttack();
  if (event.button === 2) placeOrUse();
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());

canvas.addEventListener(
  "wheel",
  (event) => {
    player.selected = mod(player.selected + Math.sign(event.deltaY), player.hotbar.length);
    event.preventDefault();
  },
  { passive: false },
);

window.addEventListener("resize", () => {
  resize();
  updateTouchControlsVisibility();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveGame(true);
});

resize();
updateTouchControlsVisibility();
world.updateChunksAround(player.position);
world.updatePressurePlates(player, entities.entities);
world.updateRedstone();
world.buildDirty(128);
updateCamera();
renderInventory();
renderHud();
requestAnimationFrame(frame);
