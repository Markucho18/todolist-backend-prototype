const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const router = express.Router()
const fs = require("fs")
const multer = require('multer');
const pool = require("../../pool")
const cloudinary = require('cloudinary').v2;

const MAX_SIZE = 2 * 1024 * 1024;

const upload = multer({
  dest: "./src/uploads", // Carpeta temporal para almacenar las imágenes subidas
  limits: {
    fileSize: MAX_SIZE // Limite de tamaño en bytes
  },
  fileFilter: (req, file, cb) => {
    // Puedes agregar un filtro para permitir solo ciertos tipos de archivos, por ejemplo, imágenes
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG, JPG, and PNG files are allowed!"));
    }
  }
});

cloudinary.config({
  url: process.env.CLOUDINARY_URL
})

router.use(authenticateToken)

router.put("/", upload.single("profile_pic"), async (req, res) => {
  console.log("CONSULTA EN PUT DE users/edit-profile-pic")
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try{
    const result = await cloudinary.uploader.upload(req.file.path) //La url local que devuelve el middleware upload.single()
    const imageUrl = result.secure_url
    await fs.promises.unlink(req.file.path) //Eliminar archivo temporal
    const query = 'UPDATE users SET profile_pic = ? WHERE id = ?'
    const results = await pool.query(query, [imageUrl, req.user.id])
    if (results[0].affectedRows > 0) res.status(200).json({ message: "Picture updated successfully", results, imageUrl });
    else res.status(404).json({ message: "Couldn't update picture" });
  }
  catch(error){
    if (error instanceof multer.MulterError) {
      // Un error de Multer (por ejemplo, tamaño de archivo excedido)
      console.log(error.message)
      return res.status(400).json({ message: error.message });
    } else {
      console.log({msg: "There was an error in users/picture/POST", error})
      return res.status(500).json({message: "There was an error updating image", error})
    }
  }
})

module.exports = router