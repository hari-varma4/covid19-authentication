const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbpath = path.join(__dirname, "covid19IndiaPortal.db");
let db = null;
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const initser = async (request, response) => {
  db = await open({
    filename: dbpath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Running");
  });
};
initser();

const authenticate = async (request, response, next) => {
  let acctok;
  const authohed = request.headers["authorization"];
  if (authohed === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  }
  if (authohed !== undefined) {
    acctok = authohed.split(" ")[1];
  } else {
    jwt.verify(acctok, "My_Secrete_Token", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        //playload.username=
        next();
      }
    });
  }
};
app.post("/login/", authenticate, async (request, response) => {
  const { username, password } = request.body;
  const qu = `
           select * from user where username="${username}"
    `;
  const qures = await db.get(qu);
  if (qures === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const pass = await bcrypt.compare(password, qures.password);
    if (pass === true) {
      const payload = {
        username: username,
      };

      const acctok = jwt.sign(payload, "My_Secrete_Token");
      response.send({ acctok });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
