const fs = require("fs");
const pool = require("../db.js");

// Membuat folder jika belum ada
const lokasiDirr = "./data";
if (!fs.existsSync(lokasiDirr)) {
  fs.mkdirSync(lokasiDirr);
}

//membuat file contacts.json jika belum ada
const filePath = `./data/contacts.json`;
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, "[]", "utf-8");
}

//load contacts
const fetchContact = async () => {
  const connection = await pool.connect();
  const query = `SELECT * FROM contacts`;
  const results = await connection.query(query);
  const contacts = results.rows;
  return contacts;
};

// Cari contact
const searchContact = async (nama) => {
  const contacts = await fetchContact();
  const contact = contacts.find(
    (contact) => contact.nama.toLowerCase() === nama.toLowerCase()
  );
  return contact;
};

// const saveContacts = (contacts) => {
//   fs.writeFileSync("data/contacts.json", JSON.stringify(contacts));
// };

const addContact = async (contact) => {
  const { nama, nomorhp, email } = contact;
  const connection = await pool.connect();
  const query = `
    INSERT INTO contacts (nama, nomorhp, email)
    VALUES ($1, $2, $3)
  `;
  await connection.query(query, [nama, nomorhp, email]);
};

// Delete contact
const deleteContact = async (nama) => {
  const connection = await pool.connect();
  const query = `
    DELETE FROM contacts
    WHERE nama = $1
  `;
  await connection.query(query, [nama]);
};

// duplicate check
const duplicateCheck = async (nama) => {
  const contacts = await fetchContact();
  return contacts.find((contact) => contact.nama === nama);
};

// duplicate check
const emailDuplicateCheck = async (email) => {
  const contacts = await fetchContact();
  return contacts.find((contact) => contact.email === email);
};

// update contact
const updateContacts = async (newContact) => {
  const connection = await pool.connect();
  const query = `
    UPDATE contacts
    SET nama = $1, nomorhp = $2, email = $3
    WHERE nama = $4
  `;
  await connection.query(query, [
    newContact.nama,
    newContact.nomorhp,
    newContact.email,
    newContact.namaLama,
  ]);
};

module.exports = {
  deleteContact,
  addContact,
  fetchContact,
  searchContact,
  duplicateCheck,
  updateContacts,
  emailDuplicateCheck,
};
