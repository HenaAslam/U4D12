import express from "express";
import createHttpError from "http-errors";
import BlogsModel from "./model.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { checkBlogSchema, triggerBadRequest } from "./validator.js";

const blogsRouter = express.Router();

blogsRouter.post(
  "/",
  checkBlogSchema,
  triggerBadRequest,
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
blogsRouter.get("/", async (req, res, next) => {
  try {
    const blogs = await BlogsModel.find();
    res.send(blogs);
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId);
    if (blog) {
      res.send(blog);
    } else {
      next(createHttpError(404, `blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.delete("/:blogId", async (req, res, next) => {
  try {
    const deletedBlog = await BlogsModel.findByIdAndDelete(req.params.blogId);
    if (deletedBlog) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.put("/:blogId", async (req, res, next) => {
  try {
    const updatedUser = await BlogsModel.findByIdAndUpdate(
      req.params.blogId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedUser) {
      res.send(updatedUser);
    } else {
      next(createHttpError(404, `blog with id ${req.params.blogId} not found`));
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

export default blogsRouter;
