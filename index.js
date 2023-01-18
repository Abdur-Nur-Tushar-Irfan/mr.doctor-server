const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port=process.env.PORT || 5000

const app=express();

//Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fpvwzmp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri)

async function run(){
    try{
        const serviceCollection=client.db('mrDoctor').collection('services')
        //for all services get
        app.get('/services',async(req,res)=>{
            const query={}
            const options=await serviceCollection.find(query).toArray()
            res.send(options)
        })

    }
    finally{

    }
}
run().catch(console.log)


app.get('/',async(req,res)=>{
    res.send('mr.doctor server is running')
})

app.listen(port,()=>console.log(`mr.doctor is running on ${port}`))