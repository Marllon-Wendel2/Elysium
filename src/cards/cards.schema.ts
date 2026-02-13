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

export const CardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
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
  },
  {
    timestamps: true,
    strict: true,
  },
);
