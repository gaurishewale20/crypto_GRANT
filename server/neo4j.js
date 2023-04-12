(async () => {
  const neo4j = require("neo4j-driver");

  const uri = "neo4j+s://295605ef.databases.neo4j.io";
  const user = "neo4j";
  const password = "yN6nOqnv_BdyK7DYxzvladXKkxM9lDQcMFfcW0Znj9A";

  // To learn more about the driver: https://neo4j.com/docs/javascript-manual/current/client-applications/#js-driver-driver-object
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    const person1Name = "Alice";
    const person2Name = "David";

    await createFriendship(driver, person1Name, person2Name);

    await findPerson(driver, person1Name);
    await findPerson(driver, person2Name);
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Don't forget to close the driver connection when you're finished with it.
    await driver.close();
  }

  async function addCSV() {
    const session = driver.session({ database: "neo4j" });

    try {
      const uploadCSVquery = `LOAD CSV WITH HEADERS FROM 'file:///employees.csv' AS row
            MERGE (e:Employee {employeeId: row.Id, email: row.Email})
            WITH e, row
            UNWIND split(row.Skills, ':') AS skill
            MERGE (s:Skill {name: skill})
            MERGE (e)-[r:HAS_EXPERIENCE]->(s)`;

      // Write transactions allow the driver to handle retries and transient errors.
      const uploadResult = await session.executeWrite((tx) =>
        tx.run(uploadCSVquery)
      );

      // Check the write results.
      uploadResult.records.forEach((record) => {
        console.info(`Uploaded CSV File`);
      });
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      // Close down the session if you're not using it anymore.
      await session.close();
    }
  }

  async function createFriendship(driver, person1Name, person2Name) {
    // To learn more about sessions: https://neo4j.com/docs/javascript-manual/current/session-api/
    const session = driver.session({ database: "neo4j" });

    try {
      // To learn more about the Cypher syntax, see: https://neo4j.com/docs/cypher-manual/current/
      // The Reference Card is also a good resource for keywords: https://neo4j.com/docs/cypher-refcard/current/
      const writeQuery = `MERGE (p1:Person { name: $person1Name })
                                  MERGE (p2:Person { name: $person2Name })
                                  MERGE (p1)-[:KNOWS]->(p2)
                                  MERGE (p2)-[:KNOWS]->(p1)
                                  RETURN p1, p2`;

      // Write transactions allow the driver to handle retries and transient errors.
      const writeResult = await session.executeWrite((tx) =>
        tx.run(writeQuery, { person1Name, person2Name })
      );

      // Check the write results.
      writeResult.records.forEach((record) => {
        const person1Node = record.get("p1");
        const person2Node = record.get("p2");
        console.info(
          `Created friendship between: ${person1Node.properties.name}, ${person2Node.properties.name}`
        );
      });
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      // Close down the session if you're not using it anymore.
      await session.close();
    }
  }

  async function findPerson(driver, personName) {
    const session = driver.session({ database: "neo4j" });

    try {
      const readQuery = `MATCH (p:Person)
                              WHERE p.name = $personName
                              RETURN p.name AS name`;

      const readResult = await session.executeRead((tx) =>
        tx.run(readQuery, { personName })
      );

      readResult.records.forEach((record) => {
        console.log(`Found person: ${record.get("name")}`);
      });
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
})();

const fs = require("fs");
const csv = require("csv-parser");
const neo4j = require("neo4j-driver");

// Define the credentials and connection details for your Neo4j instance
const uri = "bolt://localhost:7687";
const user = "neo4j";
const password = "Pablo123";

// Connect to the database
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Define the path to the CSV file and read its contents
const csvPath = "./transactions.csv";
const transactions = [];

fs.createReadStream(csvPath)
  .pipe(csv())
  .on("data", (row) => {
    // Parse the row and add it to the transactions array
    transactions.push({
      senderBankId: row["Sender Bank ID"],
      receiverBankId: row["Receiver Bank ID"],
      txnDate: row["Txn Date"],
      valueDate: row["Value Date"],
      description: row["Description"],
      refNo: row["Ref No./Cheque No."],
      debit: parseFloat(row["Debit"]),
      credit: parseFloat(row["Credit"]),
      balance: parseFloat(row["Balance"]),
    });
  })
  .on("end", () => {
    // Once the CSV has been read, create the nodes and relationships
    createNodesAndEdges(transactions)
      .then(() => {
        console.log("All transactions processed successfully");
        driver.close();
      })
      .catch((error) => {
        console.error("An error occurred while processing transactions", error);
        driver.close();
      });
  });

// Define the function that creates the nodes and relationships
async function createNodesAndEdges(transactions) {
  const session = driver.session();
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


