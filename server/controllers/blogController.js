import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Blog from '../models/Blog.js';
import Comment from '../models/Comment.js';
import main from '../configs/gemini.js';



export const addBlog = async (req, res) => {
    try {
        const { title, subTitle, description, category, isPublished } = JSON.parse(req.body.blog);
        const imageFile = req.file;   // ✅ fixed (was req.File)

        if (!title || !subTitle || !description || !category || !imageFile) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const fileBuffer = imageFile.buffer;; // works if using multer diskStorage

        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: "/blogs"
        });

        const optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                { quality: 'auto' },
                { format: 'webp' },
                { width: '1280' }
            ]
        });

        await Blog.create({
            title,
            subTitle,
            description,
            category,
            image: optimizedImageUrl,
            isPublished
        });

        res.json({ success: true, message: "Blog added successfully" });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};



export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isPublished: true });
        res.json({ success: true, blogs });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



export const getBlogById = async (req, res) => {
    try {
        const { id } = req.params;   // ✅ fixed (was req.parse)
        const blog = await Blog.findById(id);

        if (!blog) {
            return res.json({ success: false, message: "Blog not found" });
        }

        res.json({ success: true, blog });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



export const deleteBlogById = async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await Blog.findByIdAndDelete(id);

        if (!blog) {
            return res.json({ success: false, message: "Blog not found" });
        }

        await Comment.deleteMany({ blog: id });
        res.json({ success: true, message: "Blog deleted successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



export const togglePublish = async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await Blog.findById(id);

        if (!blog) {
            return res.json({ success: false, message: "Blog not found" });
        }

        blog.isPublished = !blog.isPublished;
        await blog.save();

        res.json({ success: true, message: "Blog status updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



export const addComment = async (req, res) => {
    try {
        const { blog, name, content } = req.body;

        if (!blog || !name || !content) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        await Comment.create({ blog, name, content });
        res.json({ success: true, message: "Comment added for review" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



export const getBlogComments = async (req, res) => {
    try {
        const { blogId } = req.body;

        if (!blogId) {
            return res.json({ success: false, message: "Blog ID is required" });
        }

        const comments = await Comment.find({ blog: blogId, isApproved: true }).sort({ createdAt: -1 });
        res.json({ success: true, comments });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};




export const generateContent = async(req,res) => {
     try {
          const {prompt} = req.body;
          const content =  await main(prompt + "Generate a blog content for this topic")
          res.json({success:true , content})
     } catch (error) {
          res.json({success:false , message : error.message })
     }
}
