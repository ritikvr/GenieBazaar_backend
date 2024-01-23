const Product = require("../models/productModel");
const cloudinary = require("cloudinary");

// Create product -- Admin
// Post Request

exports.createProduct = async (req, res) => {
  try {
    req.body.user = req.user.id;

    let images = req.body.productData.images;

    let imagesLink = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });
      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const {
      name,
      description,
      price,
      rating,
      category,
      stock,
      numOfReviews,
      reviews,
    } = req.body.productData;
    const user = req.body.user;
    const product = await Product.create({
      name: name,
      description: description,
      price: price,
      rating: rating,
      image: imagesLink,
      category: category,
      stock: stock,
      numOfReviews: numOfReviews,
      reviews: reviews,
      user: user,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//get Products
//get request

exports.getAllProducts = async (req, res) => {
  try {
    let query = {};

    if (req.query.keyword) {
      query.name = { $regex: req.query.keyword, $options: "i" };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = parseFloat(req.query.maxPrice);
      }
    }
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.rating) {
      query.rating = { $gte: parseFloat(req.query.rating) };
    }
    const page = req.query.page || 1;
    const perPage = req.query.perPage || 8;

    const products = await Product.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const productCount = await Product.countDocuments();
    const filteredProductCount = await Product.countDocuments(query);
    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res
      .status(200)
      .json({ products, productCount, perPage, filteredProductCount });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//get product details

exports.getProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    if (productId.length !== 24) {
      throw new Error("product id is not valid");
    }
    const product = await Product.findById(productId).populate({
      path: "reviews.user",
      model: "User",
      select: "avatar",
    });
    if (!product) {
      return res.status(500).json({
        message: "product not found",
      });
    }
    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//update a product
//put request

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    let product = await Product.findById(productId);
    if (!product) {
      return res.status(500).json({
        message: "product not found",
      });
    }
    let images = req.body.productData.image;
    let imagesLink = [];
    if (images !== undefined && typeof images[0] === "string") {
      for (let i = 0; i < product.image.length; i++) {
        if (product.image[i].public_id) {
          await cloudinary.v2.uploader.destroy(product.image[i].public_id);
        }
      }
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });
        imagesLink.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }
    req.body.productData.image = imagesLink;
    if (typeof images[0] === "object") {
      req.body.productData.image = images;
    }
    product = await Product.findByIdAndUpdate(productId, req.body.productData, {
      new: true,
    });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// delete a product
// delete request

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    let product = await Product.findById(productId);
    if (!product) {
      return res.status(500).json({
        message: "product not found",
      });
    }
    //Deleting images from cloudinary
    for (let i = 0; i < product.image.length; i++) {
      if (product.image[i].public_id) {
        await cloudinary.v2.uploader.destroy(product.image[i].public_id);
      }
    }
    await Product.deleteOne({ _id: productId });
    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// create a review

exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body.reviewData;
    const review = {
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("product not exists");
    }
    const isReviewed = product.reviews.find(
      (rev) => rev.user.toString() == req.user.id.toString()
    );

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() == req.user.id.toString()) {
          rev.rating = rating;
          rev.comment = comment;
        }
      });
    } else {
      product.reviews.push(review);
      product.numofReviews = product.numofReviews + 1;
    }

    let avg = 0;
    product.reviews.forEach((rev) => {
      avg = avg + rev.rating;
    });
    product.rating = avg / product.reviews.length;
    await product.save({ validateBeforeSave: false });
    res.status(200).json({
      message: "review submitted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.query.id;
    if (!productId) {
      throw new Error("please provide the product id");
    }
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("product not exists");
    }
    const productReviews = product.reviews;
    res.status(200).json(productReviews);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const productId = req.query.productId;
    if (!productId) {
      throw new Error("plase provide the product id");
    }
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("product not exists");
    }
    const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.reviewId.toString()
    );
    let avg = 0;
    reviews.forEach((rev) => {
      avg = avg + rev.rating;
    });
    const rating = avg / reviews.length;
    const numofReviews = reviews.length;
    await Product.findOneAndUpdate(
      { _id: productId },
      {
        reviews,
        rating,
        numofReviews,
      },
      {
        new: true,
      }
    );
    res.status(200).json({
      message: "review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find();

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
