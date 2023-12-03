const express = require("express");
const nodemailer = require('nodemailer');

const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const app = express();
require("dotenv").config();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(cors());

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

   

    app.post("/classTakenStudents", async (req, res) => {
      const user = req.body;
      const result = await summerClassTakenStudent.insertOne(user);
      res.send(result);
    });

    app.get("/classTakenStudents/:email", async (req, res) => {
      const userEmail =  req.params.email;
      const finalUserMail = {email : userEmail}
      const query = await summerClassTakenStudent.find(finalUserMail).toArray();
      res.send(query);
    });

    app.delete("/classTakenStudents/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await summerClassTakenStudent.deleteOne(query);
      res.send(result);
    });

    ///////////////////////////////// - PAYMENT - /////////////////////////////////////////////////////
// >>>>>>>>>>>>>>>>>>>>> First Process >>>>>>>>>>>>>>>>>>>>>>>>>>>

    // app.post("/checkout", async(req, res)=> {
    //  try{
    //   const session = await stripe.checkout.sessions.create({
    //     mode: 'payment',
    //     success_url: `${DOMAIN}/success`,
    //     cancel_url: `${DOMAIN}/cancel`,
    //     line_items: req.body.courses.map(item => {
    //       return {
    //         price_data:{
    //           currency:"inr",
    //           product_data:{
    //             email:item.email
    //           },
    //           unit_amount:item.price,
    //         }
    //       }
    //     })
    //   });
    
    //   res.json({url:session.url});
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: calculateOrderAmount(items),
    //     currency: 'usd',
    //     receipt_email: email,
    //   });

    //   res.json({ clientSecret: paymentIntent.client_secret });

    //  }catch (error) {
    //   res.status(500).json({error:error.message})
    //   console.log("Problem is here")
    //  }
    // })


    // >>>>>>>>>>>>>>>>>>>>> Sceond Process >>>>>>>>>>>>>>>>>>>>>>>>>>>
    app.post('/create-payment', async (req, res) => {
      const { id, price, email } = req.body;
    
      const paymentIntent = await stripe.paymentIntents.create({
        amount: +price,
        currency: 'usd',
        receipt_email: email,
      });
    
      sendInvoiceEmail(email, paymentIntent.invoice);
    
      res.json({ clientSecret: paymentIntent.client_secret });
    });

    async function sendInvoiceEmail(email, invoiceId) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASS,
        },
      });
    
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Invoice',
        text: 'Please find attached invoice.',
        attachments: [
          {
            filename: 'invoice.pdf',
            path: `https://invoices.stripe.com/invoiceitems/${invoiceId}/invoice.pdf`,
          },
        ],
      };
    
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    }
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
