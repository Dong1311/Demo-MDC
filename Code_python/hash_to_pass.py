import hashlib

given_hash = "7214ba7e8fa020b2486240ee163f4d82683a3f752b30c9781bae8105772e9145"

# Hàm để tạo hash SHA-256 của một chuỗi
def sha256_hash(s):
    return hashlib.sha256(s.encode()).hexdigest()

# Hàm brute-force để tìm mật khẩu gốc
def find_password():
    for i in range(1000000):
        password = f"{i:06d}"  # Định dạng số thành chuỗi 6 chữ số
        if sha256_hash(password) == given_hash:
            return password
    return None

# Tìm mật khẩu
password = find_password()
print (password)
