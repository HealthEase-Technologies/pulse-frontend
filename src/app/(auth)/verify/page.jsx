"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "@/lib/cognito";

export default function VerifyPage() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  useEffect(() => {
    if (!username) {
      router.push("/login");
    }
  }, [username, router]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = e.target.previousSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");

    // Filter out non-numeric characters and take only first 6 digits
    const numbers = pastedData.replace(/\D/g, "").slice(0, 6);

    if (numbers) {
      const newOtp = [...new Array(6)].map((_, idx) => {
        if (idx < numbers.length) {
          return numbers[idx];
        }
        return "";
      });

      setOtp(newOtp);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.join("")) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userData = {
        Username: username,
        Pool: UserPool,
      };

      const cognitoUser = new CognitoUser(userData);

      await new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(otp.join(""), true, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      setSuccess("Account verified successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verify your account
          </h1>
          <p className="text-gray-600">
            Enter the verification code sent to your email
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Verification Code
            </label>
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  onFocus={(e) => e.target.select()}
                  className={`w-12 h-12 text-center text-xl font-medium rounded-md border ${
                    error
                      ? "border-red-300 bg-red-50"
                      : success
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Paste your 6-digit code or enter it manually
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Back to{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
