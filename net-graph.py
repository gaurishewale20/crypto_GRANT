from neo4j import GraphDatabase
import networkx as nx
import matplotlib.pyplot as plt

# Create Neo4j driver instance
uri = "bolt://localhost:7687"
user = "neo4j"
password = "Pablo123"
driver = GraphDatabase.driver(uri, auth=(user, password))

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
        
    # nx.draw(G)
    # plt.show()

def pagerank(graph):
    print("=========PAGERANK===========")
    # Apply PageRank to the graph
    pr = nx.pagerank(graph)

    # Print the PageRank scores
    for node, score in pr.items():
        print(f"Node {node}: PageRank score = {score}")


def find_cycles(graph):
    print("========CYCLES=======")
    # Find cycles in the graph
    cycles = list(nx.simple_cycles(G, length_bound=None))

    # Filter out cycles of length 3 or less
    result = []
    for cycle in cycles:
        if len(cycle) > 1:
            # Get ref no of transactions in cycle
            refs = [G.edges[u, v]["ref_no_cheque_no"] for u, v in zip(cycle, cycle[1:]+[cycle[0]])]
            result.append({"nodes": cycle, "transactions": refs})

    print(result)



def centralities(G):
    print("==========Centrality Measures==========")
    # degree centrality
    deg_cen = nx.degree_centrality(G)
    print("Degree centrality:", deg_cen)

    # closeness centrality
    clo_cen = nx.closeness_centrality(G)
    print("Closeness centrality:", clo_cen)

    # betweenness centrality
    bet_cen = nx.betweenness_centrality(G)
    print("Betweenness centrality:", bet_cen)

    # eigenvector centrality
    eig_cen = nx.eigenvector_centrality(G)
    print("Eigenvector centrality:", eig_cen)


def apply_hits(graph):
    print("=============HITS==============")
    h, a = nx.hits(graph)

    # print authorities and hubs
    print("Authorities: ", a)
    print("Hubs: ", h)


pagerank(G)
find_cycles(G)
centralities(G)
apply_hits(G)



# Close Neo4j driver
driver.close()
