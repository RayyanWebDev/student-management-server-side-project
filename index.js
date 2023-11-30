const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ykjz5lg.mongodb.net/?retryWrites=true&w=majority`;
// import { ObjectId } from "bson";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const paidCollection = client.db("paidDB").collection("paid");
    const assignmentCollection = client
      .db("assignmentDB")
      .collection("assignment");
    const homeClassCollection = client.db("hClassDB").collection("hClassInfo");
    const assignmentPostCollection = client
      .db("assignmentPostDB")
      .collection("assignmentPost");
    const paymentCollection = client.db("paymentDB").collection("classPayment");
    const feedCollection = client.db("feedDB").collection("feedPayment");
    const userCollection = client.db("adroitDB").collection("users");
    const teacherCollection = client.db("teacherDB").collection("teacherInfo");
    const classCollection = client.db("classTeacherDB").collection("classInfo");
    const classesCollection = client
      .db("enrolledClassDB")
      .collection("classes");

    // middleware
    const verifyToken = (req, res, next) => {
      //   console.log("verified token", req.headers.authorization);
      //   next();

      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized chamber" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: "unauthorized chamber" });
        }
        req.decoded = decoded;
        next();
      });
    };
    //
    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden chamber" });
      }
      next();
    };

    // users api

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden chamber" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      //   insert email
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    //
    // enrolled api
    app.get("/paid", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await paidCollection.find(query).toArray();
      res.send(result);
    });
    // payment api

    app.post("/paid", async (req, res) => {
      const item = req.body;
      const result = await paidCollection.insertOne(item);
      res.send(result);
    });
    app.post("/classPayment", async (req, res) => {
      const item = req.body;
      const result = await paymentCollection.insertOne(item);
      res.send(result);
    });

    app.get("/classPayment", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });
    // enroll class api

    app.post("/classes", async (req, res) => {
      const item = req.body;
      const result = await classesCollection.insertOne(item);
      res.send(result);
    });
    app.get("/feedPayment", async (req, res) => {
      const result = await feedCollection.find().toArray();
      res.send(result);
    });
    app.post("/feedPayment", async (req, res) => {
      const item = req.body;
      const result = await feedCollection.insertOne(item);
      res.send(result);
    });
    app.get("/classes", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    // home Class api

    app.post("/hClassInfo", async (req, res) => {
      const item = req.body;
      const result = await homeClassCollection.insertOne(item);
      res.send(result);
    });

    app.get("/hClassInfo", async (req, res) => {
      const result = await homeClassCollection.find().toArray();
      res.send(result);
    });

    // classInfo api
    app.post("/classInfo", async (req, res) => {
      const item = req.body;
      const result = await classCollection.insertOne(item);
      res.send(result);
    });
    app.post("/assignment", async (req, res) => {
      const item = req.body;
      const result = await assignmentCollection.insertOne(item);
      res.send(result);
    });
    app.post("/assignmentPost", async (req, res) => {
      const item = req.body;
      const result = await assignmentPostCollection.insertOne(item);
      res.send(result);
    });
    app.get("/assignment", async (req, res) => {
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });
    app.get("/classInfo", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/classesInfo", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });
    app.get("/classesInfo:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.findOne(query);
      res.send(result);
    });
    app.patch("/classesInfo:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          image: item.image,
          description: item.description,
          price: item.price,

          title: item.title,
        },
      };
      const result = await classCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //
    app.post("/teacherInfo", async (req, res) => {
      const item = req.body;
      const result = await teacherCollection.insertOne(item);
      res.send(result);
    });
    app.get("/teacherInfo", async (req, res) => {
      const result = await teacherCollection.find().toArray();
      res.send(result);
    });
    // delete teacher request
    app.delete("/teacherInfo/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await teacherCollection.deleteOne(query);
      res.send(result);
    });

    // Class delete
    app.delete("/classesInfo/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.deleteOne(query);
      res.send(result);
    });

    // app.delete("/classInfo/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await classCollection.deleteOne(query);
    //   res.send(result);
    // });

    // teacher varify
    // fsdfsdfd
    // new@gmail.com
    // gdaggadgf
    // teachers@gmail.com
    app.get("/teacherInfo/teacher/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized chamber" });
      }
      const query = { email: email };
      const user = await teacherCollection.findOne(query);
      let teacher = false;
      if (user) {
        teacher = user?.role === "teacher";
      }
      res.send({ teacher });
    });

    // make admin
    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    app.patch("/teacherInfo/teacher/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "teacher",
        },
      };
      const result = await teacherCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.patch("/classPayment/payment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "paid",
        },
      };
      const result = await paymentCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.patch("/classesInfo/class/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await classCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("adroit is on move");
});

app.listen(port, () => {
  console.log(`Adroit is moving on port ${port}`);
});
