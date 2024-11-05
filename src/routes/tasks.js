const express = require("express")
const authenticateToken = require("../middlewares/authenticateToken")
const router = express.Router()
const cookieParser = require("cookie-parser")
const pool = require("../../pool")

router.use(cookieParser())

router.use(authenticateToken)

router.get("/", async (req, res)=>{
  const userId = req.user.id
  const query = "SELECT * FROM tasks WHERE user_id = ?"
  try{
    const [rows] = await pool.query(query, [userId])
    if(rows.length === 0) return res.status(204).send("No hay tareas xd")
    res.status(200).render("tasks",{tasks: rows})
  } catch(error){
    res.status(500).send(error)
  }
})

router.get("/inbox", async(req, res) => {
  const userId = req.user.id
  
})

router.get("/today", async(req, res) => {
  const userId = req.user.id
  
})

router.get("/tomorrow", async(req, res) => {
  const userId = req.user.id
  
})

router.get("/week", async(req, res) => {
  const userId = req.user.id
  
})

router.get("/month", async(req, res) => {
  const userId = req.user.id

})


router.post("/", async(req, res)=>{
  const userId = req.user.id
  const {task_title, task_deadline, task_priority, task_description} = req.body
  const query = `
    INSERT INTO tasks (user_id, task_title, task_deadline, task_priority, task_description)
    VALUES (?, ?, ?, ?, ?)
  `
})

router.put("/:id", (req, res) => {
  const userId = req.user.id
  const taskId = req.params.id
  const {task_title, task_deadline, task_priority, task_description} = req.body
  const query = `
    UPDATE tasks SET (user_id, task_title, task_deadline, task_priority, task_description)
    VALUES (?, ?, ?, ?, ?) WHERE task_id = ?
  `
})

router.delete("/:id", (req, res) => {
  const taskId = req.params.id
  const query = "DELETE FROM tasks WHERE task_id = ?"
})

module.exports = router