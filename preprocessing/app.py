import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from tabula.io import read_pdf
from pathlib import Path
import seaborn as sns
from matplotlib import pyplot as plt
from neo4j import GraphDatabase
import networkx as nx

from dotenv import load_dotenv
load_dotenv()  # take environment variables from .env.

uri = os.environ.get("NEO4J_URI")
user = os.environ.get("NEO4J_USERNAME")
password = os.environ.get("NEO4J_PASSWORD")


driver = GraphDatabase.driver(uri, auth=(user, password))


BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace this with the list of allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_EXTENSIONS = ['.pdf', '.xlsx','.csv']

columnNames = {
    "Txn Date": ["Txn Date","Transaction Date"]
}

bankColumnNames = {
    "hdfc": ["Txn Date", "Value Date", "Description", "Ref No./Cheque No.", "Debit", "Credit", "Balance"],
    "sbi": ["Txn Date", "Value Date", "Description", "Ref No./Cheque No.", "Debit", "Credit", "Balance"],
    "icici": ["Txn Date", "Value Date", "Description", "Ref No./Cheque No.", "Debit", "Credit", "Balance"]
}

# TODO: convert all columns to a common column name of all CSV files
def convertToCommonFormat(files):
    return files
    
def preprocessFile(transactions, bankName, accountNo):
    print(transactions)
    # add bank name column
    transactions = transactions.assign(Bank=bankName)
    # transactions = transactions.assign(SenderNo=accountNo)
    transactions["Sender No"] = accountNo
    print(transactions)
    # Select columns that we need
    transactions = transactions[["Txn Date", "Sender No", "Recipient No", "Value Date", "Description", "Ref No./Cheque No.", "Debit", "Credit", "Balance", "Bank"]]

    print(transactions)
    # Add 0 to credit and debit null values
    transactions['Credit'] = transactions['Credit'].fillna(0)
    transactions['Debit'] = transactions['Debit'].fillna(0)

    mask = transactions['Debit']==0

    transactions.loc[mask, ['Sender No', 'Recipient No']] = (
        transactions.loc[mask, ['Recipient No', 'Sender No']].values)

    transactions["Amount"] = transactions[["Debit", "Credit"]].max(axis=1)

    print(transactions)
    # Drop all na values and duplicates too
    transactions.dropna(inplace=True)
    transactions.drop_duplicates(inplace=True)

    return transactions


# Returns Dataframe obj of the csv file
def convertToCSV(uploadedfile):
    # print(file.filename)
    file_ext = f'.{uploadedfile.filename.split(".")[-1]}'
    print("------------------------------------------")
    print(file_ext)
    print("------------------------------------------")
    if file_ext not in UPLOAD_EXTENSIONS:
        return "Invalid file type"

    file_location = os.path.join(BASE_DIR, uploadedfile.filename)

    # saving the file temporarily
    with open(file_location, "wb+") as file_object:
        file_object.write(uploadedfile.file.read())

    print("Saving the file temporarily at - ",file_location)

    if file_ext ==  '.pdf':
        df = pd.DataFrame(read_pdf(file_location, pages = 'all',multiple_tables = True)[0])
        # df = pd.concat(read_pdf(file_location, pages = 'all',multiple_tables = True))
        # df.columns = ["Txn Date", "Sender No", "Recipient No", "Value Date", "Description", "Ref No./Cheque No.", "Debit", "Credit", "Balance"]

        print(df.head())
    elif file_ext == '.xlsx':
        read_file = pd.read_excel(file_location)
        read_file.to_csv('output_file.csv', index=False)

        # df = pdf.read_csv (index = None, header=True)
        df = pd.read_csv('output_file.csv')

    elif file_ext == '.csv':
        df = pd.read_csv(file_location)

    # deleting the saved file
    if os.path.isfile(file_location):
        os.remove(file_location)
        print("File has been deleted")
    else:
        print("File does not exist")

    return df

def findVolumes(df):
    incomingCount = {}
    outgoingCount = {}
    tranCount = {}
    mean = {}

    def addToDict(d, key, val):
        if key in d:
            d[key] += val
        else :
            d[key] = val

    for index, row in df.iterrows():
        addToDict(tranCount, row["Recipient No"], 1)
        addToDict(tranCount, row["Sender No"], 1)
        addToDict(outgoingCount, row['Recipient No'], row["Amount"])
        addToDict(incomingCount, row['Sender No'], row["Amount"])

    for key in tranCount:
        inCount = 0
        outCount = 0
        if key in incomingCount:
            inCount = incomingCount[key]
        if key in outgoingCount:
            outCount = outgoingCount[key]

    mean[key] = (inCount - outCount)/tranCount[key]

    return incomingCount, outgoingCount, tranCount, mean

def accountTransactionsHelper(transactions, accountNo):
  df = transactions.copy()
  df= df.loc[(df["Sender No"]==accountNo) | (df["Recipient No"]==accountNo)]
  m = df["Sender No"] == accountNo
  df.loc[m,"Amount"] *=-1
  return df

def balance_history(transactions, accountNo):
  df = accountTransactionsHelper(transactions, accountNo)
  print("---"*40)
  print(df)
  print("---"*40)
  balanceHistory = sns.lineplot(
      x="Value Date",
      y="Balance",
      data=df
  )
  plt.title("Balance History")
  plt.xlabel("Days")
  plt.ylabel("Balance")
  plt.savefig('line_plot')
  plt.close()

def spendAnalyser(transactions, accountNo):
  df = accountTransactionsHelper(transactions, accountNo)
  history = sns.barplot(data = df,
              x = "Value Date",
              y = "Amount",dodge=False)
  for bar in history.patches:
      if bar.get_height() < 0:
          bar.set_color('red')
      else:
          bar.set_color('green')
  plt.title("Spend History")
  plt.xlabel("Days")
  plt.ylabel("Money")
  plt.savefig('bar_plot')
  plt.close()

@app.post("/get_balance_history/{accountNo}")
async def get_balance_history(accountNo : str, file: UploadFile):
    file_location = os.path.join(BASE_DIR, file.filename)

    # saving the file temporarily
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    csvFile = pd.read_csv(file_location)
    
    balance_history(csvFile, int(accountNo))
    return FileResponse(os.path.join(BASE_DIR, "line_plot.png"), media_type='image/png')

@app.post("/get_spend_analyser/{accountNo}")
async def get_spend_analyser(accountNo : str, file: UploadFile):
    file_location = os.path.join(BASE_DIR, file.filename)

    # saving the file temporarily
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    csvFile = pd.read_csv(file_location)
    spendAnalyser(csvFile, int(accountNo))
    return FileResponse(os.path.join(BASE_DIR, "bar_plot.png"), media_type='image/png')

@app.post("/findVolumes")
async def findVolumesAPI(file: UploadFile):
    file_location = os.path.join(BASE_DIR, file.filename)

    # saving the file temporarily
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    csvFile = pd.read_csv(file_location)
    incomingCount, outgoingCount, tranCount, mean = findVolumes(csvFile)
    return [("incomingCount", incomingCount),("outgoingCount", outgoingCount),("tranCount", tranCount),("mean", mean)]
    # return JSONResponse(content={incomingCount, outgoingCount, tranCount, mean})

    # return {incomingCount, outgoingCount, tranCount, mean}


@app.post("/preprocess_csv_files")
async def preprocess_csv_files(files: list[UploadFile], bankNames: list[str], accountNos: list[str]):
    print(files, bankNames)

    dfs = []
    for i in range(len(files)):
        file = files[i]
        csvFile = convertToCSV(file)
        if type(csvFile) == str:
            raise HTTPException(status_code=400, detail="Only pdf, csv and excel files are allowed")

        # TODO: convert all columns to a common column name of all CSV files
        # df = convertToCommonFormat(csvFile, bankNames[i])
        # TODO: do some preprocessing on the dataframe here
        df = preprocessFile(csvFile, bankNames[i], accountNos[i])
        print("DF : ",df)
        print("--------------------------------")
        dfs.append(df)
    result_df = pd.concat(dfs)
    # print(result_df)
    # do some additional preprocessing on the final dataframe here
    result_csv = result_df.to_csv(index=False)
    return {"result_csv": result_csv}


@app.get("/centralities")
async def cycles():
    print("Centralities")
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
            
    print("==========Centrality Measures==========")
    # degree centrality
    dc = []
    deg_cen = nx.degree_centrality(G)
    print("Degree centrality:", deg_cen)
    dc.append(deg_cen)

    # closeness centrality
    cc = []
    clo_cen = nx.closeness_centrality(G)
    print("Closeness centrality:", clo_cen)
    cc.append(clo_cen)

    # betweenness centrality
    b_c=[]
    bet_cen = nx.betweenness_centrality(G)
    print("Betweenness centrality:", bet_cen)
    b_c.append(bet_cen)

    #eigenvector centrality
    ec = []
    # eig_cen = nx.eigenvector_centrality(G)
    # print("Eigenvector centrality:", eig_cen)
    # ec.append(eig_cen)

    return {"deg_cen": dc, "clo_cen": cc, "bet_cen": b_c, "eig_cen": ec}


@app.get("/hits")
async def hits():
    print("Hits")
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
            
    print("=============HITS==============")
    h, a = nx.hits(G)

    # print authorities and hubs
    print("Authorities: ", a)
    print("Hubs: ", h)

    return {"Hubs": h, "Authorities": a}

@app.get("/cycles")
async def cycles():
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
    accounts = list(nx.simple_cycles(G))

    return {"accounts": accounts}

@app.get("/pageRank")
async def pageRank():
    print("PageRank")
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
            
    pr = nx.pagerank(G)
    nodes = []
    scores = []

    # Print the PageRank scores
    for node, score in pr.items():
        nodes.append(node)
        scores.append(score)
        print(f"Node {node}: PageRank score = {score}")

    return {"nodes": nodes, "scores": scores}





@app.get("/")
async def root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)