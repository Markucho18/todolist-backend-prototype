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
    if(rows.length === 0) return res.status(204).json({message: "No tasks found"})
    res.status(200).json({message: "Tasks found successfully", rows})
    //res.status(200).render("tasks",{tasks: rows})
  } catch(error){
    res.status(500).json({message: "Server error", error})
  }
})

router.get("/no-date", async(req, res) => {
  const userId = req.user.id
  const query = "SELECT * FROM tasks WHERE task_deadline IS NULL AND user_id = ?"
  try{
    const [rows] = await pool.query(query, [userId])
    if(rows.length === 0){
      console.log("Sin tareas sin fecha")
      return res.status(204).json({message: "No tasks found"})
    }
    res.render("tasksInbox", {tasks: rows})
  } catch(error){
    console.log({error})
    res.json({message: "Error has ocurred"})
  }
})

router.get("/today", async(req, res) => {
  console.log("Consulta en tasks/today")
  const userId = req.user.id
  const query = "SELECT * FROM tasks WHERE task_deadline = CURDATE() AND user_id = ?"
  try{
    const [rows] = await pool.query(query, [userId])
    if(rows.length === 0){
      console.log("Sin tareas de hoy")
      return res.status(204).json({message: "No tasks found today"})
    }
    res.render("tasksToday", {tasks: rows})
  } catch(error){
    console.log({error})
    res.json({message: "Error has ocurred"})
  }
})

router.get("/tomorrow", async(req, res) => {
  const userId = req.user.id
  const query = "SELECT * FROM tasks WHERE task_deadline = DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND user_id = ?"
  try{
    const [rows] = await pool.query(query, [userId])
    if(rows.length === 0) return res.status(204).json({message: "No tasks found tomorrow", results: rows})
    res.status(200).json({message: "Tasks from tomorrow obtained successfully", results: rows})
  } catch(error){
    console.log(error)
    res.status(500).json({message: "Server error"})
  }
})

router.get("/week", async(req, res) => {
  const userId = req.user.id
  res.send("Tareas de esta semana")
  
})

router.get("/month", async(req, res) => {
  const userId = req.user.id
  res.send("Tareas de este mes")

})


router.post("/create-task", async(req, res)=>{
  const userId = req.user.id
  const {task_title, task_deadline, task_priority, task_description} = req.body
  const query = `
    INSERT INTO tasks (user_id, task_title, task_deadline, task_priority, task_description)
    VALUES (?, ?, ?, ?, ?)
  `
  try{
    const result = await pool.query(query, [userId, task_title, task_deadline, task_priority, task_description])
    if(result.affectedRows === 0) return res.status(500).json({message: "Couldn't create task"})
    res.status(200).json({message: "Task created successfully", result})
  }catch(error){
    console.log({error})
    return res.status(500).json({message: "Couldn't create task"})
  }
})

router.put("/complete/:id", async (req, res) => {
  const userId = req.user.id
  const taskId = req.params.id
  const query = "UPDATE tasks SET task_completed = NOT task_completed WHERE task_id = ? AND user_id = ?"
  try{
    const result = await pool.query(query, [taskId, userId])
    if(result[0].affectedRows === 0) return res.status(404).json({message: "Task or user not found"})
    res.status(200).json({message: "Task completed succcessfully"})
  } catch(error){
    console.log({error})
    res.status(500).json({message: "Server error has ocurred"})
  }
})

router.put("/edit/:id", (req, res) => {
  const userId = req.user.id
  const taskId = req.params.id
  const {task_title, task_deadline, task_priority, task_description} = req.body
  const query = `
    UPDATE tasks SET (task_title, task_deadline, task_priority, task_description)
    VALUES (?, ?, ?, ?) WHERE task_id = ? AND user_id = ?
  `
})

router.delete("/:id", async (req, res) => {
  const taskId = req.params.id
  console.log({taskId})
  const query = "DELETE FROM tasks WHERE task_id = ?"
  try{
    const results = await pool.query(query, [taskId])
    if(results[0].affectedRows === 0) return res.status(404).json({message: "No task found"})
    res.status(200).json({message: "Task deleted successfully"})
  } catch(error){
    console.log(error)
    res.status(500).json({message: "An error has ocurred"})
  }
})

module.exports = router