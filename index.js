const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
const app = express();

//Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fpvwzmp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri)

async function run() {
    try {
        const serviceCollection = client.db('mrDoctor').collection('services')
        const bookingsCollection = client.db('mrDoctor').collection('bookings')
        const usersCollection = client.db('mrDoctor').collection('users')
        const doctorsCollection = client.db('mrDoctor').collection('doctors')


        function verifyJWT(req, res, next) {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).send('unauthorized access')
            }
            const token = authHeader.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
                if (err) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                req.decoded = decoded;
                next();
            })

        }
        //for all services get
        app.get('/services', async (req, res) => {
            const date = req.query.date;
            const query = {}
            const options = await serviceCollection.find(query).toArray()
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray()
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookedSlot = optionBooked.map(book => book.slot)
                const remainingSlot = option.slots.filter(slot => !bookedSlot.includes(slot))
                option.slots = remainingSlot
            })
            res.send(options)
        })

        //for post booking to mongoDb
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
        })
        //getting bookings 
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const user = { email: email }
            const result = await bookingsCollection.find(user).toArray()
            res.send(result)
        })
        //for users profile get 
        app.get('/users', async (req, res) => {
            const email = req.query.email;
            console.log(email)
            const user = { email: email };
            const result = await usersCollection.find(user).toArray();
            res.send(result)
        })
        //jwt
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })
        //save users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })
        //get all users
        app.get('/dashboard/users', async (req, res) => {
            const query = {}
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/appointmentsServices', async (req, res) => {
            const query = {};
            const result = await serviceCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })

        //for admin role
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, option);
            res.send(result)
        })
        //POST DOCTOR
        app.post('/doctors', async (req, res) => {
            const doctors = req.body;
            const result = await doctorsCollection.insertOne(doctors);
            res.send(result)
        })
        //GET DOCTOR
        app.get('/doctors', async (req, res) => {
            const query = {}
            const result = await doctorsCollection.find(query).toArray()
            res.send(result)
        })
        app.delete('/doctors/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result=await doctorsCollection.deleteOne(filter)
            res.send(result)
        })



    }
    finally {

    }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('mr.doctor server is running')
})

app.listen(port, () => console.log(`mr.doctor is running on ${port}`))