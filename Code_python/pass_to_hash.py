import hashlib

# Convert the string "000100" to its SHA-256 hash
hash_object = hashlib.sha256(b"001001")
hex_dig = hash_object.hexdigest()
print(hex_dig)
