import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const adminEmail = "22051950@kiit.ac.in";
        const adminPassword = "asdfghjkl";

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log("❌ Admin account already exists!");
            process.exit(0);
        }

        // Create admin account
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = await User.create({
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            skills: ["System Administration", "All Technical Skills"],
        });

        console.log("✅ Admin account created successfully!");
        console.log(`Email: ${admin.email}`);
        console.log(`Role: ${admin.role}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin:", error.message);
        process.exit(1);
    }
};

createAdmin();
