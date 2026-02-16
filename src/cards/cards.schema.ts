import mongoose from 'mongoose';

const CardEffectSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['DAMAGE', 'HEAL', 'DRAW', 'BUFF', 'DEBUFF'],
      required: false,
    },
    value: {
      type: Number,
      default: null,
    },
  },
  { _id: false },
);

export const AbilitySchema = new mongoose.Schema(
  {
    trigger: {
      type: String,
      enum: ['START_TURN', 'END_TURN'],
      required: true,
    },
    effect: {
      type: String,
      enum: ['CREATE', 'APPLYSTATUS'],
      required: true,
    },
    params: {
      cardId: { type: String },
      zone: { type: String },
      status: { type: String },
      value: { type: Number },
    },
  },
  { _id: false },
);

export const CardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    mana: { type: Number, default: 0 },
    class: { type: String, required: true },
    rarity: String,
    artUrl: String,
    description: String,

    energy: { type: Number, default: null },
    attack: { type: Number, default: null },
    life: { type: Number, default: null },
    range: { type: Number, default: null },

    effect: {
      type: CardEffectSchema,
      default: () => ({}),
    },
    ability: { type: [AbilitySchema], default: [] },
    disabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strict: true,
  },
);
