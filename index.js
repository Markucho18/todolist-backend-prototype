require("dotenv").config()
const PORT = process.env.PORT || 3000
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const app = express()

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
app.use(bodyParser.json())

app.set("view engine", "ejs")
app.set("views", "./src/views")

const usersRouter = require("./src/routes/users")
app.use("/users", usersRouter)

const tasksRouter = require("./src/routes/tasks")
app.use("/tasks", tasksRouter)

app.get("/", (req, res) => {
  res.render("index", {
    message: "Hola Mundo, estas en la pagina principal"
  })
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
