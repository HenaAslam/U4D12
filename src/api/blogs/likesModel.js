import mongoose from "mongoose";

const { Schema, model } = mongoose;

const likeSchema = new Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "Author", required: true },
  },
  { timestamps: true }
);

export default model("Like", likeSchema);
