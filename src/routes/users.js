const express = require("express")
const pool = require("../../pool")
const router = express.Router()
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const comparePasswords = require("../utils/comparePasswords")
const hashPassword = require("../utils/hashPassword")
const authenticateToken = require("../middlewares/authenticateToken")

router.use(cookieParser())

const profilePicRouter = require("./profilePic")
router.use("/edit-profile-pic", profilePicRouter)

router.get("/", (req, res) => {
  res.send(`
    <a href="/users/login">LOGIN</a>
    <a href="/users/register">REGISTER</a>
    <a href="/users/logout">LOGOUT</a>
    <a href="/users/edit">EDIT</a>
    <a href="/">HOME</a>
  `)
})

router.get("/login", (req, res)=>{
  res.render("login")
})

router.get("/register", (req, res)=>{
  res.render("register")
})

router.get("/logout", (req, res)=>{
  res.render("logout")
})

router.get("/edit", (req, res)=>{
  res.send(`
    <a href="/users/edit/username">USERNAME</a>
    <a href="/users/edit/profile-pic">PROFILE PICTURE</a>
    <a href="/users/edit/password">PASSWORD</a>
    <a href="/users/">USERS</a>
  `)
})

router.get("/edit/:key", (req, res) => {
  const {key} = req.params
  if(key == "username") return res.render("usernameEdit")
  if(key == "profile-pic") return res.render("profilePicEdit")
  if(key == "password") return res.render("passwordEdit")
  else return res.status(400).send("No se encontro el recurso solicitado")
})

router.get("/validate-token", authenticateToken, (req, res)=>{
  console.log("Consulta en validate-token")
  res.status(200).json({ message: "Token is valid", userId: req.user.id });
})

router.get("/fetch-data/:id", async (req, res) => {
  const {id} = req.params
  console.log({id})
  const query = "SELECT * FROM users WHERE id = ?"
  try{
    const [rows] = await pool.query(query, [id])
    if(rows.length === 0) return res.status(404).json({ message: "User not found" })
    //Quitarle la contraseña
    const {user_password, ...userData} = rows[0]
    res.status(200).json({message: "User data got successfully", userData})
  } catch(error){
    res.status(500).json({message: "Server error"})
  }
})

router.post("/login", async (req, res)=>{
  const {email, user_password} = req.body
  const query = "SELECT * FROM users WHERE email = ?"
  try{
    const [rows] = await pool.query(query, [email])
    if(rows.length > 0){
      const user = rows[0]
      const hashedPassword = user.user_password
      const passwordIsValid = await comparePasswords(user_password, hashedPassword)
      if(passwordIsValid){
        const accessToken = jwt.sign({id: user.id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1h"})
        const refreshToken = jwt.sign({id: user.id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"})
        res.cookie("accessToken", accessToken, {httpOnly: true, maxAge: 60 * 60 * 1000, sameSite: "lax"})
        res.cookie("refreshToken", refreshToken, {httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax"})
        return res.status(200).json({message: "Logged in succesfully", userId: user.id})
      }
      else{
        return res.status(401).json({message: "Password is not valid", notValid: "password"})
      }
    }
    return res.status(404).json({ message: "Email not found", notValid: "email"})
  } catch(error){
    return res.status(500).json({ message: "Server error"})
  }
})

const validateEmail = async (req, res, next) => {
  const {email} = req.body
  const query = "SELECT * FROM users WHERE email = ?"
  const [rows] = await pool.query(query, [email])
  if(rows.length === 0) return next()
  else res.status(401).json({message: "Email is already in use"})
}

router.post("/register", validateEmail, async (req, res)=>{
  const {username, email, user_password} = req.body
  const hashedPassword = await hashPassword(user_password)
  const defaultImageUrl = "https://res.cloudinary.com/dyihwozea/image/upload/byrmbj7rdtui1ohypvxm.webp"
  const query = `
    INSERT into users (username, email, user_password, profile_pic)
    VALUES (?, ?, ?, ?)
  `
  try{
    const results = await pool.query(query, [username, email, hashedPassword, defaultImageUrl])
    if(results[0].affectedRows === 0) return res.status(500).json({message: "Could not register user"})
    res.status(200).json({message: "User registered succesfully"})
  } catch(error){
    console.log(error)
    res.status(500).json({message: "Could not register user"})
  }
})

router.post("/logout", (req, res)=>{
  const {accessToken, refreshToken} = req.cookies
  if (!accessToken || !refreshToken) {
    return res.status(400).json({ message: "No token provided" });
  }
  try{
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    const userId = decoded.id;
    console.log("User logged out:", userId);
    res.clearCookie("accessToken", {httpOnly: true})
    res.clearCookie("refreshToken", {httpOnly: true})
    res.status(200).json({message: "User logged out successfully"})
  } catch(error){
    console.log({error})
    res.status(401).json({message: "Invalid token"})
  }
})

router.put("/edit-username", authenticateToken, async (req, res)=>{
  const {new_username} = req.body
  const query = "UPDATE users SET username = ? WHERE id = ?" 
  try{
    const results = await pool.query(query, [new_username, req.user.id])
    if(results.affectedRows === 0) return res.status(404).json({ message: "User not found"})
    return res.status(200).json({message: "Username updated successfully", results})
  } catch(error){
    return res.status(500).json({message: "Server error"})
  }
})

router.put("/edit-password", authenticateToken, async(req, res) => {
  const {old_password, new_password} = req.body
  const passwordGetQuery = "SELECT user_password FROM users WHERE id = ?"
  if(old_password && new_password){
    try{
      const [rows] = await pool.query(passwordGetQuery, [req.user.id])
      if(rows.length === 0) return res.status(404).json({message: "User id not found"})
      const hashedPassword = rows[0].user_password
      const passwordMatch = await comparePasswords(old_password, hashedPassword)
      if(!passwordMatch) return res.status(401).json({message: "Passwords don't match"})
      const newHashedPassword = await hashPassword(new_password)
      const passwordPutQuery = "UPDATE users SET user_password = ? WHERE id = ?"
      const results = await pool.query(passwordPutQuery, [newHashedPassword, req.user.id])
      if(results.affectedRows === 0) return res.status(500).json({message: "Server error"})
      res.status(200).json({message: "Password updated succesfully"})
    } catch(error){
      res.status(500).json({message: "Server error"})
    }
  } else return res.status(400).json({message: "Not enough data"})
})

module.exports = router