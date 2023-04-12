const fs = require('fs');
const csv = require('csv-parser');
const neo4j = require('neo4j-driver');

// Define the credentials and connection details for your Neo4j instance
const uri = 'bolt://localhost:7687';
const user = 'neo4j';
const password = 'Pablo123';

// Connect to the database
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Define the path to the CSV file and read its contents
const csvPath = './transactions1.csv';
const transactions = [];

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    // Parse the row and add it to the transactions array
    transactions.push({
      senderBankId: row['Sender Bank ID'],
      receiverBankId: row['Receiver Bank ID'],
      txnDate: row['Txn Date'],
      valueDate: row['Value Date'],
      description: row['Description'],
      refNo: row['Ref No./Cheque No.'],
      debit: parseFloat(row['Debit']),
      credit: parseFloat(row['Credit']),
      balance: parseFloat(row['Balance'])
    });
  })
  .on('end', () => {
    // Once the CSV has been read, create the nodes and relationships
    createNodesAndEdges(transactions)
      .then(() => {
        console.log('All transactions processed successfully');
        driver.close();
      })
      .catch((error) => {
        console.error('An error occurred while processing transactions', error);
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

      await session.run(
        'MERGE (sender:Bank {id: $senderBankId})',
        { senderBankId }
      );
      await session.run(
        'MERGE (receiver:Bank {id: $receiverBankId})',
        { receiverBankId }
      );

      // Create the TRANSACTION relationship between the banks
      await session.run(
        'MATCH (sender:Bank {id: $senderBankId}), (receiver:Bank {id: $receiverBankId}) \
         CREATE (sender)-[:TRANSACTION {txnDate: $txnDate, valueDate: $valueDate, description: $description, refNo: $refNo, debit: $debit, credit: $credit, balance: $balance}]->(receiver)',
        { senderBankId, receiverBankId, ...transaction }
      );

      console.log(`Created transaction with attributes: senderBankId=${senderBankId}, receiverBankId=${receiverBankId}, txnDate=${transaction.txnDate}, valueDate=${transaction.valueDate}, description=${transaction.description}, refNo=${transaction.refNo}, debit=${transaction.debit}, credit=${transaction.credit}, balance=${transaction.balance}`);
    }
  } finally {
    await session.close();
  }
}
