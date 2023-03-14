import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
} from "./errorHandlers.js";
import blogsRouter from "./api/blogs/index.js";
const server = express();
const port = process.env.PORT;
const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];
server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        corsNext(null, true);
      } else {
        corsNext(
          createHttpError(
            400,
            `Origin ${currentOrigin} is not in the whitelist!`
          )
        );
      }
    },
  })
);
server.use(express.json());
server.use("/blogs", blogsRouter);
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
