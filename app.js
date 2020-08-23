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


app.get("/all", async (req, res) => {
    client
        .query("SELECT * from phishtank")
        .then((result) => {
            // console.log(result);
            res.send(result.rows);
        })
        .catch((err) => {
            console.log(err);
        });
});


app.get("/api/search/:param", async (req, res) => {
    console.log(req.params.param);

    client
        .query("SELECT * from phishtank WHERE url = $1", [req.params.param])
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


app.post('/api/checkpish', function (req, resw) {
    var url = req.body.url;
    var finish = true;
    console.log(url);

    checkRank(url).then((res) => {
        if (res.data.response[0].rank) {
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