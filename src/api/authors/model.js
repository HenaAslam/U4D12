import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const authorSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    dateOfBirth: { type: String },
    avatar: { type: String },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "User"],
      default: "User",
    },
    refreshToken: { type: String },
    googleId: { type: String },
  },
  {
    timestamps: true,
  }
);

authorSchema.pre("save", async function () {
  const newAuthorData = this;

  if (newAuthorData.isModified("password")) {
    const plainPW = newAuthorData.password;

    const hash = await bcrypt.hash(plainPW, 11);
    newAuthorData.password = hash;
  }
  console.log(this);
});

authorSchema.methods.toJSON = function () {
  const currentAuthorDocument = this;
  const currentAuthor = currentAuthorDocument.toObject();
  delete currentAuthor.password;
  delete currentAuthor.createdAt;
  delete currentAuthor.updatedAt;
  delete currentAuthor.__v;
  delete currentAuthor.refreshToken;
  return currentAuthor;
};

authorSchema.static("checkCredentials", async function (email, plainPW) {
  const user = await this.findOne({ email });

  if (user) {
    const passwordMatch = await bcrypt.compare(plainPW, user.password);

    if (passwordMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
});
export default model("Author", authorSchema);
