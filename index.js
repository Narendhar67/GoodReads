const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

// Register User API

app.post("/users/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  // creating encrypted Password
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbRes = await db.get(selectUserQuery);
  if (dbRes === undefined) {
    // Create a new user
    const createUserQuery = `INSERT INTO
        user (name , username , password , gender , location)
        VALUES (
        '${name}',
        '${username}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
        );`;
    const userDetails = await db.run(createUserQuery);
    const newUserId = userDetails.lastID;
    console.log(userDetails);
    response.send(`Created new user with username : ${username},
    and userId : ${newUserId}`);
  } else {
    // user already exists
    response.status(400); // sending status code
    response.send("User already exists");
  }
});

// Login user API

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbRes = await db.get(selectUserQuery);

  if (dbRes === undefined) {
    // Invalid user
    response.status = 400;
    response.send("Invalid User");
  } else {
    // compare Password
    const isPasswordMatched = await bcrypt.compare(password, dbRes.password);
    if (isPasswordMatched) {
      response.send("Login Success");
    } else {
      response.status = 400;
      response.send("Invalid Password");
    }
  }
});
