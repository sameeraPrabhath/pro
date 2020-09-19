const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { Client } = require("pg");

const client = new Client({
  connectionString: "postgres://hsahkdaw:JWgvRmKRS-qp_7KERaEHF03KZs2b6Lj5@lallah.db.elephantsql.com:5432/hsahkdaw"
});

const port = process.env.PORT || 3000;

var app = express();
app.use(bodyParser.json())
var corsOptions = {
  credentials: true, origin: true
}
app.use(cors(corsOptions))




//////File read//////////////////////////
var fs = require('fs');
const { text } = require('body-parser');
let queary = "INSERT INTO  alexa(url) VALUES ";
var urlArray = [];
async function readmyfile() {
  try {
    const data = await fs.readFileSync("top-1mtext.txt")
    urlArray = data.toString().split('\r\n');
  } catch (error) {
    console.log(error)
  }

  urlArray.forEach((element, i) => {
    console.log(i)
    queary = queary + ` ('${element}') ,`;

  })
  let modifyqueary = queary.substring(0, queary.length - 2) + `;`;
  console.log(modifyqueary);
  client
    .query(modifyqueary)
    .then((result) => {
      console.log(result);
      //   res.send(result);  
    })
    .catch((err) => {
      console.log(err);
    });
  console.log("result");
}

app.get("/filereadapi", async (req, res) => {
  readmyfile();
});
////////////ENd file read /////////////////////


//////////////////create table////////////////////////
app.get("/tablecalex", async (req, res) => {
  client.query("CREATE TABLE alexa(url text)", (err, result) => {
    console.log(err, result);
    // pool.end();
    res.send(result);
  });

});
//////////////end create table ///////////////////////


////// Main API ///////////////
app.post("/api/searchUrl", async (req, res) => {
  var domainName
  if (req.body.url.split("//")[1]) {
    domainName = req.body.url.split("//")[1].split("/")[0];
  }
  else {
    domainName = req.body.url;
  }
  client
    .query("SELECT * from alexa WHERE url = $1", [domainName])
    .then((result) => {
      let found = result.rowCount ? true : false;

      if (found) {
        res.json({
          whiteList: true,
          blackList: false,
          notFound: false,
        });
      }
      else {

        client
          .query("SELECT * FROM phishtank WHERE url LIKE $1", [req.body.url])
          .then((presult) => {
            let found = presult.rowCount ? true : false;
            res.json({
              whiteList: false,
              blackList: found,
              notFound: !found,
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }

    })
    .catch((err) => {
      console.log(err);
    });
});

////////End Main API /////////


app.get("/api/searchinphish/:param", async (req, res) => {
  console.log(req.params.param);
  client
    .query("SELECT * FROM phishtank WHERE url LIKE $1", ["%//" + req.params.param + "%"])
    .then((result) => {
      let found = result.rowCount ? true : false;
      res.json({
        query: req.params.param,
        rows: result.rows,
        rowCount: result.rowCount,
        found: found,
      });
    })
    .catch((err) => {
      console.log(err);
    });

});


app.get("/api/search/:param", async (req, res) => {
  console.log(req.params.param);

  client
    .query("SELECT * from alexa WHERE url = $1", [req.params.param])
    .then((result) => {
      let found = result.rowCount ? true : false;
      res.json({
        query: req.params.param,
        rows: result.rows,
        rowCount: result.rowCount,
        found: found,
      });
    })
    .catch((err) => {
      console.log(err);
    });

});



app.get("/all", async (req, res) => {
  client
    .query("SELECT * from alexa")
    .then((result) => {
      console.log(result.rows.length);
      res.send(result.rows);
    })
    .catch((err) => {
      console.log(err);
    });
});




/////////OLD///////////////////////////////
/////////////////////////////

//insert data from firebase //////////////////////////////
app.get("/insertbatch", async (req, res) => {
  let queary = "INSERT INTO  phishtank(url) VALUES ";

  axios
    .get(
      "https://test-udemy-fcbd0.firebaseio.com/domnames/-MF6HluQsn-czUhiyl7B/url.json"
    )
    .then((result) => {
      console.log(result.data);

      result.data.forEach((element) => {
        console.log(element);
        queary = queary + ` ('${element}') ,`;
      });

      console.log(queary.slice(0, 70));
      console.log(queary.slice(queary.length - 30, queary.length));
      let modifyqueary = queary.substring(0, queary.length - 2);
      modifyqueary = modifyqueary + `;`;

      console.log(
        modifyqueary.slice(modifyqueary.length - 30, modifyqueary.length)
      );

      client
        .query(modifyqueary)
        .then((result) => {
          console.log(result);
          res.send(result);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });

});
///////////////////////////////////////
////////////////////////////end insert form fire///////// /////////// 



function checkRank(url) {
  const config = {
    headers: {
      "API-OPR": "40k4g8kww4s08kcw4oc4kowckkoooko88sk8wk44"
    }
  };
  return axios.get('https://openpagerank.com/api/v1.0/getPageRank?domains[]=' + url, config)
}

function CheckInPhishtank(url) {
  return client.query("SELECT * from phishtank WHERE url = $1", [url])
}

app.post('/api/checkpish', function (req, resw) {
  var url = req.body.url;
  var finish = true;
  console.log(url);

  checkRank(url).then((res) => {
    if (res.data.response[0].rank) {
      console.log(res.data.response[0]);

      resw.status(200).json({ status: 'ela' })
    }
    else {
      CheckInPhishtank(url).then((result) => {
        let found = result.rowCount ? true : false;
        resw.json({
          query: req.params.param,
          rows: result.rows,
          rowCount: result.rowCount,
          found: found,
        });
      })
        .catch((err) => {
          resw.status(400).json({ status: 'error', error: 'Something went Wrong' })
        });

    }
  }).catch((err) => {
    resw.status(400).json({ status: 'error', error: 'req body cannot be empty' })
  })
})

/////////////////////////end OLD ////////////////////




client.connect((err) => {
  if (err) {
    console.error("connection error", err.stack);
  } else {
    console.log("connected postgreSQL");
  }
});

var server = app.listen(port, () => {
  console.log("server is running on port: " + port);
})