"use client";

import { createContext, useContext, useState } from "react";
import { CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";
import Pool from "@/lib/cognito";
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/api_calls";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [error, setError] = useState("");
  const router = useRouter();

  const getSession = async () => {
    return await new Promise((resolve, reject) => {
      const user = Pool.getCurrentUser();
      if (user) {
        user.getSession((err, session) => {
          if (err) reject(err);
          else resolve(session);
        });
      } else {
        reject();
      }
    });
  };

  const authenticate = async (Username, Password) => {
    return await new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username,
        Pool,
      });

      const authDetails = new AuthenticationDetails({
        Username,
        Password,
      });

      user.authenticateUser(authDetails, {
        onSuccess: async (data) => {
          try {
            // Store the access token
            const idToken = data.getIdToken().getJwtToken();
            localStorage.setItem("access-token", idToken);
            localStorage.setItem("cognito-id", data.idToken.payload.sub);
            localStorage.setItem("email", data.idToken.payload.email);

            // Dispatch storage event
            window.dispatchEvent(
              new StorageEvent("storage", {
                key: "access-token",
                newValue: idToken,
                oldValue: null,
                storageArea: localStorage,
              })
            );

            // Short delay
            await new Promise((resolve) => setTimeout(resolve, 100));

            resolve(data);
          } catch (error) {
            console.error("Error in authentication success:", error);
            reject(error);
          }
        },
        onFailure: (err) => {
          setError(err.message);
          reject(err);
        },
        newPasswordRequired: (data) => {
          resolve(data);
        },
      });
    });
  };

  const checkToken = () => {
    const token = localStorage.getItem("access-token");
    if (token) {
      const jwt = token.split(".");
      const jwtData = JSON.parse(atob(jwt[1]));
      const exp = jwtData.exp;
      const current_time = Date.now() / 1000;
      if (exp < current_time) {
        logout();
        router.push("/login");
      }
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem("access-token");

    if (!token) {
      router.push("/login");
      return false;
    }

    try {
      return true;
    } catch (err) {
      console.error("Auth check failed:", err);
      router.push("/login");
      return false;
    }
  };

  const logout = () => {
    const user = Pool.getCurrentUser();
    if (user) {
      user.signOut();
      localStorage.clear();
      router.push("/login");
    }
  };

  const signup = async (username, email, password, fullName, role) => {
    return new Promise((resolve, reject) => {
      Pool.signUp(
        username, // Username (alphanumeric, not email)
        password,
        [
          {
            Name: "email",
            Value: email,
          },
          {
            Name: "name",
            Value: fullName,
          },
        ],
        null,
        async (err, result) => {
          if (err) {
            setError(err.message);
            reject(err);
            return;
          }

          try {
            // After Cognito signup, register user in our database
            const cognitoId = result.userSub;

            await registerUser({
              cognito_id: cognitoId,
              username: username,
              email: email,
              full_name: fullName,
              role: role,
            });

            resolve(result);
          } catch (dbError) {
            console.error("Database registration error:", dbError);
            // Cognito user was created but DB registration failed
            setError("Account created but registration incomplete. Please contact support.");
            reject(dbError);
          }
        }
      );
    });
  };

  const confirmSignUp = async (username, code) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
        Pool,
      });

      user.confirmRegistration(code, true, (err, result) => {
        if (err) {
          setError(err.message);
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  };

  const resendConfirmationCode = async (username) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
        Pool,
      });

      user.resendConfirmationCode((err, result) => {
        if (err) {
          setError(err.message);
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  };

  const forgotPassword = async (username) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
        Pool,
      });

      user.forgotPassword({
        onSuccess: (data) => {
          resolve(data);
        },
        onFailure: (err) => {
          setError(err.message);
          reject(err);
        },
      });
    });
  };

  const confirmPassword = async (username, code, newPassword) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
        Pool,
      });

      user.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          setError(err.message);
          reject(err);
        },
      });
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authenticate,
        getSession,
        logout,
        checkToken,
        checkAuth,
        signup,
        confirmSignUp,
        resendConfirmationCode,
        forgotPassword,
        confirmPassword,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
