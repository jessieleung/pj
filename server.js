//var http = require('http');
//var url  = require('url');
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
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


//---------------------Edit information--------------------------------------------
app.get('/change', function(req, res){
var key = req.query.id;

	if (req.query.id != null) {
		MongoClient.connect(mongourl, function(err, db){
		assert.equal(null, err);
	
		findOwner(db, key, function(result){
			db.close();
			console.log(result+">>result");
			//for (var i=0; i<result.length; i++) {
      			if (result.owner == req.session.userid) {
					console.log(result.owner+">>owner");
					res.sendFile(__dirname + '/public/change.html');
        			res.render("edit.ejs", {c: result});
        			//break;
				}
				else{
					res.status(400).end('not a owner');
				}
      		//}


		});


	});


  } 
	else {
    res.status(500).end('id missing!');
  }	

});


//********************find owner*******************************************
function findOwner(db,target,callback){
	db.collection('restaurants').findOne({"_id": ObjectId(target)}, function(err, result){
		assert.equal(err, null);
		callback(result);
	});
}





//------------------Get image--------------------------------------------------
app.get('/image', function(req,res) {
var key = req.query.key;
//console.log('Finding key = ' + req.query.key);
  MongoClient.connect(mongourl,function(err,db) {
    console.log('Connected to db, image');
    
    assert.equal(null,err);
    var bfile;
    var key = req.query.key;

	//console.log(req.query.key);
    if (key != null) {
      readImage(db, key, function(bfile,mimetype) {
        if (bfile != null) {
			//console.log('bFile: ' + bfile)
          //console.log('Found: ' + key)
          res.set('Content-Type',mimetype);
          res.end(bfile);
        } else {
          res.status(404);
          res.end(key + ' not found!');
          //console.log(key + ' not found!');
        }
        db.close();
      });
    } else {
      res.status(500);
      res.end('Error: query parameter "key" is missing!');
    }
  });
});



function readImage(db,target,callback) {
  var bfile = null;
  var mimetype = null;
  db.collection('restaurants').findOne({"_id": ObjectId(target)}, function(err,doc) {
    assert.equal(err,null);
	console.log(target +">>target");
	console.log(doc + ">>doc");
    if (doc != null) {
      bfile = new Buffer(doc.photo.data,'base64');
		console.log(doc.photo.data + "bfile");
      mimetype = doc.photo.mimetype;
		//callback(bfile,mimetype);
    }
    callback(bfile,mimetype);
  });
}



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

//---------------display detail of restaurants------------------------------
app.get('/display', function(req,res) {
	var shop;
	var rating ="";
	console.log(req.query.id);
	var criteria2 = {"_id": req.query.id};	
	
	if (req.query.id != null) {
		MongoClient.connect(mongourl, function(err, db){
		assert.equal(null, err);
	
		findRestaurants(db, function(result){
			db.close();
			for (var i=0; i<result.length; i++) {
      			if (result[i]._id == req.query.id) {
        			res.render("display.ejs", {c: result[i]});
        			break;
				}
      		}


		});


	});


  } 
else {
    res.status(500).end('id missing!');
  }
});

//--------------------------Change-------------------------------------------
/*app.post('/change', function(req, res){
	var sampleFile;
	var bfile = req.files.sampleFile;
	var key = req.query.id;
	var criteria1 = {"_id": ObjectId(key)};
	
	var criteria2 = {$set:{"name": req.body.name, 
					"cuisine": req.body.cuisine, 
					"borough": req.body.borough, 
					"owner": req.session.userid, 
					"photo": {"data" : new Buffer(bfile.data).toString('base64'), "mimetype" : bfile.mimetype}, 
					"address": {"street": req.body.street,
								 "zipcode": req.body.zipcode,
								 "building": req.body.building,
								 "coord": {"lon": req.body.lon, "lat": req.body.lat}
								}
					}};

	console.log(req.body.name);
	MongoClient.connect(mongourl, function(err, db){
		assert.equal(null, err);
		//editRestaurant(db, req.session.userid, req.body.id, req.body.name, req.body.borough, req.body.cuisine, req.body.street, req.body.building, req.body.zipcode, req.body.lon, req.body.lat, req.files.sampleFile, function(result){
		editRestaurant(db, criteria1, criteria2, function(result){
				db.close();
				console.log(result);
				res.status(200).end('restaurant updated');
							
		});
	});

});
*/

app.post('/change', function(req,res){
	var sampleFile;
	var bfile = req.files.sampleFile;
	var criteria = {"name": req.body.name, "cuisine": req.body.cuisine, "borough": req.body.borough, "owner": req.session.userid,
					"photo": {"data" : new Buffer(bfile.data).toString('base64'), "mimetype" : bfile.mimetype}, 
					"address": {"street": req.body.street, "zipcode": req.body.zipcode, "building": req.body.building, "coord": {"lon": req.body.lon, "lat": req.body.lat}}};
	MongoClient.connect(mongourl, function(err, db){
		assert.equal(null, err);

		db.collection('restaurants').updateOne(
									{"_id": ObjectId(req.query.id)}, 
									{$set: {"name": req.body.name, "cuisine": req.body.cuisine, "borough": req.body.borough, "owner": 										req.session.userid,
									"photo": {"data" : new Buffer(bfile.data).toString('base64'), "mimetype" : bfile.mimetype}, 
									"address": {"street": req.body.street, "zipcode": req.body.zipcode, "building": 									req.body.building, "coord": {"lon": req.body.lon, "lat": req.body.lat}}}}, function(err, result) {
		assert.equal(err, null);
		//callback(result);
		//db.close();
				//res.redirect('/list');
				res.status(200).end('restaurant updated');
		});
		
	});
});


//*****************************Function for edit restaurnat*************************/
//function editRestaurant(db,owner,id,name,borough,cuisine,street,building,zipcode,lon,lat,bfile,callback){
function editRestaurant(db, criteria1, criteria2, callback){
	console.log(criteria1 + ">>criteria1");
console.log(criteria2 + ">>criteria2");
	db.collection('restaurants').updateOne(criteria1, criteria2, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});

/*
db.collection('restaurants').update({"_id": ObjectId(id)},{$set:{
		"name": name, "cuisine": cuisine, "borough": borough, "owner": owner,
					"photo": {"data" : new Buffer(bfile.data).toString('base64'), "mimetype" : bfile.mimetype}, 
					"address": {"street": street, "zipcode": zipcode, "building": building, "coord": {"lon": lon, "lat": lat}}
}}, 
			function(err,result) {
				if (err) {
					result = err;
					console.log("Update error: " + JSON.stringify(err));
				}
				callback(result);
			}// end function(err,result)
		);//end insertOne*/
	}



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
					"address": {"street": req.body.street, "zipcode": req.body.zipcode, "building": req.body.building, "coord": {"lon": req.body.lon, "lat": req.body.lat}}};
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

/**************************Function for Rating***************************************/
function findRating(db, criteria, callback){
	db.collection('rating').find(criteria).toArray(function(err, result){
		assert.equal(err, null);
		callback(result);
	});
}

/************************Function for find one restaurant****************************/
function findRest(db, criteria, callback){
	db.collection('restaurants').find(criteria, function(err, result){
		assert.equal(err, null);
		callback(result);
	});

}



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
