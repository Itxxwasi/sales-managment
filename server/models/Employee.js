import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    fatherMother: { type: String, default: '' },
    cnic: { type: String, default: '' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeDepartment' },
    designationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeDesignation' },
    designation: { type: String, default: '' }, // Keep for backward compatibility
    address: { type: String, default: '' },
    accNo: { type: String, default: '' },
    bankName: { type: String, default: '' },
    mobileNo: { type: String, default: '' },
    dob: { type: Date },
    joiningDate: { type: Date },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    incrDate: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    religion: { type: String, default: 'Islam' },
    salesman: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    image: { type: String, default: '' },
    
    // Fix (Salary/Allowance) Section
    opening: { type: Number, default: 0 },
    salary: { type: Number, default: 0 },
    salaryPeriod: { type: String, default: 'Per Month' },
    fixAllowance: { type: Number, default: 0 },
    stLessAllowance: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 },
    commEmp: { type: Boolean, default: false },
    allowFood: { type: String, default: 'No Food' },
    perTimeFoodRs: { type: Number, default: 0 },
    bankCash: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },
    
    // Duty Section
    fDutyTime: { type: String, default: '' },
    tDutyTime: { type: String, default: '' },
    offDay: { type: String, default: 'Sunday' },
    totalHrs: { type: Number, default: 0 },
    
    // Employee Access Controls
    allowOvertime: { type: Boolean, default: true },
    otstThirtyWorkingDays: { type: Boolean, default: false },
    eobi: { type: Boolean, default: false },
    payFullSalaryThroughBank: { type: Boolean, default: false },
    electricityBill: { type: Boolean, default: false },
    thirtyWorkingDays: { type: Boolean, default: false },
    allowEmployeeAdvances: { type: Boolean, default: true },
    allowRottiPerks: { type: Boolean, default: false },
    dontAllowRottiPerks: { type: Boolean, default: false },
    allowNashtaPerks: { type: Boolean, default: false },
    dontAllowNashtaPerks: { type: Boolean, default: false },
    rottiTimes: { type: String, default: '' },
    
    // Employee Bank Details
    hbl: { type: String, default: '' },
    alf: { type: String, default: '' },
    bop: { type: String, default: '' },
    bip: { type: String, default: '' },
    bahl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Employee = mongoose.model('Employee', EmployeeSchema);

