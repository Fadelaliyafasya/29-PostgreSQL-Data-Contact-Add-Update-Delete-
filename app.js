const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const {
  addContact,
  fetchContact,
  searchContact,
  duplicateCheck,
  deleteContact,
  updateContacts,
  emailDuplicateCheck,
} = require("./utility/contacts.js");
const sess = require("express-session");
const flash = require("connect-flash");
const cParser = require("cookie-parser");
const { body, check, validationResult } = require("express-validator");
const app = express();

const host = "localhost";
const port = 3000;

const pool = require("./db.js");

app.set("view engine", "ejs");

app.use(express.json());
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cParser("secret"));

app.use(
  sess({
    cookie: { maxAge: 3000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

app.get("/", (req, res) => {
  res.render("index", {
    namaWeb: "around world.",
    title: "around world.",
    layout: "layout/core-layout",
  });
});

app.get("/addsync", async (req, res) => {
  try {
    const nama = "";
    const nomorhp = "";
    const email = "";
    const newCont = await pool.query(
      `INSERT INTO contacts values ('${nama}', '${nomorhp}', '${email}') RETURNING *`
    );
    res.json(newCont);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("<h1>internal server error</h1>");
  }
});

app.get("/list", async (req, res) => {
  try {
    const contact = await pool.query(`SELECT * FROM contacts`);
    res.json(contact.rows);
  } catch (err) {
    console.log(err.message);
  }
});

app.get("/about", (req, res) => {
  res.render("about", {
    title: "around world. - About",
    layout: "layout/core-layout",
  });
});

app.get("/contact", async (req, res) => {
  try {
    const contactsList = await pool.query("SELECT * FROM contacts");
    const contacts = contactsList.rows;
    res.render("contact", {
      title: "around world. - Contact",
      contacts,
      layout: "layout/core-layout.ejs",
      message: req.flash("message"),
    });
  } catch (err) {
    console.error(err.message);
    res.render("contact", {
      title: "around world. - Contact",
      contacts: [],
      layout: "layout/core-layout.ejs",
      message: req.flash("message"),
    });
  }
});

app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "around world. - Add Contact",
    layout: "layout/core-layout.ejs",
  });
});

app.post(
  "/contact",
  [
    body("nama").custom(async (value) => {
      const duplicate = await duplicateCheck(value);
      if (duplicate) {
        throw new Error("Nama sudah terdaftar!!");
      }
      return true;
    }),
    check("email", "Email tidak valid").isEmail(),
    check("nomorhp", "Nomor Handphone tidak valid").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "around world - Add Contact",
        layout: "layout/core-layout.ejs",
        errors: errors.array(),
      });
    } else {
      try {
        await addContact(req.body);
        req.flash("message", "Data berhasil ditambahkan");
        res.redirect("/contact");
      } catch (err) {
        console.error(err.message);
        res.status(500).send("<h1>internal server error</h1>");
      }
    }
  }
);

app.get("/contact/delete/:nama", async (req, res) => {
  try {
    const contact = await searchContact(req.params.nama);

    if (!contact) {
      res.status(400);
      res.send("<h1>404 Not Found</h1>");
    } else {
      await deleteContact(req.params.nama);
      req.flash("message", "Data berhasil dihapus");
      res.redirect("/contact");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("<h1>internal server error</h1>");
  }
});

app.get("/contact/update/:nama", async (req, res) => {
  try {
    const contact = await searchContact(req.params.nama);
    res.render("update-contact", {
      title: "around world. - Update Contact",
      layout: "layout/core-layout.ejs",
      contact,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("<h1>internal server error</h1>");
  }
});

app.post(
  "/contact/update",
  [
    body("nama").custom(async (value, { req }) => {
      const duplicate = await duplicateCheck(value);
      if (value !== req.body.namaLama && duplicate) {
        throw new Error("Nama sudah terdaftar!!");
      }
      return true;
    }),
    body("email").custom(async (value) => {
      const emailDuplicate = await emailDuplicateCheck(value);
      if (emailDuplicate) {
        throw new Error("Email sudah terdaftar!!");
      }
      return true;
    }),
    check("email", "Email tidak valid").isEmail(),
    check("nomorhp", "Nomor Handphone tidak valid").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("update-contact", {
        title: "around world - Update Contact",
        layout: "layout/core-layout.ejs",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      try {
        await updateContacts(req.body);
        req.flash("message", "Data berhasil diupdate");
        res.redirect("/contact");
      } catch (err) {
        console.error(err.message);
        res.status(500).send("<h1>internal server error</h1>");
      }
    }
  }
);

app.get("/contact/:nama", async (req, res) => {
  const nama = req.params.nama;
  const contacts = await fetchContact();
  const contact = contacts.find((contact) => contact.nama === nama);

  res.render("detail", {
    title: "around world. - Detail Contact",
    contact,
    isEmpty: true,
    layout: "layout/core-layout.ejs",
  });
});

app.use("/", (req, res) => {
  res.status(404);
  res.send("<h1>404 Not Found</h1>");
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
