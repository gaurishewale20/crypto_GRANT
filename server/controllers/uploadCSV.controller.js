const fs = require("fs");
const csv = require("csv-parser");
require("dotenv").config();

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
          refNo: row["Ref No./Cheque No."],
          debit: parseFloat(row["Debit"]),
          credit: parseFloat(row["Credit"]),
          balance: parseFloat(row["Balance"]),
          bank: row["Bank"],
        });
      })
      .on("end", () => {
        // Once the CSV has been read, create the nodes and relationships
        createNodesAndEdges(transactions)
          .then(() => {
            console.log("All transactions processed successfully");
            res.send({"message": "done"});
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
      console.log(transactions);
      const session = driver.session();
      console.log(session);
      try {
        for (const transaction of transactions) {
          // Create the sender and receiver bank nodes, if they don't exist already
          const senderBankId = transaction.senderBankId;
          const receiverBankId = transaction.receiverBankId;

          await session.run("MERGE (sender:Bank {id: $senderBankId})", {
            senderBankId,
          });
          await session.run("MERGE (receiver:Bank {id: $receiverBankId})", {
            receiverBankId,
          });

          // Create the TRANSACTION relationship between the banks
          await session.run(
            "MATCH (sender:Bank {id: $senderBankId}), (receiver:Bank {id: $receiverBankId}) \
         CREATE (sender)-[:TRANSACTION {txnDate: $txnDate, valueDate: $valueDate, description: $description, refNo: $refNo, debit: $debit, credit: $credit, balance: $balance}]->(receiver)",
            { senderBankId, receiverBankId, ...transaction }
          );

          console.log(
            `Created transaction with attributes: senderBankId=${senderBankId}, receiverBankId=${receiverBankId}, txnDate=${transaction.txnDate}, valueDate=${transaction.valueDate}, description=${transaction.description}, refNo=${transaction.refNo}, debit=${transaction.debit}, credit=${transaction.credit}, balance=${transaction.balance}`
          );
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

  session.run(nodeFetchQuery).then((result) => {
    // console.log(result.records);
    result.records.forEach((record) => {
      nodes.push({'id': record.get('b.id'), 'group': 1});
    });
  }).catch((error) => {
    console.error(error);
  }).finally(() => {

    const query = `
    MATCH (sender:Bank)-[t:TRANSACTION]->(receiver:Bank)
    RETURN sender.id AS SenderBankID, receiver.id AS ReceiverBankID, t.txnDate AS TxnDate, t.valueDate AS ValueDate, t.description AS Description, t.refNoChequeNo AS RefNoChequeNo, t.debit AS Debit, t.credit AS Credit, t.balance AS Balance
  `;

  session
    .run(query)
    .then((result) => {
      // console.log(result);
      result.records.forEach((record) => {
        console.log(
          record.get("SenderBankID"),
          record.get("ReceiverBankID"),
          record.get("TxnDate"),
          record.get("ValueDate"),
          record.get("Description"),
          record.get("RefNoChequeNo"),
          record.get("Debit"),
          record.get("Credit"),
          record.get("Balance")
        );
        links.push({
          'source': record.get("SenderBankID"),
          'target': record.get("ReceiverBankID"),
          'value': 1
        });
      });
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      session.close();
      driver.close();
      res.send({nodes, links});
    });
  });
  
};
