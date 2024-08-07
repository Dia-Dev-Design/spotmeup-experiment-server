var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var mongoose = require("mongoose");
var cors = require("cors");

var indexRouter = require("./routes/index.routes");
var usersRouter = require("./routes/users.routes");
var venueRouter = require("./routes/venue.routes");
var layoutRouter = require("./routes/layout.routes");
var blockRouter = require("./routes/block.routes");
var sectionRouter = require("./routes/section.routes");
var seatsRouter = require("./routes/seats.routes");
var tablesRouter = require("./routes/tables.routes");
var authRouter = require("./routes/auth.routes");
var shapeRouter = require("./routes/shape.routes")
var eventRouter = require("./routes/event.routes")
var ticketRouter = require("./routes/ticket.routes")
var transactionRouter = require("./routes/transaction.routes")
var seed = require("./routes/seed.route");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", 1);
app.enable("trust proxy");

// app.use(
//   cors({
//     origin: [process.env.REACT_APP_URI], // <== URL of our future React app
//   })
// );

app.use(
    cors()
  );
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/venue", venueRouter);
app.use("/layout", layoutRouter);
app.use("/block", blockRouter);
app.use("/section", sectionRouter);
app.use("/seats", seatsRouter);
app.use("/tables", tablesRouter);
app.use("/auth", authRouter);
app.use("/shape", shapeRouter);
app.use("/event", eventRouter);
app.use("/ticket", ticketRouter);
app.use("/transaction", transactionRouter);
app.use("/seed", seed);

mongoose
  .connect(process.env.MONGODB_URI)
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });
module.exports = app;
