"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateOTP = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};
exports.default = generateOTP;
