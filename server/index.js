// ========================================
// IMPORTS AND CONFIGURATION
// ========================================
/*
this code is a complete sales management system for a pharmacy made by wasi
has multi-branch support, role-based access control, and comprehensive reporting.
designed and developed by wasi and bilal shah.
copyright © 2025 wasi and bilal shah. all rights reserved.
don't sell this code without permission.
don't use this code for commercial purposes without permission.
don't use this code for illegal purposes without permission.
don't use this code for any purpose without permission.
don't use this code for any purpose without permission.
contact us at mrwasi.dev@gmail.com for any questions or support.
anywhare i see  this code i will sue you for copyright infringement.and will take legal action.
code based on the following technologies:
- html5
- css3
- javascript
- nodejs
- express
- mongoose
- cors
- morgan
- dotenv
- path
- fileurl
- bcryptjs
- jsonwebtoken
- mongoose
- cors
- morgan

never use any other technologies without permission.
mission of this code is to help the pharmacy business to manage their sales and inventory.
soon i will add more features to this code.
happy coding and good luck.
goo
follow me on github and twitter.
follow me on instagram and facebook.
follow me on youtube and tiktok.
follow me on linkedin and github.
follow me on twitter and facebook.
follow me on instagram and youtube.
follow me on tiktok and linkedin.
follow me on github and twitter.
 official website: https://mrwasi.dev
 official email: mrwasi.dev@gmail.com
 official phone: +923192173398
 official address: pwd housing society, islamabad, pakistan
 official city: islamabad
 official state: pakistan
 official zip: 45600
 official country: pakistan

*/
// Importing the necessary modules made by wasi
import express from 'express';
// removed dynamic logo upload dependencies
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env, paths } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { connectDB, checkDatabaseConnection } from './config/db.js';
import { sanitizeInput, rateLimit } from './middlewares/util.js';
import { authenticate, isAdmin, hasPermission } from './middlewares/auth.js';
import { authenticateApiKey } from './middlewares/apiKey.js';
import { Branch, Category, Group, User, Sale, DepartmentSale, Settings, Supplier, Payment, CategoryPayment, ApiKey, Department, SubDepartment, Employee, EmployeeDepartment, EmployeeDesignation } from './models/index.js';

// ========================================
// SERVER INITIALIZATION AND CONFIGURATION
// ========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env is loaded via ./config/env.js

const app = express();
const port = env.PORT;
const mongoUri = env.MONGO_URI;

// ========================================
// MIDDLEWARE CONFIGURATION
// ========================================
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
/*
// DEBUG: Log ALL incoming API requests to see what's happening
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log('🔍 REQUEST RECEIVED:', req.method, req.path, '| Query:', JSON.stringify(req.query), '| Original:', req.originalUrl);
    console.log('🔍 Authorization header:', req.header('Authorization') ? 'Present' : 'Missing');
  }
  next();
});
*/ // Commented out by wasi to avoid logging all requests to the console
// ========================================
// RATE LIMITING MIDDLEWARE (imported from middlewares/util.js)

// Apply rate limiting to sensitive auth endpoints only
app.use('/api/auth/login', rateLimit(10, 15 * 60 * 1000));
app.use('/api/auth/signup', rateLimit(10, 15 * 60 * 1000));

// ========================================
// INPUT SANITIZATION MIDDLEWARE (imported from middlewares/util.js)
app.use(sanitizeInput);


// ========================================
// DATABASE CONNECTION
// ========================================

// DATABASE CONNECTION (via modular config)
connectDB(mongoUri);

// MongoDB connection event handlers
// MongoDB connection event handlers moved to config/db.js

// ========================================
// DATABASE SCHEMAS AND MODELS
// ========================================

// Branch Schema - Pharmacy locations
const BranchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  { timestamps: true }
);

// Category Schema - Product categories
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    color: { type: String, default: 'primary' }
  },
  { timestamps: true }
);

// Group Schema - User permission groups
const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    permissions: [{ type: String }],
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// User Schema - System users
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

// Sale Schema - Sales transactions
const SaleSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    date: { type: Date, required: true },
    items: [
      {
        sku: String,
        name: String,
        quantity: Number,
        unitPrice: Number,
        cost: Number
      }
    ],
    total: { type: Number, required: true },
    costTotal: { type: Number, required: true },
    profit: { type: Number, required: true },
    category: { type: String, required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// Department Sale Schema - Department/Sub-Department Sales transactions
const DepartmentSaleSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    subDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubDepartment', required: true },
    date: { type: Date, required: true },
    grossSale: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    saleValue: { type: Number, required: true },
    returnAmount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    netSale: { type: Number, required: true },
    subDepartmentTotal: { type: Number, required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// Settings Schema - System configuration
const SettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'D.Watson Group of Pharmacy' },
    currency: { type: String, default: '' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    itemsPerPage: { type: Number, default: 10 },
    defaultCostPercent: { type: Number, default: 70 }
  },
  { timestamps: true }
);

// Supplier Schema - Payment suppliers
const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    contact: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  { timestamps: true }
);

// Payment Schema - Payment entries (Voucher-based) - Supplier Vouchers ONLY
const PaymentSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    voucherNumber: { type: String, unique: true, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    paymentMethod: { type: String, default: 'Cash' }, // Cash, Bank Transfer, Check, Online Payment
    supplier: { type: String, required: true },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] }
  },
  { timestamps: true }
);

// Category Payment Schema - Category Vouchers (SEPARATE MODEL)
const CategoryPaymentSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    voucherNumber: { type: String, unique: true, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    paymentMethod: { type: String, default: 'Cash' },
    category: { type: String, required: true },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] }
  },
  { timestamps: true }
);

// API Key Schema - For external API access
const ApiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    apiKey: { type: String, required: true, unique: true },
    apiSecret: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date } // Optional expiration date
  },
  { timestamps: true }
);

// Index for faster lookups
ApiKeySchema.index({ isActive: 1 });

// Department Schema - Main departments (branch-specific)
const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sequence: { type: Number, default: 0 } // Custom sequence for branch-wise ordering
  },
  { timestamps: true }
);

// SubDepartment Schema - Sub-departments under departments (branch-specific)
const SubDepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sequence: { type: Number, default: 0 } // Custom sequence for branch-wise ordering
  },
  { timestamps: true }
);

// Indexes for departments and sub-departments
DepartmentSchema.index({ branchId: 1, name: 1 }, { unique: true });
SubDepartmentSchema.index({ departmentId: 1, branchId: 1, name: 1 }, { unique: true });

// Model Creation
// Models are imported from server/models/index.js

// ========================================
// AUTHENTICATION CONFIGURATION
// ========================================
// Validate environment variables
// JWT secret validation handled in middlewares/auth.js


// ========================================
// DATABASE CONNECTION CHECK MIDDLEWARE
// ========================================

// Check if database is connected
// Database connection check imported from config/db.js

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

// Main Authentication Middleware
// Authentication middleware imported from middlewares/auth.js

// Admin Permission Middleware
// isAdmin imported from middlewares/auth.js

// Permission Check Middleware - Check if user has specific permission
// Supports hierarchical permissions: if user has parent permission, they get access to sub-permissions
// hasPermission imported from middlewares/auth.js

// ========================================
// API KEY AUTHENTICATION MIDDLEWARE
// ========================================

// API Key Authentication Middleware - For external API access
// API Key auth imported from middlewares/apiKey.js

// ========================================
// UTILITY ENDPOINTS
// ========================================

// Promote user to admin endpoint
app.post('/api/admin/promote-user', async (req, res) => {
  try {
    const { username, adminPassword } = req.body;
    
    // Verify admin password
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
      return res.status(503).json({ error: 'Admin password not configured on server' });
    }
    if (adminPassword !== expectedPassword) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Find the user
    const user = await User.findOne({ username }).populate('groupId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find or create Admin group
    let adminGroup = await Group.findOne({ name: 'Admin' });
    if (!adminGroup) {
        adminGroup = await Group.create({
          name: 'Admin',
          description: 'System administrators with full access',
          permissions: ['admin', 'dashboard', 'categories', 'departments', 'sales', 'payments', 'payment-dashboard', 'payment-vouchers', 'payment-voucher-list', 'payment-reports', 'category-voucher', 'category-voucher-list', 'category-voucher-edit', 'category-voucher-delete', 'reports', 'branches', 'groups', 'users', 'settings', 'suppliers'],
          isDefault: true
        });
    }
    
    // Update user to Admin group
    user.groupId = adminGroup._id;
    await user.save();
    
    // Populate the updated user
    await user.populate('groupId', 'name permissions');
    
    res.json({
      message: `User ${username} has been promoted to admin`,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        groupId: user.groupId,
        permissions: user.groupId.permissions
      }
    });
    
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by username endpoint
app.get('/api/users/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username }).populate('groupId', 'name permissions');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      groupId: user.groupId,
      permissions: user.groupId.permissions,
      isActive: user.isActive
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = { 
    ok: true, 
    environment: process.env.NODE_ENV || 'development',
    port: port,
    timestamp: new Date().toISOString(),
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
      host: mongoose.connection.host || 'unknown',
      port: mongoose.connection.port || 'unknown'
    },
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    rateLimit: {
      activeConnections: rateLimitMap.size
    }
  };
  
  
  // Set appropriate status code based on database connection
  const statusCode = mongoose.connection.readyState === 1 ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// ========================================
// AUTHENTICATION ROUTES
// ========================================

// User Login
app.post('/api/auth/login', checkDatabaseConnection, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await User.findOne({ username }).populate('groupId');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
  const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        groupId: user.groupId,
        branches: user.branches,
        permissions: user.groupId.permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Logout
app.post('/api/auth/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// User Registration
app.post('/api/auth/signup', checkDatabaseConnection, async (req, res) => {
  try {
    const { username, fullName, email, password, confirmPassword } = req.body;
    
    
    // Validation
    if (!username || !fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Database connection error' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }
    
    // Get Admin group for new users (full rights)
    let adminGroup = await Group.findOne({ name: 'Admin' });
    if (!adminGroup) {
      // If Admin group doesn't exist, create it with full permissions
      adminGroup = await Group.create({
        name: 'Admin',
        description: 'System administrators with full access',
        permissions: ['admin', 'dashboard', 'categories', 'departments', 'sales', 'payments', 'reports', 'branches', 'groups', 'users', 'settings', 'suppliers'],
        isDefault: true
      });
    }
    
    // Get all branches for new user (or empty array if no branches exist)
    const allBranches = await Branch.find();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user with admin privileges
    const newUser = new User({
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      groupId: adminGroup._id, // Assign admin group for full rights
      branches: allBranches.map(b => b._id), // Assign all branches by default
      isActive: true
    });
    
    await newUser.save();
    
    // Populate group information for response
    await newUser.populate('groupId', 'name permissions');
    
    
    // Generate JWT token
  const token = jwt.sign({ id: newUser._id }, env.JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        groupId: newUser.groupId,
        branches: newUser.branches,
        permissions: newUser.groupId.permissions
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Get Current User Info
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    // Fetch the user again to ensure we have the latest data
    const user = await User.findById(req.user._id).populate('groupId');
    
    res.json({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      groupId: user.groupId,
      branches: user.branches,
      permissions: user.groupId.permissions
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// SETTINGS API ROUTES
// ========================================

// Get System Settings
app.get('/api/settings', authenticate, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update System Settings
app.put('/api/settings', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const update = {
      companyName: req.body.companyName ?? 'D.Watson Group of Pharmacy',
      currency: req.body.currency ?? '',
      dateFormat: req.body.dateFormat ?? 'DD/MM/YYYY',
      itemsPerPage: Number(req.body.itemsPerPage ?? 10),
      defaultCostPercent: req.body.defaultCostPercent !== undefined ? Number(req.body.defaultCostPercent) : undefined,
      theme: req.body.theme ?? 'light'
    };
    
    // Remove undefined to avoid overwriting with undefined
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    
    const settings = await Settings.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(400).json({ error: error.message });
  }
});


// ========================================
// DATA RESTORE API ROUTE
// ========================================

// Restore Data from Backup
app.post('/api/admin/restore', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const backup = req.body;
    
    // Validate backup structure
    if (!backup || typeof backup !== 'object') {
      return res.status(400).json({ error: 'Invalid backup data format' });
    }
    
    // Optional: Validate timestamp exists
    if (!backup.timestamp) {
      console.warn('⚠️ Backup file missing timestamp');
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Step 1: Clear existing data (in reverse dependency order to avoid foreign key issues)
      console.log('🗑️ Clearing existing data...');
      
      await DepartmentSale.deleteMany({}).session(session);
      await Sale.deleteMany({}).session(session);
      await Payment.deleteMany({}).session(session);
      await CategoryPayment.deleteMany({}).session(session);
      await User.deleteMany({}).session(session);
      await SubDepartment.deleteMany({}).session(session);
      await Department.deleteMany({}).session(session);
      await Category.deleteMany({}).session(session);
      await Supplier.deleteMany({}).session(session);
      await Branch.deleteMany({}).session(session);
      await Group.deleteMany({}).session(session);
      await Settings.deleteMany({}).session(session);
      // Note: Not deleting ApiKeys to preserve API access
      
      // Step 2: Restore data (in dependency order)
      console.log('📥 Restoring backup data...');
      
      // Restore Settings
      if (backup.settingsData) {
        if (Array.isArray(backup.settingsData) && backup.settingsData.length > 0) {
          await Settings.insertMany([backup.settingsData[0]], { session });
        } else if (typeof backup.settingsData === 'object') {
          await Settings.insertMany([backup.settingsData], { session });
        }
      }
      
      // Restore Groups (needed before Users)
      if (backup.groupsData && Array.isArray(backup.groupsData)) {
        const groups = backup.groupsData.map(g => ({
          name: g.name,
          description: g.description || '',
          permissions: g.permissions || [],
          isDefault: g.isDefault || false
        }));
        await Group.insertMany(groups, { session });
      }
      
      // Restore Branches (needed before Departments and Users)
      if (backup.branchesData && Array.isArray(backup.branchesData)) {
        const branches = backup.branchesData.map(b => ({
          name: b.name,
          address: b.address || '',
          phone: b.phone || '',
          email: b.email || ''
        }));
        await Branch.insertMany(branches, { session });
      }
      
      // Restore Categories (needed before Sales)
      if (backup.categoriesData && Array.isArray(backup.categoriesData)) {
        const categories = backup.categoriesData.map(c => ({
          name: c.name,
          description: c.description || '',
          color: c.color || 'primary'
        }));
        await Category.insertMany(categories, { session });
      }
      
      // Restore Suppliers (needed before Payments)
      if (backup.suppliersData && Array.isArray(backup.suppliersData)) {
        const suppliers = backup.suppliersData.map(s => ({
          name: s.name,
          description: s.description || '',
          contact: s.contact || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || ''
        }));
        await Supplier.insertMany(suppliers, { session });
      }
      
      // Restore Users (needs Groups and Branches to exist)
      if (backup.usersData && Array.isArray(backup.usersData)) {
        // First, get current Groups and Branches to map old IDs to new IDs
        const allGroups = await Group.find({}).session(session);
        const allBranches = await Branch.find({}).session(session);
        
        const groupMap = new Map();
        allGroups.forEach(g => groupMap.set(g.name, g._id));
        
        const branchMap = new Map();
        allBranches.forEach(b => branchMap.set(b.name, b._id));
        
        const users = [];
        for (const u of backup.usersData) {
          // Find matching group by name
          const group = allGroups.find(g => g.name === (u.groupId?.name || u.group?.name || ''));
          if (!group) {
            console.warn(`⚠️ Group not found for user ${u.username}, skipping`);
            continue;
          }
          
          // Map branch names to IDs
          const branchIds = [];
          if (u.branches && Array.isArray(u.branches)) {
            for (const branchRef of u.branches) {
              const branchName = branchRef.name || branchRef;
              const branch = allBranches.find(b => b.name === branchName);
              if (branch) branchIds.push(branch._id);
            }
          }
          
          // Use existing password hash if available, otherwise hash a default
          let passwordHash = u.password;
          if (!passwordHash || passwordHash.length < 20) {
            // If password looks unhashed or invalid, hash a default
            passwordHash = await bcrypt.hash('password123', 10);
          }
          
          users.push({
            username: u.username,
            fullName: u.fullName,
            email: u.email,
            password: passwordHash,
            groupId: group._id,
            branches: branchIds,
            isActive: u.isActive !== undefined ? u.isActive : true,
            lastLogin: u.lastLogin || null
          });
        }
        
        if (users.length > 0) {
          await User.insertMany(users, { session });
        }
      }
      
      // Restore Sales (needs Branches and Categories)
      if (backup.salesData && Array.isArray(backup.salesData)) {
        const allBranches = await Branch.find({}).session(session);
        const allCategories = await Category.find({}).session(session);
        
        const branchMap = new Map();
        allBranches.forEach(b => branchMap.set(b.name, b._id));
        
        const categoryMap = new Map();
        allCategories.forEach(c => categoryMap.set(c.name, c._id));
        
        const sales = [];
        for (const s of backup.salesData) {
          const branchName = s.branchId?.name || s.branch?.name || '';
          const categoryName = s.categoryId?.name || s.category || '';
          
          const branch = allBranches.find(b => b.name === branchName);
          const category = allCategories.find(c => c.name === categoryName);
          
          if (!branch || !category) {
            console.warn(`⚠️ Branch or Category not found for sale, skipping`);
            continue;
          }
          
          sales.push({
            branchId: branch._id,
            categoryId: category._id,
            date: new Date(s.date),
            items: s.items || [],
            total: s.total || 0,
            costTotal: s.costTotal || 0,
            profit: s.profit || 0,
            category: categoryName,
            notes: s.notes || ''
          });
        }
        
        if (sales.length > 0) {
          await Sale.insertMany(sales, { session });
        }
      }
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      console.log('✅ Data restored successfully');
      
      res.json({
        success: true,
        message: 'Data restored successfully',
        restored: {
          settings: backup.settingsData ? 1 : 0,
          groups: backup.groupsData?.length || 0,
          branches: backup.branchesData?.length || 0,
          categories: backup.categoriesData?.length || 0,
          suppliers: backup.suppliersData?.length || 0,
          users: backup.usersData?.length || 0,
          sales: backup.salesData?.length || 0
        },
        timestamp: backup.timestamp || 'Unknown'
      });
      
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error restoring data:', error);
    res.status(500).json({ 
      error: 'Failed to restore data',
      message: error.message 
    });
  }
});

// ========================================
// BRANCHES API ROUTES
// ========================================

// Get All Branches
app.get('/api/branches', authenticate, checkDatabaseConnection, async (req, res) => {
  try {
    // If user is not admin, only return assigned branches
    const filter = {};
    if (!req.user.groupId.permissions.includes('admin')) {
      filter._id = { $in: req.user.branches };
    }
    
    const branches = await Branch.find(filter).sort({ createdAt: -1 });
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create New Branch
app.post('/api/branches', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });
    // Enforce unique name (case-insensitive)
    const exists = await Branch.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) return res.status(409).json({ error: 'Branch with this name already exists' });
    const branch = await Branch.create({ ...req.body, name });
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update Branch
app.put('/api/branches/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const id = req.params.id;
    const payload = { ...req.body };

    // Normalize name if provided
    if (payload.name !== undefined && payload.name !== null) {
      payload.name = String(payload.name).trim();

      // Fetch current branch to compare names
      const current = await Branch.findById(id);
      if (!current) {
        return res.status(404).json({ error: 'Branch not found' });
      }

      // Simple case-insensitive comparison
      const currentName = String(current.name || '').toLowerCase().trim();
      const newName = payload.name.toLowerCase().trim();
      const nameChanged = currentName !== newName;


      // Only enforce uniqueness if the name is actually changing
      if (nameChanged) {
        const exists = await Branch.findOne({
          _id: { $ne: id },
          name: { $regex: `^${payload.name}$`, $options: 'i' }
        });
        if (exists) {
          return res.status(409).json({ error: 'Branch with this name already exists' });
        }
      }
    }
    
    const updated = await Branch.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating branch:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete Branch
app.delete('/api/branches/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    // Also delete all sales associated with this branch
    await Sale.deleteMany({ branchId: req.params.id });
    // Remove branch from all users
    await User.updateMany(
      { branches: req.params.id },
      { $pull: { branches: req.params.id } }
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting branch:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// CATEGORIES API ROUTES
// ========================================

// Get All Categories
app.get('/api/categories', authenticate, async (req, res) => {
  try {
    console.log('✅ GET /api/categories route hit');
    const categories = await Category.find().sort({ sequence: 1, createdAt: 1 });
    console.log(`✅ Returning ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get Category by ID
app.get('/api/categories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Category ID format' });
    }
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('❌ Error fetching category by ID:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get Single Category by ID
app.get('/api/categories/:id', authenticate, async (req, res) => {
  try {
    console.log('✅ GET /api/categories/:id route hit', req.params.id);
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.log('✅ Category loaded', { id: category._id?.toString(), sequence: category.sequence });
    res.json(category);
  } catch (error) {
    console.error('❌ Error fetching category by id:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Create New Category
app.post('/api/categories', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        error: `A category with the name "${name}" already exists. Please choose a different name.` 
      });
    }
    
    let payload = { ...req.body };
    const hasSeq = Object.prototype.hasOwnProperty.call(payload, 'sequence');
    if (!hasSeq || payload.sequence === '' || payload.sequence === null || payload.sequence === undefined) {
      const maxSeqDoc = await Category.findOne().sort({ sequence: -1 }).select('sequence');
      const nextSeq = maxSeqDoc && maxSeqDoc.sequence !== undefined ? maxSeqDoc.sequence + 1 : 0;
      payload.sequence = nextSeq;
    } else {
      const n = Number(payload.sequence);
      payload.sequence = Number.isNaN(n) ? payload.sequence : n;
    }
    console.log('🟦 Creating category payload', { name: payload.name, sequence: payload.sequence });
    const category = await Category.create(payload);
    console.log('🟩 Created category', { id: category._id?.toString(), sequence: category.sequence });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update Category
app.put('/api/categories/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    console.log('🟨 Update category request', { id: req.params.id, sequence: req.body?.sequence });
    
    // Check if another category with the same name exists (excluding current category)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        error: `A category with the name "${name}" already exists. Please choose a different name.` 
      });
    }
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (Object.prototype.hasOwnProperty.call(req.body, 'sequence')) {
      const s = req.body.sequence;
      if (s !== '' && s !== null && s !== undefined) {
        const n = Number(s);
        if (!Number.isNaN(n)) updateData.sequence = n;
      }
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.log('🟩 Updated category', { id: updated._id?.toString(), sequence: updated.sequence });
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete Category
app.delete('/api/categories/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting category:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// DEPARTMENTS API ROUTES
// ========================================

// Get All Departments (optionally filtered by branch)
app.get('/api/departments', authenticate, async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. Connection state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        error: 'Database connection not available. Please try again later.',
        status: 'database_unavailable'
      });
    }

    console.log('✅ GET /api/departments route hit - Query:', req.query);
    const { branchId } = req.query;
    const query = {};
    
    if (branchId && branchId !== 'undefined' && branchId.trim() !== '') {
      // Validate and convert branchId to ObjectId
      if (!mongoose.Types.ObjectId.isValid(branchId)) {
        console.error('❌ Invalid branchId format:', branchId);
        return res.status(400).json({ error: 'Invalid branch ID format' });
      }
      query.branchId = new mongoose.Types.ObjectId(branchId);
      console.log('🔍 Filtering departments by branchId:', branchId);
    }
    
    console.log('🔍 Department query:', JSON.stringify(query, null, 2));
    const departments = await Department.find(query).populate('branchId', 'name').sort({ sequence: 1, name: 1 });
    console.log(`✅ Found ${departments.length} departments`);
    
    if (departments.length === 0 && branchId) {
      console.warn(`⚠️ No departments found for branchId: ${branchId}`);
    }
    
    res.json(departments);
  } catch (error) {
    console.error('❌ Error fetching departments:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch departments from database'
    });
  }
});

// Get Departments by Branch ID
app.get('/api/branches/:branchId/departments', authenticate, async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. Connection state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        error: 'Database connection not available. Please try again later.',
        status: 'database_unavailable'
      });
    }

    const { branchId } = req.params;
    console.log('✅ GET /api/branches/:branchId/departments - branchId:', branchId);
    
    // Validate branchId format
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      console.error('❌ Invalid branchId format:', branchId);
      return res.status(400).json({ error: 'Invalid branch ID format' });
    }
    
    const departments = await Department.find({ branchId: new mongoose.Types.ObjectId(branchId) })
      .populate('branchId', 'name')
      .sort({ sequence: 1, name: 1 });
    
    console.log(`✅ Found ${departments.length} departments for branchId: ${branchId}`);
    
    if (departments.length === 0) {
      console.warn(`⚠️ No departments found for branchId: ${branchId}`);
    }
    
    res.json(departments);
  } catch (error) {
    console.error('❌ Error fetching departments by branch:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch departments from database'
    });
  }
});

// Get Single Department with Sub-Departments
app.get('/api/departments/:id', authenticate, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate('branchId', 'name');
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    const subDepartments = await SubDepartment.find({ departmentId: req.params.id }).sort({ sequence: 1, name: 1 });
    res.json({ ...department.toObject(), subDepartments });
  } catch (error) {
    console.error('Error fetching department:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create New Department
app.post('/api/departments', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, branchId, description } = req.body;
    
    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }
    
    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    // Check if department with same name already exists in this branch
    const existingDepartment = await Department.findOne({ 
      branchId,
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingDepartment) {
      return res.status(400).json({ 
        error: `A department with the name "${name}" already exists in this branch. Please choose a different name.` 
      });
    }
    
    // Get max sequence for this branch to set default
    const maxSequence = await Department.findOne({ branchId }).sort({ sequence: -1 }).select('sequence');
    const defaultSequence = maxSequence && maxSequence.sequence !== undefined ? maxSequence.sequence + 1 : 0;
    
    const department = await Department.create({ 
      name, 
      branchId, 
      description: description || '',
      sequence: req.body.sequence !== undefined ? req.body.sequence : defaultSequence
    });
    
    await department.populate('branchId', 'name');
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update Department
app.put('/api/departments/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, branchId, description } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const currentBranchId = branchId || department.branchId;
    
    // Check if another department with the same name exists in the same branch (excluding current department)
    if (name) {
      const existingDepartment = await Department.findOne({ 
        branchId: currentBranchId,
        name: { $regex: new RegExp(`^${name}$`, 'i') }, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingDepartment) {
        return res.status(400).json({ 
          error: `A department with the name "${name}" already exists in this branch. Please choose a different name.` 
        });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (branchId) updateData.branchId = branchId;
    if (description !== undefined) updateData.description = description;
    if (req.body.sequence !== undefined) updateData.sequence = req.body.sequence;
    
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('branchId', 'name');
    
    res.json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete Department
app.delete('/api/departments/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    // Check if department has sub-departments
    const subDepartmentCount = await SubDepartment.countDocuments({ departmentId: req.params.id });
    if (subDepartmentCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete department. It has ${subDepartmentCount} sub-department(s). Please delete sub-departments first.` 
      });
    }
    
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting department:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// SUB-DEPARTMENTS API ROUTES
// ========================================

// Get All Sub-Departments (optionally filtered by department or branch)
app.get('/api/sub-departments', authenticate, async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. Connection state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        error: 'Database connection not available. Please try again later.',
        status: 'database_unavailable'
      });
    }

    const { departmentId, branchId } = req.query;
    console.log('✅ GET /api/sub-departments - Query:', req.query);
    const query = {};
    
    if (departmentId && departmentId !== 'undefined' && departmentId.trim() !== '') {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        console.error('❌ Invalid departmentId format:', departmentId);
        return res.status(400).json({ error: 'Invalid department ID format' });
      }
      query.departmentId = new mongoose.Types.ObjectId(departmentId);
    }
    
    if (branchId && branchId !== 'undefined' && branchId.trim() !== '') {
      if (!mongoose.Types.ObjectId.isValid(branchId)) {
        console.error('❌ Invalid branchId format:', branchId);
        return res.status(400).json({ error: 'Invalid branch ID format' });
      }
      query.branchId = new mongoose.Types.ObjectId(branchId);
    }
    
    console.log('🔍 Sub-department query:', JSON.stringify(query, null, 2));
    const subDepartments = await SubDepartment.find(query)
      .populate('departmentId', 'name')
      .populate('branchId', 'name')
      .sort({ sequence: 1, name: 1 });
    
    console.log(`✅ Found ${subDepartments.length} sub-departments`);
    
    if (subDepartments.length === 0 && (departmentId || branchId)) {
      console.warn(`⚠️ No sub-departments found for filters:`, query);
    }
    
    res.json(subDepartments);
  } catch (error) {
    console.error('❌ Error fetching sub-departments:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch sub-departments from database'
    });
  }
});

// Get Single Sub-Department by ID (must come before department-specific route)
app.get('/api/sub-departments/:id', authenticate, async (req, res) => {
  try {
    const subDepartment = await SubDepartment.findById(req.params.id)
      .populate('departmentId', 'name')
      .populate('branchId', 'name');
    
    if (!subDepartment) {
      return res.status(404).json({ error: 'Sub-department not found' });
    }
    
    res.json(subDepartment);
  } catch (error) {
    console.error('Error fetching sub-department:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get Sub-Departments by Department ID
app.get('/api/departments/:departmentId/sub-departments', authenticate, async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. Connection state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        error: 'Database connection not available. Please try again later.',
        status: 'database_unavailable'
      });
    }

    const { departmentId } = req.params;
    console.log('✅ GET /api/departments/:departmentId/sub-departments - departmentId:', departmentId);
    
    // Validate departmentId format
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      console.error('❌ Invalid departmentId format:', departmentId);
      return res.status(400).json({ error: 'Invalid department ID format' });
    }
    
    const subDepartments = await SubDepartment.find({ departmentId: new mongoose.Types.ObjectId(departmentId) })
      .populate('branchId', 'name')
      .sort({ sequence: 1, name: 1 });
    
    console.log(`✅ Found ${subDepartments.length} sub-departments for departmentId: ${departmentId}`);
    
    if (subDepartments.length === 0) {
      console.warn(`⚠️ No sub-departments found for departmentId: ${departmentId}`);
    }
    
    res.json(subDepartments);
  } catch (error) {
    console.error('❌ Error fetching sub-departments:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch sub-departments from database'
    });
  }
});

// Create New Sub-Department
app.post('/api/sub-departments', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, departmentId, branchId, description } = req.body;
    
    if (!departmentId) {
      return res.status(400).json({ error: 'Department ID is required' });
    }
    
    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }
    
    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Verify branch matches department's branch
    if (department.branchId.toString() !== branchId) {
      return res.status(400).json({ 
        error: 'Branch ID must match the department\'s branch' 
      });
    }
    
    // Check if sub-department with same name already exists in this department and branch
    const existingSubDepartment = await SubDepartment.findOne({ 
      departmentId,
      branchId,
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingSubDepartment) {
      return res.status(400).json({ 
        error: `A sub-department with the name "${name}" already exists in this department. Please choose a different name.` 
      });
    }
    
    // Get max sequence for this department to set default
    const maxSequence = await SubDepartment.findOne({ departmentId, branchId }).sort({ sequence: -1 }).select('sequence');
    const defaultSequence = maxSequence && maxSequence.sequence !== undefined ? maxSequence.sequence + 1 : 0;
    
    const subDepartment = await SubDepartment.create({ 
      name, 
      departmentId,
      branchId,
      description: description || '',
      sequence: req.body.sequence !== undefined ? req.body.sequence : defaultSequence
    });
    
    await subDepartment.populate('departmentId', 'name');
    await subDepartment.populate('branchId', 'name');
    res.status(201).json(subDepartment);
  } catch (error) {
    console.error('Error creating sub-department:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update Sub-Department
app.put('/api/sub-departments/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, departmentId, branchId, description } = req.body;
    
    const subDepartment = await SubDepartment.findById(req.params.id);
    if (!subDepartment) {
      return res.status(404).json({ error: 'Sub-department not found' });
    }
    
    const currentDepartmentId = departmentId || subDepartment.departmentId;
    const currentBranchId = branchId || subDepartment.branchId;
    
    // If department is being changed, verify branch matches
    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
      if (department.branchId.toString() !== currentBranchId) {
        return res.status(400).json({ 
          error: 'Branch ID must match the department\'s branch' 
        });
      }
    }
    
    // Check if another sub-department with the same name exists in the same department and branch (excluding current sub-department)
    if (name) {
      const existingSubDepartment = await SubDepartment.findOne({ 
        departmentId: currentDepartmentId,
        branchId: currentBranchId,
        name: { $regex: new RegExp(`^${name}$`, 'i') }, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingSubDepartment) {
        return res.status(400).json({ 
          error: `A sub-department with the name "${name}" already exists in this department. Please choose a different name.` 
        });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (departmentId) updateData.departmentId = departmentId;
    if (branchId) updateData.branchId = branchId;
    if (description !== undefined) updateData.description = description;
    if (req.body.sequence !== undefined) updateData.sequence = req.body.sequence;
    
    const updatedSubDepartment = await SubDepartment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('departmentId', 'name')
    .populate('branchId', 'name');
    
    res.json(updatedSubDepartment);
  } catch (error) {
    console.error('Error updating sub-department:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete Sub-Department
app.delete('/api/sub-departments/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const subDepartment = await SubDepartment.findByIdAndDelete(req.params.id);
    if (!subDepartment) {
      return res.status(404).json({ error: 'Sub-department not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting sub-department:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update Department Sequences (Bulk)
app.put('/api/departments/sequences', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { sequences } = req.body; // Array of { id, sequence }
    
    if (!Array.isArray(sequences)) {
      return res.status(400).json({ error: 'Sequences must be an array' });
    }
    
    const updatePromises = sequences.map(({ id, sequence }) => 
      Department.findByIdAndUpdate(id, { sequence }, { new: true })
    );
    
    await Promise.all(updatePromises);
    res.json({ ok: true, message: 'Sequences updated successfully' });
  } catch (error) {
    console.error('Error updating department sequences:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update Sub-Department Sequences (Bulk)
app.put('/api/sub-departments/sequences', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { sequences } = req.body; // Array of { id, sequence }
    
    if (!Array.isArray(sequences)) {
      return res.status(400).json({ error: 'Sequences must be an array' });
    }
    
    const updatePromises = sequences.map(({ id, sequence }) => 
      SubDepartment.findByIdAndUpdate(id, { sequence }, { new: true })
    );
    
    await Promise.all(updatePromises);
    res.json({ ok: true, message: 'Sequences updated successfully' });
  } catch (error) {
    console.error('Error updating sub-department sequences:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// SUPPLIERS API ROUTES
// ========================================

// Get All Suppliers
app.get('/api/suppliers', authenticate, async (req, res) => {
  try {
    console.log('✅ /api/suppliers route hit');
    // Ensure Content-Type is set to JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    console.log(`✅ Returning ${suppliers.length} suppliers`);
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('❌ Error fetching suppliers:', error.message);
    // Always return JSON, even on error
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message });
  }
});

// Create New Supplier
app.post('/api/suppliers', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, contact, phone, email, address } = req.body;
    
    // Check if supplier with same name already exists
    const existingSupplier = await Supplier.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingSupplier) {
      return res.status(400).json({ 
        error: `A supplier with the name "${name}" already exists. Please choose a different name.` 
      });
    }
    
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update Supplier
app.put('/api/suppliers/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, contact, phone, email, address } = req.body;
    
    // Check if another supplier with the same name exists (excluding current supplier)
    const existingSupplier = await Supplier.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingSupplier) {
      return res.status(400).json({ 
        error: `A supplier with the name "${name}" already exists. Please choose a different name.` 
      });
    }
    
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating supplier:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete Supplier
app.delete('/api/suppliers/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting supplier:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// GROUPS API ROUTES
// ========================================

// Get All Groups
app.get('/api/groups', authenticate, isAdmin, async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create New Group
app.post('/api/groups', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    // Check if group with same name already exists
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ error: 'Group with this name already exists' });
    }
    
    const group = new Group({ name, description, permissions });
    await group.save();
    
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Group
app.put('/api/groups/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    // Check if group with same name already exists (excluding current group)
    const existingGroup = await Group.findOne({ 
      name, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingGroup) {
      return res.status(400).json({ error: 'Group with this name already exists' });
    }
    
    // Find the current group to check if it's the Admin group
    const currentGroup = await Group.findById(req.params.id);
    
    // If updating the Admin group, ensure 'admin' permission is always included
    if (currentGroup && (currentGroup.name.toLowerCase() === 'admin' || name.toLowerCase() === 'admin')) {
      if (!permissions.includes('admin')) {
        permissions.push('admin');
      }
    }
    
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions },
      { new: true }
    );
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Group
app.delete('/api/groups/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Update all users with this group to have no group
    await User.updateMany(
      { groupId: req.params.id },
      { $unset: { groupId: 1 } }
    );
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// USERS API ROUTES
// ========================================

// Get All Users
app.get('/api/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .populate('groupId', 'name permissions')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create New User
app.post('/api/users', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { username, fullName, email, password, groupId, branches } = req.body;
    
    if (!username || !fullName || !email || !password || !groupId) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user with same username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { username },
        { email }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      groupId,
      branches
    });
    
    await user.save();
    
    // Populate group for response
    await user.populate('groupId', 'name permissions');
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update User
app.put('/api/users/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { username, fullName, email, password, groupId, branches, isActive } = req.body;
    
    if (!username || !fullName || !email || !groupId) {
      return res.status(400).json({ error: 'Username, full name, email, and group are required' });
    }
    
    // Check if user with same username or email already exists (excluding current user)
    const existingUser = await User.findOne({
      $or: [
        { username },
        { email }
      ],
      _id: { $ne: req.params.id }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }
    
    const updateData = {
      username,
      fullName,
      email,
      groupId,
      branches,
      isActive
    };
    
    // Only update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('groupId', 'name permissions');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete User
app.delete('/api/users/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    // Prevent users from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EMPLOYEES API ROUTES
// ========================================

// Get All Employees
app.get('/api/employees', authenticate, hasPermission('employees'), async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .populate('designationId', 'name')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Employee by ID
app.get('/api/employees/:id', authenticate, hasPermission('employees'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .populate('designationId', 'name');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create New Employee
app.post('/api/employees', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const employeeData = req.body;
    
    if (!employeeData.code || !employeeData.name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    
    // Check if employee with same code already exists
    const existingEmployee = await Employee.findOne({ code: employeeData.code });
    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee with this code already exists' });
    }
    
    // Convert date strings to Date objects
    if (employeeData.dob) employeeData.dob = new Date(employeeData.dob);
    if (employeeData.joiningDate) employeeData.joiningDate = new Date(employeeData.joiningDate);
    if (employeeData.issueDate) employeeData.issueDate = new Date(employeeData.issueDate);
    if (employeeData.expiryDate) employeeData.expiryDate = new Date(employeeData.expiryDate);
    if (employeeData.incrDate) employeeData.incrDate = new Date(employeeData.incrDate);
    
    const employee = new Employee(employeeData);
    await employee.save();
    
    await employee.populate('branchId', 'name');
    await employee.populate('departmentId', 'name');
    await employee.populate('designationId', 'name');
    
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Employee
app.put('/api/employees/:id', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const employeeData = req.body;
    
    if (!employeeData.code || !employeeData.name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    
    // Check if employee with same code already exists (excluding current employee)
    const existingEmployee = await Employee.findOne({
      code: employeeData.code,
      _id: { $ne: req.params.id }
    });
    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee with this code already exists' });
    }
    
    // Convert date strings to Date objects
    if (employeeData.dob) employeeData.dob = new Date(employeeData.dob);
    if (employeeData.joiningDate) employeeData.joiningDate = new Date(employeeData.joiningDate);
    if (employeeData.issueDate) employeeData.issueDate = new Date(employeeData.issueDate);
    if (employeeData.expiryDate) employeeData.expiryDate = new Date(employeeData.expiryDate);
    if (employeeData.incrDate) employeeData.incrDate = new Date(employeeData.incrDate);
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      employeeData,
      { new: true, runValidators: true }
    )
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .populate('designationId', 'name');
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Employee
app.delete('/api/employees/:id', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EMPLOYEE DEPARTMENTS API ROUTES
// ========================================

// Get All Employee Departments
app.get('/api/employee-departments', authenticate, hasPermission('employees'), async (req, res) => {
  try {
    const departments = await EmployeeDepartment.find()
      .sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching employee departments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Employee Department by ID
app.get('/api/employee-departments/:id', authenticate, hasPermission('employees'), async (req, res) => {
  try {
    const department = await EmployeeDepartment.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Employee department not found' });
    }
    res.json(department);
  } catch (error) {
    console.error('Error fetching employee department:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create New Employee Department
app.post('/api/employee-departments', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    // Check if department with same name already exists
    const existingDepartment = await EmployeeDepartment.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    if (existingDepartment) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    
    const department = new EmployeeDepartment({
      name: name.trim(),
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });
    
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating employee department:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Employee Department
app.put('/api/employee-departments/:id', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    // Check if department with same name already exists (excluding current)
    const existingDepartment = await EmployeeDepartment.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    if (existingDepartment) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    
    const department = await EmployeeDepartment.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description || '',
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    );
    
    if (!department) {
      return res.status(404).json({ error: 'Employee department not found' });
    }
    
    res.json(department);
  } catch (error) {
    console.error('Error updating employee department:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Employee Department
app.delete('/api/employee-departments/:id', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const department = await EmployeeDepartment.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.status(404).json({ error: 'Employee department not found' });
    }
    
    res.json({ message: 'Employee department deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee department:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EMPLOYEE DESIGNATIONS API ROUTES
// ========================================

// Get All Employee Designations
app.get('/api/employee-designations', authenticate, hasPermission('employees'), async (req, res) => {
  try {
    const designations = await EmployeeDesignation.find()
      .sort({ name: 1 });
    res.json(designations);
  } catch (error) {
    console.error('Error fetching employee designations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Employee Designation by ID
app.get('/api/employee-designations/:id', authenticate, hasPermission('employees'), async (req, res) => {
  try {
    const designation = await EmployeeDesignation.findById(req.params.id);
    if (!designation) {
      return res.status(404).json({ error: 'Employee designation not found' });
    }
    res.json(designation);
  } catch (error) {
    console.error('Error fetching employee designation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create New Employee Designation
app.post('/api/employee-designations', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Designation name is required' });
    }
    
    // Check if designation with same name already exists
    const existingDesignation = await EmployeeDesignation.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    if (existingDesignation) {
      return res.status(400).json({ error: 'Designation with this name already exists' });
    }
    
    const designation = new EmployeeDesignation({
      name: name.trim(),
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });
    
    await designation.save();
    res.status(201).json(designation);
  } catch (error) {
    console.error('Error creating employee designation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Employee Designation
app.put('/api/employee-designations/:id', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Designation name is required' });
    }
    
    // Check if designation with same name already exists (excluding current)
    const existingDesignation = await EmployeeDesignation.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    if (existingDesignation) {
      return res.status(400).json({ error: 'Designation with this name already exists' });
    }
    
    const designation = await EmployeeDesignation.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description || '',
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    );
    
    if (!designation) {
      return res.status(404).json({ error: 'Employee designation not found' });
    }
    
    res.json(designation);
  } catch (error) {
    console.error('Error updating employee designation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Employee Designation
app.delete('/api/employee-designations/:id', authenticate, hasPermission('employees'), checkDatabaseConnection, async (req, res) => {
  try {
    const designation = await EmployeeDesignation.findByIdAndDelete(req.params.id);
    
    if (!designation) {
      return res.status(404).json({ error: 'Employee designation not found' });
    }
    
    res.json({ message: 'Employee designation deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee designation:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// SALES API ROUTES
// ========================================

// Get All Sales
app.get('/api/sales', authenticate, async (req, res) => {
  try {
    const filter = {};
    
    // Build filter from query parameters
    if (req.query.branchId && req.query.branchId !== 'undefined' && req.query.branchId.trim() !== '') {
      filter.branchId = req.query.branchId;
    }
    
    if (req.query.categoryId && req.query.categoryId !== 'undefined' && req.query.categoryId.trim() !== '') {
      filter.categoryId = req.query.categoryId;
    }
    
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        filter.date.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        filter.date.$lte = new Date(req.query.to);
      }
    }
    
    // If user is not admin, filter by user's assigned branches
    if (!req.user.groupId.permissions.includes('admin')) {
      filter.branchId = { $in: req.user.branches };
    }
    
    const sales = await Sale.find(filter)
      .sort({ date: -1 })
      .populate('branchId', 'name')
      .populate('categoryId', 'name');
    
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create New Sale
app.post('/api/sales', authenticate, checkDatabaseConnection, async (req, res) => {
  try {
    // Copy request data
    const data = { ...req.body };

    // If category string missing, fetch from Category model
    if (!data.category && data.categoryId) {
      try {
        const cat = await Category.findById(data.categoryId);
        data.category = cat ? cat.name : 'Unknown';
      } catch (err) {
        // Category not found, using 'Unknown'
        data.category = 'Unknown';
      }
    }

    // Check if user has access to this branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin') && data.branchId) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const saleBranchId = data.branchId._id ? data.branchId._id.toString() : data.branchId.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(saleBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    // Create sale using fixed data
    const sale = await Sale.create(data);

    // Populate branch & category references before sending response
    const populatedSale = await Sale.findById(sale._id)
      .populate('branchId', 'name')
      .populate('categoryId', 'name');

    res.status(201).json(populatedSale);
  } catch (error) {
    console.error('Error creating sale:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update Sale
app.put('/api/sales/:id', authenticate, hasPermission('sales-edit'), checkDatabaseConnection, async (req, res) => {
  try {
    // Check if user has access to this branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin') && req.body.branchId) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const updateBranchId = req.body.branchId._id ? req.body.branchId._id.toString() : req.body.branchId.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(updateBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    const updated = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('branchId', 'name')
      .populate('categoryId', 'name');
    
    if (!updated) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating sale:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete Sale
app.delete('/api/sales/:id', authenticate, hasPermission('sales-delete'), checkDatabaseConnection, async (req, res) => {
  try {
    // Check if user has access to this sale's branch
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    // Check if user has access to this sale's branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin')) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const saleBranchId = sale.branchId?._id ? sale.branchId._id.toString() : sale.branchId?.toString() || sale.branchId;
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(saleBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    const deleted = await Sale.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting sale:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// DEPARTMENT SALES API ROUTES
// ========================================

// Get All Department Sales
app.get('/api/department-sales', authenticate, async (req, res) => {
  try {
    console.log('✅ GET /api/department-sales - Query:', req.query);
    const filter = {};
    
    // If user is not admin, filter by user's assigned branches
    let userAllowedBranches = null;
    if (!req.user.groupId.permissions.includes('admin')) {
      userAllowedBranches = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      console.log('🔒 Non-admin user, allowed branches:', userAllowedBranches);
    }
    
    // Build filter from query parameters
    if (req.query.branchId && req.query.branchId !== 'undefined' && req.query.branchId.trim() !== '') {
      // If user is not admin, validate that the requested branch is in their allowed branches
      if (userAllowedBranches && !userAllowedBranches.includes(req.query.branchId)) {
        console.log('❌ User requested branch not in allowed branches');
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
      filter.branchId = req.query.branchId;
    } else if (userAllowedBranches) {
      // If no branchId provided but user is not admin, filter by user's assigned branches
      filter.branchId = { $in: req.user.branches };
    }
    
    if (req.query.departmentId && req.query.departmentId !== 'undefined' && req.query.departmentId.trim() !== '') {
      filter.departmentId = req.query.departmentId;
    }
    
    if (req.query.subDepartmentId && req.query.subDepartmentId !== 'undefined' && req.query.subDepartmentId.trim() !== '') {
      filter.subDepartmentId = req.query.subDepartmentId;
    }
    
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        filter.date.$gte = new Date(req.query.from);
        console.log('📅 Date filter from:', req.query.from, '->', filter.date.$gte);
      }
      if (req.query.to) {
        filter.date.$lte = new Date(req.query.to);
        console.log('📅 Date filter to:', req.query.to, '->', filter.date.$lte);
      }
    }
    
    console.log('🔍 Final filter:', JSON.stringify(filter, null, 2));
    
    const departmentSales = await DepartmentSale.find(filter)
      .populate('branchId', 'name')
      .populate({
        path: 'departmentId',
        select: 'name sequence',
        model: 'Department'
      })
      .populate({
        path: 'subDepartmentId',
        select: 'name sequence',
        model: 'SubDepartment'
      });
    
    // Sort by department sequence, then sub-department sequence, then date
    departmentSales.sort((a, b) => {
      const deptSeqA = a.departmentId?.sequence ?? 0;
      const deptSeqB = b.departmentId?.sequence ?? 0;
      if (deptSeqA !== deptSeqB) {
        return deptSeqA - deptSeqB;
      }
      const subDeptSeqA = a.subDepartmentId?.sequence ?? 0;
      const subDeptSeqB = b.subDepartmentId?.sequence ?? 0;
      if (subDeptSeqA !== subDeptSeqB) {
        return subDeptSeqA - subDeptSeqB;
      }
      return new Date(b.date) - new Date(a.date);
    });
    
    console.log(`✅ Found ${departmentSales.length} department sales`);
    res.json(departmentSales);
  } catch (error) {
    console.error('❌ Error fetching department sales:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create New Department Sale
app.post('/api/department-sales', authenticate, checkDatabaseConnection, async (req, res) => {
  try {
    console.log('📝 POST /api/department-sales - Request received');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    // Copy request data
    const data = { ...req.body };

    // Check if user has access to this branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin') && data.branchId) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const saleBranchId = data.branchId._id ? data.branchId._id.toString() : data.branchId.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(saleBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    // Validate required fields
    if (!data.branchId || !data.departmentId || !data.subDepartmentId || !data.date) {
      return res.status(400).json({ error: 'Missing required fields: branchId, departmentId, subDepartmentId, and date are required.' });
    }

    if (!data.grossSale || data.grossSale <= 0) {
      return res.status(400).json({ error: 'Gross Sale must be greater than 0.' });
    }

    // Create department sale
    const departmentSale = await DepartmentSale.create(data);

    // Populate references before sending response
    const populatedSale = await DepartmentSale.findById(departmentSale._id)
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .populate('subDepartmentId', 'name');

    res.status(201).json(populatedSale);
  } catch (error) {
    console.error('Error creating department sale:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get Single Department Sale
app.get('/api/department-sales/:id', authenticate, async (req, res) => {
  try {
    const departmentSale = await DepartmentSale.findById(req.params.id)
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .populate('subDepartmentId', 'name');
    
    if (!departmentSale) {
      return res.status(404).json({ error: 'Department sale not found' });
    }
    
    // Check if user has access to this sale's branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin')) {
      const saleBranchId = departmentSale.branchId?._id ? departmentSale.branchId._id.toString() : departmentSale.branchId?.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(saleBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }
    
    res.json(departmentSale);
  } catch (error) {
    console.error('Error fetching department sale:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update Department Sale
app.put('/api/department-sales/:id', authenticate, hasPermission('sales-edit'), checkDatabaseConnection, async (req, res) => {
  try {
    // Check if user has access to this branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin') && req.body.branchId) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const updateBranchId = req.body.branchId._id ? req.body.branchId._id.toString() : req.body.branchId.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(updateBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    const updated = await DepartmentSale.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .populate('subDepartmentId', 'name');
    
    if (!updated) {
      return res.status(404).json({ error: 'Department sale not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating department sale:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete Department Sale
app.delete('/api/department-sales/:id', authenticate, hasPermission('sales-delete'), checkDatabaseConnection, async (req, res) => {
  try {
    // Check if user has access to this sale's branch
    const departmentSale = await DepartmentSale.findById(req.params.id);
    if (!departmentSale) {
      return res.status(404).json({ error: 'Department sale not found' });
    }
    
    // Check if user has access to this sale's branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin')) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const saleBranchId = departmentSale.branchId?._id ? departmentSale.branchId._id.toString() : departmentSale.branchId?.toString() || departmentSale.branchId;
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(saleBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    const deleted = await DepartmentSale.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting department sale:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// PAYMENTS API ROUTES
// ========================================

// Get All Payments (Supplier Vouchers) - Requires payment-voucher-list permission
app.get('/api/payments', authenticate, hasPermission('payment-voucher-list'), async (req, res) => {
  try {
    const filter = {};
    
    // Build filter from query parameters
    if (req.query.branchId && req.query.branchId !== 'undefined' && req.query.branchId.trim() !== '') {
      filter.branchId = req.query.branchId;
    }
    
    if (req.query.supplierId && req.query.supplierId !== 'undefined' && req.query.supplierId.trim() !== '') {
      filter.supplierId = req.query.supplierId;
    }
    
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        filter.date.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        filter.date.$lte = new Date(req.query.to);
      }
    }
    
    // If user is not admin, filter by user's assigned branches
    if (!req.user.groupId.permissions.includes('admin')) {
      filter.branchId = { $in: req.user.branches };
    }
    
    const payments = await Payment.find(filter)
      .sort({ date: -1 })
      .populate('branchId', 'name')
      .populate('supplierId', 'name');
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// SPECIFIC PAYMENT ROUTES (must come before parameterized routes)
// ========================================

// Get Next Voucher Number - MUST be defined BEFORE /api/payments/:id route
app.get('/api/payments/next-voucher-number', authenticate, async (req, res) => {
  // ALWAYS set Content-Type to JSON FIRST
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('✅ GET /api/payments/next-voucher-number called');
    
    // Logic to generate next voucher number
    const prefix = 'PV';
    const lastPayment = await Payment.findOne().sort({ voucherNumber: -1 });
    
    let nextNumber = 1001;
    if (lastPayment && lastPayment.voucherNumber) {
      const lastNum = parseInt(lastPayment.voucherNumber.replace(prefix, '')) || 1000;
      nextNumber = lastNum + 1;
    }
    
    const nextVoucherNumber = `${prefix}${nextNumber}`;
    res.status(200).json({ voucherNumber: nextVoucherNumber });
  } catch (error) {
    console.error('Error generating next voucher number:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Failed to generate next voucher number', message: error.message });
  }
});

// Create New Payment (Supplier Vouchers ONLY)
app.post('/api/payments', authenticate, checkDatabaseConnection, async (req, res) => {
  // ALWAYS set Content-Type to JSON FIRST
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('✅ POST /api/payments called (Supplier voucher)');
    
    // Copy request data
    const data = { ...req.body };

    // Reject if it has categoryId - category vouchers should use /api/category-payments
    if (data.categoryId || data.voucherType === 'category') {
      return res.status(400).json({ error: 'Category vouchers must use /api/category-payments endpoint' });
    }

    // Generate voucher number if not provided
    if (!data.voucherNumber) {
      const prefix = 'PV';
      const lastPayment = await Payment.findOne().sort({ voucherNumber: -1 });
      let nextNumber = 1001;
      if (lastPayment && lastPayment.voucherNumber) {
        const lastNum = parseInt(lastPayment.voucherNumber.replace(prefix, '')) || 1000;
        nextNumber = lastNum + 1;
      }
      data.voucherNumber = `${prefix}${nextNumber}`;
    }

    // If supplier string missing, fetch from Supplier model
    if (!data.supplier && data.supplierId) {
      try {
        const supplier = await Supplier.findById(data.supplierId);
        data.supplier = supplier ? supplier.name : 'Unknown';
      } catch (err) {
        // Supplier not found, using 'Unknown'
        data.supplier = 'Unknown';
      }
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = 'Pending';
    }

    // Check if user has access to this branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin') && data.branchId) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const paymentBranchId = data.branchId._id ? data.branchId._id.toString() : data.branchId.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(paymentBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    // Create payment using fixed data
    const payment = await Payment.create(data);

    // Populate branch & supplier references before sending response
    const populatedPayment = await Payment.findById(payment._id)
      .populate('branchId', 'name')
      .populate('supplierId', 'name');

    console.log('✅ Supplier payment created:', populatedPayment.voucherNumber);
    res.status(201).json(populatedPayment);
  } catch (error) {
    console.error('❌ Error creating supplier payment:', error.message);
    // ALWAYS return JSON even on error
    res.status(400).json({ 
      error: 'Bad Request',
      details: error.message 
    });
  }
});

// ========================================
// GENERAL PAYMENT ROUTES (parameterized routes come after specific routes)
// ========================================

// Get Single Payment by ID - This route comes AFTER specific routes like /next-voucher-number
// NOTE: Express matches routes in order, so /next-voucher-number must come before this
app.get('/api/payments/:id', authenticate, checkDatabaseConnection, async (req, res) => {
  // ALWAYS set Content-Type to JSON FIRST
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // CRITICAL: Validate ObjectId BEFORE database query to prevent CastError
    // This prevents routes like /next-voucher-number from being treated as IDs
    // Also reject known non-ID paths explicitly
    if (req.params.id === 'next-voucher-number') {
      console.error(`❌ Route mismatch detected: /payments/:id matched "next-voucher-number". This should not happen!`);
      return res.status(404).json({ 
        error: 'Endpoint not found',
        message: 'The requested endpoint was not found. Please ensure the route is correctly defined.'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`⚠️ Invalid Payment ID format attempted: "${req.params.id}"`);
      return res.status(400).json({ 
        error: 'Invalid Payment ID format',
        message: `The provided ID "${req.params.id}" is not a valid MongoDB ObjectId format.`,
        providedId: req.params.id
      });
    }
    
    // Ensure Content-Type is JSON
    res.setHeader('Content-Type', 'application/json');
    
    const payment = await Payment.findById(req.params.id)
      .populate('branchId', 'name')
      .populate('supplierId', 'name');
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Check permissions: user needs payment-edit OR payment-voucher-list OR reports permission to view/edit
    // Reports permission grants access to view payment data for reporting purposes
    const hasPaymentPermission = req.user.groupId.permissions.includes('payment-edit') || 
                                  req.user.groupId.permissions.includes('payment-voucher-list') ||
                                  req.user.groupId.permissions.includes('reports') ||
                                  req.user.groupId.permissions.includes('admin');
    
    if (!hasPaymentPermission) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to access supplier vouchers.' });
    }
    
    // Check if user has access to this payment's branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin')) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const paymentBranchId = payment.branchId?._id ? payment.branchId._id.toString() : payment.branchId?.toString() || payment.branchId;
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(paymentBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment by ID:', error);
    res.setHeader('Content-Type', 'application/json');
    
    // Handle cases where req.params.id is not a valid ObjectId format
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid Payment ID format',
        message: `The provided ID "${req.params.id}" is not a valid MongoDB ObjectId format.`,
        providedId: req.params.id
      });
    }
    
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Update Payment
app.put('/api/payments/:id', authenticate, hasPermission('payment-edit'), checkDatabaseConnection, async (req, res) => {
  // ALWAYS set Content-Type to JSON FIRST (checkDatabaseConnection already sets it, but being explicit)
  res.setHeader('Content-Type', 'application/json');
  
  try {
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Payment ID format' });
    }
    
    // Check if user has access to this branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin') && req.body.branchId) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const updateBranchId = req.body.branchId._id ? req.body.branchId._id.toString() : req.body.branchId.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(updateBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    // If supplier string missing, fetch from Supplier model
    if (!req.body.supplier && req.body.supplierId) {
      try {
        const supplier = await Supplier.findById(req.body.supplierId);
        req.body.supplier = supplier ? supplier.name : 'Unknown';
      } catch (err) {
        req.body.supplier = 'Unknown';
      }
    }

    const updated = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('branchId', 'name')
      .populate('supplierId', 'name');
    
    if (!updated) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.setHeader('Content-Type', 'application/json');
    
    // Handle cases where req.params.id is not a valid ObjectId format
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid Payment ID format',
        message: `The provided ID "${req.params.id}" is not a valid MongoDB ObjectId format.`
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Delete Payment
app.delete('/api/payments/:id', authenticate, hasPermission('payment-delete'), checkDatabaseConnection, async (req, res) => {
  // ALWAYS set Content-Type to JSON FIRST (checkDatabaseConnection already sets it, but being explicit)
  res.setHeader('Content-Type', 'application/json');
  
  try {
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Payment ID format' });
    }
    // Check if user has access to this payment's branch
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Check branch access (only if not admin)
    if (!req.user.groupId.permissions.includes('admin')) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const paymentBranchId = payment.branchId?._id ? payment.branchId._id.toString() : payment.branchId?.toString() || payment.branchId;
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(paymentBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    const deleted = await Payment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.setHeader('Content-Type', 'application/json');
    
    // Handle cases where req.params.id is not a valid ObjectId format
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid Payment ID format',
        message: `The provided ID "${req.params.id}" is not a valid MongoDB ObjectId format.`
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// CATEGORY PAYMENTS API ROUTES (SEPARATE FROM SUPPLIER PAYMENTS)
// MUST BE BEFORE THE CATCH-ALL ROUTE
// ========================================

// TEST ENDPOINT - NO AUTH - TO VERIFY ROUTING WORKS
app.get('/api/test-category-payments', (req, res) => {
  console.log('✅ TEST ENDPOINT HIT: /api/test-category-payments');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    success: true, 
    message: 'Category payments API is accessible',
    timestamp: new Date().toISOString()
  });
});

// Get Next Category Voucher Number - MUST be before /api/category-payments/:id
app.get('/api/category-payments/next-voucher-number', authenticate, hasPermission('category-voucher'), async (req, res) => {
  // CRITICAL: Set headers FIRST before anything else
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  try {
    console.log('✅ GET /api/category-payments/next-voucher-number called');
    
    // Verify CategoryPayment model exists
    if (!CategoryPayment) {
      throw new Error('CategoryPayment model not defined');
    }
    
    const prefix = 'PV';
    const lastPayment = await CategoryPayment.findOne().sort({ voucherNumber: -1 });
    
    let nextNumber = 1001;
    if (lastPayment && lastPayment.voucherNumber) {
      const lastNum = parseInt(lastPayment.voucherNumber.replace(prefix, '')) || 1000;
      nextNumber = lastNum + 1;
    }
    
    const nextVoucherNumber = `${prefix}${nextNumber}`;
    console.log('✅ Generated next category voucher number:', nextVoucherNumber);
    res.status(200).json({ voucherNumber: nextVoucherNumber });
  } catch (error) {
    console.error('❌ Error generating next category voucher number:', error);
    console.error('❌ Error stack:', error.stack);
    // ALWAYS return JSON even on error - don't let Express default to HTML
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate next voucher number',
        details: error.message
      });
    }
  }
});

// Get All Category Payments
app.get('/api/category-payments', authenticate, hasPermission('category-voucher-list'), async (req, res) => {
  // CRITICAL: Set headers FIRST before anything else - MUST BE FIRST LINE
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  try {
    console.log('🎯 ========== CATEGORY PAYMENTS ROUTE HIT ==========');
    console.log('✅ GET /api/category-payments called');
    console.log('✅ Method:', req.method);
    console.log('✅ Path:', req.path);
    console.log('✅ Query:', JSON.stringify(req.query));
    console.log('✅ User authenticated:', req.user ? req.user.username : 'NO USER');
    
    // Verify CategoryPayment model exists
    if (!CategoryPayment) {
      throw new Error('CategoryPayment model not defined');
    }
    
    const filter = {};
    
    // Build filter from query parameters
    if (req.query.branchId && req.query.branchId !== 'undefined' && req.query.branchId.trim() !== '') {
      filter.branchId = req.query.branchId;
    }
    
    if (req.query.categoryId && req.query.categoryId !== 'undefined' && req.query.categoryId.trim() !== '') {
      filter.categoryId = req.query.categoryId;
    }
    
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        filter.date.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        filter.date.$lte = new Date(req.query.to);
      }
    }
    
    // If user is not admin, filter by user's assigned branches
    if (!req.user.groupId.permissions.includes('admin')) {
      filter.branchId = { $in: req.user.branches };
    }
    
    console.log('✅ Filter:', JSON.stringify(filter));
    
    const categoryPayments = await CategoryPayment.find(filter)
      .sort({ date: -1 })
      .populate('branchId', 'name')
      .populate('categoryId', 'name');
    
    console.log(`✅ Found ${categoryPayments.length} category payments`);
    res.status(200).json(categoryPayments);
  } catch (error) {
    console.error('❌ Error fetching category payments:', error);
    console.error('❌ Error stack:', error.stack);
    // ALWAYS return JSON even on error - don't let Express default to HTML
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Create New Category Payment
app.post('/api/category-payments', authenticate, hasPermission('category-voucher'), checkDatabaseConnection, async (req, res) => {
  // CRITICAL: Set headers FIRST before anything else
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  try {
    console.log('✅ POST /api/category-payments called (Category voucher)');
    console.log('✅ Request data:', JSON.stringify(req.body));
    
    // Verify CategoryPayment model exists
    if (!CategoryPayment) {
      throw new Error('CategoryPayment model not defined');
    }
    
    const data = { ...req.body };

    // Generate voucher number if not provided
    if (!data.voucherNumber) {
      const prefix = 'PV';
      const lastPayment = await CategoryPayment.findOne().sort({ voucherNumber: -1 });
      let nextNumber = 1001;
      if (lastPayment && lastPayment.voucherNumber) {
        const lastNum = parseInt(lastPayment.voucherNumber.replace(prefix, '')) || 1000;
        nextNumber = lastNum + 1;
      }
      data.voucherNumber = `${prefix}${nextNumber}`;
    }

    // If category string missing, fetch from Category model
    if (!data.category && data.categoryId) {
      try {
        const category = await Category.findById(data.categoryId);
        data.category = category ? category.name : 'Unknown';
      } catch (err) {
        data.category = 'Unknown';
      }
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = 'Pending';
    }

    // Check if user has access to this branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin') && data.branchId) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const paymentBranchId = data.branchId._id ? data.branchId._id.toString() : data.branchId.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(paymentBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    // Create category payment
    const categoryPayment = await CategoryPayment.create(data);

    // Populate branch & category references before sending response
    const populatedPayment = await CategoryPayment.findById(categoryPayment._id)
      .populate('branchId', 'name')
      .populate('categoryId', 'name');

    console.log('✅ Category payment created:', populatedPayment.voucherNumber);
    res.status(201).json(populatedPayment);
  } catch (error) {
    console.error('❌ Error creating category payment:', error);
    console.error('❌ Error stack:', error.stack);
    // ALWAYS return JSON even on error - don't let Express default to HTML
    if (!res.headersSent) {
      res.status(400).json({ 
        error: 'Bad Request',
        details: error.message 
      });
    }
  }
});

// Get Single Category Payment by ID
app.get('/api/category-payments/:id', authenticate, checkDatabaseConnection, async (req, res) => {
  // ALWAYS set Content-Type to JSON FIRST
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Category Payment ID format' });
    }
    
    const categoryPayment = await CategoryPayment.findById(req.params.id)
      .populate('branchId', 'name')
      .populate('categoryId', 'name');
    
    if (!categoryPayment) {
      return res.status(404).json({ error: 'Category payment not found' });
    }
    
    // Check permissions: user needs category-voucher-edit OR category-voucher-list OR reports permission to view/edit
    // Reports permission grants access to view category payment data for reporting purposes
    const hasCategoryPermission = req.user.groupId.permissions.includes('category-voucher-edit') || 
                                   req.user.groupId.permissions.includes('category-voucher-list') ||
                                   req.user.groupId.permissions.includes('reports') ||
                                   req.user.groupId.permissions.includes('admin');
    
    if (!hasCategoryPermission) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to access category vouchers.' });
    }
    
    // Check if user has access to this payment's branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin')) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const paymentBranchId = categoryPayment.branchId?._id ? categoryPayment.branchId._id.toString() : categoryPayment.branchId?.toString() || categoryPayment.branchId;
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(paymentBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }
    
    res.status(200).json(categoryPayment);
  } catch (error) {
    console.error('Error fetching category payment by ID:', error);
    // ALWAYS return JSON even on error
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid Category Payment ID format' });
    }
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message 
    });
  }
});

// Update Category Payment
app.put('/api/category-payments/:id', authenticate, hasPermission('category-voucher-edit'), checkDatabaseConnection, async (req, res) => {
  // ALWAYS set Content-Type to JSON FIRST
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Category Payment ID format' });
    }
    
    // Check if user has access to this branch (only if not admin)
    if (!req.user.groupId.permissions.includes('admin') && req.body.branchId) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const updateBranchId = req.body.branchId._id ? req.body.branchId._id.toString() : req.body.branchId.toString();
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(updateBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    // If category string missing, fetch from Category model
    if (!req.body.category && req.body.categoryId) {
      try {
        const category = await Category.findById(req.body.categoryId);
        req.body.category = category ? category.name : 'Unknown';
      } catch (err) {
        req.body.category = 'Unknown';
      }
    }

    const updated = await CategoryPayment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('branchId', 'name')
      .populate('categoryId', 'name');
    
    if (!updated) {
      return res.status(404).json({ error: 'Category payment not found' });
    }
    
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating category payment:', error);
    // ALWAYS return JSON even on error
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid Category Payment ID format' });
    }
    
    res.status(400).json({ 
      error: 'Bad Request',
      details: error.message 
    });
  }
});

// Delete Category Payment
app.delete('/api/category-payments/:id', authenticate, hasPermission('category-voucher-delete'), checkDatabaseConnection, async (req, res) => {
  // ALWAYS set Content-Type to JSON FIRST
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Category Payment ID format' });
    }
    
    // Check if user has access to this payment's branch
    const categoryPayment = await CategoryPayment.findById(req.params.id);
    if (!categoryPayment) {
      return res.status(404).json({ error: 'Category payment not found' });
    }
    
    // Check branch access (only if not admin)
    if (!req.user.groupId.permissions.includes('admin')) {
      // Convert branchId to string for comparison (handle both ObjectId and populated object)
      const paymentBranchId = categoryPayment.branchId?._id ? categoryPayment.branchId._id.toString() : categoryPayment.branchId?.toString() || categoryPayment.branchId;
      const userBranchIds = req.user.branches.map(b => b._id ? b._id.toString() : b.toString());
      
      if (!userBranchIds.includes(paymentBranchId)) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this branch.' });
      }
    }

    await CategoryPayment.findByIdAndDelete(req.params.id);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error deleting category payment:', error);
    // ALWAYS return JSON even on error
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid Category Payment ID format' });
    }
    
    res.status(400).json({ 
      error: 'Bad Request',
      details: error.message 
    });
  }
});

// ========================================
// ADMIN UTILITY ROUTES
// ========================================

// Admin Delete Action
app.post('/api/admin/delete', checkDatabaseConnection, async (req, res) => {
  try {
    const { resource, id, password } = req.body || {};
    const expected = String(process.env.ADMIN_PASSWORD || '');
    const provided = String(password || '');
    
    if (!expected) {
      return res.status(500).json({ error: 'Admin password not configured on server' });
    }
    
    if (provided.trim() !== expected.trim()) {
      console.warn('Admin delete auth failed');
      return res.status(403).json({ error: 'Invalid admin password' });
    }

    if (!resource || !id) {
      return res.status(400).json({ error: 'resource and id are required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    let deleted = null;
    if (resource === 'sales') {
      deleted = await Sale.findByIdAndDelete(id);
    } else if (resource === 'payments') {
      deleted = await Payment.findByIdAndDelete(id);
    } else if (resource === 'branches') {
      deleted = await Branch.findByIdAndDelete(id);
      await Sale.deleteMany({ branchId: id });
      await Payment.deleteMany({ branchId: id });
      await User.updateMany(
        { branches: id },
        { $pull: { branches: id } }
      );
    } else if (resource === 'categories') {
      deleted = await Category.findByIdAndDelete(id);
    } else if (resource === 'groups') {
      deleted = await Group.findByIdAndDelete(id);
      await User.updateMany(
        { groupId: id },
        { $unset: { groupId: 1 } }
      );
    } else if (resource === 'users') {
      deleted = await User.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ error: 'Unknown resource type' });
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    return res.json({ ok: true });
  } catch (error) {
    console.error('Admin delete error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Admin Update Action
app.post('/api/admin/update', checkDatabaseConnection, async (req, res) => {
  try {
    const { resource, id, payload, password } = req.body || {};
    const expected = String(process.env.ADMIN_PASSWORD || '');
    const provided = String(password || '');
    
    if (!expected) {
      console.error('Admin password not configured on server');
      return res.status(500).json({ error: 'Admin password not configured on server' });
    }
    
    if (provided.trim() !== expected.trim()) {
      console.warn('Admin auth failed (update)');
      return res.status(403).json({ error: 'Invalid admin password' });
    }

    if (!resource || !id || !payload) {
      return res.status(400).json({ error: 'resource, id and payload are required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    let updated = null;
    if (resource === 'sales') {
      updated = await Sale.findByIdAndUpdate(id, payload, { new: true })
        .populate('branchId', 'name')
        .populate('categoryId', 'name');
    } else if (resource === 'payments') {
      updated = await Payment.findByIdAndUpdate(id, payload, { new: true })
        .populate('branchId', 'name')
        .populate('supplierId', 'name');
    } else if (resource === 'branches') {
      updated = await Branch.findByIdAndUpdate(id, payload, { new: true });
    } else if (resource === 'categories') {
      updated = await Category.findByIdAndUpdate(id, payload, { new: true });
    } else if (resource === 'groups') {
      updated = await Group.findByIdAndUpdate(id, payload, { new: true });
    } else if (resource === 'users') {
      // Hash password if provided
      if (payload.password) {
        const salt = await bcrypt.genSalt(10);
        payload.password = await bcrypt.hash(payload.password, salt);
      }
      updated = await User.findByIdAndUpdate(id, payload, { new: true })
        .populate('groupId', 'name permissions');
    } else {
      return res.status(400).json({ error: 'Unknown resource type' });
    }

    if (!updated) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    return res.json(updated);
  } catch (error) {
    console.error('Admin update error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// API KEY MANAGEMENT ROUTES (Admin Only)
// ========================================

// Get All API Keys
app.get('/api/api-keys', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const apiKeys = await ApiKey.find()
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .select('-apiSecret'); // Don't return the secret hash
    
    res.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create New API Key
app.post('/api/api-keys', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, expiresAt } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }
    
    // Generate unique API key and secret
    const apiKey = `dw_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const apiSecret = `${Math.random().toString(36).substring(2, 15)}${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
    
    // Hash the secret before storing
    const salt = await bcrypt.genSalt(10);
    const hashedSecret = await bcrypt.hash(apiSecret, salt);
    
    // Create API key record
    const apiKeyRecord = await ApiKey.create({
      name: name.trim(),
      description: description || '',
      apiKey: apiKey,
      apiSecret: hashedSecret,
      isActive: true,
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    // Return the API key and secret (only shown once!)
    res.status(201).json({
      id: apiKeyRecord._id,
      name: apiKeyRecord.name,
      description: apiKeyRecord.description,
      apiKey: apiKey, // Return the plain text key (only time it will be shown)
      apiSecret: apiSecret, // Return the plain text secret (only time it will be shown)
      isActive: apiKeyRecord.isActive,
      expiresAt: apiKeyRecord.expiresAt,
      createdAt: apiKeyRecord.createdAt,
      warning: '⚠️ Save these credentials now! The API secret will not be shown again.'
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update API Key (toggle active status, update name/description)
app.put('/api/api-keys/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    const { name, description, isActive, expiresAt } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid API key ID format' });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    
    const updated = await ApiKey.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'username fullName').select('-apiSecret');
    
    if (!updated) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete API Key
app.delete('/api/api-keys/:id', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid API key ID format' });
    }
    
    const deleted = await ApiKey.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ ok: true, message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get API Key Usage Stats
app.get('/api/api-keys/:id/stats', authenticate, isAdmin, checkDatabaseConnection, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid API key ID format' });
    }
    
    const apiKey = await ApiKey.findById(req.params.id).select('-apiSecret');
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({
      id: apiKey._id,
      name: apiKey.name,
      usageCount: apiKey.usageCount || 0,
      lastUsed: apiKey.lastUsed,
      createdAt: apiKey.createdAt,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt
    });
  } catch (error) {
    console.error('Error fetching API key stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// PUBLIC API ENDPOINTS (API Key Authentication)
// ========================================

// Get All Sales (Public API with API Key)
app.get('/api/public/sales', authenticateApiKey, checkDatabaseConnection, async (req, res) => {
  try {
    const filter = {};
    
    // Build filter from query parameters
    if (req.query.branchId && req.query.branchId !== 'undefined' && req.query.branchId.trim() !== '') {
      filter.branchId = req.query.branchId;
    }
    
    if (req.query.categoryId && req.query.categoryId !== 'undefined' && req.query.categoryId.trim() !== '') {
      filter.categoryId = req.query.categoryId;
    }
    
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        filter.date.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        filter.date.$lte = new Date(req.query.to);
      }
    }
    
    const sales = await Sale.find(filter)
      .sort({ date: -1 })
      .populate('branchId', 'name')
      .populate('categoryId', 'name');
    
    res.json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching sales (public API):', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get All Payments (Public API with API Key)
app.get('/api/public/payments', authenticateApiKey, checkDatabaseConnection, async (req, res) => {
  try {
    const filter = {};
    
    // Build filter from query parameters
    if (req.query.branchId && req.query.branchId !== 'undefined' && req.query.branchId.trim() !== '') {
      filter.branchId = req.query.branchId;
    }
    
    if (req.query.supplierId && req.query.supplierId !== 'undefined' && req.query.supplierId.trim() !== '') {
      filter.supplierId = req.query.supplierId;
    }
    
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        filter.date.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        filter.date.$lte = new Date(req.query.to);
      }
    }
    
    const payments = await Payment.find(filter)
      .sort({ date: -1 })
      .populate('branchId', 'name')
      .populate('supplierId', 'name');
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments (public API):', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get All Category Payments (Public API with API Key)
app.get('/api/public/category-payments', authenticateApiKey, checkDatabaseConnection, async (req, res) => {
  try {
    const filter = {};
    
    // Build filter from query parameters
    if (req.query.branchId && req.query.branchId !== 'undefined' && req.query.branchId.trim() !== '') {
      filter.branchId = req.query.branchId;
    }
    
    if (req.query.categoryId && req.query.categoryId !== 'undefined' && req.query.categoryId.trim() !== '') {
      filter.categoryId = req.query.categoryId;
    }
    
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        filter.date.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        filter.date.$lte = new Date(req.query.to);
      }
    }
    
    const categoryPayments = await CategoryPayment.find(filter)
      .sort({ date: -1 })
      .populate('branchId', 'name')
      .populate('categoryId', 'name');
    
    res.json({
      success: true,
      count: categoryPayments.length,
      data: categoryPayments
    });
  } catch (error) {
    console.error('Error fetching category payments (public API):', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get All Branches (Public API with API Key)
app.get('/api/public/branches', authenticateApiKey, checkDatabaseConnection, async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (error) {
    console.error('Error fetching branches (public API):', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get All Categories (Public API with API Key)
app.get('/api/public/categories', authenticateApiKey, checkDatabaseConnection, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories (public API):', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get All Suppliers (Public API with API Key)
app.get('/api/public/suppliers', authenticateApiKey, checkDatabaseConnection, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers (public API):', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get Dashboard Summary (Public API with API Key)
app.get('/api/public/dashboard', authenticateApiKey, checkDatabaseConnection, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Build date filter if provided
    const dateFilter = {};
    if (req.query.from || req.query.to) {
      dateFilter.date = {};
      if (req.query.from) dateFilter.date.$gte = new Date(req.query.from);
      if (req.query.to) dateFilter.date.$lte = new Date(req.query.to);
    }
    
    // Get sales totals
    const allSales = await Sale.find(dateFilter);
    const totalSales = allSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalProfit = allSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    
    // Get monthly sales
    const monthlySales = await Sale.find({ 
      ...dateFilter,
      date: { $gte: startOfMonth }
    });
    const monthlyTotal = monthlySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    // Get payment totals
    const allPayments = await Payment.find(dateFilter);
    const totalPayments = allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Get category payment totals
    const allCategoryPayments = await CategoryPayment.find(dateFilter);
    const totalCategoryPayments = allCategoryPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Get counts
    const branchCount = await Branch.countDocuments();
    const categoryCount = await Category.countDocuments();
    const supplierCount = await Supplier.countDocuments();
    
    res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalProfit,
          monthlySales: monthlyTotal,
          totalPayments,
          totalCategoryPayments,
          netAmount: totalSales - totalPayments - totalCategoryPayments
        },
        counts: {
          branches: branchCount,
          categories: categoryCount,
          suppliers: supplierCount,
          sales: allSales.length,
          payments: allPayments.length,
          categoryPayments: allCategoryPayments.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard (public API):', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// DATABASE SEEDING FUNCTION
// ========================================

// Seed default data - Creates initial data for the system
async function seedDefaultData() {
  
  try {
    // Seed branches
    const branchCount = await Branch.estimatedDocumentCount();
    
    if (branchCount === 0) {
      const defaultBranches = [
        { name: 'D WATSON PWD', address: '' },
        { name: 'D WATSON F6', address: '' },
        { name: 'D WATSON GUJJAR KHAN', address: '' },
        { name: 'D WATSON CHANDNI CHOWK', address: '' },
        { name: 'D WATSON ATTOCK', address: '' },
        { name: 'D WATSON GHORI TOWN', address: '' },
        { name: 'D WATSON G 15', address: '' }
      ];
      await Branch.insertMany(defaultBranches);
    } else {
    }

    // Seed categories
    const categoryCount = await Category.estimatedDocumentCount();
    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'MEDICINE NEUTRA', description: 'Neutral medicine category', color: 'primary' },
        { name: 'MEDICINE AIMS', description: 'AIMS medicine category', color: 'success' },
        { name: 'COSTMAIES', description: 'Costmaies category', color: 'info' }
      ];
      await Category.insertMany(defaultCategories);
    }
    
    // Seed groups - FIXED to ensure admin permissions are set correctly
    const groupCount = await Group.estimatedDocumentCount();
    if (groupCount === 0) {
      const defaultGroups = [
        {
          name: 'Admin',
          description: 'System administrators with full access',
          permissions: ['admin', 'dashboard', 'categories', 'departments', 'sales', 'payments', 'payment-dashboard', 'payment-vouchers', 'payment-voucher-list', 'payment-reports', 'category-voucher', 'category-voucher-list', 'category-voucher-edit', 'category-voucher-delete', 'reports', 'branches', 'groups', 'users', 'settings', 'suppliers', 'employees', 'employee-list'],
          isDefault: true
        },
        {
          name: 'Sales',
          description: 'Sales staff with access to sales entry and reports',
          permissions: ['dashboard', 'sales', 'reports', 'suppliers'],
          isDefault: true
        },
        {
          name: 'Manager',
          description: 'Branch managers with access to dashboard and reports only',
          permissions: ['dashboard', 'reports'],
          isDefault: true
        }
      ];
      await Group.insertMany(defaultGroups);
    } else {
      
      // Check if admin group exists and has correct permissions
      const adminGroup = await Group.findOne({ name: 'Admin' });
      if (adminGroup) {
        let needsUpdate = false;
        const requiredPermissions = ['admin', 'dashboard', 'categories', 'departments', 'sales', 'payments', 'payment-dashboard', 'payment-vouchers', 'payment-voucher-list', 'payment-reports', 'sales-edit', 'sales-delete', 'payment-edit', 'payment-delete', 'category-voucher', 'category-voucher-list', 'category-voucher-edit', 'category-voucher-delete', 'reports', 'branches', 'groups', 'users', 'settings', 'suppliers'];
        
        requiredPermissions.forEach(perm => {
          if (!adminGroup.permissions.includes(perm)) {
            adminGroup.permissions.push(perm);
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          await adminGroup.save();
          console.log('✅ Updated Admin group with new payment permissions');
        }
      }
      
      const managerGroup = await Group.findOne({ name: 'Manager' });
      if (managerGroup) {
        const correctManagerPermissions = ['dashboard', 'reports'];
        const needsUpdate = JSON.stringify(managerGroup.permissions.sort()) !== JSON.stringify(correctManagerPermissions.sort());
        
        if (needsUpdate) {
          managerGroup.permissions = correctManagerPermissions;
          managerGroup.description = 'Branch managers with access to dashboard and reports only';
          await managerGroup.save();
        }
      }
    }
    
    // Seed admin user - FIXED to ensure it references the admin group
    const userCount = await User.estimatedDocumentCount();
    if (userCount === 0) {
      
      // Find the admin group
      const adminGroup = await Group.findOne({ name: 'Admin' });
      if (!adminGroup) {
        return;
      }
      
      // Get all branches
      const allBranches = await Branch.find();
      if (allBranches.length === 0) {
        return;
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        username: 'admin',
        fullName: 'System Administrator',
        email: 'admin@dwatson.com',
        password: hashedPassword,
        groupId: adminGroup._id,
        branches: allBranches.map(b => b._id)
      });
      
      await adminUser.save();
    } else {
      
      // Check if admin user exists and has correct group
      const adminUser = await User.findOne({ username: 'admin' }).populate('groupId');
      if (adminUser) {
        
        // Ensure admin user has admin permission
        if (!adminUser.groupId.permissions.includes('admin')) {
          adminUser.groupId.permissions.push('admin');          
          await adminUser.groupId.save();
        }
      }
    }
    
  } catch (error) {
    console.error('Seed error:', error.message);
  }
}

// ========================================
// CRITICAL: VERIFY ALL API ROUTES ARE REGISTERED
// ========================================

// Log all registered routes on startup (for debugging)
const logRegisteredRoutes = () => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      routes.push(`${methods} ${middleware.route.path}`);
    }
  });
  console.log('\n📋 Registered Routes:');
  routes.filter(r => r.includes('/api/')).forEach(r => console.log(`   ${r}`));
  console.log('');
};

// ========================================
// API ROUTE INTERCEPTOR - MUST BE BEFORE STATIC FILES
// ========================================

// This middleware ensures ALL /api/ routes bypass static file serving
// MUST be before static middleware to prevent path rewriting
app.use((req, res, next) => {
  // Check originalUrl FIRST (before any path modification)
  // Extract path from originalUrl (remove query string)
  const originalPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
  
  // If it's an API route, skip static serving and continue to API routes
  if (originalPath.startsWith('/api/') || req.path.startsWith('/api/')) {
    console.log('🔵 API Route Detected - Bypassing static files:', req.method, 'Path:', req.path, '| Original:', req.originalUrl);
    return next(); // Continue to API route handlers
  }
  // For non-API routes, continue to static file middleware
  next();
});

// ========================================
// STATIC FILE SERVING
// ========================================

// Serve static frontend files (but NOT for API routes)
// IMPORTANT: This MUST come AFTER all API routes are defined
const clientDir = paths.clientDir;
const staticMiddleware = express.static(clientDir, {
  // Don't modify the request path
  index: false
});
app.use((req, res, next) => {
  // This should never catch API routes now due to the interceptor above
  // But keep this check as a safety net - use originalUrl to avoid path rewriting issues
  // Check originalUrl FIRST before path, as path might be modified
  const isApiRoute = req.originalUrl && req.originalUrl.split('?')[0].startsWith('/api/');
  if (isApiRoute || req.path.startsWith('/api/')) {
    console.log('⚠️ Static middleware: API route slipped through!', req.method, req.path, '| Original:', req.originalUrl);
    return next(); // Continue to API routes - DO NOT call staticMiddleware
  }
  // Only serve static files for non-API routes
  staticMiddleware(req, res, next);
});

// ========================================
// SERVER STARTUP
// ========================================

// Start server immediately - not dependent on database
app.listen(port, () => {
  console.log(`\n✅ ========================================`);
  console.log(`✅ Server listening on port ${port}`);
  console.log(`✅ ========================================\n`);
  
  // Log all registered API routes
  logRegisteredRoutes();
  
  console.log(`✅ Expected Category Payment Routes:`);
  console.log(`   - GET  /api/category-payments`);
  console.log(`   - POST /api/category-payments`);
  console.log(`   - GET  /api/category-payments/next-voucher-number`);
  console.log(`   - GET  /api/test-category-payments (no auth - TEST IT FIRST!)\n`);
});

// Start seeding when database is ready (if connected)
const handleDatabaseReady = () => {
  seedDefaultData();
};

// Handle if already connected
if (mongoose.connection.readyState === 1) {
  handleDatabaseReady();
} else {
  mongoose.connection.once('open', handleDatabaseReady);
}

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

// Global error handler - MUST be before catch-all
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled error:', err);
  // ALWAYS return JSON
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler for API routes and frontend
// THIS MUST BE THE ABSOLUTE LAST ROUTE - AFTER EVERYTHING
app.use('*', (req, res) => {
  console.log('🔴🔴🔴 404 Handler reached:', req.method, req.path);
  console.log('🔴 Query string:', req.query);
  console.log('🔴 Original URL:', req.originalUrl);
  console.log('🔴 Headers:', JSON.stringify(req.headers, null, 2));
  
  // ALWAYS set Content-Type to JSON for API routes - DO THIS FIRST
  if (req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/')) {
    console.log('🔴 API 404 - returning JSON:', req.path);
    console.log('🔴 Checking if /api/departments route exists...');
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({ 
      error: 'API endpoint not found', 
      path: req.path,
      originalUrl: req.originalUrl,
      method: req.method,
      availableEndpoints: [
        'GET /api/departments',
        'GET /api/branches/:branchId/departments',
        'GET /api/category-payments',
        'POST /api/category-payments',
        'GET /api/category-payments/next-voucher-number',
        'GET /api/test-category-payments'
      ]
    });
  } else {
    console.log('🔴 Frontend 404 - serving index.html for:', req.path);
    // For non-API routes, serve the frontend
    res.sendFile(path.join(clientDir, 'index.html'));
  }
});




