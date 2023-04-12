print("Hello from python");
import re

headers = ["Date", "Description", "Amount", "Type", "Location"]

new_headers = ["Transaction Data" if re.match("^[a-zA-Z\s/]*\b(\w+)\b.*", header) else header for header in headers]

print(new_headers)
