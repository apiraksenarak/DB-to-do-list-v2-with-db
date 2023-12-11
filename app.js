//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//localhost: 27017
mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true });

// mongoose.connect("mongodb+srv://apirak25808:0991213754aA@cluster0.0wegs.mongodb.net/todolistDB", { useNewUrlParser: true });

//////////////////////////////////////////////////////////////////////////////////////

const itemSchema = {
  name : String
};

// upper-case & singular(เอกพจน์)
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
}); 

const defaultItems = [item1, item2, item3];

//////////////////////////////////////////////////////////////////////////////////////

const listSchema = {
	name: String,
	items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

//////////////////////////////////////////////////////////////////////////////////////

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if(err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully insert default items to DB");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  })
});

app.get("/:customListName", function(req, res) {
	const customListName = _.capitalize(req.params.customListName);

	const list = new List({
		name: customListName,
		items: defaultItems
	});

	//return only 1 document
	List.findOne({name: customListName}, function(err, foundList){
		if(err){
			console.log(err);
		} else {
			if(!foundList) {
				list.save();
				res.redirect("/") + customListName;
			} else {
				// show existing list
				//																							             ชี้ไปที่ array item ใน list(name, items)
				res.render("list", {listTitle: customListName, newListItems: foundList.items});
			}
		}
	});
});

//////////////////////////////////////////////////////////////////////////////////////

app.post("/", function(req, res){

  	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName
	});

	// case DEFAULT ("/")
	if (listName === "Today") {
		item.save();
		res.redirect("/");
	} else {
		List.findOne({name: listName}, function(err, foundList){
				foundList.items.push(item);
				foundList.save();
				res.redirect("/" + listName);
		});
	}
});

app.post("/delete", function(req, res) {
	const temp = JSON.parse(req.body.checkBox);

	if(temp.listName === "Today") {
		Item.findByIdAndDelete(temp.itemId, function(err){
			if(!err) {
				res.redirect("/");
			}
		});
	} else {																	      //delete but query inside
		List.findOneAndUpdate({name: temp.listName}, {$pull: {items: {_id: temp.itemId}}}, function(err, foundList) {
			if (!err) {
				res.redirect("/" + temp.listName);
			}
		});
	}
});

//////////////////////////////////////////////////////////////////////////////////////

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3010;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});
