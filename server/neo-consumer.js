const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', 'Pablo123')
);

const session = driver.session();

// const query = `
// MATCH p=(sender:Bank)-[t:TRANSACTION*1..15]->(receiver:Bank)
// RETURN sender.id AS SenderBankID, receiver.id AS ReceiverBankID, t.txnDate AS TxnDate, t.valueDate AS ValueDate, t.description AS Description, t.refNoChequeNo AS RefNoChequeNo, t.debit AS Debit, t.credit AS Credit, t.balance AS Balance
// `;

const query = `
    MATCH R=(N)-[*]->(N) RETURN NODES(R)
`

session
    .run(query)
    .then(result => {
        result.records.forEach(record => {
            // console.log(record.get('SenderBankID'), record.get('ReceiverBankID'), record.get('TxnDate'), record.get('ValueDate'), record.get('Description'), record.get('RefNoChequeNo'), record.get('Debit'), record.get('Credit'), record.get('Balance'));
            const nodes = record.get('NODES(R)');
            console.log(nodes.map(node => node.properties));
        });
    })
    .catch(error => {
        console.error(error);
    })
    .finally(() => {
        session.close();
        driver.close();
    });
