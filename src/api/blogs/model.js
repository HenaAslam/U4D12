import mongoose from "mongoose";

const { Schema, model } = mongoose;
const commentSchema = new Schema({
  comment: { type: String, required: true },
  rate: { type: Number, required: true, min: 1, max: 5 },
  author: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const blogsSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String },
    readTime: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    author: { type: Schema.Types.ObjectId, ref: "Author" },
    content: { type: String, required: true },
    comments: [commentSchema],
    likes: [{ type: Schema.Types.ObjectId, ref: "Author" }],
  },
  {
    timestamps: true,
  }
);

export default model("Blog", blogsSchema);
