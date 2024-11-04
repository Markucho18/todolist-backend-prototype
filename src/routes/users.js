const express = require("express")
const pool = require("../../pool")
const router = express.Router()
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const comparePasswords = require("../utils/comparePasswords")

router.use(cookieParser())

router.get("/", (req, res) => {
  res.send('<a href="/users/login">LOGIN</a>')
})

router.get("/login", (req, res)=>{
  res.render("login")
})

router.post("/login", async (req, res)=>{
  const {email, user_password} = req.body
  const query = "SELECT * FROM users WHERE email = ?"
  try{
    const [rows] = await pool.query(query, [email])
    if(rows.length > 0){
      const user = rows[0]
      console.log({ user })
      const hashedPassword = user.user_password
      const passwordIsValid = await comparePasswords(user_password, hashedPassword)
      if(passwordIsValid){
        console.log("Access Token Secret:", process.env.ACCESS_TOKEN_SECRET);
        console.log("Refresh Token Secret:", process.env.REFRESH_TOKEN_SECRET);
        const accessToken = jwt.sign({id: user.id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1h"})
        const refreshToken = jwt.sign({id: user.id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"})
        console.log({accessToken, refreshToken})
        res.cookie("accessToken", accessToken, {httpOnly: true, maxAge: 60 * 60 * 1000})
        res.cookie("refreshToken", refreshToken, {httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000})
        return res.status(200).json({message: "Logged in succesfully"})
      }
      else{
        return res.status(401).json({message: "Password is not valid"})
      }
    }
    return res.status(404).json({ message: "Email not found"})
  } catch(error){
    return res.status(500).json({ message: "Server error"})
  }
})

router.post("/register", (req, res)=>{
  
})

router.post("/logout", (req, res)=>{

})

router.put("/edit", (req, res)=>{

})

module.exports = router