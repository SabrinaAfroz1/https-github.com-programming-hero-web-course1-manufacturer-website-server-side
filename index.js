const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jrqo1gw.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });

    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('sabrina-assignment12').collection('tools');
        const purchaseCollection = client.db('sabrina-assignment12').collection('purchase');
        const userCollection = client.db('sabrina-assignment12').collection('users');
        const reviewCollection = client.db('sabrina-assignment12').collection('review');



        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolsCollection.findOne(query);
            res.send(tool);

        })

        app.post('/tools', async (req, res) => {
            const newTool = req.body;
            const result = await toolsCollection.insertOne(newTool);
            res.send(result);

        })

        app.put('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const updateTool = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    available: updateTool.restQuantity,
                }
            }
            const result = await toolsCollection.updateOne(filter, updateDoc,
                options
            );
            res.send(result);
        });


          //delete----------------------
          app.delete('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolsCollection.deleteOne(query);
            res.send(result);
        })


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token: token });
        })



        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.post('/review', async (req, res) => {
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result);

        })









        app.get('/purchase', verifyJWT, async (req, res) => {
            const user = req.query.user;
            const decodedEmail = req.decoded.email;
            if (user === decodedEmail) {
                const query = { user: user };
                const bookings = await purchaseCollection.find(query).toArray();
                return res.send(purchase);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' });
            }

        })


        app.get('/purchase', async (req, res) => {
            const query = {};
            const cursor = purchaseCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.post('/purchase', async (req, res) => {
            const newItem = req.body;
            const result = await purchaseCollection.insertOne(newItem);
            res.send(result);

        })





        //for get all user ---------admin
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        //for admin user ----------------------
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });

            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' });
            }

        })

        //admin-----------------check admin or not
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })






    } finally {

    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send(" done all");
})

app.listen(port, () => {
    console.log("listening the port")
})