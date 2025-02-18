const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const User = require("./models/user");
const Feature = require("./models/featured");

const app = express();

// Database Connection
main().then(() => {
  console.log("Connected to DB");
}).catch((err) => {
  console.log(err);
});

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/cookandbook");
}

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.static(path.join(__dirname, "/public")));

// Session Configuration
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Flash Messages
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global Variables for Flash Messages
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user; // Make the current user available in all views
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("Hi, I am the root");
});

app.get("/home", async (req, res) => {
  const allFeature = await Feature.find({});
  res.render("home/index", { allFeature });
});

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true,
  })

);

app.get("/signup", (req, res) => {
  res.render("users/signup");
});

app.post("/signup", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const newUser = new User({ username, email });
      const registerUser =await User.register(newUser, password); // Automatically hashes the password
      req.login(registerUser,(err)=>{
        if(err){
          return next(err);
        }
        req.flash("success","Welcome to Cook & Book");
            res.redirect("/home");
      })
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/signup");
    }
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/home");
  });
});

app.get("/chefs",(req,res,next)=>{
  res.render("chef/chef.ejs")
})

// Server Start
app.listen(3000, () => {
  console.log("Listening at port 3000");
});
