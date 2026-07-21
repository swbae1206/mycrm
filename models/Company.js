import mongoose from "mongoose";

const salesSchema = mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  contents: String,
  savedDocName: String,
  salesStatus: String
})

const contactsSchema = mongoose.Schema({
  name: String,
  phone: String
})


const companySchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    registNo: {
      type: String,
    },
    ceo: String,
    age: String,
    companyType: String,
    salesType: String,
    employees: String,
    grossRevenue: String,
    netProfit: String,
    suspenseAccount: String,
    retainedEarnings: String,
    industry: String,
    address: String,
    phone: String,
    groupInsu: String,
    companyInsu: String,
    companion: String,
    group: String,
    status: String,
    sales: [salesSchema]
  },
  { timestamps: true },
);

const CompanyData = mongoose.model("Company", companySchema);

export default CompanyData;
