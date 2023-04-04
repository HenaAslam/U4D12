import express from "express";
import createHttpError from "http-errors";
import authorsModel from "./model.js";
import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import BlogsModel from "../blogs/model.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";

const authorsRouter = express.Router();

authorsRouter.post(
  "/",

  async (req, res, next) => {
    try {
      const newAuthor = new authorsModel(req.body);
      const { _id } = await newAuthor.save();
      res.status(201).send({ _id });
    } catch (error) {
      next(error);
    }
  }
);
authorsRouter.get("/", basicAuthMiddleware, async (req, res, next) => {
  try {
    const authors = await authorsModel.find();
    res.send(authors);
  } catch (error) {
    next(error);
  }
});
authorsRouter.get("/me", basicAuthMiddleware, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

authorsRouter.put("/me", basicAuthMiddleware, async (req, res, next) => {
  try {
    const updatedAuthor = await authorsModel.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    );
    res.send(updatedAuthor);
  } catch (error) {
    next(error);
  }
});

authorsRouter.delete("/me", basicAuthMiddleware, async (req, res, next) => {
  try {
    await authorsModel.findOneAndDelete(req.user._id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
authorsRouter.get(
  "/me/stories",
  basicAuthMiddleware,
  async (req, res, next) => {
    try {
      // res.send(req.user);

      const blogs = await BlogsModel.find({
        author: req.user._id,
      });
      res.send(blogs);
    } catch (error) {
      next(error);
    }
  }
);
authorsRouter.get("/:authorId", basicAuthMiddleware, async (req, res, next) => {
  try {
    const author = await authorsModel.findById(req.params.authorId);
    if (author) {
      res.send(author);
    } else {
      next(
        createHttpError(404, `author with id ${req.params.authorId} not found`)
      );
    }
  } catch (error) {
    next(error);
  }
});
authorsRouter.delete(
  "/:authorId",
  basicAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const deletedAuthor = await authorsModel.findByIdAndDelete(
        req.params.authorId
      );
      if (deletedAuthor) {
        res.status(204).send();
      } else {
        next(
          createHttpError(
            404,
            `author with id ${req.params.authorId} not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);
authorsRouter.put(
  "/:authorId",
  basicAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const updatedAuthor = await authorsModel.findByIdAndUpdate(
        req.params.authorId,
        req.body,
        { new: true, runValidators: true }
      );
      // console.log(updatedAuthor);
      // const { _id } = await updatedAuthor.save();
      if (updatedAuthor) {
        res.send(updatedAuthor);
      } else {
        next(
          createHttpError(
            404,
            `author with id ${req.params.authorId} not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default authorsRouter;
