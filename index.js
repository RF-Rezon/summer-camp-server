const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

//   const authorization = req.headers.Authorization;
//   if (!authorization) {
//     return res.status(401).send({ error: true, message: "unauthorized access" });
//   }
//   // bearer token
//   const token = authorization.split(" ")[1];

//   jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ error: true, message: "unauthorized access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// };

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  const summerClassTakenStudent = client.db("summerDB").collection("classTakenUsers");

  try {
    await client.connect();

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

    app.get("/users", async (req, res) => {
      const cursor = await summerUsersCollectons.find().toArray();
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

    app.post("/newAddedClass", async (req, res) => {
      const newclass = req.body;
      const cursor = await summerAddedNewClass.insertOne(newclass);
      res.send(cursor);
    });

    app.get("/newAddedClass", async (req, res) => {
      const query = await summerAddedNewClass.find().toArray();
      res.send(query);
    });

    app.get("/newAddedClass/:email", async (req, res) => {
      const getEmail = req.params.email;
      const queryMail = { email: getEmail };
      const query = await summerAddedNewClass.find(queryMail).toArray();
      res.send(query);
    });

    app.patch("/newAddedClass/approve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: {
          status: "approved",
        },
      };

      const result = await summerAddedNewClass.updateOne(filter, updateStatus);
      res.send(result);
    });

    app.patch("/newAddedClass/feedBack/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const info = req.body.feedBack;

      const updateStatus = {
        $set: {
          feedBack: info,
        },
      };

      const result = await summerAddedNewClass.updateOne(query, updateStatus);
      res.send(result);
    });

    app.patch("/newAddedClass/deny/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: {
          status: "denied",
        },
      };

      const result = await summerAddedNewClass.updateOne(filter, updateStatus);
      res.send(result);
    });

    app.patch("/newAddedClass/makeadmin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const makeAdmin = {
        $set: {
          role: "admin",
        },
      };

      const result = await summerUsersCollectons.updateOne(filter, makeAdmin);
      res.send(result);
    });

    app.patch("/newAddedClass/makeinstructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const makeInstructor = {
        $set: {
          role: "instructor",
        },
      };

      const result = await summerUsersCollectons.updateOne(filter, makeInstructor);
      res.send(result);
    });

    // .............................................

    app.get("/classTakenStudents", async (req, res) => {
      const query = await summerClassTakenStudent.find().toArray();
      res.send(query);
    });

    app.post("/classTakenStudents", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await summerClassTakenStudent.findOne(query);

      if (existingUser) {
        const update = { $inc: { enrolled: 1 } };
        await summerClassTakenStudent.updateOne(query, update);
        return res.send({ message: "user already exists on the database." });
      }

      // Adding All users (user, intructor, admin) in the database.

      const result = await summerClassTakenStudent.insertOne(user);
      res.send(result);
    });

    app.delete("/classTakenStudents/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await summerClassTakenStudent.deleteOne(query);
      res.send(result);
    });

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
