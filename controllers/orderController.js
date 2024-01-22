const Order = require("../models/orderModel");
const Product = require("../models/productModel");

// create new order
exports.newOrder = async (req, res) => {
  try {
    const {
      address,
      city,
      state,
      country,
      pinCode,
      phoneNo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;
    if (!address || !city || !state || !country || !pinCode || !phoneNo) {
      throw new Error("please provide the complete shiping information");
    }
    const isOrderItemsValid = orderItems.every(
      (item) => item._id && item.quantity
    );
    if (!isOrderItemsValid) {
      throw new Error(
        "plase provide the correct order items that is with product and it's quantity"
      );
    }
    if (!paymentInfo.id || !paymentInfo.status) {
      throw new Error("please provide the payment id and status correctly");
    }
    if (!itemsPrice || !taxPrice || !shippingPrice || !totalPrice) {
      throw new Error("Please provide all the prices");
    }
    const shippingInfo = {
      address,
      city,
      state,
      country,
      pinCode,
      phoneNo,
    };
    const order = await Order.create({
      shippingInfo,
      orderItems,
      user: req.user.id,
      paymentInfo,
      paidAt: Date.now(),
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });
    await order.populate([
      { path: "orderItems._id", select: "name price" },
      { path: "user", select: "name email" },
    ]);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//get single order details
exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) {
      throw new Error("please provide the order id");
    }
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("order not exists");
    }
    await order.populate([
      { path: "orderItems._id", select: "name price image" },
      { path: "user", select: "name email" },
    ]);
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//get all orders -- User
exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//get all orders -- Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    let totalAmount = 0;
    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });
    res.status(200).json({
      totalAmount,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// update order status -- Admin
exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = req.body.status;
    if (!orderId || !status) {
      throw new Error("please provide the order id and status");
    }
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("order does not exists with this order id");
    }
    if (order.orderStatus === "Delivered") {
      throw new Error("you had already delivered this order");
    }
    if (status === "Shipped") {
      order.orderItems.forEach(async (item) => {
        const product = await Product.findById(item._id);
        const stock = product.stock - item.quantity;
        await Product.findOneAndUpdate({ _id: item._id }, { stock });
      });
    }
    order.orderStatus = status;
    if (status === "Delivered") {
      order.deliveredAt = Date.now();
    }
    await order.save({ validateBeforeSave: false });
    res.status(200).json({
      message: "order status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//delete order -- Admin
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) {
      throw new Error("please provide the order id");
    }
    await Order.deleteOne({ _id: orderId });
    res.status(200).json({
      message: "order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
