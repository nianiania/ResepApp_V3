var express = require('express')
var app = express()
var path = require('path')
var bodyParse = require('body-parser')
var exphbs = require('express-handlebars')
var cookieParser = require('cookie-parser')

app.use(bodyParse.urlencoded({ extended: true }));
app.use(bodyParse.json());

app.use(function(req,res, next) {
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
    database: 'resep',
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

//==================routing==============

app.route('/')
    .get(function(req, res) {
        res.render('home')
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

    })
app.route('/signin')
    .get(function(req, res) {
        res.render('signin')
    })
    .post(function(req, res) {

    })

//=============webserver============================

pool
	.query('CREATE TABLE IF NOT EXISTS resep(id SERIAL PRIMARY KEY, nama_resep VARCHAR(40)not null,deskripsi VARCHAR(70)not null, penulis VARCHAR(40)not null, cara_pembuatan VARCHAR(500)not null)')
	.then(function(){
		app.listen(4000, function(){
			console.log('server is listening on 4000')
		})
	})
