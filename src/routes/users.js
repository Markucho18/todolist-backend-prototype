const express = require("express")
const pool = require("../../pool")
const router = express.Router()
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const comparePasswords = require("../utils/comparePasswords")

router.use(cookieParser())

router.get("/", (req, res) => {
  res.send(`
    <a href="/users/login">LOGIN</a>
    <a href="/users/edit">EDIT</a>
  `)
})

router.get("/login", (req, res)=>{
  res.render("login")
})

router.get("/edit", (req, res) => {
  res.render("userEdit")
})

router.get("/:id", async (req, res) => {
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
        res.cookie("accessToken", accessToken, {httpOnly: true, maxAge: 60 * 60 * 1000})
        res.cookie("refreshToken", refreshToken, {httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000})
        return res.status(200).json({message: "Logged in succesfully", userId: user.id})
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