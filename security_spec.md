# Security Specification - Keuangan Harianku

## 1. Data Invariants
1. **User Isolation**: Data pada path `users/{userId}/*` hanya dapat dibaca, dibuat, diubah, dan dihapus oleh pengguna terotentikasi yang memiliki UID sama dengan `userId` (`request.auth.uid == userId`).
2. **Path & Payload Consistency**: Field `userId` pada isi dokumen `accounts`, `categories`, dan `transactions` harus selalu persis sama dengan path variable `userId` dan `request.auth.uid`.
3. **Valid Transaction Types**: Jenis transaksi (`type`) hanya boleh bernilai `'income'` atau `'expense'`.
4. **Valid Account Types**: Jenis akun (`type`) hanya boleh bernilai `'Cash'`, `'Bank'`, `'E-Wallet'`, atau `'Lainnya'`.
5. **Positive Transaction Amount**: Nominal transaksi (`amount`) harus berupa angka numerik lebih besar dari 0 (`amount > 0`).
6. **No Cross-User Access**: Pengguna A tidak dapat melakukan query, read, update, atau delete pada akun, kategori, atau transaksi milik Pengguna B dalam keadaan apa pun.

## 2. The Dirty Dozen Payloads (Security Attack Vectors)
1. **Payload 1 (Cross-User Read)**: Pengguna B mencoba membaca dokumen transaksi `/users/user_A_123/transactions/tx_1`.
2. **Payload 2 (Cross-User Create)**: Pengguna B mencoba menulis transaksi di `/users/user_A_123/transactions/tx_evil`.
3. **Payload 3 (Spoofed UID in Payload)**: Pengguna A menulis di `/users/user_A_123/transactions/tx_2` dengan body `userId: "user_B_456"`.
4. **Payload 4 (Negative Transaction Amount)**: Pengguna A mengirim transaksi dengan `amount: -500000`.
5. **Payload 5 (Zero Transaction Amount)**: Pengguna A mengirim transaksi dengan `amount: 0`.
6. **Payload 6 (Invalid Transaction Type)**: Pengguna A mengirim transaksi dengan `type: "transfer_unauthorized"` atau `type: "crypto"`.
7. **Payload 7 (Unauthenticated Read)**: Klien tanpa token login Firebase mencoba mengakses `/users/user_A_123/accounts`.
8. **Payload 8 (Oversized Description Attack)**: Klien mengirim transaksi dengan field description berukuran 2MB (Denial of Wallet).
9. **Payload 9 (Invalid Account Type Injection)**: Klien mencoba membuat akun dengan type `'SuperAdminVault'`.
10. **Payload 10 (Path Injection Attack)**: Klien mencoba membuat dokumen dengan path variable yang mengandung karakter berbahaya atau berukuran > 128 karakter.
11. **Payload 11 (Shadow Field Injection)**: Klien mencoba menginjeksi field tambahan seperti `isAdmin: true` atau `bypassRules: true` ke dalam dokumen user/transaksi.
12. **Payload 12 (Cross-User Account Tampering)**: Pengguna A mencoba mengubah `currentBalance` akun milik Pengguna B.

## 3. Test Runner Design
Semua 12 payload di atas diverifikasi untuk menghasilkan status `PERMISSION_DENIED` pada lapisan Firestore Security Rules sebelum operasi dapat mencapai penyimpanan data.
