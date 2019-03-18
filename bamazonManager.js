var mysql = require("mysql");
var inquirer = require("inquirer");

// create the connection information for the sql database
var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "",
  database: "bamazon"
});

var listLength = 0;

connection.query("SELECT * FROM products", function(err, results) {
  if (err) throw err;
  listLength = results.length;
  startMenu();
});

function startMenu() {
  inquirer
    .prompt({
      name: "mainMenu",
      type: "list",
      choices: [
        "View Products for Sale",
        "View Low Inventory",
        "Add to Inventory",
        "Add New Product",
        "Exit Program"
      ],
      message: "What do you want to do? "
    })
    .then(function(answer) {
      //   console.log(answer.mainMenu);
      //   connection.end();
      switch (answer.mainMenu) {
        case "View Products for Sale":
          showTable();
          break;
        case "View Low Inventory":
          lowInventory();
          break;
        case "Add to Inventory":
          addToInventory();
          break;
        case "Add New Product":
          newProduct();
          break;
        case "Exit Program":
          endProgram();
          break;
      }
    });
}

function showTable() {
  // query the database for all items being auctioned
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    console.table(results);
    startMenu();
  });
}

function lowInventory() {
  connection.query("SELECT * FROM products WHERE stock_quantity < 5", function(
    err,
    results
  ) {
    if (err) throw err;
    console.table(results);
    startMenu();
  });
}

function addToInventory() {
  var stock_quantity = 0;
  inquirer
    .prompt({
      name: "addInventory",
      type: "input",
      message:
        "Which item would you like to restock? Enter the 'item_id' of that product, or enter '0' to exit: "
    })
    .then(function(answer) {
      var currentQuantity = 0;
      if (answer.addInventory === "0") {
        console.log("Inventory is unchanged. \n");
        startMenu();
      } else if (answer.addInventory <= listLength && answer.addInventory > 0) {
        connection.query(
          "SELECT stock_quantity FROM products WHERE item_id = ?",
          answer.addInventory,
          function(err, response) {
            if (err) throw err;
            currentQuantity = response[0].stock_quantity;
          }
        );
        connection.query(
          "SELECT * FROM products WHERE item_id = ?",
          answer.addInventory,
          function(err, results) {
            if (err) throw err;
            console.table(results);
            setTimeout(
              confirmInventory,
              700,
              answer.addInventory,
              currentQuantity
            );
          }
        );
      } else {
        console.log("Invalid input. Please enter a valid item_id number.");
        connection.end();
      }
    });
}

function confirmInventory(item_id, stock_quantity) {
  inquirer
    .prompt({
      name: "quantity",
      type: "input",
      message: "How many would you like add?"
    })
    .then(function(answer) {
      if (answer.quantity === "0") {
        console.log("Would you like to add something else?");
        addToInventory();
      } else if (answer.quantity > 0 || answer.quantity < 0) {
        var addionalInventory = parseInt(answer.quantity);
        inquirer
          .prompt({
            name: "confirmation",
            type: "confirm",
            message:
              "You are about to add " +
              addionalInventory +
              " to stock. Continue? "
          })
          .then(function(answer) {
            if (answer.confirmation) {
              console.log(
                "Confirmed. " + addionalInventory + " has been added to stock. "
              );
              var newQTY = stock_quantity + addionalInventory;
              console.log("The new inventory is now " + newQTY + " units.");
              updateSQL(newQTY, item_id);
              startMenu();
            } else {
              console.log("This inventory update has been cancelled. ");
              startMenu();
            }
          });
      } else {
        console.log("Sorry, that is an invalid input. Please try again.");
        startMenu();
      }
    });
}

function updateSQL(new_qty, item_id) {
  connection.query(
    "UPDATE products SET stock_quantity = ? WHERE item_id = ?",
    [new_qty, item_id],
    function(err) {
      if (err) throw err;
    }
  );
}

function endProgram() {
  console.log("Exiting Program.");
  connection.end();
}

function newProduct() {
  inquirer
    .prompt([
      {
        name: "itemName",
        type: "input",
        message: "What is the name of the new item? "
      },
      {
        name: "itemCategory",
        type: "input",
        message: "What is the category of the new item? "
      },
      {
        name: "itemPrice",
        type: "input",
        message: "What is the price of the new item? "
      },
      {
        name: "itemStock",
        type: "input",
        message: "What is the initial stock for the new item?"
      }
    ])
    .then(function(answer) {
      connection.query(
        "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)",
        [
          answer.itemName,
          answer.itemCategory,
          answer.itemPrice,
          answer.itemStock
        ],
        function(err) {
          if (err) throw err;
          console.log("'" + answer.itemName + "' has been added to stock.");
          updateList();
          startMenu();
        }
      );
    });
}

function updateList() {
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    listLength = results.length;
  });
}
