# Memos

## Difference between official PSD document and real file photoshop generated

### Structure of Enumerate

- Document
  | Length | Description |
  | ---- | ---- |
  | Variable | Unicode string: name from Class ID. |
  | Variable | ClassID: 4 bytes (length), followed either by string or (if length is zero) 4-byte classID |
  | Variable | TypeID: 4 bytes (length), followed either by string or (if length is zero) 4-byte typeID |
  | Variable | enum: 4 bytes (length), followed either by string or (if length is zero) 4-byte enum |
- Real file
  | Length | Description |
  | ---- | ---- |
  | Variable | Name: **4 bytes (length), followed either by string or (if length is zero) 4-byte** name |
  | Variable | ClassID: 4 bytes (length), followed either by string or (if length is zero) 4-byte classID |
