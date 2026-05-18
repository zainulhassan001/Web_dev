require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Ad = require('../models/Ad');

const categories = [
  { name: 'Textbooks', icon: 'book', displayOrder: 1 },
  { name: 'Electronics', icon: 'device-laptop', displayOrder: 2 },
  { name: 'Furniture', icon: 'armchair', displayOrder: 3 },
  { name: 'Clothing', icon: 'shirt', displayOrder: 4 },
  { name: 'Sports', icon: 'ball-football', displayOrder: 5 },
  { name: 'Stationery', icon: 'pencil', displayOrder: 6 },
  { name: 'Transport', icon: 'bike', displayOrder: 7 },
  { name: 'Other', icon: 'box', displayOrder: 8 }
];

const sampleAds = [
  { title: 'Engineering Mathematics Textbook', price: 25, condition: 'good', status: 'active' },
  { title: 'Dell Laptop 8GB RAM', price: 320, condition: 'good', status: 'active' },
  { title: 'Study Desk with Drawer', price: 60, condition: 'fair', status: 'active' },
  { title: 'Campus Bike', price: 120, condition: 'good', status: 'sold' },
  { title: 'Winter Jacket', price: 40, condition: 'like-new', status: 'active' },
  { title: 'Wireless Mouse', price: 15, condition: 'good', status: 'pending' },
  { title: 'Office Chair', price: 45, condition: 'fair', status: 'active' },
  { title: 'Graphic Calculator', price: 55, condition: 'good', status: 'active' },
  { title: 'Noise Cancelling Headphones', price: 80, condition: 'like-new', status: 'active' },
  { title: 'Dorm Mini Fridge', price: 90, condition: 'good', status: 'sold' },
  { title: 'Chemistry Lab Coat', price: 12, condition: 'good', status: 'active' },
  { title: 'Soccer Cleats', price: 30, condition: 'fair', status: 'active' },
  { title: 'Stationery Starter Pack', price: 8, condition: 'new', status: 'active' },
  { title: 'Monitor 24 Inch', price: 110, condition: 'good', status: 'pending' },
  { title: 'Guitar with Case', price: 140, condition: 'good', status: 'active' },
  { title: 'Tablet for Notes', price: 180, condition: 'like-new', status: 'active' },
  { title: 'Sports Water Bottle', price: 10, condition: 'new', status: 'active' },
  { title: 'Winter Boots', price: 35, condition: 'good', status: 'active' },
  { title: 'Printer with Ink', price: 70, condition: 'fair', status: 'sold' },
  { title: 'Desk Lamp', price: 18, condition: 'good', status: 'active' },
  { title: 'Backpack', price: 22, condition: 'good', status: 'active' },
  { title: 'Mechanical Keyboard', price: 50, condition: 'good', status: 'pending' },
  { title: 'Bluetooth Speaker', price: 28, condition: 'good', status: 'active' },
  { title: 'Calculator Stand', price: 6, condition: 'new', status: 'active' },
  { title: 'Campus Hoodie', price: 20, condition: 'like-new', status: 'active' }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Ad.deleteMany({})
    ]);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@uni.com',
      password: 'admin123',
      role: 'admin',
      university: 'Central University'
    });

    const student = await User.create({
      name: 'Test Student',
      email: 'student@uni.com',
      password: 'student123',
      role: 'customer',
      university: 'North Campus'
    });

    const createdCategories = await Category.insertMany(
      categories.map(cat => ({
        ...cat,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-')
      }))
    );

    const adsToCreate = sampleAds.map((ad, index) => {
      const category = createdCategories[index % createdCategories.length];
      const seller = index % 2 === 0 ? admin._id : student._id;
      const campus = index % 2 === 0 ? admin.university : student.university;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return {
        title: ad.title,
        description: `${ad.title} in great condition. Ready for pickup on campus.`,
        price: ad.price,
        category: category._id,
        condition: ad.condition,
        images: [],
        seller,
        status: ad.status,
        campus,
        expiresAt,
        slug: ad.title.toLowerCase().replace(/\s+/g, '-') + '-' + (index + 1)
      };
    });

    await Ad.insertMany(adsToCreate);

    console.log('Seeding complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
