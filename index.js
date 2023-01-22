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
        const bookingsCollection=client.db('mrDoctor').collection('bookings')
        //for all services get
        app.get('/services',async(req,res)=>{
            const date=req.query.date;
            const query={}
            const options=await serviceCollection.find(query).toArray()
            const bookingQuery={appointmentDate: date}
            const alreadyBooked=await bookingsCollection.find(bookingQuery).toArray()
            options.forEach(option=>{
                const optionBooked=alreadyBooked.filter(book=>book.treatment===option.name)
                const bookedSlot=optionBooked.map(book=>book.slot)
                const remainingSlot=option.slots.filter(slot=>!bookedSlot.includes(slot))
                option.slots=remainingSlot
            })
            res.send(options)
        })

        //for booking
        app.post('/bookings',async(req,res)=>{
            const booking=req.body;
            const result=await bookingsCollection.insertOne(booking);
            res.send(result)
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