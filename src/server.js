import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import cors from "cors";
import {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
  unauthorizedErrorHandler,
  forbiddenErrorHandler,
} from "./errorHandlers.js";
import blogsRouter from "./api/blogs/index.js";
import googleStrategy from "./lib/auth/googleOauth.js";
import authorsRouter from "./api/authors/index.js";
const server = express();
const port = process.env.PORT;

passport.use("google", googleStrategy);
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
server.use(passport.initialize());
server.use("/blogs", blogsRouter);
server.use("/authors", authorsRouter);
server.use(badRequestHandler); //400
server.use(unauthorizedErrorHandler); //401
server.use(forbiddenErrorHandler); //403
server.use(notFoundHandler); //404
server.use(genericErrorHandler); //500
mongoose.connect(process.env.mongoURL);

mongoose.connection.on("connected", () => {
  console.log(" Successfully connected to Mongo!");
  server.listen(port, () => {
    console.log(` Server is running on port ${port}`);
  });
});
