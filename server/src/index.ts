import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./firebase";
import { sendMail } from "./config/mailer";
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
  orderProcessingEmail,
  orderCancelledEmail
} from "./templates/emails";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// ==========================
// USER ROUTES
// ==========================

app.post("/api/users/sync", async (req, res) => {
  const { uid, name, email, phone } = req.body;
  try {
    const userRef = db.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');
    let user = snapshot.val();
    
    if (!user) {
      user = { uid, name, email, phone, createdAt: new Date().toISOString() };
      await userRef.set(user);
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "User sync failed" });
  }
});

app.get("/api/users/:uid", async (req, res) => {
  try {
    const userSnapshot = await db.ref(`users/${req.params.uid}`).once('value');
    if (!userSnapshot.exists()) return res.status(404).json({ error: "User not found" });
    
    const user = userSnapshot.val();
    const ordersSnapshot = await db.ref(`orders`).orderByChild('uid').equalTo(req.params.uid).once('value');
    const ordersData = ordersSnapshot.val() || {};
    
    user.orders = Object.keys(ordersData).map(k => ({ id: k, ...ordersData[k] })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error fetching user" });
  }
});

// ==========================
// PRODUCT ROUTES
// ==========================

app.get("/api/products", async (req, res) => {
  const { category, search, featured } = req.query;
  try {
    const snapshot = await db.ref('products').once('value');
    const data = snapshot.val() || {};
    let products = Object.keys(data).map(k => ({ id: k, ...data[k] }));

    products = products.filter(p => p.isActive !== false);

    if (category) {
      products = products.filter(p => p.categoryId === category || p.category?.slug === category);
    }
    if (featured) {
      products = products.filter(p => p.isFeatured === true);
    }
    if (search) {
      products = products.filter(p => p.name.toLowerCase().includes(String(search).toLowerCase()));
    }

    res.json(products.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
  } catch (err) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const snapshot = await db.ref(`products/${req.params.id}`).once('value');
  if (!snapshot.exists()) return res.status(404).json({ error: "Product not found" });
  res.json({ id: req.params.id, ...snapshot.val() });
});

app.post("/api/products", async (req, res) => {
  const ref = db.ref('products').push();
  const product = { ...req.body, createdAt: new Date().toISOString() };
  await ref.set(product);
  res.json({ id: ref.key, ...product });
});

app.put("/api/products/:id", async (req, res) => {
  const ref = db.ref(`products/${req.params.id}`);
  await ref.update(req.body);
  const snapshot = await ref.once('value');
  res.json({ id: req.params.id, ...snapshot.val() });
});

app.delete("/api/products/:id", async (req, res) => {
  await db.ref(`products/${req.params.id}`).update({ isActive: false });
  res.json({ success: true });
});

// ==========================
// CATEGORY ROUTES
// ==========================

app.get("/api/categories", async (req, res) => {
  const snapshot = await db.ref('categories').once('value');
  const data = snapshot.val() || {};
  const categories = Object.keys(data).map(k => ({ id: k, ...data[k] }));
  res.json(categories);
});

// ==========================
// ORDER ROUTES
// ==========================

app.post("/api/orders", async (req, res) => {
  const uid = req.body.uid || req.body.userId || 'guest';
  const name = req.body.name || req.body.userName || 'Guest';
  const email = req.body.email || req.body.userEmail || '';
  const phone = req.body.phone || req.body.userPhone || '';
  const {
    items, totalAmount, deliveryAddress,
    paymentMethod, upiTransactionId,
    cardLast4, cardHolderName, bankName
  } = req.body;

  try {
    const userRef = db.ref(`users/${uid}`);
    const userSnap = await userRef.once('value');
    if (!userSnap.exists()) {
      await userRef.set({ uid, name, email, phone, createdAt: new Date().toISOString() });
    }

    const orderId = "KM-" + Date.now().toString();
    const orderData = {
      orderId,
      uid,
      userName: name,
      buyerName: name,
      userEmail: email,
      userPhone: phone,
      totalAmount,
      total: totalAmount,
      deliveryAddress,
      address: deliveryAddress,
      paymentMethod,
      upiTransactionId: upiTransactionId || null,
      cardLast4: cardLast4 || null,
      bankName: bankName || null,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      status: "Pending",
      items,
      createdAt: new Date().toISOString()
    };

    const newOrderRef = db.ref('orders').push();
    await newOrderRef.set(orderData);

    // Reduce stock
    for (const item of items) {
      if (item.productId || item.product?.id) {
        const pId = item.productId || item.product?.id;
        const prodRef = db.ref(`products/${pId}`);
        const pSnap = await prodRef.once('value');
        if (pSnap.exists()) {
          const pData = pSnap.val();
          const newStock = Math.max(0, (pData.stock || 0) - item.quantity);
          await prodRef.update({ stock: newStock });
        }
      }
    }

    // Send email
    let previewUrl: string | undefined = undefined;
    if (email) {
      const mailRes = await sendMail(
        email,
        `✅ Order Confirmed — KisanMart ${orderId}`,
        orderConfirmationEmail({
          userName: name,
          orderId,
          items,
          totalAmount,
          deliveryAddress,
          paymentMethod,
          estimatedDelivery: "Tomorrow, 8AM–12PM",
        })
      ).catch(e => console.error("Email error:", e));
      if (mailRes && mailRes.previewUrl) previewUrl = mailRes.previewUrl;
    }

    res.json({ success: true, previewUrl, orderId, order: { id: newOrderRef.key, ...orderData } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order placement failed" });
  }
});

app.get("/api/orders", async (req, res) => {
  const snapshot = await db.ref('orders').once('value');
  const data = snapshot.val() || {};
  
  // also fetch users to attach user object
  const usersSnap = await db.ref('users').once('value');
  const usersData = usersSnap.val() || {};

  let orders = Object.keys(data).map(k => {
    const order = data[k];
    const user = usersData[order.uid] || null;
    return { id: k, ...order, user };
  });

  res.json(orders.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
});

app.get("/api/orders/user/:uid", async (req, res) => {
  const snapshot = await db.ref('orders').orderByChild('uid').equalTo(req.params.uid).once('value');
  const data = snapshot.val() || {};
  let orders = Object.keys(data).map(k => ({ id: k, ...data[k] }));
  res.json(orders.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
});

app.get("/api/orders/:orderId", async (req, res) => {
  let orderRef = db.ref(`orders/${req.params.orderId}`);
  let snap = await orderRef.once('value');
  let data = snap.val();
  let key = req.params.orderId;

  if (!data) {
    const querySnap = await db.ref('orders').orderByChild('orderId').equalTo(req.params.orderId).once('value');
    if (!querySnap.exists()) return res.status(404).json({ error: "Order not found" });
    key = Object.keys(querySnap.val())[0];
    data = querySnap.val()[key];
  }
  
  const userSnap = await db.ref(`users/${data.uid}`).once('value');
  data.user = userSnap.val();
  
  res.json({ id: key, ...data });
});

app.put("/api/orders/:orderId/status", async (req, res) => {
  const { status } = req.body;
  const { orderId } = req.params;

  try {
    let orderRef = db.ref(`orders/${orderId}`);
    let snap = await orderRef.once('value');
    let key = orderId;

    if (!snap.exists()) {
      const querySnap = await db.ref('orders').orderByChild('orderId').equalTo(orderId).once('value');
      if (!querySnap.exists()) return res.status(404).json({ error: "Order not found" });
      key = Object.keys(querySnap.val())[0];
      orderRef = db.ref(`orders/${key}`);
      snap = await orderRef.once('value');
    }
    
    const updateData: any = { status };
    const orderData = snap.val();
    
    if (status === "Delivered" && orderData.paymentMethod === "COD") {
      updateData.paymentStatus = "Paid";
    }
    
    await orderRef.update(updateData);
    const updatedSnap = await orderRef.once('value');
    const order = updatedSnap.val();
    
    const userSnap = await db.ref(`users/${order.uid}`).once('value');
    const user = userSnap.val();

    const targetEmail = order.userEmail || order.email || user?.email || process.env.MAIL_USER || "gopikonangi8@gmail.com";
    const targetName = order.userName || order.buyerName || user?.name || "Customer";
    const cleanOrderId = order.orderId || orderId;

    console.log(`[STATUS UPDATE API] Order: ${cleanOrderId}, New Status: ${status}, Recipient: ${targetEmail}`);

    let previewUrl: string | undefined = undefined;
    if (targetEmail) {
      let mailRes: any = null;
      if (status === "Processing") {
        console.log(`[STATUS UPDATE API] Sending Processing email...`);
        mailRes = await sendMail(
          targetEmail,
          `⏳ Your KisanMart Order ${cleanOrderId} is Processing`,
          orderProcessingEmail({
            userName: targetName,
            orderId: cleanOrderId,
            estimatedDelivery: "Tomorrow, 8AM–12PM",
          })
        ).catch(e => console.error("Processing mail error:", e));
      } else if (status === "Shipped") {
        console.log(`[STATUS UPDATE API] Sending Shipped email...`);
        mailRes = await sendMail(
          targetEmail,
          `🚚 Your KisanMart Order ${cleanOrderId} is Shipped!`,
          orderShippedEmail({
            userName: targetName,
            orderId: cleanOrderId,
            deliveryAddress: order.deliveryAddress || order.address || "Your Delivery Address",
            estimatedDelivery: "Tomorrow, 8AM–12PM",
          })
        ).catch(e => console.error("Shipped mail error:", e));
      } else if (status === "Delivered") {
        console.log(`[STATUS UPDATE API] Sending Delivered email...`);
        mailRes = await sendMail(
          targetEmail,
          `🎉 Delivered! Your KisanMart Order ${cleanOrderId}`,
          orderDeliveredEmail({
            userName: targetName,
            orderId: cleanOrderId,
            totalAmount: order.totalAmount || order.total || 0,
          })
        ).catch(e => console.error("Delivered mail error:", e));
      } else if (status === "Cancelled") {
        console.log(`[STATUS UPDATE API] Sending Cancelled email...`);
        mailRes = await sendMail(
          targetEmail,
          `❌ KisanMart Order Cancelled (${cleanOrderId})`,
          orderCancelledEmail({
            userName: targetName,
            orderId: cleanOrderId,
          })
        ).catch(e => console.error("Cancelled mail error:", e));
      }
      if (mailRes && mailRes.previewUrl) previewUrl = mailRes.previewUrl;
    }

    res.json({ success: true, previewUrl, order: { id: key, ...order, user } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error updating order" });
  }
});

// ==========================
// ADMIN DASHBOARD STATS
// ==========================

app.get("/api/admin/stats", async (req, res) => {
  try {
    const [prodSnap, orderSnap] = await Promise.all([
      db.ref('products').once('value'),
      db.ref('orders').once('value')
    ]);

    const prods = prodSnap.val() || {};
    const orders = orderSnap.val() || {};

    let totalProducts = 0;
    Object.keys(prods).forEach(k => { if (prods[k].isActive !== false) totalProducts++; });

    let totalOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;
    let todayRevenue = 0;

    const today = new Date();
    today.setHours(0,0,0,0);

    const orderArray = Object.keys(orders).map(k => ({ id: k, ...orders[k] }));
    
    orderArray.forEach(o => {
      totalOrders++;
      if (o.status === 'Pending' || o.status === 'PENDING') pendingOrders++;
      totalRevenue += (o.totalAmount || 0);
      
      const orderDate = new Date(o.createdAt);
      if (orderDate >= today) {
        todayRevenue += (o.totalAmount || 0);
      }
    });

    const recentOrders = orderArray
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      recentOrders,
    });
  } catch (e) {
    res.status(500).json({ error: "Error fetching stats" });
  }
});

// Admin login
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@kisanmart.com" && password === "admin123") {
    const token = jwt.sign(
      { email: "admin@kisanmart.com" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );
    return res.json({ token, admin: { id: 1, name: "Admin", email } });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`🔥 KisanMart Firebase API server running on port ${process.env.PORT || 5000}`)
);
