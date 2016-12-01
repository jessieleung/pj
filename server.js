//var http = require('http');
//var url  = require('url');
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
//var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://localhost:27017/test';
var fileUpload = require('express-fileupload');

app = express();
var session = require('cookie-session');
var bodyParser = require('body-parser');

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

app.set('view engine','ejs');

app.use(session({
	name: 'session',
	keys: [SECRETKEY1,SECRETKEY2],
	//authenticated: false,
	//secret: SECRETKEY1,
	resave: true,
	saveUninitialized: true
}));

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res) {
	console.log(req.session);
	res.status(200).end('Hello, ');
});

app.get('/register',function(req,res) {
	res.sendFile(__dirname + '/public/register.html');
});

app.get('/login',function(req,res) {
	res.sendFile(__dirname + '/public/login.html');
});

app.get('/create',function(req,res) {
	if (!req.session.authenticated)	{	//Required Login
		res.redirect('/login'); 
	}
	res.sendFile(__dirname + '/public/form.html');
});

//----------------List All Restaurants---------------------------------------------
app.get('/read',function(req,res) {
	MongoClient.connect(mongourl, function(err, db){
		assert.equal(null, err);		
		findRestaurants(db, function(result){	
			db.close();
			console.log(req.session);
			res.render("read.ejs", {c: result, userid: req.session.userid});
		});
	});
});


//----------------------------Login-----------------------------------------------
app.post('/login', function(req,res){
	//if (!req.session.authenticated) {
		req.session.authenticated = false;
		var criteria = {"userid": req.body.userid, "password": req.body.password};
		MongoClient.connect(mongourl, function(err, db){
			assert.equal(null, err);
			findPassword(db, criteria, function(result){
				if(result == null){
					res.status(200).end('error ');
							
				}else{
					req.session.authenticated = true;
					req.session.userid = req.body.userid;
					//res.status(200).end('login successful');	
					res.redirect('/read');
				}		
			});
		});
	//}
	//res.status(200).end('go to restaurant page');
});


//------------------------Register------------------------------------------------
app.post('/register', function(req,res){
	
		var criteria = {"userid": req.body.userid};
		MongoClient.connect(mongourl, function(err, db){
			assert.equal(null, err);
			findUser(db, criteria, function(result){
				if(result == null){
					createUser(db, req.body.userid, req.body.password, function(result){
						db.close();
						res.redirect('/login');
						//res.status(200).end('inserted');
					});			
				}else{
					res.status(200).end('error ' + result);			
				}		
			});
		});
	
	
});

//------------------------------Logout----------------------------------------------
app.get('/logout',function(req,res) {
	req.session.authenticated = false;
	req.session = null;	
	res.redirect('/login');
});


//--------------------------Create Restaurant----------------------------------------
app.post('/create', function(req,res){
	var sampleFile;
	var bfile = req.files.sampleFile;
	var criteria = {"name": req.body.name, "cuisine": req.body.cuisine, "borough": req.body.borough, "owner": req.session.userid,
					"photo": {"data" : new Buffer(bfile.data).toString('base64'), "mimetype" : bfile.mimetype}, 
					"address": {"street": req.body.street, "zipcode": req.body.zipcode, "building": req.body.building, "coord": [req.body.lon, req.body.lat]}};
	MongoClient.connect(mongourl, function(err, db){
		assert.equal(null, err);
		createRestaurant(db, criteria, function(result){
				db.close();
				//res.redirect('/list');
				res.status(200).end('restaurant inserted');
							
		});
	});
});






/*function findRestaurants(db, callback) {
	
	//cursor = db.collection('restaurants').find(criteria).limit(20);
	cursor = db.collection('restaurants').find();
	cursor.each(function(err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			//restaurants.push(doc);
			
			callback(doc);
		} else {
			callback(doc);
		}
	});
}*/






/**************************Function for List All Restaurants***************************/
function findRestaurants(db, callback){
	db.collection('restaurants').find().toArray(function(err, result){
		assert.equal(err, null);
		callback(result);
	});
}
/**************************Function for Login******************************************/
function findPassword(db,criteria,callback){
	db.collection('users').findOne(criteria, function(err, result){
		assert.equal(err, null);
		callback(result);
	});
}
/**************************Function for Register***************************************/
function createUser(db, name, pw, callback){
	db.collection('users').insertOne({"userid": name, "password": pw}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});

}

function findUser(db,criteria,callback){
	db.collection('users').findOne(criteria, function(err, result){
		assert.equal(err, null);
		callback(result);
	});
}
/**************************Function for Create Restaurants*****************************/
function createRestaurant(db, criteria, callback){
	db.collection('restaurants').insertOne(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});

}



app.listen(process.env.PORT || 8099);
