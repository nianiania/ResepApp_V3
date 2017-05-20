var express = require('express')
var app = express()
var path = require('path')
var bodyParse = require('body-parser')
var exphbs = require('express-handlebars')
var cookieParser = require('cookie-parser')
var multer  = require('multer')
var upload = multer({ dest: 'public/uploads/' })
var fs = require('fs');


app.use(bodyParse.urlencoded({ extended: true }));
app.use(bodyParse.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Header", "Origin, X-Requested-with, Content-Type, Accept");
    next();
});

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.engine('hbs', exphbs({ defaultLayout: 'main', extname: '.hbs' }));
app.set('view engine', '.hbs')

//===================SET UP DB============
const Pool = require('pg').Pool;
var config = {
    user: 'postgres',
    database: 'resep_v2',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000,
};
process.on('unhandledRejection', function(e) {
    console.log(e.message, e.stack)
})
var pool = new Pool(config)


//============================ setup Firebase =================================
var admin = require("firebase-admin");
var serviceAccount = require("./resepv2-d3f60-firebase-adminsdk-e95wy-bd57a737c5.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://resepv2-d3f60.firebaseio.com"
});

var firebase = require("firebase");
firebase.initializeApp({
    apiKey: " AIzaSyCUgo5_dMpN03C6ZsiAlS-kjEZH1RkE9_4",
    databaseURL: "https://resepv2-d3f60.firebaseio.com"
});

//==================routing==============

app.route('/')
    .get(function(req, res) {
        res.render('home')

        // Check Cookies
        console.log('Cookies: ', req.cookies)
    })
    .post(function(req, res) {

    })

app.route('/resepmu')
    .get(function(req, res) {
        res.render('resepmu')
    })
    .post(function(req, res) {

    })

app.route('/signup')
    .get(function(req, res) {
        res.render('signup')
    })
    .post(function(req, res) {
        var first_name = req.body.first_name
        var last_name = req.body.last_name
        var email = req.body.email
        var password = req.body.password
        var confirm_password = req.body.confirm_password

        if (password !== confirm_password) {
            var error_msg = "Your password and  confirmation password should be the same!"
            res.send(error_msg)
        } else {
            signup();
        }

        function signup() {
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(function(result) {
                    console.log('Emailnya:', result.email)
                    console.log('UID:', result.uid)
                    var uid = result.uid
                    var email_signup = result.email

                    var query_post = 'insert into db_user(uid, email)' + 'values($1,$2)'

                    pool.query(query_post, [uid, email])
                        .then((result) => {
                            console.log('succes insert data');
                            res.redirect('/signin')
                        })
                        .catch((err) => {
                            console.log('error running query', err);
                        })
                })
                .catch((err) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    res.send(errorMessage)
                })
        }
    })
app.route('/signin')
    .get(function(req, res) {
        res.render('signin')
    })
    .post(function(req, res) {
        var email = req.body.email
        var password = req.body.password
        var remember = req.body.remember
        var expired = 6000 * 10000

        console.log(email + ' ' + password + ' ' + remember)

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(result) {
                res.cookie('uid_token', result.uid, { maxAge: expired });
                console.log('Success auth: ', result.email);
                res.redirect("/admin");
            }).catch(function(error) {
                console.log("Error Loggin In User :", error.message);
            });
    })




app.route('/admin')
    .get(function(req, res) {
        if(req.cookies.uid_token){ 
            pool.query('SELECT * from resep')
            .then((result) => {
                var hasil = result.rows
                console.log('number:', hasil);

                res.render('admin', {
                    data: hasil,
                    judul: 'Resep App with NodeJS'
                })
            })
            .catch((err) => {
                console.error('error running query', err);
            });


        } else {
            res.send('You have to signin to access this page!')
        }
    })
    .post(function(req, res) {
        
    })





// ========================= Routing '/add_resep' ========================================== 
app.get('/add_resep', function(req, res){
    res.render('add_resep')
})
app.post('/add_resep', upload.any(), function(req, res){
    var nama_resep = req.body.nama_resep || ""
    var deskripsi = req.body.deskripsi || ""
    var penulis = req.body.penulis || ""
    var cara_pembuatan = req.body.cara_pembuatan || ""
    var image = req.files[0] || ""

    // console.log(nama_resep + ' ' + deskripsi + ' ' + penulis + ' ' + cara_pembuatan)
    console.log(image)

    if(req.cookies.uid_token){


        if(image){
            fs.rename(image.path, image.path + '.jpg', function(err) {
            if (err)
              console.log('ERROR: ' + err);
            }
          );

        } 

        if(nama_resep && deskripsi && penulis && cara_pembuatan){
            // console.log('trus')
            var image_path = image.path + ".jpg" || "";
            var konversi_imagePath = image_path.substring(6)
            console.log('Path: ', konversi_imagePath)

            var query_post = 'insert into resep(nama_resep, deskripsi, penulis, cara_pembuatan, image)' + 'values($1, $2, $3, $4, $5)'
            pool.query(query_post, [nama_resep, deskripsi, penulis, cara_pembuatan, konversi_imagePath])
                .then((result) => {
                    console.log('success insert data');
                    res.redirect('/admin')
                })
                .catch((err) => {
                    console.log('error running query', err);
                })

        } else {
            res.send('Nama Resep, Deskripsi, Penulis, dan Cara Pembuatan cannot be empty!')
        }

    } else {
        res.send('You have to signin to post to the DB!')
    }
})
// ========================= Routing '/add_resep' ==========================================


app.route('/signout')
    .get(function(req, res) {


    })
    .post(function(req, res) {
        console.log(req.cookies.uid_token)

        firebase.auth().signOut()
            .then(() => {
                console.log('Successfully Signout ');
                res.clearCookie('uid_token');
                res.redirect('/');
            }, (error) => {
                console.log(error);
            })
    })



app.route('/clear_cookies')
    .get(function(req, res, next) {
        res.clearCookie('uid_token')
        res.json({ message: 'success clear cookies' })
    });




//=============webserver============================
app.listen(4000, function() {
    pool
        .query('CREATE TABLE IF NOT EXISTS resep(id SERIAL PRIMARY KEY, nama_resep VARCHAR(40) not null, deskripsi VARCHAR(70) not null, penulis VARCHAR(40) not null, cara_pembuatan VARCHAR(700) not null)')
        .then(function() {
            console.log('Table resep is exist!')
        })
    pool
        .query('CREATE TABLE IF NOT EXISTS db_user(id SERIAL PRIMARY KEY, uid VARCHAR(80) not null, email VARCHAR(80) not null)')
        .then(function() {
            console.log('Table db_user is exist!')
        })
    console.log('Server is listening on 4000 and Table is exist!')
})
