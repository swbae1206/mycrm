import mongoose from "mongoose";


const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    phone: {
      type: String,
      required: true,
      max: 50,
      // unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    picturePath: {
      type: String,
      default: "",
    },
    approval: {
      type: Boolean,
      default: false,
    },
    companion: [
      {
        name: { type: String },
        groups: [{ type: String }],
      },
    ],
    approvedDate: { type: String, default: "0000-00-00" },
    suspendedDate: { type: String, default: "0000-00-00" },
    lastLogined: { type: String, default: "0000-00-00" },
    lastPaymentDate: { type: String, default: "0000-00-00" },
    totalLogin: { type: Number, default: 0 },
    totalCompany: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalDocumnet: { type: Number, default: 0 },
    suspended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);
export default User;
