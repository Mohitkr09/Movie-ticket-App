import { clerkClient } from "@clerk/express";

/* =====================================================
PROTECT (ANY LOGGED-IN USER)
===================================================== */

export const protect = (req, res, next) => {
  try {

    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });

  }
};


/* =====================================================
ADMIN PROTECTION
===================================================== */

export const protectAdmin = async (req, res, next) => {

  try {

    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const user = await clerkClient.users.getUser(userId);

    if (user.privateMetadata?.role !== "admin") {

      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });

    }

    next();

  } catch (error) {

    console.log("Admin auth error:", error);

    return res.status(403).json({
      success: false,
      message: "Not authorized"
    });

  }

};