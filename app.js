const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));

const mongoose = require("mongoose");

const _ = require("lodash");

app.set("view engine", "ejs");
app.use(express.static("public"));

const date = require(__dirname+"/date.js");

mongoose.connect("<Mongodb database server uri>/todolistDB");
const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Welcome to todo list" });
const item2 = new Item({ name: "hit + to add" });
const item3 = new Item({ name: "<-- hit to delete" });
const defItems =[item1,item2,item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

const day=date.getDate();

app.get("/", function(req,res){

    Item.find()
        .then(function(items){
            if(items.length === 0){
                Item.insertMany(defItems)
                    .then(function(){console.log("inserted succesfully")})
                    .catch(function(err){console.log(err)});
                res.redirect("/");
            }
            else res.render("list", {listTittle:day, itemkey:items})
        })
        .catch(function(err){console.log(err)});
})

app.post("/", function(req,res){

    const itemName = req.body.newitem;
    const listName = req.body.list;

    if(itemName === ""){ 
        if(listName === day) return res.redirect("/");
        else return res.redirect("/"+listName); 
    }

    const item = new Item({ name: itemName });

    if(listName === day){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:listName})
            .then(function(foundList){
                foundList.items.push(item);
                foundList.save();
                res.redirect("/"+listName);
            })
            .catch(function(err){ console.log(err);});
    }

})

app.post("/delete", function(req,res){

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === day){
        Item.findByIdAndRemove(checkedItemId)
            .then(function(){console.log("succesfully deleted")})
            .catch(function(err){console.log(err)});
        setTimeout(function(){res.redirect("/");},300);
    }
    else{
        List.findOneAndUpdate({name:listName}, {$pull: {items: {_id:checkedItemId}}})
            .then(function(){console.log("succesfully deleted")})
            .catch(function(err){console.log(err)});
            setTimeout(function(){res.redirect("/"+listName);},300);
    }
    
})

app.get("/:customList", function(req,res){

    const customListName = _.capitalize(req.params.customList);

    List.findOne({ name: customListName })
        .then(function (foundList) {
            if (!foundList) {
                const newlist = new List({
                    name: customListName,
                    items: defItems,
                });
                newlist.save();
                res.redirect("/" + customListName);
            }
            else { res.render("list", { listTittle: foundList.name, itemkey: foundList.items});}
        })
        .catch(function(err){ console.log(err);});

})

app.listen(3000, function(){
    console.log("serving at 3000");
})