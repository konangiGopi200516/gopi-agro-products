import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { db } from "./firebase";
import { sendMail } from "./config/mailer";
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
  orderProcessingEmail,
  orderCancelledEmail
} from "./templates/emails";
import paymentRouter from "./routes/payment";
import authRouter from "./routes/auth";

dotenv.config();
const app = express();

app.use(helmet());
app.use(cookieParser() as any);
const allowedOrigins = [
  "http://localhost:5173",
  "https://gopi-agro-products.vercel.app"
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

// Add raw body parser BEFORE json parser for webhook route
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

// Register payment routes (legacy /api/payment/* prefix)
app.use("/api/payment", paymentRouter);

// ─── Clean API routes matching desired flow ──────────────────────────────────
// POST /api/create-order → same as /api/payment/create-order
app.use("/api", paymentRouter);

// Authentication Routes
app.use("/api/auth", authRouter);

// Order Schema Healing Formatter
function formatOrder(key: string, data: any) {
  if (!data) return null;
  return {
    id: key,
    orderId: data.orderId || `KM_${key.slice(0, 8)}`,
    uid: data.uid || data.userId || "guest",
    userName: data.userName || data.buyerName || data.customerName || "Guest User",
    buyerName: data.buyerName || data.userName || data.customerName || "Guest User",
    userEmail: data.userEmail || data.customerEmail || "",
    userPhone: data.userPhone || data.customerPhone || "",
    totalAmount: data.totalAmount || data.total || 0,
    total: data.total || data.totalAmount || 0,
    deliveryAddress: data.deliveryAddress || data.address || "No Address Provided",
    address: data.address || data.deliveryAddress || "No Address Provided",
    paymentMethod: data.paymentMethod || "COD",
    upiTransactionId: data.upiTransactionId || null,
    cardLast4: data.cardLast4 || null,
    bankName: data.bankName || null,
    paymentStatus: data.paymentStatus || "Pending",
    status: data.status || data.orderStatus || "Pending",
    orderStatus: data.orderStatus || data.status || "Pending",
    items: data.items || data.cartItems || [],
    cartItems: data.cartItems || data.items || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || data.createdAt || new Date().toISOString()
  };
}

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
    const fs = require('fs');
    const files = fs.readdirSync(process.cwd());
    res.status(500).json({ error: "Error fetching products", details: err instanceof Error ? err.message : String(err), cwd: process.cwd(), files });
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
// FARMER ROUTES
// ==========================

const seedFarmers = [
  { id: 'f1', name: 'Ramesh Kumar', field: 'Organic Vegetables', location: 'Maharashtra', rating: 4.8, experience: '12 years', image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', phone: '+91 9876543210', status: 'Active' },
  { id: 'f2', name: 'Suresh Patil', field: 'Fresh Fruits', location: 'Karnataka', rating: 4.9, experience: '8 years', image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0a2f4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', phone: '+91 9876543211', status: 'Active' },
  { id: 'f3', name: 'Anita Devi', field: 'Dairy & Eggs', location: 'Punjab', rating: 4.7, experience: '15 years', image: 'https://images.unsplash.com/photo-1551804791-5f102570077c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', phone: '+91 9876543212', status: 'Active' },
  { id: 'f4', name: 'Gopi Konangi', field: 'Grains & Pulses', location: 'Andhra Pradesh', rating: 5.0, experience: '20 years', image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', phone: '+91 9876543213', status: 'Active' },
  { id: 'f5', name: 'Vikram Singh', field: 'Spices & Herbs', location: 'Kerala', rating: 4.6, experience: '5 years', image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', phone: '+91 9876543214', status: 'Inactive' }
];

app.get("/api/farmers", async (req, res) => {
  try {
    const snapshot = await db.ref('farmers').once('value');
    const data = snapshot.val();
    if (!data) {
      // Seed farmers if empty
      for (const f of seedFarmers) {
        await db.ref(`farmers/${f.id}`).set(f);
      }
      return res.json(seedFarmers);
    }
    const farmers = Object.keys(data).map(k => ({ id: k, ...data[k] }));
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch farmers" });
  }
});

app.post("/api/farmers", async (req, res) => {
  const ref = db.ref('farmers').push();
  const farmer = { ...req.body, id: ref.key, createdAt: new Date().toISOString() };
  await ref.set(farmer);
  res.json(farmer);
});

app.put("/api/farmers/:id", async (req, res) => {
  const ref = db.ref(`farmers/${req.params.id}`);
  await ref.update(req.body);
  const snapshot = await ref.once('value');
  res.json({ id: req.params.id, ...snapshot.val() });
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
    const order = formatOrder(k, data[k]);
    const user = order ? (usersData[order.uid] || null) : null;
    return { ...order, user };
  });

  res.json(orders.filter(Boolean).sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || "")));
});

app.get("/api/orders/user/:uid", async (req, res) => {
  const snapshot = await db.ref('orders').orderByChild('uid').equalTo(req.params.uid).once('value');
  const data = snapshot.val() || {};
  let orders = Object.keys(data).map(k => formatOrder(k, data[k]));
  res.json(orders.filter(Boolean).sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || "")));
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
  
  const formatted = formatOrder(key, data) as any;
  if (formatted) {
    const userSnap = await db.ref(`users/${formatted.uid}`).once('value');
    formatted.user = userSnap.val();
  }
  
  res.json(formatted);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🔥 KisanMart Firebase API server running on port ${PORT}`)
);

export default app;
