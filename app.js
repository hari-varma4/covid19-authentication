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
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  }
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
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
app.post("/login/", async (request, response) => {
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

      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

function obr(obj) {
  return {
    stateID: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
}

app.get("/states/", authenticate, async (request, response) => {
  const query = `
    select * from state
    
    `;
  const res = await db.all(query);
  console.log(res);
  response.send(
    res.map((each) => {
      obr(each);
    })
  );
});

app.get("/states/:stateId/", authenticate, async (request, response) => {
  const { stateId } = request.params;
  const quee = `
    select * from state where state_id="${stateId}"
    `;
  const res = await db.get(quee);

  response.send(obr(res));
});
app.post("/districts/", async (request, response) => {
  const detailstopost = request.body;
  const { districtName, stateid, cases, cured, active, deaths } = detailstopost;
  const query = `
    insert into district (district_name,state_id,cases,cured,active,deaths)
    values ("${districtName}","${stateid}","${cases}","${cured}","${active}","${deaths}")
    `;
  const re = await db.run(query);
  const districtid = re.lastId;
  response.send("District Successfully Added");
});

function obb(ob) {
  return {
    districtId: ob.district_id,
    districtName: ob.district_name,
    stateId: ob.state_id,
    cases: ob.cases,
    cured: ob.cured,
    active: ob.active,
    deaths: ob.deaths,
  };
}
app.get("/districts/:districtId/", authenticate, async (request, response) => {
  const { districtId } = request.params;

  const query = ` select * from district
    where district_id=${districtId}`;
  const re = await db.get(query);

  response.send(obb(re));
});

app.delete("/districts/:districtId/",  authenticate,async (request, response) => {
  const { districtId } = request.params;
  const quer = `
delete from district where district_id=${districtId}

`;
  const re = await db.run(quer);
  response.send("District Removed");
});

app.put("/districts/:districtId/", authenticate, async (request, response) => {
  const { districtId } = request.params;
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const quer = `
      update district set 
  
    district_name=  "${districtName}",state_id="${stateId}",cases="${cases}",cured="${cured}",active="${active}",deaths="${deaths}"
   where district_id="${districtId}"
    `;
  const re = await db.run(quer);

  response.send("District Details Updated");
});

app.get("/states/:stateId/stats", authenticate, async (request, response) => {
  const { stateId } = request.params;

  const query = ` select sum(cases) ,
  sum(cured) ,sum(active) , sum(deaths) from district 
    where state_id=${stateId}`;
  const re = await db.get(query);

  response.send({
    totalCases: re["sum(cases)"],
    totalCured: re["sum(cured)"],
    totalActive: re["sum(active)"],
    totalDeaths: re["sum(deaths)"],
  });
});
module.exports=app