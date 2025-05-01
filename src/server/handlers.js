
require('dotenv').config();
const flexatarApiUrl = "https://api.flexatar-sdk.com"
const flexatarApiSecret = process.env.FLEXATAR_API_SECRET;
console.log(flexatarApiSecret)

async function flexRequest(endpoint,reqBody){

    
    const url = `${flexatarApiUrl}/b2b/${endpoint}`
    const opts = {
        method: 'POST',
        headers:{
            'Authorization': 'Bearer ' + flexatarApiSecret,
            "Content-Type":"application/json",
        },
     
    }
    if (reqBody){
        opts.body =  JSON.stringify(reqBody)
    }
    const resp = await fetch(url,opts)
    return resp
}

exports.getUserToken = async (req, res, next) => {


    const resp = await flexRequest("usertoken",req.body)
    if (resp.ok){
        return res.status(resp.status).json(await resp.json());
    }else{
        return res.status(resp.status).json({error:await resp.text()});
    }
    

};

exports.buySubscription = async (req, res) => {
    
    const resp = await flexRequest("buysubscription",req.body)
    // console.log(resp.text())
    // console.log(resp.status)
    if (resp.ok){
        return res.status(resp.status).send();
    }else{
        return res.status(resp.status).json({error:await resp.text()});
    }

};


exports.delSubscription = async (req, res) => {
    
    const resp = await flexRequest("delsubscription",req.body)

    if (resp.ok){
        return res.status(resp.status).send();
    }else{
        return res.status(resp.status).json({error:await resp.text()});
    }

};

exports.listSubscriptions = async (req, res, next) => {

    const resp = await flexRequest("listsubscription",req.body)
    
    if (resp.ok){
        return res.status(resp.status).json(await resp.json());
    }else{
        return res.status(resp.status).json({error:await resp.text()});
    }
   
    

};
exports.info = async (req, res, next) => {

    const resp = await flexRequest("info",req.body)
    
    if (resp.ok){
        return res.status(resp.status).json(await resp.json());
    }else{
        return res.status(resp.status).json({error:await resp.text()});
    }
   
    

};

