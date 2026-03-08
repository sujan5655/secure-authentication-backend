// import { Schema, model, Document } from 'mongoose';

// // TypeScript interface for type safety
// export interface IUser extends Document {
//   firstName: string;
//   lastName: string;
//   email: string;
//   password: string;
//   confirmPassword?: string;
//   otp?: string | null;
//   otpCreatedAt?: Date | null;
//   otpVerified: boolean;
//   resetPasswordToken?: string | null;
//   resetPasswordExpires?: Date | null;
//   failedAttempts: number; // <-- must be a number for arithmetic operations

//   trustedDevices: {
//     deviceId: string;
//     addedAt: Date;
//     location: string;
//   }[]; // <-- array of objects, not a tuple

//   lastLoginIP?: string;
//   lastLoginLocation?: string;
//   created_at: Date;
//   updated_at: Date;
// }

// // Define Mongoose schema
// const UserSchema = new Schema<IUser>(
//   {
//     firstName: {
//       type: String,
//       required: [true, 'First name is required'],
//     },
//     lastName: {
//       type: String,
//       required: [true, 'Last name is required'],
//     },
//     email: {
//       type: String,
//       required: [true, 'Email is required'],
//       unique: true,
//       validate: {
//         validator: (value: string) => /^\S+@\S+\.\S+$/.test(value),
//         message: 'Invalid email address',
//       },
//     },
//     password: {
//       type: String,
//       required: [true, 'Password is required'],
//       validate: {
//         validator: function (value: string): boolean {
//           const hasUpperCase = (value.match(/[A-Z]/g) || []).length >= 1;
//           const hasLowerCase = (value.match(/[a-z]/g) || []).length >= 1;
//           const hasDigits = (value.match(/[0-9]/g) || []).length >= 2;
//           return hasUpperCase && hasLowerCase && hasDigits;
//         },
//         message:
//           'Password must have at least 1 uppercase, 1 lowercase letters, and 2 digits.',
//       },
//     },
//     otp: {
//       type: String,
//       default: null,
//     },
//     otpCreatedAt: {
//       type: Date,
//       default: null,
//     },
//     otpVerified: {
//       type: Boolean,
//       default: false,
//     },
//     resetPasswordToken: {
//       type: String,
//       default: null,
//     },
//     resetPasswordExpires: {
//       type: Date,
//       default: null,
//     },
//     failedAttempts: {
//       type: Number,
//       default: 0, // <-- ensure default value
//     },
//     trustedDevices: [
//       {
//         deviceId: { type: String, required: true },
//         addedAt: { type: Date, required: true },
//         location: { type: String, required: true },
//       },
//     ],
//     lastLoginIP: { type: String, default: null },
//     lastLoginLocation: { type: String, default: null },
//   },
//   {
//     timestamps: {
//       createdAt: 'created_at',
//       updatedAt: 'updated_at',
//     },
//   }
// );

// // Virtual field — not stored in DB
// UserSchema.virtual('confirmPassword')
//   .get(function (this: IUser) {
//     return this.confirmPassword;
//   })
//   .set(function (this: IUser, value: string) {
//     this.confirmPassword = value;
//   });

// // Export model
// export const User = model<IUser>('User', UserSchema);

import { Schema, model, Document } from "mongoose";

// Device subdocument type
export interface ITrustedDevice {
  deviceId: string;
  addedAt: Date;
  location: string;
}

// TypeScript interface for users
export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: "user" | "admin";

  otp: string | null;
  otpCreatedAt :Date|null,
  otpExpiresAt: Date | null;
  otpVerified: boolean;

  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;

  failedAttempts: number;
  lockedUntil: Date | null; // Account locked until this time (e.g. after 5 failed attempts)

  trustedDevices: ITrustedDevice[];

  lastLoginIP: string;
  lastLoginLocation: string;

  // Password policy fields
  passwordHistory: string[]; // Array of hashed previous passwords
  passwordCreatedAt: Date; // When current password was set
  passwordExpiresAt: Date | null; // When password expires (null = no expiration)

  created_at: Date;
  updated_at: Date;

  // Virtuals
  confirmPassword?: string;
}
const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (value: string) => /^\S+@\S+\.\S+$/.test(value),
        message: "Invalid email format",
      },
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    otp: {
      type: String,
      default: null,
    },

    otpCreatedAt: {
      type: Date,
      default: null,
    },

    otpExpiresAt: {
      type: Date,
      default: null,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },

    trustedDevices: {
      type: [
        {
          deviceId: { type: String, required: true },
          addedAt: { type: Date, required: true },
          location: { type: String, required: true },
        },
      ],
      default: [],
    },

    lastLoginIP: {
      type: String,
      default: "",
    },

    lastLoginLocation: {
      type: String,
      default: "",
    },

    // Password policy fields
    passwordHistory: {
      type: [String],
      default: [],
      validate: {
        validator: function (value: string[]) {
          return value.length <= 5; // Keep last 5 passwords
        },
        message: "Password history cannot exceed 5 entries",
      },
    },
    passwordCreatedAt: {
      type: Date,
      default: Date.now,
    },
    passwordExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);
UserSchema.virtual("confirmPassword")
  .get(function (this: IUser) {
    return this.confirmPassword;
  })
  .set(function (this: IUser, value: string) {
    this.confirmPassword = value;
  });
export const User = model<IUser>("User", UserSchema);

