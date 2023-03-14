import express from "express";
import mongoose from "mongoose";
import {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
} from "./errorHandlers.js";
import blogsRouter from "./api/blogs/index.js";
const server = express();
const port = process.env.PORT;
server.use(express.json());
server.use("/blogPosts", blogsRouter);
server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);
mongoose.connect(process.env.mongoURL);

mongoose.connection.on("connected", () => {
  console.log(" Successfully connected to Mongo!");
  server.listen(port, () => {
    console.log(` Server is running on port ${port}`);
  });
});
