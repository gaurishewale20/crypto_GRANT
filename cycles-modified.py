from neo4j import GraphDatabase
import networkx as nx

def cycles():
    print("Cycles")
    # Define Cypher query
    cypher_query = """
    MATCH (sender:Bank)-[t:TRANSACTION]->(receiver:Bank)
    RETURN sender.id AS SenderBankID, receiver.id AS ReceiverBankID, 
        t.txnDate AS TxnDate, t.valueDate AS ValueDate, 
        t.description AS Description, t.refNo AS RefNoChequeNo, 
        t.debit AS Debit, t.credit AS Credit, t.balance AS Balance
    """

    # Create empty graph
    G = nx.DiGraph()

    # Open Neo4j session
    with driver.session() as session:
        # Run query and iterate over result
        result = session.run(cypher_query)
        for record in result:
            # Extract data from record
            sender_bank_id = record["SenderBankID"]
            receiver_bank_id = record["ReceiverBankID"]
            txn_date = record["TxnDate"]
            value_date = record["ValueDate"]
            description = record["Description"]
            ref_no_cheque_no = record["RefNoChequeNo"]
            debit = record["Debit"]
            credit = record["Credit"]
            balance = record["Balance"]

            # Add sender and receiver nodes to graph
            G.add_node(sender_bank_id)
            G.add_node(receiver_bank_id)

            # Add transaction edge to graph
            G.add_edge(sender_bank_id, receiver_bank_id, 
                    txn_date=txn_date, value_date=value_date, 
                    description=description, ref_no_cheque_no=ref_no_cheque_no, 
                    debit=debit, credit=credit, balance=balance)
            
    print("========CYCLES=======")

    # Find cycles in the graph and store transaction data
    cycles = []
    for node in G.nodes:
        for cycle in nx.simple_cycles(G, node):
            if len(cycle) > 3:
                cycle_data = []
                for node_id in cycle:
                    for _, data in G.nodes(data=True):
                        if data["id"] == node_id:
                            cycle_data.append(data)
                cycles.append(cycle_data)

    return {"cycles": cycles}
