import jwt from 'jsonwebtoken'
import { Response } from 'express'

const generateAdminToken = async (res:Response) : Promise<string> =>{

    if(!process.env.MY_SERCET_KEY){
        console.error("JWT key is not define in enviornment variables")
        throw new Error("JWT secret key undefined")
    }

    const token = jwt.sign({ userId: 0, isAdmin: true } , process.env.MY_SERCET_KEY , {expiresIn:'15d'})
    res.cookie("jwt",token,{
        maxAge: 15 * 24 * 60 * 60 * 1000,
		httpOnly: true,
		sameSite: "lax", 
		secure: false,
    })
    return token;
}

export default generateAdminToken