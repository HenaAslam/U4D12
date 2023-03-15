import express from "express";
import createHttpError from "http-errors";
import BlogsModel from "./model.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { checkBlogSchema, triggerBadRequest } from "./validator.js";
import q2m from "query-to-mongo";

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
    const mongoQuery = q2m(req.query);
    console.log(mongoQuery);
    const blogs = await BlogsModel.find(
      mongoQuery.criteria,
      mongoQuery.options.fields
    )
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort);

    const total = await BlogsModel.countDocuments(mongoQuery.criteria);

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
    const updatedBlog = await BlogsModel.findByIdAndUpdate(
      req.params.blogId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedBlog) {
      res.send(updatedBlog);
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

export default blogsRouter;
