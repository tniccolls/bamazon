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

// connect to the mysql server and sql database
connection.connect(function(err) {
  if (err) throw err;
  // run the start function after the connection is made to prompt the user
  // console.log("connected");
});

function showTable() {
  // query the database for all items being auctioned
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    console.table(results);
  });
}
function makePurchase() {
  var listLength = 0;
  var price = 0;
  var stock_quantity = 0;
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    listLength = results.length;
  });

  inquirer
    .prompt({
      name: "purchaseItem",
      type: "input",
      message:
        "Which item would you like to purchase? Enter the 'item_id' of that product, or enter '0' to exit: "
    })
    .then(function(answer) {
      // console.log();
      if (answer.purchaseItem === "0") {
        console.log("Thanks for shopping with Bamazon. Come again soon!");
        connection.end();
      } else if (answer.purchaseItem <= listLength && answer.purchaseItem > 0) {
        connection.query(
          "SELECT price FROM products WHERE item_id = ?",
          answer.purchaseItem,
          function(err, response) {
            if (err) throw err;
            price = response[0].price;
          }
        );
        connection.query(
          "SELECT stock_quantity FROM products WHERE item_id = ?",
          answer.purchaseItem,
          function(err, response) {
            if (err) throw err;
            stock_quantity = response[0].stock_quantity;
          }
        );
        connection.query(
          "SELECT * FROM products WHERE item_id = ?",
          answer.purchaseItem,
          function(err, results) {
            if (err) throw err;

            // console.log(price);
            console.table(results);
            setTimeout(
              confirmQuantity,
              1000,
              answer.purchaseItem,
              price,
              stock_quantity
            );
          }
        );
      } else {
        console.log("Invalid input. Please enter a valid item_id number.");
        connection.end();
      }
    });
}

function confirmQuantity(item_id, price, stock_quantity) {
  inquirer
    .prompt({
      name: "quantity",
      type: "input",
      message: "How many would you like to purchase?"
    })
    .then(function(answer) {
      // answer.quantity = parseInt(answer.quantity);
      if (answer.quantity === "0") {
        console.log("Would you like to purchase something else?");
        makePurchase();
      } else if (answer.quantity < 0 || answer.quantity > stock_quantity) {
        console.log(
          "That is not a valid quantity. Please enter a number greater than 0, but less than the stock quantity."
        );
        confirmQuantity(item_id, price, stock_quantity);
      } else if (answer.quantity <= stock_quantity) {
        var currentQTY = parseInt(answer.quantity);
        var totalPrice = answer.quantity * price;
        totalPrice = parseFloat(Math.round(totalPrice * 100) / 100).toFixed(2);
        console.log(
          "QTY " + answer.quantity + " will cost $" + totalPrice + "."
        );
        inquirer
          .prompt({
            name: "confirmation",
            type: "confirm",
            message: "Do you wish to proceed with this purchase? "
          })
          .then(function(answer) {
            if (answer.confirmation) {
              console.log(
                "Thank you for shopping with bamazon. Your order has been confirmed. "
              );
              var newQTY = stock_quantity - currentQTY;
              console.log(newQTY);
              updateSQL(newQTY, item_id);
              inquirer
                .prompt({
                  name: "keepShopping",
                  type: "confirm",
                  message: "Would you like to make another purchase? "
                })
                .then(function(answer) {
                  if (answer.keepShopping) {
                    showTable();
                    setTimeout(makePurchase, 1000);
                  } else {
                    console.log("Shop again soon! We restock quickly!");
                    connection.end();
                  }
                });
            } else {
              console.log(
                "Your order has been cancelled. Thank you for shopping with bamazon. Please come again!"
              );
              connection.end();
            }
          });
      } else {
        console.log("Sorry, that is an invalid input. Please try again.");
        setTimeout(showTable, 750);
        setTimeout(makePurchase, 1500);
      }
    });
}

function updateSQL(new_qty, item_id) {
  // console.log("Ran");
  connection.query(
    "UPDATE products SET stock_quantity = ? WHERE item_id = ?",
    [new_qty, item_id],
    function(err) {
      if (err) throw err;
    //   console.log(response.affectedRows);
    }
  );
}

showTable();

setTimeout(makePurchase, 1000);

//   con.query("SELECT * FROM customers WHERE address = 'Park Lane 38'", function (err, result) {
