const jwt = require("jsonwebtoken");

const isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token || token === "null") {
    return res
      .status(404)
      .json({ success: false, message: "Token not found." });
  }

  try {
    const tokenInfo = jwt.verify(token, process.env.SECRET);
    req.user = tokenInfo;
    next();
  } catch (error) {
    console.error(
      "Caught Backend Error on isAuthenticated. Error Message: ",
      error.message
    );
    return res
      .status(401)
      .json({ success: false, error: { message: "Must Be Logged In" } });
  }
};

module.exports = isAuthenticated;
