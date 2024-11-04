const fetchUserData = async () => {
  const userId = localStorage.getItem("userId")
  console.log({userId})
  if(userId){
    try{
      const response = await fetch(`http://localhost:3000/users/${userId}`, {
        method: "GET",
      })
      if(response.status === 404) throw new Error("User not found")
      if(response.status === 500) throw new Error("Server error")
      const data = await response.json()
      console.log({data})
      const userData = data.userData
      //Aqui en verdad deberia guardarlo en useState y hacerlo cada que app renderize por primera vez o cada que edite algo del usuario
      if(userData){
        localStorage.setItem("username", userData.username)
        localStorage.setItem("email", userData.email)
        localStorage.setItem("profile_pic", userData.profile_pic)
      }
      else{
        throw new Error("User data not found in response")
      }
    } catch(error){
      console.log(error.message)
    }
  }
else alert("UserId not found in localStorage")
}

module.exports = fetchUserData