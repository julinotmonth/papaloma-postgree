import { body, param, query } from 'express-validator';

// Auth validations
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email tidak valid')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter')
];

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nama harus diisi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus 2-100 karakter'),
  body('email')
    .isEmail()
    .withMessage('Email tidak valid')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter'),
  body('role')
    .optional()
    .isIn(['admin', 'super_admin'])
    .withMessage('Role tidak valid')
];

// User validations
export const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus 2-100 karakter'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email tidak valid')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'super_admin'])
    .withMessage('Role tidak valid'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status tidak valid')
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Password saat ini harus diisi'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password baru minimal 6 karakter'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Konfirmasi password tidak cocok');
      }
      return true;
    })
];

// Kategori validations
export const kategoriValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nama kategori harus diisi')
    .isLength({ max: 100 })
    .withMessage('Nama kategori maksimal 100 karakter'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter')
];

// Barang validations
export const barangValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nama barang harus diisi')
    .isLength({ max: 200 })
    .withMessage('Nama barang maksimal 200 karakter'),
  body('kategoriId')
    .notEmpty()
    .withMessage('Kategori harus dipilih')
    .isInt({ min: 1 })
    .withMessage('Kategori tidak valid'),
  body('satuan')
    .trim()
    .notEmpty()
    .withMessage('Satuan harus diisi')
    .isLength({ max: 50 })
    .withMessage('Satuan maksimal 50 karakter'),
  body('stok')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok tidak boleh negatif'),
  body('stokMinimum')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok minimum tidak boleh negatif'),
  body('hargaPerUnit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Harga tidak boleh negatif'),
  body('lokasi')
    .trim()
    .notEmpty()
    .withMessage('Lokasi harus diisi')
    .isLength({ max: 200 })
    .withMessage('Lokasi maksimal 200 karakter'),
  body('kondisi')
    .optional()
    .isIn(['baik', 'rusak', 'kadaluarsa'])
    .withMessage('Kondisi tidak valid'),
  body('tanggalKadaluarsa')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  body('catatan')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Catatan maksimal 1000 karakter')
];

export const updateBarangValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Nama barang harus diisi')
    .isLength({ max: 200 })
    .withMessage('Nama barang maksimal 200 karakter'),
  body('kategoriId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Kategori tidak valid'),
  body('satuan')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Satuan harus diisi'),
  body('stok')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok tidak boleh negatif'),
  body('stokMinimum')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok minimum tidak boleh negatif'),
  body('hargaPerUnit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Harga tidak boleh negatif'),
  body('lokasi')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Lokasi harus diisi'),
  body('kondisi')
    .optional()
    .isIn(['baik', 'rusak', 'kadaluarsa'])
    .withMessage('Kondisi tidak valid'),
  body('tanggalKadaluarsa')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  body('catatan')
    .optional()
    .trim()
];

// Transaksi Masuk validations
export const transaksiMasukValidation = [
  body('barangId')
    .notEmpty()
    .withMessage('Barang harus dipilih')
    .isInt({ min: 1 })
    .withMessage('Barang tidak valid'),
  body('jumlah')
    .notEmpty()
    .withMessage('Jumlah harus diisi')
    .isInt({ min: 1 })
    .withMessage('Jumlah minimal 1'),
  body('tanggal')
    .notEmpty()
    .withMessage('Tanggal harus diisi')
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  body('supplier')
    .trim()
    .notEmpty()
    .withMessage('Supplier harus diisi')
    .isLength({ max: 200 })
    .withMessage('Supplier maksimal 200 karakter'),
  body('catatan')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Catatan maksimal 1000 karakter')
];

// Transaksi Keluar validations
export const transaksiKeluarValidation = [
  body('barangId')
    .notEmpty()
    .withMessage('Barang harus dipilih')
    .isInt({ min: 1 })
    .withMessage('Barang tidak valid'),
  body('jumlah')
    .notEmpty()
    .withMessage('Jumlah harus diisi')
    .isInt({ min: 1 })
    .withMessage('Jumlah minimal 1'),
  body('tanggal')
    .notEmpty()
    .withMessage('Tanggal harus diisi')
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  body('alasan')
    .trim()
    .notEmpty()
    .withMessage('Alasan harus diisi')
    .isLength({ max: 200 })
    .withMessage('Alasan maksimal 200 karakter'),
  body('catatan')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Catatan maksimal 1000 karakter')
];

// Common ID validation
export const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID tidak valid')
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus bilangan positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus 1-100')
];
