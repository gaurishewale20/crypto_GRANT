import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException
# from sklearn.preprocessing import MinMaxScaler, StandardScaler
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from tabula.io import read_pdf
from pathlib import Path

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

    mask = transactions['Credit']==0

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

@app.get("/")
async def root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)