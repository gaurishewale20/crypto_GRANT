const fs = require("fs");
const csv = require("csv-parser");
require("dotenv").config();
const neo4j = require("neo4j-driver");

exports.uploadCSVController = async (req, res) => {
  console.log("req", req.files[0]);
  console.log("req", req.body.bankNames);

  const bank = req.body.bankNames;
  const file = req.files[0];
  console.log(typeof file);

  (async () => {
    const neo4j = require("neo4j-driver");

    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;
    console.log(uri);
    //   // To learn more about the driver: https://neo4j.com/docs/javascript-manual/current/client-applications/#js-driver-driver-object
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

    console.log("Connected", driver);

    //   // Define the path to the CSV file and read its contents
    //   const csvPath = "import/transactions.csv";
    const transactions = [];

    let inputFile = Buffer.from(file.buffer).toString();
    console.log("inpppppp", inputFile);
    fs.writeFile("input.csv", inputFile, (err) => {
      if (!err) console.log("Data written");
    });

    fs.createReadStream("input.csv")
      .pipe(csv())
      .on("data", (row) => {
        // Parse the row and add it to the transactions array
        transactions.push({
          txnDate: row["Txn Date"],
          senderBankId: row["Sender No"],
          receiverBankId: row["Recipient No"],
          valueDate: row["Value Date"],
          description: row["Description"],
          refNo: parseFloat(row["Ref No./Cheque No."]),
          debit: parseFloat(row["Debit"]),
          credit: parseFloat(row["Credit"]),
          balance: parseFloat(row["Balance"]),
          amount: parseFloat(row["Amount"]),
          bank: row["Bank"],
          location: row["Location"],
        });
      })
      .on("end", () => {
        // Once the CSV has been read, create the nodes and relationships
        createNodesAndEdges(transactions)
          .then(() => {
            console.log("All transactions processed successfully");
            res.send({ message: "done" });
            driver.close();
          })
          .catch((error) => {
            console.error(
              "An error occurred while processing transactions",
              error
            );
            driver.close();
          });
      });

    // Define the function that creates the nodes and relationships
    async function createNodesAndEdges(transactions) {
      console.log("transactions", transactions);
      const session = driver.session();
      // console.log(session);
      try {
        for (const transaction of transactions) {
          // Create the sender and receiver bank nodes, if they don't exist already
          const senderBankId = `${parseInt(transaction.senderBankId)}`;
          const receiverBankId = `${parseInt(transaction.receiverBankId)}`;
          const refNo = transaction.refNo;
          transaction.senderBankId = senderBankId;
          transaction.receiverBankId = receiverBankId;

          let result2 = await session.run(
            "MATCH (sender:Bank )-[t:TRANSACTION {refNo: $refNo}]->(receiver:Bank) RETURN  t.refNo AS RefNoChequeNo",
            {
              refNo,
            }
          );
          console.log("result2", result2.records.length);
          // const list = new Array(result);
          // let flag = 0

          // console.log("list", list[0].records.length);
          // for (let i = 0; i < list[0].records.length; i++) {
          //   console.log("lisssttt", list[0].records[i].get("RefNoChequeNo"))
          //   if (refNo == list[0].records[i].get("RefNoChequeNo")) {
          //     console.log(
          //       `Transaction is already added with senderId=${senderBankId}, recipientId=${receiverBankId} and refNo=${refNo}`
          //     );
          //     flag = 1;
          //     break;
          //   }
          // }
          if (result2.records.length == 0) {
            await session.run("MERGE (sender:Bank {id: $senderBankId})", {
              senderBankId,
            });
            await session.run("MERGE (receiver:Bank {id: $receiverBankId})", {
              receiverBankId,
            });
            console.log(senderBankId);
            console.log(receiverBankId);

            // Create the TRANSACTION relationship between the banks
            await session.run(
              "MATCH (sender:Bank {id: $senderBankId}), (receiver:Bank {id: $receiverBankId}) \
           CREATE (sender)-[:TRANSACTION {txnDate: $txnDate, valueDate: $valueDate, description: $description, refNo: $refNo, debit: $debit, credit: $credit, balance: $balance, amount: $amount, location: $location}]->(receiver)",
              { senderBankId, receiverBankId, ...transaction }
            );

            console.log(
              `Created transaction with attributes: senderBankId=${senderBankId}, receiverBankId=${receiverBankId}, txnDate=${transaction.txnDate}, valueDate=${transaction.valueDate}, description=${transaction.description}, refNo=${transaction.refNo}, debit=${transaction.debit}, credit=${transaction.credit}, balance=${transaction.balance}, amount=${transaction.amount}, location=${transaction.location}`
            );
            // fs.unlink("./input.csv", (err) => {
            //   if (err) {
            //     throw err;
            //   }

            //   console.log("Deleted File successfully.");
            // });
          }
        }
      } finally {
        await session.close();
      }
    }
  })();
};

exports.extractData = async (req, res) => {
  console.log("===== EXTRACT DATA =======");
  const neo4j = require("neo4j-driver");

  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );

  const session = driver.session();
  const nodes = [];
  const links = [];

  const nodeFetchQuery = `
    MATCH (b:Bank)
    RETURN b.id
  `;

  session
    .run(nodeFetchQuery)
    .then((result) => {
      // console.log(result.records);
      result.records.forEach((record) => {
        nodes.push({ id: record.get("b.id"), group: 1 });
      });
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      const query = `
    MATCH (sender:Bank)-[t:TRANSACTION]->(receiver:Bank)
    RETURN sender.id AS SenderBankID, receiver.id AS ReceiverBankID, t.txnDate AS TxnDate, t.valueDate AS ValueDate, t.description AS Description, t.refNo AS RefNoChequeNo, t.debit AS Debit, t.credit AS Credit, t.balance AS Balance, t.location AS Location
  `;

      session
        .run(query)
        .then((result) => {
          result.records.forEach((record, index) => {
            console.log(
              record.get("SenderBankID"),
              record.get("ReceiverBankID"),
              record.get("TxnDate"),
              record.get("ValueDate"),
              record.get("Description"),
              record.get("RefNoChequeNo"),
              record.get("Debit"),
              record.get("Credit"),
              record.get("Balance"),
              record.get("Location")
            );
            links.push({
              source: record.get("SenderBankID"),
              target: record.get("ReceiverBankID"),
              refNo: record.get("RefNoChequeNo"),
              amount: record.get("Debit") == "0" ? record.get("Credit") : record.get("Debit"),
              description: record.get("Description"),
              txnDate: record.get("TxnDate"),
              location: record.get("Location"),
              curvature: index/result.records.length,
            });
          });
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          session.close();
          driver.close();
          res.send({ nodes, links });
        });
    });
};

exports.pageRank = async (req, res) => {
  console.log("===== EXTRACT DATA =======");
  const neo4j = require("neo4j-driver");

  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );

  const session = driver.session();
  const results = [];

  const query = `
    CALL gds.pageRank.stream('transactions', {
      dampingFactor: 0.85,
      maxIterations: 20
  })
  YIELD nodeId, score
  RETURN gds.util.asNode(nodeId).id AS node, score
  ORDER BY score DESC
  LIMIT 10
  `;

  session
    .run(nodeFetchQuery)
    .then((result) => {
      // console.log(result.records);
      result.records.forEach((record) => {
        results.push(record.get("node"), record.get("score"));
      });
      console.log(results);
      res.send(results);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      session.close();
      driver.close();
      // res.send({nodes, links});
    });
};

exports.getCycles = async (req, res) => {
  console.log("===== Get Cycles =======");

  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );

  const session = driver.session();
  // Txn Date,Sender No,Recipient No,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance,Bank
  const query = `
    MATCH R=(N)-[*]->(N) RETURN NODES(R)
  `;

  const results = [];

  session
    .run(query)
    .then((result) => {
      // console.log(result);
      result.records.forEach((record) => {
        const nodes = record.get("NODES(R)");
        console.log(nodes.map((node) => node.properties));
        results.push(nodes.map((node) => node.properties));
      });
      res.send(results);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      session.close();
      driver.close();
      // res.send(result.record);
    });
};

// CALL gds.eigenvector.stream('transactions', {
//   maxIterations: 20
// })
// YIELD nodeId, score
// RETURN gds.util.asNode(nodeId).id AS node, score
// ORDER BY score DESC
// LIMIT 10

exports.eigenVectorCentrality = async (req, res) => {
  console.log("===== EXTRACT DATA =======");
  const neo4j = require("neo4j-driver");

  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );

  const session = driver.session();
  const results = [];

  const query = `
    CALL gds.eigenvector.stream('transactions', {
      maxIterations: 20
    })
    YIELD nodeId, score
    RETURN gds.util.asNode(nodeId).id AS node, score
    ORDER BY score DESC
    LIMIT 10
  `;

  session
    .run(query)
    .then((result) => {
      // console.log(result);
      result.records.forEach((record) => {
        results.push(record.get("node"), record.get("score"));
      });
      console.log(results);
      res.send(results);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      session.close();
      driver.close();
      // res.send({nodes, links});
    });
};
