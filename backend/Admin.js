require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); 

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "admin@nectarinfotel.com";
    const plainPassword = "Infotel@2025";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists in the database.");
    } else {
      await User.create({
        name: "Admin",
        email: email,
        password: hashedPassword,
        userType: "admin"
      });
      console.log("✅ Admin user created successfully.");
    }

    process.exit();
  } catch (err) {
    console.error("❌ Failed to create admin:", err.message);
    process.exit(1);
  }
};

createAdmin();