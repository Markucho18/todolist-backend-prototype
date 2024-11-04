const jwt = require("jsonwebtoken")

const authenticateToken = async (req, res, next) => {
  const {accessToken, refreshToken} = req.cookies
  //Confirmar si hay accessToken
  if(accessToken){
    try{
      //Si el accessToken es valido, proseguimos
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
      req.user = decoded
      return next()
    } catch(error){
      // Si el access token está expirado, intentaremos usar el refresh token
      if(error.name !== "TokenExpiredError"){
        return res.status(403).json({ message: "Invalid access token"})
      }
    }
  }
  //Si expiro, confirmar si hay RefreshToken
  if(refreshToken){
    try{
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
      const userId = decoded.id
      const newAccessToken = jwt.sign({id: userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1h"})
      res.cookie("accessToken", newAccessToken, { httpOnly: true, maxAge: 60 * 60 * 1000 });
      req.user = decoded
      return next()
    } catch(error){
      return res.status(403).json({ message: "Invalid refresh token" });
    }
  }
  //Si no hay ninguno volver a iniciar sesion
  return res.status(401).json({ message: "Please log in again" });
}

module.exports = authenticateToken