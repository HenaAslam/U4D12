import express from "express";
import createHttpError from "http-errors";
import BlogsModel from "./model.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { checkBlogSchema, triggerBadRequest } from "./validator.js";
import q2m from "query-to-mongo";
import authorsModel from "../authors/model.js";

import Mongoose from "mongoose";
import { ObjectId } from "mongoose";
import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwt.js";
const blogsRouter = express.Router();

blogsRouter.post(
  "/",
  // checkBlogSchema,
  // triggerBadRequest,
  async (req, res, next) => {
    try {
      const newBlog = new BlogsModel(req.body);

      const { _id } = await newBlog.save();

      res.status(201).send({ _id });
    } catch (error) {
      next(error);
    }
  }
);
blogsRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    // console.log(mongoQuery);
    const blogs = await BlogsModel.find(
      { author: req.user._id },
      mongoQuery.criteria,
      mongoQuery.options.fields
    )
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort)
      .populate({
        path: "author",
        select: "name ",
      })
      .populate({
        path: "likes",
        select: "name ",
      });

    const total = await BlogsModel.countDocuments(
      // mongoQuery.criteria,
      {
        author: req.user._id,
      }
    );

    res.send({
      links: mongoQuery.links("http://localhost:3009/blogs", total),
      total,
      numberOfPages: Math.ceil(total / mongoQuery.options.limit),
      blogs,
    });
  } catch (error) {
    next(error);
  }
});
blogsRouter.put(
  "/myBlog/:blogId",
  basicAuthMiddleware,
  async (req, res, next) => {
    try {
      const blog = await BlogsModel.findById(req.params.blogId);
      if (blog.author.includes(req.user._id)) {
        const updatedBlog = await BlogsModel.findByIdAndUpdate(
          blog._id,
          req.body,
          { new: true, runValidators: true }
        );
        res.send(updatedBlog);
      } else {
        next(createHttpError(403, "owner only endpoint!"));
      }
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.delete(
  "/myBlog/:blogId",
  basicAuthMiddleware,
  async (req, res, next) => {
    try {
      const blog = await BlogsModel.findById(req.params.blogId);
      if (blog.author.includes(req.user._id)) {
        await BlogsModel.findOneAndDelete(req.params.blogId);
        res.status(204).send();
      } else {
        next(createHttpError(403, "owner only endpoint!"));
      }
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId)
      .populate({
        path: "author",
        select: "name surname email",
      })
      .populate({
        path: "likes",
        select: "name surname email",
      });

    if (blog) {
      res.send(blog);
    } else {
      next(createHttpError(404, `blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.delete("/:blogId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId);

    if (blog.author.includes(req.user._id)) {
      const deletedBlog = await BlogsModel.findByIdAndDelete(req.params.blogId);
      if (deletedBlog) {
        res.status(204).send();
      } else {
        next(
          createHttpError(404, `blog with id ${req.params.blogId} not found`)
        );
      }
    } else {
      next(createHttpError(403, "unauthorized"));
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.put("/:blogId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    // const author=authorsModel.findById(req.user._id)
    const blog = await BlogsModel.findById(req.params.blogId);
    console.log(blog.author, req.user._id);
    if (blog.author.includes(req.user._id)) {
      const updatedBlog = await BlogsModel.findByIdAndUpdate(
        req.params.blogId,
        req.body,
        { new: true, runValidators: true }
      );
      if (updatedBlog) {
        res.send(updatedBlog);
      } else {
        next(
          createHttpError(404, `blog with id ${req.params.blogId} not found`)
        );
      }
    } else {
      next(createHttpError(403, "unauthorized"));
    }
  } catch (error) {
    next(error);
  }
});
const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "blogWithMongo/cover",
    },
  }),
}).single("cover");

blogsRouter.post(
  "/:blogId/uploadCover",
  cloudinaryUploader,

  async (req, res, next) => {
    try {
      if (req.file) {
        // console.log("FILE:", req.file);
        const blog = await BlogsModel.findById(req.params.blogId);
        if (blog) {
          blog.cover = req.file.path;
          await blog.save();
          res.send("uploaded");
        } else {
          next(
            createHttpError(404, `blog with id ${req.params.blogId} not found`)
          );
        }
      } else {
        next(createHttpError(400, "upload an image"));
      }
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.post("/:blogId/comments", async (req, res, next) => {
  try {
    const newComment = req.body;
    const commentToInsert = {
      ...newComment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log(commentToInsert);

    const updatedBlog = await BlogsModel.findByIdAndUpdate(
      req.params.blogId,
      { $push: { comments: commentToInsert } },
      { new: true, runValidators: true }
    );
    if (updatedBlog) {
      res.send(updatedBlog);
    } else {
      next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId/comments", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId);
    if (blog) {
      res.send(blog.comments);
    } else {
      next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId);
    if (blog) {
      const comment = blog.comments.find(
        (c) => c._id.toString() === req.params.commentId
      );
      if (comment) {
        res.send(comment);
      } else {
        next(
          createHttpError(
            404,
            `comment with id ${req.params.commentId} not found!`
          )
        );
      }
    } else {
      next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.delete("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const updatedBlog = await BlogsModel.findByIdAndUpdate(
      req.params.blogId,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true, runValidators: true }
    );
    if (updatedBlog) {
      res.send(updatedBlog);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.put("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId);
    if (blog) {
      const index = blog.comments.findIndex(
        (b) => b._id.toString() === req.params.commentId
      );
      if (index !== -1) {
        blog.comments[index] = {
          ...blog.comments[index].toObject(),
          ...req.body,
          updatedAt: new Date(),
        };
        await blog.save();
        res.send(blog);
      } else {
        next(
          createHttpError(
            404,
            `comment with id ${req.params.commentId} not found!`
          )
        );
      }
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.post("/:blogId/likes", async (req, res, next) => {
  try {
    const { authorId } = req.body;

    const blog = await BlogsModel.findById(req.params.blogId);
    if (!blog)
      return next(
        createHttpError(404, `blog with id ${req.params.blogId} not found!`)
      );

    const likedAuthor = await authorsModel.findById(authorId);
    if (!likedAuthor)
      return next(
        createHttpError(404, `author with id ${authorId} not found!`)
      );

    if (blog.likes.includes(authorId)) {
      const updatedBlog = await BlogsModel.findByIdAndUpdate(
        { _id: req.params.blogId },
        { $pull: { likes: authorId } },
        { new: true, runValidators: true }
      );
      res.send({ blog: updatedBlog, numberOflikes: updatedBlog.likes.length });
    } else {
      const updatedBlog = await BlogsModel.findOneAndUpdate(
        { _id: req.params.blogId },
        { $push: { likes: authorId } },
        { new: true, runValidators: true, upsert: true }
      );

      // console.log(updatedBlog);
      res.send({ blog: updatedBlog, numberOflikes: updatedBlog.likes.length });
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/:blogId/likes", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId);
    if (!blog)
      return next(
        createHttpError(404, `blog with id ${req.params.blogId} not found!`)
      );

    res.send({ likes: blog.likes, numberOflikes: blog.likes.length });
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;
