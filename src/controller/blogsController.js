const blogsModule = require("../modules/blogsModule");
const authorModule = require("../modules/authorModule");









/*------------------------------------------------------------------------------------------
➡️ POST METHOD, CREATE NEW BLOG USING
------------------------------------------------------------------------------------------ */

const createBlogs = async (req, res) => {
    try {
        // 👇 get all data from body here 🤯
        const data = req.body;
        // data.authorId = req.decodedToken.authorId

        // validate required info...
        if (Object.keys(data).length == 0) {
            return res.status(400).send({
                status: false,
                msg: "POST Body data required"
            });
        }

        if (!data.authorId) return res.status(400).send({
            status: false,
            msg: "authorId id mandatory"
        })

        // 👇 need to check author id is valid or not 🔍
        const isValidAuthor = await authorModule
            .findById(data.authorId)
            .catch(err => null);
        if (!isValidAuthor) {
            // NOT true
            return res.status(401).send({
                status: false,
                msg: "⚠️ Invalid AuthorId, please try with a valid AuthorId"
            });
        }

        // 👇 Create a blog document from request body
        const createBlogs = await blogsModule.create(data);

        res.status(201).send({
            status: true,
            data: createBlogs
        });
    } catch (err) {
        res.status(500).send({
            status: false,
            msg: err.message
        });
    }
};





/*------------------------------------------------------------------------------------------
 ➡️ GET METHOD, GET ALL LIST OF BLOGS
------------------------------------------------------------------------------------------ */

const getAllBlogs = async (req, res) => {
    try {
        let data = req.query;
        let query = {};

        if (Object.keys(data).length > 0) {
            if (data.tags) {
                data.tags = {
                    $in: data.tags
                };
            }

            if (data.subcategory) {
                data.subcategory = {
                    $in: data.subcategory
                };
            }

            query = data
        }

        query.isDeleted = false;
        query.isPublished = true;

        const allBlogs = await blogsModule.find(query);

        if (allBlogs.length == 0) {
            return res.status(404).send({
                status: false,
                msg: "Blogs list not found"
            });
        }

        res.status(200).send({
            status: true,
            data: allBlogs
        });
    } catch (err) {
        res.status(500).send({
            status: false,
            msg: err.message
        });
    }
};





/*------------------------------------------------------------------------------------------
 ➡️ PUT METHOD, UPDATE BY BLOG-ID AS PARAMS
------------------------------------------------------------------------------------------ */

const updateBlogsById = async function (req, res) {
    try {
        let blogId = req.params.blogId;
        let data = req.body;
        if (Object.keys(data).length == 0)
            return res.status(400).send({
                status: false,
                msg: "Body is required"
            });
        let blogData = await blogsModule.findOne({
            _id: blogId,
            isDeleted: false
        });


        if (!blogData) return res.status(404).send({
            status: false,
            msg: "blogs-Id related data unavailable"
        })

        if (data.title) blogData.title = data.title;
        if (data.body) blogData.body = data.body;
        if (data.category) blogData.category = data.category;
        if (data.tags) {
            if (typeof data.tags == "object") {
                blogData.tags.push(...data.tags);
            } else {
                blogData.tags.push(data.tags);
            }
        }
        if (data.subcategory) {
            if (typeof data.subcategory == "object") {
                blogData.subcategory.push(...data.subcategory);
            } else {
                blogData.subcategory.push(data.subcategory);
            }
        }
        blogData.publishedAt = Date(); //Fri Apr 29 2022 11:14:26 GMT+0530 (India Standard Time)
        blogData.isPublished = true;
        blogData.save();

        res.status(200).send({
            status: true,
            data: blogData
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            msg: error.message
        });
    }
};







/*------------------------------------------------------------------------------------------
 ➡️ DELETE METHOD, DELETE BY BLOG-ID AS PARAMS
------------------------------------------------------------------------------------------ */

const deleteBlogsById = async function (req, res) {
    try {
        let blogId = req.params.blogId;
        let result = await blogsModule.findOne({
            _id: blogId,
            isDeleted: false
        });
        if (!result) return res.status(404).send({
            status: false,
            msg: "User data not found"
        })
        let updated = await blogsModule.findByIdAndUpdate({
            _id: blogId,
            isDeleted: false
        }, {
            isDeleted: true,
            deletedAt: Date()
        }, {
            new: true
        });
        res.status(200).send({
            status: true,
            data: "Deletion Successfull"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            msg: error.message
        });
    }
};





/*------------------------------------------------------------------------------------------
 ➡️ DELETE METHOD, DELETE BY QUERY
------------------------------------------------------------------------------------------ */

const deleteBlogsByQuery = async function (req, res) {
    try {
        let data = req.query;

        if (data.authorId) {
            if (data.authorId != req.decodedToken.authorId) return res.status(401).send({
                status: false,
                msg: "Unauthorized access"
            });
        }
        // add a query variable
        let query = {};

        if (Object.keys(data).length == 0) {
            //-> if data undefined
            return res.status(400).send({
                status: false,
                msg: "no query params available "
            });
        } else {
            //-> if tags defined
            if (data.tags) {
                data.tags = {
                    $in: data.tags
                };
            }

            //-> if subcategory defined
            if (data.subcategory) {
                data.subcategory = {
                    $in: data.subcategory
                };
            }

            // create a query structure
            query = data
        }

        // add default query
        query.isDeleted = false
        query.authorId = req.decodedToken.authorId

        // check if the query related data exist OR not
        const available = await blogsModule.find(query).count();
        if (available == 0) {
            return res.status(404).send({
                status: false,
                msg: "query data not found OR may be you are Unauthorised to delete info"
            });
        }

        // perform delete here using update many 
        const deleteData = await blogsModule.updateMany(query, {
            $set: {
                isDeleted: true,
                deletedAt: Date()
            }
        });
        res.status(200).send({
            status: true,
            data: deleteData
        });

    } catch (error) {
        res.status(500).send({
            status: false,
            msg: error.message
        });
    }
};










module.exports.createBlogs = createBlogs;
module.exports.getAllBlogs = getAllBlogs
module.exports.updateBlogsById = updateBlogsById;
module.exports.deleteBlogsById = deleteBlogsById;
module.exports.deleteBlogsByQuery = deleteBlogsByQuery;