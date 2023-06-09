const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@summerprojectcluster.iiq59ed.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const summerInstructors = client.db("summerDB").collection("instructors");
  const summerAddedNewClass = client.db("summerDB").collection("addedNewClass");
  const summerUsersCollectons = client.db("summerDB").collection("all_users");
  const summerClassTakenStudent = client.db("summerDB").collection("class_taken_users");

  try {
    // await client.connect();

    app.post("/users", async (req, res) => {
      const user = req.body;

      // Avoid adding rows in the dabase for the user alreary exist on the database.

      const query = { email: user.email };
      const existingUser = await summerUsersCollectons.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists on the database." });
      }

      // Adding All users (user, intructor, admin) in the database.

      const result = await summerUsersCollectons.insertOne(user);
      res.send(result);
    });

    app.get("/instructors", async (req, res) => {
      const cursor = await summerInstructors.find().toArray();
      res.send(cursor);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await summerUsersCollectons.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    app.get("/users/instructor/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await summerUsersCollectons.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    });

    app.get("/newAddedClass/:email", async (req, res) => {
      const getEmail = req.params.email;
      const queryMail = {email : getEmail};
      const query = await summerAddedNewClass.find(queryMail).toArray();
      res.send(query);
    });

    app.get("/newAddedClass", async (req, res) => {
      const query = await summerAddedNewClass.find().toArray();
      res.send(query);
    });
    
    app.post("/newAddedClass", async (req, res) => {
      const newclass = req.body;
      const cursor = await summerAddedNewClass.insertOne(newclass);
      res.send(cursor);
    });

    // app.get("/new_added_class/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = {email : {i_email: email}}
    //   const cursor = await summerAddedNewClass.find(query).toArray();
    //   console.log(cursor)
    //   if (cursor.length === 0) {
    //     res.status(404).json({ error: 'No users found' });
    //     return;
    //   }
    //   res.send(cursor);
    // });

    // app.post("/class_taken_students", async (req, res) => {
    //   const user = req.body;

    //   // Avoid adding rows in the dabase for the user alreary exist on the database.

    //   const query = { email: user.email };
    //   const existingUser = await summerClassTakenStudent.findOne(query);

    //   if (existingUser) {
    //     return res.send({ message: "This user already taken the class." });
    //   }

    //   // Adding All users (user, intructor, admin) in the database.

    //   const result = await summerClassTakenStudent.insertOne(user);
    //   res.send(result);
    // });

    // app.get("/class_taken_students", async (req, res) => {
    //   const cursor = await summerClassTakenStudent.find().toArray();
    //   res.send(cursor);
    // });

    // app.post("/student", async (req, res) => {
    //   const data = req.body;
    //   console.log(data)
    //   // const cursor = await summerInstructors.find().toArray();
    //   res.send();
    // });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
