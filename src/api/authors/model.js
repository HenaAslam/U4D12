import mongoose from "mongoose";

const { Schema, model } = mongoose;

const authorSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: { type: String },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

export default model("Author", authorSchema);
