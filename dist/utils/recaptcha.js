"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRecaptcha = verifyRecaptcha;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
/**
 * Verify Google reCAPTCHA v2 token with Google's API.
 * Returns true if verification succeeds, false otherwise.
 */
function verifyRecaptcha(token, remoteip) {
    return __awaiter(this, void 0, void 0, function* () {
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        if (!secret) {
            console.warn("RECAPTCHA_SECRET_KEY is not set; reCAPTCHA verification skipped.");
            return true; // Allow in dev when key not set
        }
        if (!token || typeof token !== "string" || token.length < 10) {
            return false;
        }
        try {
            const params = new URLSearchParams();
            params.append("secret", secret);
            params.append("response", token);
            if (remoteip)
                params.append("remoteip", remoteip);
            const res = yield fetch(RECAPTCHA_VERIFY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString(),
            });
            const data = yield res.json();
            return data.success === true;
        }
        catch (error) {
            console.error("reCAPTCHA verification error:", error);
            return false;
        }
    });
}
