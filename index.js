import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "travel",
  password: "Pratham@9532",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

// let users = [
//   { id: 1, name: "Member 1", color: "teal" },
//   { id: 2, name: "Member 2", color: "powderblue" },
//   { id: 3, name: "Member 3", color: "yellow" },
// ];

async function checkVisitedCountries() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1",
    [currentUserId]
  );
  const countries=[];
  result.rows.forEach((country) => {
      countries.push(country.country_code);
})
return countries;
}
async function allUser()
{
  const data = await db.query("SELECT * FROM users");
  return data.rows;
}
async function getUser() {
  const data = await db.query("SELECT * FROM users");
  return data.rows.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  const countries = await checkVisitedCountries();
  const currentUser = await getUser();
  const everyUser= await allUser();
  res.render("index.ejs", {
    countries,
    total: countries.length,
    users:everyUser,
    color: currentUser.color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body.country;
  const currentUser = await getUser();
  const everyUser=await allUser();
  const result = await db.query(
    "SELECT country_code FROM countries WHERE LOWER(country)=$1",
    [input.toLowerCase()]
  );
  const code = result.rows;
  if (code.length !== 0) {
    const countryCode = code[0].country_code;
    await db.query(
      "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
      [countryCode, currentUserId]
    );
    res.redirect("/");
  } else {
    const countries = await checkVisitedCountries();
    res.render("index.ejs", {
      countries:countries,
      total: countries.length,
      error: "No countries matching in database",
      users: everyUser,
      color: currentUser.color,
    });
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (user_name, color) VALUES ($1, $2) RETURNING *",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


